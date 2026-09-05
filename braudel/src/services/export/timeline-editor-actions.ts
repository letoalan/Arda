// services/export/timeline-editor-actions.ts

import { EditTimeline, VideoClip, AudioClip, computeTotalTimelineDuration } from './studio-types';
import { resolveTrackOverlaps } from './TimelineScheduler';

export interface StudioClipboardItem {
  type: 'video' | 'audio';
  clip: VideoClip | AudioClip;
}

/**
 * Découpe (Split) un clip vidéo ou audio en deux morceaux à un timestamp donné.
 */
export function splitClipAtTime(
  timeline: EditTimeline,
  clipId: string,
  splitTimeMs: number
): EditTimeline {
  // 1. Chercher dans les pistes vidéo
  const vIndex = timeline.videoTracks.findIndex(c => c.id === clipId);
  if (vIndex !== -1) {
    const clip = timeline.videoTracks[vIndex];
    const cStart = clip.startMs ?? 0;
    const cEnd = cStart + clip.durationMs;

    // Le point de coupe doit être strictement à l'intérieur du clip (marge min 150ms)
    if (splitTimeMs <= cStart + 150 || splitTimeMs >= cEnd - 150) {
      return timeline;
    }

    const cutOffset = splitTimeMs - cStart;
    const part1Duration = cutOffset;
    const part2Duration = clip.durationMs - cutOffset;

    const part1: VideoClip = {
      ...clip,
      durationMs: part1Duration,
      trimEndMs: (clip.trimEndMs ?? 0) + part2Duration,
    };

    const part2: VideoClip = {
      ...clip,
      id: `${clip.id}-part2-${Date.now()}`,
      startMs: splitTimeMs,
      durationMs: part2Duration,
      trimStartMs: (clip.trimStartMs ?? 0) + cutOffset,
      title: clip.title ? `${clip.title} (fin)` : undefined,
    };

    const newVideoTracks = [...timeline.videoTracks];
    newVideoTracks.splice(vIndex, 1, part1, part2);

    const resolved = resolveTrackOverlaps(newVideoTracks);
    return {
      ...timeline,
      videoTracks: resolved,
      totalDurationMs: computeTotalTimelineDuration({ ...timeline, videoTracks: resolved })
    };
  }

  // 2. Chercher dans les pistes audio
  const aIndex = timeline.audioTracks.findIndex(a => a.id === clipId);
  if (aIndex !== -1) {
    const clip = timeline.audioTracks[aIndex];
    const aStart = clip.startMs ?? 0;
    const aEnd = aStart + clip.durationMs;

    if (splitTimeMs <= aStart + 150 || splitTimeMs >= aEnd - 150) {
      return timeline;
    }

    const cutOffset = splitTimeMs - aStart;
    const part1Duration = cutOffset;
    const part2Duration = clip.durationMs - cutOffset;

    const part1: AudioClip = {
      ...clip,
      durationMs: part1Duration,
      trimEndMs: (clip.trimEndMs ?? 0) + part2Duration,
    };

    const part2: AudioClip = {
      ...clip,
      id: `${clip.id}-part2-${Date.now()}`,
      startMs: splitTimeMs,
      durationMs: part2Duration,
      trimStartMs: (clip.trimStartMs ?? 0) + cutOffset,
      name: `${clip.name} (fin)`,
    };

    const newAudioTracks = [...timeline.audioTracks];
    newAudioTracks.splice(aIndex, 1, part1, part2);

    return {
      ...timeline,
      audioTracks: newAudioTracks,
      totalDurationMs: computeTotalTimelineDuration({ ...timeline, audioTracks: newAudioTracks })
    };
  }

  return timeline;
}

/**
 * Copie un clip sélectionné dans le format de presse-papiers Studio.
 */
export function copyClip(
  timeline: EditTimeline,
  clipId: string
): StudioClipboardItem | null {
  const vClip = timeline.videoTracks.find(c => c.id === clipId);
  if (vClip) {
    return {
      type: 'video',
      clip: { ...vClip }
    };
  }

  const aClip = timeline.audioTracks.find(a => a.id === clipId);
  if (aClip) {
    return {
      type: 'audio',
      clip: { ...aClip }
    };
  }

  return null;
}

/**
 * Coupe un clip sélectionné (copie et suppression de la timeline).
 */
export function cutClip(
  timeline: EditTimeline,
  clipId: string
): { updatedTimeline: EditTimeline; clipboardItem: StudioClipboardItem | null } {
  const clipboardItem = copyClip(timeline, clipId);
  if (!clipboardItem) {
    return { updatedTimeline: timeline, clipboardItem: null };
  }

  if (clipboardItem.type === 'video') {
    const updated = timeline.videoTracks.filter(c => c.id !== clipId);
    const resolved = resolveTrackOverlaps(updated);
    const updatedTimeline: EditTimeline = {
      ...timeline,
      videoTracks: resolved,
      totalDurationMs: computeTotalTimelineDuration({ ...timeline, videoTracks: resolved })
    };
    return { updatedTimeline, clipboardItem };
  } else {
    const updated = timeline.audioTracks.filter(a => a.id !== clipId);
    const updatedTimeline: EditTimeline = {
      ...timeline,
      audioTracks: updated,
      totalDurationMs: computeTotalTimelineDuration({ ...timeline, audioTracks: updated })
    };
    return { updatedTimeline, clipboardItem };
  }
}

/**
 * Colle un élément du presse-papiers à la position courante du playhead.
 */
export function pasteClip(
  timeline: EditTimeline,
  playheadMs: number,
  clipboardItem: StudioClipboardItem
): EditTimeline {
  const targetStartMs = Math.max(0, playheadMs);
  const newId = `${clipboardItem.clip.id}-pasted-${Date.now()}`;

  if (clipboardItem.type === 'video') {
    const pastedVideo: VideoClip = {
      ...(clipboardItem.clip as VideoClip),
      id: newId,
      startMs: targetStartMs,
    };
    const updatedVideoTracks = [...timeline.videoTracks, pastedVideo];
    const resolved = resolveTrackOverlaps(updatedVideoTracks);

    return {
      ...timeline,
      videoTracks: resolved,
      totalDurationMs: computeTotalTimelineDuration({ ...timeline, videoTracks: resolved })
    };
  } else {
    const pastedAudio: AudioClip = {
      ...(clipboardItem.clip as AudioClip),
      id: newId,
      startMs: targetStartMs,
    };
    const updatedAudioTracks = [...timeline.audioTracks, pastedAudio];

    return {
      ...timeline,
      audioTracks: updatedAudioTracks,
      totalDurationMs: computeTotalTimelineDuration({ ...timeline, audioTracks: updatedAudioTracks })
    };
  }
}

/**
 * Ajuste les points de rognage temporel (Crop In / Out) de manière non destructive.
 */
export function applyCropTemporal(
  clip: VideoClip | AudioClip,
  newTrimStartMs: number,
  newTrimEndMs: number
): { durationMs: number; trimStartMs: number; trimEndMs: number } {
  const safeTrimStart = Math.max(0, newTrimStartMs);
  const safeTrimEnd = Math.max(0, newTrimEndMs);
  const totalSourceMs = clip.sourceDurationMs || (clip.durationMs + (clip.trimStartMs || 0) + (clip.trimEndMs || 0));

  const newDurationMs = Math.max(300, totalSourceMs - safeTrimStart - safeTrimEnd);

  return {
    durationMs: newDurationMs,
    trimStartMs: safeTrimStart,
    trimEndMs: safeTrimEnd,
  };
}

// services/export/TimelineScheduler.ts

import { EditTimeline, VideoClip, AudioClip, computeTotalTimelineDuration } from './studio-types';
import { StoryProject, StoryScene } from '../../core/schema/story';
import { getEffectiveStyleBearing } from '../../core/styles.config';

export interface ScheduledVideoStep {
  clipId: string;
  sceneId?: string;
  startMs: number;
  durationMs: number;
  periodNumber: number;
  totalPeriods: number;
  title: string;
  timelineYear?: number;
  mapState: any;
  transition: any;
  mediaType?: 'map' | 'image' | 'video';
  mediaUrl?: string;
  trimStartMs?: number;
  trimEndMs?: number;
}

export interface AudioPlaybackHandle {
  stopAll: () => void;
}

/**
 * Résout tout chevauchement conflictuel sur une même piste vidéo.
 * Si un clip B commence avant la fin du clip A sur le même trackIndex,
 * clip B est automatiquement décalé pour commencer exactement à la fin de clip A.
 */
export function resolveTrackOverlaps(clips: VideoClip[]): VideoClip[] {
  if (!clips || clips.length === 0) return [];

  // Grouper par trackIndex
  const tracksMap = new Map<number, VideoClip[]>();
  for (const clip of clips) {
    const tIdx = clip.trackIndex ?? 0;
    if (!tracksMap.has(tIdx)) {
      tracksMap.set(tIdx, []);
    }
    tracksMap.get(tIdx)!.push({ ...clip });
  }

  const resolvedClips: VideoClip[] = [];

  for (const [, trackClips] of tracksMap.entries()) {
    // Trier par startMs chronologique
    trackClips.sort((a, b) => a.startMs - b.startMs);

    let lastEndMs = 0;
    for (let i = 0; i < trackClips.length; i++) {
      const c = trackClips[i];
      if (c.startMs < lastEndMs) {
        c.startMs = lastEndMs;
      }
      lastEndMs = c.startMs + c.durationMs;
      resolvedClips.push(c);
    }
  }

  return resolvedClips.sort((a, b) => a.startMs - b.startMs);
}

/**
 * Calcule la durée totale de l'EditTimeline.
 */
export function calculateTotalTimelineDuration(timeline: EditTimeline): number {
  return computeTotalTimelineDuration(timeline);
}

/**
 * Retourne le clip vidéo actif sur la timeline pour un timestamp donné en millisecondes.
 * Priorise les pistes supérieures si plusieurs clips sont actifs en parallèle.
 */
export function getVideoClipAtTime(timeline: EditTimeline, timeMs: number, strict = false): VideoClip | undefined {
  if (!timeline?.videoTracks || timeline.videoTracks.length === 0) return undefined;

  const validClips = timeline.videoTracks.filter(
    c => timeMs >= c.startMs && timeMs < c.startMs + c.durationMs
  );

  if (validClips.length > 0) {
    // Si plusieurs pistes se superposent, prendre le trackIndex le plus élevé (overlay)
    validClips.sort((a, b) => (b.trackIndex ?? 0) - (a.trackIndex ?? 0));
    return validClips[0];
  }

  if (strict) return undefined;

  // Si on est au-delà du dernier clip, retourner le dernier clip pour maintenir l'état final
  const sorted = [...timeline.videoTracks].sort((a, b) => a.startMs - b.startMs);
  if (sorted.length === 0) return undefined;
  const lastClip = sorted[sorted.length - 1];
  if (timeMs >= lastClip.startMs + lastClip.durationMs) {
    return lastClip;
  }

  return sorted[0];
}

/**
 * Retourne la liste des clips audio actifs à un timestamp donné.
 */
export function getActiveAudioClipsAtTime(timeline: EditTimeline, timeMs: number): AudioClip[] {
  if (!timeline?.audioTracks || timeline.audioTracks.length === 0) return [];
  return timeline.audioTracks.filter(
    a => !a.muted && timeMs >= a.startMs && timeMs < a.startMs + a.durationMs
  );
}

/**
 * Traduit une EditTimeline et un StoryProject en une séquence ordonnée d'instructions
 * temporisées pour le moteur d'enregistrement vidéo.
 */
export function buildScheduledVideoSteps(
  timeline: EditTimeline,
  story: StoryProject
): ScheduledVideoStep[] {
  const sanitizedClips = resolveTrackOverlaps(timeline.videoTracks);
  const scenesMap = new Map<string, StoryScene>();
  for (const scene of story.scenes) {
    scenesMap.set(scene.id, scene);
  }

  const total = sanitizedClips.length;

  return sanitizedClips.map((clip, idx) => {
    const scene = (clip.sceneId ? scenesMap.get(clip.sceneId) : undefined) || story.scenes[idx] || story.scenes[0];
    const pNum = clip.periodNumber || (idx + 1);
    const totP = clip.totalPeriods || total;
    const sceneTitle = clip.title || scene?.title || `Période ${pNum}/${totP}`;

    // On adapte la transition avec la durée exacte définie par l'utilisateur dans la timeline
    const baseTransition = clip.transition || scene?.transition || {
      profile: 'standard',
      durationMode: 'fixed',
      durationMs: Math.max(1000, clip.durationMs - 1000),
      pauseAfterMs: 1000,
      reduceMotionPolicy: 'essential-for-export'
    };

    const effectiveDurationMs = clip.durationMs;
    // Si la durée totale est étendue, la caméra dispose d'un temps de vol et d'une pause stabilisée proportionnels
    const pauseAfterMs = Math.min(2500, Math.max(800, Math.round(effectiveDurationMs * 0.35)));
    const travelDurationMs = Math.max(500, effectiveDurationMs - pauseAfterMs);

    const tailoredTransition = {
      ...baseTransition,
      durationMode: 'fixed' as const,
      durationMs: travelDurationMs,
      pauseAfterMs,
    };

    const rawMapState = clip.mapState || scene?.mapState;
    const resolvedStyle = rawMapState?.basemapStyle || clip.mapState?.basemapStyle || scene?.mapState?.basemapStyle;
    const resolvedBearing = getEffectiveStyleBearing(resolvedStyle, rawMapState?.bearing);
    const resolvedMapState = rawMapState ? {
      ...rawMapState,
      bearing: resolvedBearing,
      basemapStyle: resolvedStyle
    } : undefined;

    return {
      clipId: clip.id,
      sceneId: clip.sceneId,
      startMs: clip.startMs,
      durationMs: effectiveDurationMs,
      periodNumber: pNum,
      totalPeriods: totP,
      title: sceneTitle,
      timelineYear: clip.timelineYear ?? scene?.mapState?.timelineYear,
      mapState: resolvedMapState,
      transition: tailoredTransition,
      mediaType: clip.mediaType || 'map',
      mediaUrl: clip.mediaUrl,
      trimStartMs: clip.trimStartMs,
      trimEndMs: clip.trimEndMs,
    };
  });
}

/**
 * Programme et mixe en temps réel l'ensemble des pistes audio d'une EditTimeline
 * vers un nœud de destination Web Audio (ex: MediaStreamAudioDestinationNode ou ctx.destination).
 * Prend en charge les volumes unitaires, le décalage de démarrage et les fondus (fadeIn / fadeOut).
 */
export function scheduleAudioTracks(
  audioCtx: AudioContext,
  destinationNode: AudioNode,
  audioTracks: AudioClip[],
  getBuffer: (clip: AudioClip) => AudioBuffer | undefined,
  startOffsetSec: number = 0
): AudioPlaybackHandle {
  const activeSources: AudioBufferSourceNode[] = [];
  const activeGains: GainNode[] = [];
  const baseTime = audioCtx.currentTime;

  for (const clip of audioTracks) {
    if (clip.muted) continue;

    const buffer = getBuffer(clip) || clip.audioBuffer;
    if (!buffer) continue;

    const clipStartSec = clip.startMs / 1000;
    const clipDurationSec = clip.durationMs / 1000;
    const trimStartSec = (clip.trimStartMs || 0) / 1000;

    // Calcul du point de démarrage absolu dans le contexte Web Audio
    const relativeStartSec = clipStartSec - startOffsetSec;

    let whenToStart = baseTime + relativeStartSec;
    let bufferOffset = trimStartSec;
    let actualDuration = clipDurationSec;

    // Si startOffsetSec est déjà au milieu du clip
    if (relativeStartSec < 0) {
      const elapsed = Math.abs(relativeStartSec);
      if (elapsed >= clipDurationSec) {
        // Le clip est déjà terminé à cet instant
        continue;
      }
      whenToStart = baseTime;
      bufferOffset += elapsed;
      actualDuration -= elapsed;
    }

    if (actualDuration <= 0 || bufferOffset >= buffer.duration) {
      continue;
    }

    try {
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;

      const gain = audioCtx.createGain();
      const targetVolume = Math.max(0, Math.min(2, clip.volume ?? 1));
      const fadeInSec = (clip.fadeInMs || 0) / 1000;
      const fadeOutSec = (clip.fadeOutMs || 0) / 1000;

      // Courbe de gain (fadeIn / plateau / fadeOut)
      if (fadeInSec > 0 && relativeStartSec >= 0) {
        gain.gain.setValueAtTime(0.001, whenToStart);
        gain.gain.linearRampToValueAtTime(targetVolume, whenToStart + fadeInSec);
      } else {
        gain.gain.setValueAtTime(targetVolume, whenToStart);
      }

      if (fadeOutSec > 0 && actualDuration > fadeOutSec) {
        const fadeOutStartTime = whenToStart + actualDuration - fadeOutSec;
        gain.gain.setValueAtTime(targetVolume, fadeOutStartTime);
        gain.gain.linearRampToValueAtTime(0.001, whenToStart + actualDuration);
      }

      source.connect(gain);
      gain.connect(destinationNode);

      source.start(whenToStart, bufferOffset, actualDuration);
      activeSources.push(source);
      activeGains.push(gain);
    } catch (err) {
      console.warn('[TimelineScheduler] Erreur programmation source audio:', err);
    }
  }

  let stopped = false;
  return {
    stopAll: () => {
      if (stopped) return;
      stopped = true;
      for (const s of activeSources) {
        try {
          s.stop();
          s.disconnect();
        } catch {
          // Ignorer
        }
      }
      for (const g of activeGains) {
        try {
          g.disconnect();
        } catch {
          // Ignorer
        }
      }
    }
  };
}

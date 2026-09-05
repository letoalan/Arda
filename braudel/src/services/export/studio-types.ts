import { z } from 'zod';
import { StoryProject, StoryScene, StoryMapStateSchema, StoryCameraTransitionSchema } from '../../core/schema/story';
import { getEffectiveStyleBearing } from '../../core/styles.config';

export const VideoMediaTypeSchema = z.enum(['map', 'image', 'video']);
export type VideoMediaType = z.infer<typeof VideoMediaTypeSchema>;

export const VideoClipSchema = z.object({
  id: z.string(),
  sceneId: z.string().optional(),
  trackIndex: z.number().optional().default(0),
  startMs: z.number().nonnegative(),
  durationMs: z.number().positive(),
  title: z.string().optional(),
  periodNumber: z.number().optional(),
  totalPeriods: z.number().optional(),
  timelineYear: z.number().optional(),
  mapState: StoryMapStateSchema.optional(),
  transition: StoryCameraTransitionSchema.optional(),
  // Médias Externes & Crops Temporels
  mediaType: VideoMediaTypeSchema.optional(),
  mediaUrl: z.string().optional(),
  sourceDurationMs: z.number().positive().optional(),
  trimStartMs: z.number().nonnegative().optional(),
  trimEndMs: z.number().nonnegative().optional(),
  name: z.string().optional(),
});
export type VideoClip = z.infer<typeof VideoClipSchema>;

export const AudioClipTypeSchema = z.enum(['music', 'voice']);
export type AudioClipType = z.infer<typeof AudioClipTypeSchema>;

export const AudioClipSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: AudioClipTypeSchema.default('music'),
  trackIndex: z.number().default(0),
  fileRef: z.string().optional(),
  dataUrl: z.string().optional(),
  startMs: z.number().nonnegative(),
  durationMs: z.number().positive(),
  sourceDurationMs: z.number().positive().optional(),
  trimStartMs: z.number().nonnegative().optional(),
  trimEndMs: z.number().nonnegative().optional(),
  volume: z.number().min(0).max(2).optional(),
  fadeInMs: z.number().nonnegative().optional(),
  fadeOutMs: z.number().nonnegative().optional(),
  muted: z.boolean().optional(),
  waveformData: z.array(z.number()).optional(),
});
export type AudioClip = z.infer<typeof AudioClipSchema> & {
  audioBuffer?: AudioBuffer;
};

export const EditTimelineSchema = z.object({
  id: z.string(),
  videoTracks: z.array(VideoClipSchema).default([]),
  audioTracks: z.array(AudioClipSchema).default([]),
  totalDurationMs: z.number().nonnegative().default(0),
  zoomScale: z.number().positive().default(50), // Pixels par seconde
  playheadMs: z.number().nonnegative().default(0),
});
export type EditTimeline = z.infer<typeof EditTimelineSchema> & {
  audioTracks: AudioClip[];
};

/**
 * Calcule la durée narrative d'une scène individuelle pour le placement initial.
 */
export function getSceneDefaultDurationMs(scene: StoryScene): number {
  if (scene.transition?.durationMode === 'fixed' && scene.transition?.durationMs) {
    return scene.transition.durationMs + (scene.transition.pauseAfterMs ?? 800);
  }
  const flyToDuration = 2400; // vol moyen MapLibre
  const pauseDuration = scene.transition?.pauseAfterMs ?? 1200;
  return flyToDuration + pauseDuration;
}

/**
 * Convertit un StoryProject existant en un plan de montage EditTimeline multi-pistes initial.
 * Chaque scène devient un VideoClip consécutif sur la piste 0.
 */
export function createDefaultEditTimeline(story: StoryProject, fallbackBasemapStyle?: string): EditTimeline {
  const scenes = story?.scenes || [];
  let currentStartMs = 0;
  const total = scenes.length;

  const videoClips: VideoClip[] = scenes.map((scene, idx) => {
    const durationMs = getSceneDefaultDurationMs(scene);
    const pNum = scene.periodNumber || (idx + 1);
    const totP = scene.totalPeriods || total;
    const effectiveStyle = scene.mapState?.basemapStyle || fallbackBasemapStyle;
    const effectiveBearing = getEffectiveStyleBearing(effectiveStyle, scene.mapState?.bearing);

    const clip: VideoClip = {
      id: `clip-${scene.id || idx}-${Date.now()}`,
      sceneId: scene.id,
      trackIndex: 0,
      startMs: currentStartMs,
      durationMs,
      title: scene.title || `Période ${pNum}/${totP}`,
      periodNumber: pNum,
      totalPeriods: totP,
      timelineYear: scene.mapState?.timelineYear,
      mapState: scene.mapState ? {
        ...scene.mapState,
        bearing: effectiveBearing,
        basemapStyle: effectiveStyle
      } : undefined,
      transition: scene.transition,
      mediaType: 'map',
      trimStartMs: 0,
      trimEndMs: 0,
    };
    currentStartMs += durationMs;
    return clip;
  });

  return {
    id: `timeline-${story.id || Date.now()}`,
    videoTracks: videoClips,
    audioTracks: [],
    totalDurationMs: Math.max(3500, currentStartMs),
    zoomScale: 60, // 60 pixels par seconde par défaut
    playheadMs: 0,
  };
}

/**
 * Recalcule la durée totale de l'EditTimeline en fonction des clips vidéo et audio.
 */
export function computeTotalTimelineDuration(timeline: EditTimeline): number {
  let maxEndMs = 0;
  for (const v of timeline.videoTracks) {
    const end = v.startMs + v.durationMs;
    if (end > maxEndMs) maxEndMs = end;
  }
  for (const a of timeline.audioTracks) {
    const end = a.startMs + a.durationMs;
    if (end > maxEndMs) maxEndMs = end;
  }
  return Math.max(1000, maxEndMs);
}

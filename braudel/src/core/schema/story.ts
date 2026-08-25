import { z } from 'zod';

export const StoryLayoutSchema = z.enum([
  'map-full',
  'map-text',
  'split',
  'media-focus'
]);
export type StoryLayout = z.infer<typeof StoryLayoutSchema>;

export const TransitionProfileSchema = z.enum([
  'documentary',
  'standard',
  'dynamic',
  'cut',
  'custom'
]);
export type TransitionProfile = z.infer<typeof TransitionProfileSchema>;

export const DurationModeSchema = z.enum(['auto', 'fixed']);
export type DurationMode = z.infer<typeof DurationModeSchema>;

export const TransitionEasingSchema = z.enum(['linear', 'easeInOut', 'easeOut']);
export type TransitionEasing = z.infer<typeof TransitionEasingSchema>;

export const StoryCameraTransitionSchema = z.object({
  profile: TransitionProfileSchema.default('standard'),
  durationMode: DurationModeSchema.default('auto'),
  durationMs: z.number().optional(),
  speed: z.number().optional(),
  curve: z.number().optional(),
  easing: TransitionEasingSchema.optional(),
  minZoomOut: z.number().optional(),
  pauseAfterMs: z.number().default(800),
  reduceMotionPolicy: z.enum(['respect', 'essential-for-export']).default('respect')
});
export type StoryCameraTransition = z.infer<typeof StoryCameraTransitionSchema>;

export const StoryMapStateSchema = z.object({
  center: z.tuple([z.number(), z.number()]),
  zoom: z.number(),
  bearing: z.number().optional(),
  pitch: z.number().optional(),
  timelineYear: z.number().optional(),
  visibleLayerIds: z.array(z.string()).default([]),
  selectedEntityIds: z.array(z.string()).optional(),
  basemapStyle: z.string().optional()
});
export type StoryMapState = z.infer<typeof StoryMapStateSchema>;

export const StorySceneSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  body: z.string().optional(),
  mapState: StoryMapStateSchema,
  mediaIds: z.array(z.string()).optional(),
  layout: StoryLayoutSchema.default('split'),
  transition: StoryCameraTransitionSchema.default({
    profile: 'standard',
    durationMode: 'auto',
    pauseAfterMs: 800,
    reduceMotionPolicy: 'respect'
  }),
  durationHint: z.number().optional()
});
export type StoryScene = z.infer<typeof StorySceneSchema>;

export const StoryProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  theme: z.string().optional(),
  defaultFps: z.number().default(30),
  scenes: z.array(StorySceneSchema).default([])
});
export type StoryProject = z.infer<typeof StoryProjectSchema>;

export const StoryMediaTypeSchema = z.enum(['image', 'video', 'audio']);
export type StoryMediaType = z.infer<typeof StoryMediaTypeSchema>;

export const StoryMediaSchema = z.object({
  id: z.string(),
  type: StoryMediaTypeSchema,
  name: z.string(),
  mimeType: z.string(),
  dataUrl: z.string().optional(),
  caption: z.string().optional(),
  credit: z.string().optional(),
  sourceUrl: z.string().optional()
});
export type StoryMedia = z.infer<typeof StoryMediaSchema>;

export const SubtitleItemSchema = z.object({
  start: z.number(),
  end: z.number(),
  text: z.string()
});
export type SubtitleItem = z.infer<typeof SubtitleItemSchema>;

export const NarrationTrackSchema = z.object({
  sceneId: z.string(),
  audioMediaId: z.string().optional(),
  transcript: z.string().optional(),
  subtitles: z.array(SubtitleItemSchema).optional()
});
export type NarrationTrack = z.infer<typeof NarrationTrackSchema>;

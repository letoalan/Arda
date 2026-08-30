import { z } from 'zod';
import { ID, Timeline } from './types';

export const timelineEventSchema = z.object({
  id: z.string().min(1),
  layerId: z.string().min(1),
  timestamp: z.string().min(1),
  entityId: z.string().min(1),
  description: z.string().optional(),
  meta: z.any().optional()
});

export type TimelineEventSchema = z.infer<typeof timelineEventSchema>;

export const timelineSchema = z.object({
  id: z.string().min(1),
  worldId: z.string().min(1),
  name: z.string().min(1),
  events: z.array(timelineEventSchema),
  meta: z.any().optional()
});

export type TimelineSchema = z.infer<typeof timelineSchema>;

export const createTimeline = (worldId: ID, name: string): Timeline => ({
  id: crypto.randomUUID(),
  worldId,
  name,
  events: [],
  meta: {
    id: 'meta',
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
});

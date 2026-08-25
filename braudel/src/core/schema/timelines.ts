import { z } from 'zod';
import { ID, Timeline } from './types';

export const timelineEventSchema = z.object({
  id: z.string().uuid(),
  layerId: z.string().uuid(),
  timestamp: z.string().datetime(),
  entityId: z.string().uuid(),
  description: z.string().optional(),
  meta: z.any()
});

export type TimelineEventSchema = z.infer<typeof timelineEventSchema>;

export const timelineSchema = z.object({
  id: z.string().uuid(),
  worldId: z.string().uuid(),
  name: z.string().min(1),
  events: z.array(timelineEventSchema),
  meta: z.any()
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

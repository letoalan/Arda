import { z } from 'zod';
import { ID } from './types';

export const styleSchema = z.object({
  id: z.string().uuid(),
  worldId: z.string().uuid(),
  type: z.literal('relief'),
  name: z.string().min(1),
  properties: z.object({
    exaggeration: z.number().min(0).max(2).default(0.5),
    shadowColor: z.string().default('#000000'),
    highlightColor: z.string().default('#FFFFFF')
  }),
  meta: z.any()
});

export type StyleSchema = z.infer<typeof styleSchema>;

export const createReliefStyle = (worldId: ID, name: string): StyleSchema => ({
  id: crypto.randomUUID(),
  worldId,
  type: 'relief',
  name,
  properties: {
    exaggeration: 0.5,
    shadowColor: '#000000',
    highlightColor: '#FFFFFF'
  },
  meta: {
    id: 'meta',
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
});

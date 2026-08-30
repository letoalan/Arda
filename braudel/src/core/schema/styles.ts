import { z } from 'zod';
import { ID } from './types';

export const styleSchema = z.object({
  id: z.string().min(1),
  worldId: z.string().min(1),
  type: z.string().min(1),
  name: z.string().min(1),
  properties: z.record(z.unknown()).optional(),
  meta: z.any().optional()
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

import { z } from 'zod';
import { ID, LayerType, Layer } from './types';

export const layerSchema = z.object({
  id: z.string().uuid(),
  worldId: z.string().uuid(),
  type: z.enum(['physical', 'historical', 'political']),
  name: z.string().min(1),
  order: z.number().int().nonnegative(),
  visible: z.boolean(),
  meta: z.any()
});

export type LayerSchema = z.infer<typeof layerSchema>;

export const createLayer = (worldId: ID, type: LayerType, name: string, order: number): Layer => ({
  id: crypto.randomUUID(),
  worldId,
  type,
  name,
  order,
  visible: true,
  meta: {
    id: 'meta',
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
});

import { z } from 'zod';
import { ID, Relation } from './types';

export const relationSchema = z.object({
  id: z.string().uuid(),
  worldId: z.string().uuid(),
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  type: z.string().min(1),
  direction: z.enum(['directed', 'undirected', 'bidirectional']),
  weight: z.number().optional(),
  isSpatial: z.boolean().optional().default(false),
  entityId: z.string().uuid().optional(),
  temporalRange: z.object({
    validFrom: z.number(),
    validTo: z.number()
  }).optional(),
  meta: z.any()
});

export type RelationSchema = z.infer<typeof relationSchema>;

export const createRelation = (
  worldId: ID, 
  sourceId: ID, 
  targetId: ID, 
  type: string, 
  direction: 'directed' | 'undirected' | 'bidirectional', 
  weight?: number, 
  isSpatial: boolean = false, 
  entityId?: ID,
  temporalRange?: { validFrom: number, validTo: number }
): Relation => ({
  id: crypto.randomUUID(),
  worldId,
  sourceId,
  targetId,
  type,
  direction,
  weight,
  isSpatial,
  entityId,
  temporalRange,
  meta: {
    id: 'meta',
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
});

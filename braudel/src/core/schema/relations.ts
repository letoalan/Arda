import { z } from 'zod';
import { ID, Relation } from './types';

export const relationSchema = z.object({
  id: z.string().min(1),
  worldId: z.string().min(1),
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
  type: z.string().min(1),
  direction: z.enum(['directed', 'undirected', 'bidirectional']),
  weight: z.number().optional(),
  isSpatial: z.boolean().optional().default(false),
  entityId: z.string().min(1).optional(),
  temporalRange: z.object({
    validFrom: z.number(),
    validTo: z.number()
  }).optional(),
  meta: z.any().optional()
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

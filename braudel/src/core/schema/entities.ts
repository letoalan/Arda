import { z } from 'zod';
import { ID, EntityType, Entity } from './types';

// Schéma GeoJSON strict pour la géométrie
export const geoJsonPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]) // [longitude, latitude]
});

export const geoJsonLineStringSchema = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(z.tuple([z.number(), z.number()])),
});

export const geoJsonPolygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
});

export const geometrySchema = z.union([
  geoJsonPointSchema,
  geoJsonLineStringSchema,
  geoJsonPolygonSchema,
]);

export type GeoJsonPoint = z.infer<typeof geoJsonPointSchema>;
export type GeoJsonLineString = z.infer<typeof geoJsonLineStringSchema>;
export type GeoJsonPolygon = z.infer<typeof geoJsonPolygonSchema>;
export type GeometryType = z.infer<typeof geometrySchema>;

export const entitySchema = z.object({
  id: z.string().uuid(),
  worldId: z.string().uuid(),
  layerId: z.string().uuid(),
  type: z.enum(['place', 'event', 'actor', 'concept']),
  name: z.string().min(1),
  description: z.string().optional(),
  geometry: geometrySchema.optional(),
  properties: z.record(z.unknown()).optional(),
  temporalRange: z.object({
    validFrom: z.number(),
    validTo: z.number()
  }).optional().refine(data => !data || data.validFrom <= data.validTo, {
    message: "validFrom must be less than or equal to validTo"
  }),
  wikiContent: z.string().optional(),
  meta: z.any()
});

export type EntitySchema = z.infer<typeof entitySchema>;

export const createEntity = (worldId: ID, layerId: ID, type: EntityType, name: string, geometry?: GeometryType, validFrom?: number, validTo?: number): Entity => ({
  id: crypto.randomUUID(),
  worldId,
  layerId,
  type,
  name,
  description: undefined,
  geometry,
  properties: {},
  temporalRange: (validFrom !== undefined && validTo !== undefined) ? { validFrom, validTo } : undefined,
  meta: {
    id: 'meta',
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
});

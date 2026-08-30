import { z } from 'zod';
import { ID, EntityType, Entity } from './types';

// Schéma GeoJSON standard et complet pour la géométrie
export const geoJsonPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]) // [longitude, latitude]
});

export const geoJsonMultiPointSchema = z.object({
  type: z.literal('MultiPoint'),
  coordinates: z.array(z.tuple([z.number(), z.number()])),
});

export const geoJsonLineStringSchema = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(z.tuple([z.number(), z.number()])),
});

export const geoJsonMultiLineStringSchema = z.object({
  type: z.literal('MultiLineString'),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
});

export const geoJsonPolygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
});

export const geoJsonMultiPolygonSchema = z.object({
  type: z.literal('MultiPolygon'),
  coordinates: z.array(z.array(z.array(z.tuple([z.number(), z.number()])))),
});

export const geometrySchema = z.union([
  geoJsonPointSchema,
  geoJsonMultiPointSchema,
  geoJsonLineStringSchema,
  geoJsonMultiLineStringSchema,
  geoJsonPolygonSchema,
  geoJsonMultiPolygonSchema,
]);

export type GeoJsonPoint = z.infer<typeof geoJsonPointSchema>;
export type GeoJsonMultiPoint = z.infer<typeof geoJsonMultiPointSchema>;
export type GeoJsonLineString = z.infer<typeof geoJsonLineStringSchema>;
export type GeoJsonMultiLineString = z.infer<typeof geoJsonMultiLineStringSchema>;
export type GeoJsonPolygon = z.infer<typeof geoJsonPolygonSchema>;
export type GeoJsonMultiPolygon = z.infer<typeof geoJsonMultiPolygonSchema>;
export type GeometryType = z.infer<typeof geometrySchema>;

export const entitySchema = z.object({
  id: z.string().min(1),
  worldId: z.string().min(1),
  layerId: z.string().min(1),
  type: z.enum(['place', 'event', 'actor', 'concept']).optional().default('place'),
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
  color: z.string().optional(),
  wikiContent: z.string().optional(),
  updatedAt: z.string().optional(),
  meta: z.any().optional()
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

import { z } from 'zod';

export const GeojsonFamilySchema = z.enum([
  'historical',
  'contemporary',
  'administrative',
  'maritime'
]);
export type GeojsonFamily = z.infer<typeof GeojsonFamilySchema>;

export const GeographicScopeSchema = z.enum([
  'world',
  'continent',
  'country',
  'subnational'
]);
export type GeographicScope = z.infer<typeof GeographicScopeSchema>;

export const GeometryKindSchema = z.enum([
  'polygon',
  'line',
  'point',
  'mixed'
]);
export type GeometryKind = z.infer<typeof GeometryKindSchema>;

export const PrecisionLevelSchema = z.enum([
  'overview',
  'standard',
  'detailed'
]);
export type PrecisionLevel = z.infer<typeof PrecisionLevelSchema>;

export const RecommendedUseSchema = z.enum([
  'narrative',
  'pedagogy',
  'analysis',
  'print'
]);
export type RecommendedUse = z.infer<typeof RecommendedUseSchema>;

export const GeojsonCatalogEntrySchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
  family: GeojsonFamilySchema,
  geographicScope: GeographicScopeSchema,
  temporalRange: z.tuple([z.number(), z.number()]).optional(),
  referenceYear: z.number().optional(),
  geometryKind: GeometryKindSchema,
  source: z.string(),
  license: z.string().optional(),
  precision: PrecisionLevelSchema.optional(),
  recommendedUse: RecommendedUseSchema,
  sizeBytes: z.number().optional()
});
export type GeojsonCatalogEntry = z.infer<typeof GeojsonCatalogEntrySchema>;

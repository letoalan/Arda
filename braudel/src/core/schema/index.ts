import { z } from 'zod';
import { StoryProjectSchema, StoryMediaSchema } from './story';
import { GeojsonCatalogEntrySchema } from './geojson-catalog';

// Export individual schemas for external use
export * as MetaSchema from './meta';
export * as WorldSchema from './world';
export * as LayersSchema from './layers';
export * as EntitiesSchema from './entities';
export * as RelationsSchema from './relations';
export * as TimelinesSchema from './timelines';
export * as StylesSchema from './styles';
export * as ImportsSchema from './imports';
export * as AISchema from './ai';
export * as ViewsSchema from './views';
export * as HistorySchema from './history';
export * as StorySchema from './story';
export * as GeojsonCatalogSchema from './geojson-catalog';
export * as WikiSchema from './wiki';
export * as ClimateSchema from './climate';

// Import specific schemas for internal use in databaseSchema
import { metaSchema } from './meta';
import { worldSchema } from './world';
import { layerSchema } from './layers';
import { entitySchema } from './entities';
import { relationSchema } from './relations';
import { timelineSchema } from './timelines';
import { styleSchema } from './styles';
import { importSchema } from './imports';
import { aiSchema } from './ai';
import { viewSchema } from './views';
import { historySchema } from './history';

export const databaseSchema = z.object({
  meta: z.array(metaSchema),
  world: z.array(worldSchema),
  layers: z.array(layerSchema),
  entities: z.array(entitySchema),
  relations: z.array(relationSchema),
  timelines: z.array(timelineSchema),
  styles: z.array(styleSchema),
  imports: z.array(importSchema),
  ai: z.array(aiSchema),
  views: z.array(viewSchema),
  history: z.array(historySchema),
  // Extensions optionnelles pour la narration et les sources GeoJSON (export2.md)
  story: StoryProjectSchema.optional(),
  mediaLibrary: z.array(StoryMediaSchema).optional(),
  geojsonSources: z.array(GeojsonCatalogEntrySchema).optional()
});

export type DatabaseSchema = z.infer<typeof databaseSchema>;

export const validateDatabase = (data: unknown): data is DatabaseSchema => {
  try {
    databaseSchema.parse(data);
    return true;
  } catch {
    return false;
  }
};

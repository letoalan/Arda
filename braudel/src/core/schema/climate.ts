import { z } from 'zod';

export const climatePointSchema = z.object({
  year: z.number(),
  deltaTemp: z.number() // Delta en °C par rapport à la période de référence
});

export type ClimatePoint = z.infer<typeof climatePointSchema>;

export const climateScenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['historical', 'rcp', 'tolkien_parametric', 'custom']),
  points: z.array(climatePointSchema).min(1),
  meta: z.record(z.unknown()).optional()
});

export type ClimateScenario = z.infer<typeof climateScenarioSchema>;

export const climateSettingsSchema = z.object({
  seaLevelVisible: z.boolean().default(false),
  iceCapVisible: z.boolean().default(false),
  activeScenarioId: z.string().optional(),
  rcpVariability: z.boolean().default(false),
  medianWarmingTarget: z.number().min(1).max(4).default(2.5)
});

export type ClimateSettings = z.infer<typeof climateSettingsSchema>;

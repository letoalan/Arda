import { z } from 'zod';
import { Meta, World, WorldType } from './types';

export const worldSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  worldType: z.enum(['real', 'fictional']).optional().default('real'),
  continents: z.any().optional(),
  basemapStyle: z.string().optional(),
  basemapLabelsVisible: z.boolean().optional(),
  basemapBordersVisible: z.boolean().optional(),
  activeEmpire: z.string().optional(),
  startYear: z.number().optional(),
  endYear: z.number().optional(),
  prometheanMode: z.boolean().optional(),
  meta: z.any().optional(),
});

export type WorldSchema = z.infer<typeof worldSchema>;

export const createWorld = (name: string, meta: Meta, worldType?: WorldType, basemapStyle?: any, startYear?: number, endYear?: number): World => ({
  id: crypto.randomUUID(),
  name,
  description: undefined,
  worldType: worldType || 'real', // Default to real for backward compatibility
  basemapStyle: basemapStyle || (worldType === 'fictional' ? 'tolkien_high_fantasy' : 'contemporary_current'),
  basemapLabelsVisible: worldType === 'fictional' ? true : true,
  basemapBordersVisible: worldType === 'fictional' ? false : true,
  activeEmpire: worldType === 'fictional' ? undefined : 'all',
  startYear: startYear !== undefined ? startYear : -3000,
  endYear: endYear !== undefined ? endYear : 2100,
  prometheanMode: false,
  meta,
});

export const createRealWorld = (name: string, meta: Meta, basemapStyle?: any, startYear?: number, endYear?: number): World => ({
  ...createWorld(name, meta, 'real', basemapStyle, startYear, endYear),
  worldType: 'real' as WorldType,
});

export const createFictionalWorld = (name: string, meta: Meta, startYear?: number, endYear?: number): World => ({
  ...createWorld(name, meta, 'fictional', 'tolkien_high_fantasy', startYear, endYear),
  worldType: 'fictional' as WorldType,
});

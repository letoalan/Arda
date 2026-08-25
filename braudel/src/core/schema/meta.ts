import { z } from 'zod';
import { Version, Meta } from './types';

export const metaSchema = z.object({
  id: z.literal('meta'),
  schemaVersion: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type MetaSchema = z.infer<typeof metaSchema>;

export const createMeta = (version: Version): Meta => ({
  id: 'meta',
  schemaVersion: version,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

import { DatabaseSchema } from '../schema';
import { createMeta } from '../schema/meta'; // Assuming createMeta is exported from meta.ts

export const createEmptyDatabase = (): DatabaseSchema => {
  return {
    meta: [createMeta(1)], // Initialize with a default meta object
    world: [],
    layers: [],
    entities: [],
    relations: [],
    timelines: [],
    styles: [],
    imports: [],
    ai: [],
    views: [],
    history: []
  };
};

import { DatabaseSchema } from '../schema';
import { createMeta } from '../schema/meta';

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
    history: [],
  };
};

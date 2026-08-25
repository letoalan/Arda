import * as Schema from '../../core/schema';

export const serialize = (data: unknown): string => {
  return JSON.stringify(data, null, 2);
};

export const deserialize = <T>(raw: string): T => {
  return JSON.parse(raw) as T;
};

export const exportWorld = (worldData: Schema.DatabaseSchema): string => {
  if (!Schema.validateDatabase(worldData)) {
    throw new Error('Validation échouée avant export');
  }
  return serialize(worldData);
};

export const importWorld = (raw: string): Schema.DatabaseSchema => {
  try {
    const parsed = deserialize<unknown>(raw);
    
    if (!Schema.validateDatabase(parsed)) {
      throw new Error('Validation échouée');
    }
    
    return parsed;
  } catch (error) {
    throw new Error(`Import échoué : ${(error as Error).message}`);
  }
};

export default {
  serialize,
  deserialize,
  exportWorld,
  importWorld
};

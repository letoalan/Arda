import { describe, it, expect } from 'vitest';
import { validateDatabase } from '../core/schema';

describe('Schema validation', () => {
  it('valide un monde vide valide', () => {
    const validData = {
      meta: [
        {
          id: 'meta',
          schemaVersion: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
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

    expect(validateDatabase(validData)).toBe(true);
  });

  it('rejette un monde invalide', () => {
    const invalidData = {
      meta: [{ id: 'wrong' }],
      world: []
    };

    expect(validateDatabase(invalidData)).toBe(false);
  });
});

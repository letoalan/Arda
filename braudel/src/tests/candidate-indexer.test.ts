// tests/candidate-indexer.test.ts

import { describe, it, expect } from 'vitest';
import { buildCandidateIndex } from '../services/import/candidateIndexer';
import { normalizeSelectedFeatures } from '../services/import/geopoliticaImporter';
import type { Feature } from 'geojson';

describe('Candidate Indexer & Selective Normalization', () => {
  const mockFeatures: Feature[] = [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]]
      },
      properties: {
        NAME: 'Empire Romain',
        CONTINENT: 'Europe',
        PARTOF: 'Empire'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [12.49, 41.90]
      },
      properties: {
        NAME: 'Rome',
        CONTINENT: 'Europe'
      }
    }
  ];

  it('should build candidate index from GeoJSON features', () => {
    const candidates = buildCandidateIndex(mockFeatures, {
      sourceId: 'hist-rome-100ad',
      sourceType: 'geopolitica',
      referenceYear: 100,
      label: 'Monde en l\'an 100 ap. J.-C.'
    });

    expect(candidates).toHaveLength(2);
    expect(candidates[0].name).toBe('Empire Romain');
    expect(candidates[0].geometryType).toBe('Polygon');
    expect(candidates[0].continent).toBe('Europe');
    expect(candidates[0].referenceYear).toBe(100);

    expect(candidates[1].name).toBe('Rome');
    expect(candidates[1].geometryType).toBe('Point');
  });

  it('should normalize only selected candidates with importBatchId', () => {
    const candidates = buildCandidateIndex(mockFeatures, {
      sourceId: 'hist-rome-100ad',
      sourceType: 'geopolitica',
      referenceYear: 100
    });

    // Select only candidate 0 (Empire Romain)
    const selected = [candidates[0]];
    const batchId = 'batch-test-123';
    const entities = normalizeSelectedFeatures(selected, 'layer-1', 'world-1', batchId);

    expect(entities).toHaveLength(1);
    expect(entities[0].name).toBe('Empire Romain');
    expect(entities[0].layerId).toBe('layer-1');
    expect(entities[0].worldId).toBe('world-1');
    expect(entities[0].properties?.importBatchId).toBe(batchId);
  });
});

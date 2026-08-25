import { describe, it, expect } from 'vitest';
import { calculateBuffer } from '../services/analysis/analysis-service';
import { generateStandaloneHtml } from '../services/export/standalone-template';
import { STYLE_CONFIGS } from '../core/styles.config';

describe('Multimedia Export & Spatial Analysis Tests', () => {
  it('should correctly calculate a buffer polygon around a point', () => {
    const point = {
      type: 'Point' as const,
      coordinates: [2.3522, 48.8566] as [number, number] // Paris
    };

    const buffer = calculateBuffer(point, 10); // 10 km
    expect(buffer.geometry.type).toBe('Polygon');
    expect(buffer.geometry.coordinates[0].length).toBe(33); // 32 segments + fermeture
    
    // Le premier et le dernier point doivent être identiques
    const coords = buffer.geometry.coordinates[0];
    expect(coords[0][0]).toBeCloseTo(coords[coords.length - 1][0], 5);
    expect(coords[0][1]).toBeCloseTo(coords[coords.length - 1][1], 5);
  });

  it('should generate a valid standalone HTML page containing all injected elements', () => {
    const style = STYLE_CONFIGS[0];
    const entities = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [0, 0] },
          properties: { name: 'Rome', type: 'city' }
        }
      ]
    };
    const relations = {
      type: 'FeatureCollection',
      features: []
    };

    const html = generateStandaloneHtml('Monde Test', style, entities, relations);
    expect(html).toContain('maplibregl.Map');
    expect(html).toContain('entitiesData');
    expect(html).toContain('relationsData');
    expect(html).toContain('Monde Test');
    expect(html).toContain('time-slider');
  });
});

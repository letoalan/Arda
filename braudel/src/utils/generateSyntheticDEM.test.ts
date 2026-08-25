import { describe, it, expect } from 'vitest';
import { generateSyntheticDEM } from './generateSyntheticDEM';
import { FeatureCollection, Polygon } from 'geojson';

describe('generateSyntheticDEM', () => {
  it('should generate sea level (0) for points outside continents and elevation > 0 inside', () => {
    // Simple square continent from lon -10 to 10, lat -10 to 10
    const geojson: FeatureCollection<Polygon> = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-10, -10],
              [10, -10],
              [10, 10],
              [-10, 10],
              [-10, -10]
            ]]
          }
        }
      ]
    };

    // A tiny grid 36x18 (10 degrees per pixel)
    const width = 36;
    const height = 18;
    const grid = generateSyntheticDEM(geojson, width, height, 'test-seed');

    expect(grid.length).toBe(width * height);

    let maxElevation = 0;
    let minLandElevation = Infinity;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const lon = (x / width) * 360 - 180;
        const lat = 90 - (y / height) * 180;
        
        const isInside = lon > -9.9 && lon < 9.9 && lat > -9.9 && lat < 9.9;
        const isOutside = lon < -10.1 || lon > 10.1 || lat < -10.1 || lat > 10.1;
        const elevation = grid[y * width + x];

        if (isInside) {
          expect(elevation).toBeGreaterThan(0);
          maxElevation = Math.max(maxElevation, elevation);
          minLandElevation = Math.min(minLandElevation, elevation);
        } else if (isOutside) {
          expect(elevation).toBeLessThanOrEqual(0);
        }
      }
    }

    // Ensure we have some variance (not a flat plateau and not pure noise returning negative)
    expect(maxElevation).toBeGreaterThan(10);
    expect(minLandElevation).toBeGreaterThanOrEqual(10); // Minimum land altitude
    console.log(`Test passed. Max elevation found: ${maxElevation.toFixed(2)}m, Min land: ${minLandElevation.toFixed(2)}m`);
  });
});

import { FeatureCollection, Polygon, Point } from 'geojson';

/**
 * Computes a simple centroid (average of all vertices) for a given polygon ring.
 */
function computeCentroid(ring: [number, number][]): [number, number] {
  if (!ring || ring.length === 0) return [0, 0];
  if (ring.length === 1) return [ring[0][0], ring[0][1]];
  let cx = 0;
  let cy = 0;
  const count = ring.length > 1 ? ring.length - 1 : 1;
  for (let i = 0; i < count; i++) {
    cx += ring[i][0];
    cy += ring[i][1];
  }
  return [cx / count, cy / count];
}

/**
 * Extracts the center point of each continent to place a label.
 */
export function generateContinentLabels(geojson: FeatureCollection<Polygon>): FeatureCollection<Point> {
  const points = geojson.features.map(feature => {
    // We only use the exterior ring (index 0)
    const exteriorRing = feature.geometry.coordinates[0];
    const centroid = computeCentroid(exteriorRing as [number, number][]);
    
    return {
      type: 'Feature' as const,
      properties: {
        name: feature.properties?.name || 'Continent'
      },
      geometry: {
        type: 'Point' as const,
        coordinates: centroid
      }
    };
  });

  return {
    type: 'FeatureCollection',
    features: points
  };
}

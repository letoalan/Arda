import { GeometryType } from '../core/schema/types';

/**
 * Returns the approximate center (centroid) of a GeoJSON geometry.
 * Returns [longitude, latitude].
 */
export function getCenter(geometry: GeometryType): [number, number] | null {
  if (!geometry) return null;

  if (geometry.type === 'Point') {
    return geometry.coordinates as [number, number];
  }

  if (geometry.type === 'LineString') {
    const coords = geometry.coordinates;
    if (coords.length === 0) return null;
    const mid = Math.floor(coords.length / 2);
    return coords[mid] as [number, number];
  }

  if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates;
    if (coords.length === 0 || coords[0].length === 0) return null;
    const ring = coords[0]; // exterior ring
    
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const pt of ring) {
      const x = pt[0];
      const y = pt[1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    return [(minX + maxX) / 2, (minY + maxY) / 2];
  }

  return null;
}

/**
 * Calculates the bearing (angle in degrees) between two points [lon, lat].
 * North is 0, East is 90, South is 180, West is 270 (or -90).
 */
export function calculateBearing(start: [number, number], end: [number, number]): number {
  const startLat = start[1] * Math.PI / 180;
  const startLng = start[0] * Math.PI / 180;
  const endLat = end[1] * Math.PI / 180;
  const endLng = end[0] * Math.PI / 180;

  const dLng = endLng - startLng;

  const y = Math.sin(dLng) * Math.cos(endLat);
  const x = Math.cos(startLat) * Math.sin(endLat) -
            Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

  const bearing = Math.atan2(y, x);
  return (bearing * 180 / Math.PI + 360) % 360;
}

/**
 * Generates Point features representing arrowheads for a LineString.
 */
export function getArrowheadPoints(
  entity: any,
  arrowMode: 'forward' | 'backward' | 'both' | 'none'
): any[] {
  if (!entity.geometry || entity.geometry.type !== 'LineString' || arrowMode === 'none') {
    return [];
  }

  const coords = entity.geometry.coordinates;
  if (coords.length < 2) return [];

  const points: any[] = [];
  const color = entity.properties?.color || '#3B82F6';

  if (arrowMode === 'forward' || arrowMode === 'both') {
    const p1 = coords[coords.length - 2] as [number, number];
    const p2 = coords[coords.length - 1] as [number, number];
    const bearing = calculateBearing(p1, p2);
    points.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: p2 },
      properties: { bearing, color, lineWidth: entity.properties?.lineWidth, entityId: entity.id }
    });
  }

  if (arrowMode === 'backward' || arrowMode === 'both') {
    const p1 = coords[1] as [number, number];
    const p2 = coords[0] as [number, number];
    const bearing = calculateBearing(p1, p2);
    points.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: p2 },
      properties: { bearing, color, lineWidth: entity.properties?.lineWidth, entityId: entity.id }
    });
  }

  return points;
}

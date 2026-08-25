// utils/demGeometry.ts

/**
 * Checks if a point is inside a GeoJSON polygon ring.
 */
export function isPointInPolygon(point: [number, number], polygon: [number, number][][]): boolean {
  const [x, y] = point;
  let inside = false;
  
  const ring = polygon[0];
  if (!ring || ring.length < 3) return false;
  
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  if (!inside) return false;
  
  for (let h = 1; h < polygon.length; h++) {
    let insideHole = false;
    const hole = polygon[h];
    for (let i = 0, j = hole.length - 1; i < hole.length; j = i++) {
      const xi = hole[i][0], yi = hole[i][1];
      const xj = hole[j][0], yj = hole[j][1];
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) insideHole = !insideHole;
    }
    if (insideHole) return false;
  }
  
  return true;
}

/**
 * Squared distance from point to line segment
 */
export function distToSegmentSquared(p: [number, number], v: [number, number], w: [number, number]): number {
  const l2 = (w[0] - v[0]) ** 2 + (w[1] - v[1]) ** 2;
  if (l2 === 0) return (p[0] - v[0]) ** 2 + (p[1] - v[1]) ** 2;
  let t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
  t = Math.max(0, Math.min(1, t));
  return (p[0] - (v[0] + t * (w[0] - v[0]))) ** 2 + (p[1] - (v[1] + t * (w[1] - v[1]))) ** 2;
}

/**
 * Shortest distance from a point to the edges of a polygon
 */
export function distanceToPolygonEdges(point: [number, number], polygon: [number, number][][]): number {
  let minDistSq = Infinity;
  for (const ring of polygon) {
    if (!ring) continue;
    for (let i = 0; i < ring.length - 1; i++) {
      const dSq = distToSegmentSquared(point, ring[i], ring[i+1]);
      if (dSq < minDistSq) minDistSq = dSq;
    }
  }
  return Math.sqrt(minDistSq);
}

export function smoothFalloff(t: number): number {
  return 0.5 * (1 + Math.cos(Math.PI * Math.min(1, t)));
}

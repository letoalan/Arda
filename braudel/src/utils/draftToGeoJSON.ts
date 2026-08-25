import { TerrainFeatureDraft, TerrainFeatureType } from '../app/views/ContinentBuilderView';
import { FeatureCollection, Feature, Geometry } from 'geojson';

/**
 * Infer geometry kind from the terrain feature type when geometryKind
 * is not explicitly set (i.e. hand-drawn features vs AI-parsed sketches).
 *
 * - Surfaces (continent, hills, valley) → Polygon
 * - Linear features (mountain range, ridge, rift, trench) → LineString
 * - Point features (peak) → Point
 */
function inferGeometryKind(featureType: TerrainFeatureType, explicitKind?: string): 'point' | 'line' | 'polygon' {
  if (explicitKind === 'point' || explicitKind === 'line' || explicitKind === 'polygon') {
    return explicitKind;
  }

  switch (featureType) {
    case 'peak':
      return 'point';
    case 'mountain':
    case 'ridge':
    case 'rift':
    case 'trench':
      return 'line';
    case 'continent':
    case 'hills':
    case 'valley':
    default:
      return 'polygon';
  }
}

export function draftsToGeoJSON(
  drafts: TerrainFeatureDraft[],
  canvasWidth: number,
  canvasHeight: number
): FeatureCollection<Geometry> {
  const features: Feature<Geometry>[] = drafts.map(draft => {
    // lon = (x / canvasWidth) * 360 - 180
    // lat = 90 - (y / canvasHeight) * 180
    const coordinates = draft.points.map(pt => {
      const lon = (pt.x / canvasWidth) * 360 - 180;
      const rawLat = 90 - (pt.y / canvasHeight) * 180;
      const lat = Math.max(-85, Math.min(85, rawLat));
      return [lon, lat];
    });
    
    const kind = inferGeometryKind(draft.featureType, draft.geometryKind);
    let geometry: Geometry;

    if (kind === 'point') {
      // For peaks: use the centroid of all drawn points
      if (coordinates.length === 1) {
        geometry = { type: 'Point', coordinates: coordinates[0] };
      } else {
        const cx = coordinates.reduce((s, c) => s + c[0], 0) / coordinates.length;
        const cy = coordinates.reduce((s, c) => s + c[1], 0) / coordinates.length;
        geometry = { type: 'Point', coordinates: [cx, cy] };
      }
    } else if (kind === 'line') {
      geometry = { type: 'LineString', coordinates };
    } else {
      // Close the polygon if not closed
      if (coordinates.length > 0) {
        const first = coordinates[0];
        const last = coordinates[coordinates.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          coordinates.push([...first]);
        }
      }
      geometry = { type: 'Polygon', coordinates: [coordinates] };
    }

    return {
      type: 'Feature',
      properties: { type: draft.featureType, name: draft.name || draft.featureType },
      geometry
    };
  });

  return {
    type: 'FeatureCollection',
    features
  };
}

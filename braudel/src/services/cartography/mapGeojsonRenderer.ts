// services/cartography/mapGeojsonRenderer.ts

import maplibregl from 'maplibre-gl';
import type { Entity, Relation } from '../../core/schema/types';

export function buildEntitiesGeoJSON(entities: Entity[], relations: Relation[], currentTime: number, empireFilter: string) {
  const features: any[] = [];

  const activeEntities = entities.filter((e) => {
    if (e.properties?.isRelation) return false;
    if (!e.temporalRange) return true;
    return e.temporalRange.validFrom <= currentTime && e.temporalRange.validTo >= currentTime;
  });

  const activeIds = new Set(activeEntities.map((e) => e.id));

  activeEntities.forEach((entity) => {
    if (!entity.geometry) return;
    if (empireFilter !== 'all' && entity.properties?.empire && entity.properties.empire !== empireFilter) return;

    features.push({
      type: 'Feature',
      id: entity.id,
      geometry: entity.geometry,
      properties: {
        id: entity.id,
        name: entity.name,
        type: entity.type,
        color: entity.properties?.color || '#3B82F6',
        isRelation: false,
      },
    });
  });

  relations.forEach((rel) => {
    if (!activeIds.has(rel.sourceId) || !activeIds.has(rel.targetId)) return;
    const sourceEnt = activeEntities.find((e) => e.id === rel.sourceId);
    const targetEnt = activeEntities.find((e) => e.id === rel.targetId);

    if (sourceEnt?.geometry && targetEnt?.geometry) {
      const c1 = sourceEnt.geometry.type === 'Point' ? sourceEnt.geometry.coordinates : null;
      const c2 = targetEnt.geometry.type === 'Point' ? targetEnt.geometry.coordinates : null;

      if (c1 && c2) {
        features.push({
          type: 'Feature',
          id: rel.id,
          geometry: { type: 'LineString', coordinates: [c1, c2] },
          properties: {
            id: rel.id,
            name: `${sourceEnt.name} → ${targetEnt.name}`,
            type: 'relation',
            relType: rel.type,
            color: '#F59E0B',
            isRelation: true,
          },
        });
      }
    }
  });

  return { type: 'FeatureCollection', features };
}

export function updateMapSourceData(map: maplibregl.Map, sourceId: string, geojsonData: any) {
  const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
  if (source) {
    source.setData(geojsonData);
  }
}

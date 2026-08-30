// services/cartography/mapGeojsonRenderer.ts

import maplibregl from 'maplibre-gl';
import type { Entity, Relation, Layer } from '../../core/schema/types';

export function buildEntitiesGeoJSON(
  entities: Entity[],
  relations: Relation[],
  currentTime: number,
  empireFilter: string,
  layers?: Layer[],
  epochRange?: { validFrom?: number; validTo?: number }
) {
  const features: any[] = [];

  const hiddenLayerIds = new Set(
    (layers || []).filter((l) => l.visible === false).map((l) => l.id)
  );

  const activeEntities = entities.filter((e) => {
    if (e.properties?.isRelation) return false;
    if (e.layerId && hiddenLayerIds.has(e.layerId)) return false;
    if (!e.temporalRange) return true;

    const from = (e.temporalRange as any).validFrom !== undefined
      ? Number((e.temporalRange as any).validFrom)
      : Array.isArray(e.temporalRange)
      ? Number(e.temporalRange[0])
      : -Infinity;

    const to = (e.temporalRange as any).validTo !== undefined
      ? Number((e.temporalRange as any).validTo)
      : Array.isArray(e.temporalRange)
      ? Number(e.temporalRange[1])
      : Infinity;

    // 1. Visibilité au point temporel exact
    if (from <= currentTime && to >= currentTime) return true;

    // 2. Si une plage d'époque spécifique est fournie, tester le chevauchement
    if (epochRange && epochRange.validFrom !== undefined && epochRange.validTo !== undefined) {
      return from <= epochRange.validTo && to >= epochRange.validFrom;
    }

    return false;
  });


  const activeIds = new Set(activeEntities.map((e) => e.id));

  activeEntities.forEach((entity) => {
    if (!entity.geometry) return;
    if (empireFilter !== 'all' && entity.properties?.empire && entity.properties.empire !== empireFilter) return;

    const entityColor =
      (typeof entity.properties?.color === 'string' && entity.properties.color) ||
      (typeof (entity as any).color === 'string' && (entity as any).color) ||
      '#3B82F6';

    const fillOpacity =
      typeof entity.properties?.fillOpacity === 'number'
        ? entity.properties.fillOpacity
        : 0.45;

    const strokeOpacity =
      typeof entity.properties?.strokeOpacity === 'number'
        ? entity.properties.strokeOpacity
        : 0.9;

    const lineWidth =
      typeof entity.properties?.lineWidth === 'number'
        ? entity.properties.lineWidth
        : 1.5;

    features.push({
      type: 'Feature',
      id: entity.id,
      geometry: entity.geometry,
      properties: {
        id: entity.id,
        name: entity.name,
        type: entity.type,
        color: entityColor,
        fillColor: entityColor,
        strokeColor: entityColor,
        fillOpacity,
        strokeOpacity,
        lineWidth,
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

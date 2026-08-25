// services/cartography/mapDrawingService.ts

import MapboxDraw from '@mapbox/mapbox-gl-draw';

export function createMapLibreDrawInstance(): MapboxDraw {
  return new MapboxDraw({
    displayControlsDefault: false,
    controls: {
      point: true,
      line_string: true,
      polygon: true,
      trash: true,
    },
    styles: [
      {
        id: 'gl-draw-polygon-fill-inactive',
        type: 'fill',
        filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
        paint: { 'fill-color': '#3b82f6', 'fill-outline-color': '#3b82f6', 'fill-opacity': 0.2 },
      },
      {
        id: 'gl-draw-polygon-fill-active',
        type: 'fill',
        filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
        paint: { 'fill-color': '#f59e0b', 'fill-outline-color': '#f59e0b', 'fill-opacity': 0.4 },
      },
      {
        id: 'gl-draw-polygon-stroke-inactive',
        type: 'line',
        filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#3b82f6', 'line-width': 2 },
      },
      {
        id: 'gl-draw-polygon-stroke-active',
        type: 'line',
        filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#f59e0b', 'line-dasharray': [0.2, 2], 'line-width': 2 },
      },
      {
        id: 'gl-draw-line-inactive',
        type: 'line',
        filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'LineString']],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#3b82f6', 'line-width': 2 },
      },
      {
        id: 'gl-draw-line-active',
        type: 'line',
        filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'LineString']],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#f59e0b', 'line-dasharray': [0.2, 2], 'line-width': 2 },
      },
      {
        id: 'gl-draw-point-inactive',
        type: 'circle',
        filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Point']],
        paint: { 'circle-radius': 6, 'circle-color': '#3b82f6' },
      },
      {
        id: 'gl-draw-point-active',
        type: 'circle',
        filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Point']],
        paint: { 'circle-radius': 8, 'circle-color': '#f59e0b' },
      },
    ],
  });
}

export function enableDrawingModeOnMap(
  draw: MapboxDraw,
  entityId: string,
  type: 'Point' | 'LineString' | 'Polygon',
  existingGeometry?: any,
  modeOverride?: 'simple_select' | 'direct_select'
) {
  draw.deleteAll();

  if (existingGeometry) {
    const featureId = draw.add({
      type: 'Feature',
      id: entityId,
      geometry: existingGeometry,
      properties: {},
    })[0];

    if (modeOverride === 'direct_select' && (type === 'Polygon' || type === 'LineString')) {
      draw.changeMode('direct_select' as any, { featureId });
    } else {
      draw.changeMode('simple_select', { featureIds: [featureId] });
    }
  } else {
    const modeMap = {
      Point: 'draw_point',
      LineString: 'draw_line_string',
      Polygon: 'draw_polygon',
    };
    draw.changeMode(modeMap[type] as any);
  }
}

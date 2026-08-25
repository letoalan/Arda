// services/cartography/modules/grid-reference-layers.ts

import type { Map } from 'maplibre-gl';
import { geoReferenceLines } from '../../../data/geoReferenceLines';

export function generateGridData() {
  const features = [];
  
  for (let lat = -90; lat <= 90; lat += 30) {
    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [[-180, lat], [180, lat]]
      }
    });
  }
  
  for (let lon = -180; lon <= 180; lon += 30) {
    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [[lon, -90], [lon, 90]]
      }
    });
  }
  
  return {
    type: 'FeatureCollection',
    features
  };
}

export function initGridLayer(map: Map | null) {
  if (!map || map.getSource('grid-source')) return;

  map.addSource('grid-source', {
    type: 'geojson',
    data: generateGridData() as any
  });

  map.addLayer({
    id: 'grid-layer',
    type: 'line',
    source: 'grid-source',
    paint: {
      'line-color': '#d0d0c8',
      'line-width': 1,
      'line-opacity': 0.1
    }
  });
}

export function initGeoReferenceLinesLayer(map: Map | null) {
  if (!map || map.getSource('geo-reference-lines')) return;

  map.addSource('geo-reference-lines', {
    type: 'geojson',
    data: geoReferenceLines as any
  });

  map.addLayer({
    id: 'geo-reference-lines',
    type: 'line',
    source: 'geo-reference-lines',
    layout: {
      visibility: 'visible'
    },
    paint: {
      'line-color': '#78716c',
      'line-width': 1,
      'line-dasharray': [4, 4],
      'line-opacity': 0.5
    }
  });

  map.addLayer({
    id: 'geo-reference-labels',
    type: 'symbol',
    source: 'geo-reference-lines',
    layout: {
      visibility: 'visible',
      'symbol-placement': 'line',
      'text-field': ['get', 'name'],
      'text-size': 10,
      'text-offset': [0, 0.4],
      'text-anchor': 'top',
      'text-letter-spacing': 0.1,
    },
    paint: {
      'text-color': '#78716c',
      'text-halo-color': 'rgba(255, 255, 255, 0.85)',
      'text-halo-width': 1.5
    }
  });
}

export function toggleGeoReferenceLines(map: Map | null, visible: boolean) {
  if (!map) return;
  const visibility = visible ? 'visible' : 'none';
  ['geo-reference-lines', 'geo-reference-labels', 'grid-layer'].forEach((layerId) => {
    if (map.getLayer(layerId)) {
      try {
        map.setLayoutProperty(layerId, 'visibility', visibility);
      } catch (e) {}
    }
  });
}

export function initColonialGraticuleLayer(map: Map | null) {
  if (!map || map.getSource('colonial-graticule')) return;

  const features = [];
  for (let lat = -80; lat <= 80; lat += 10) {
    features.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[-180, lat], [180, lat]] },
      properties: { type: lat === 0 ? 'equator' : 'latitude', label: `${Math.abs(lat)}°${lat >= 0 ? 'N' : 'S'}` }
    });
  }
  for (let lon = -180; lon <= 180; lon += 10) {
    features.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[lon, -90], [lon, 90]] },
      properties: { type: lon === 0 ? 'prime' : 'longitude', label: `${Math.abs(lon)}°${lon >= 0 ? 'E' : 'O'}` }
    });
  }

  map.addSource('colonial-graticule', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features } as any
  });

  map.addLayer({
    id: 'colonial-graticule-lines',
    type: 'line',
    source: 'colonial-graticule',
    layout: { visibility: 'none' },
    paint: {
      'line-color': '#8B5A2B',
      'line-width': ['match', ['get', 'type'], 'equator', 1.5, 'prime', 1.5, 0.5],
      'line-dasharray': [2, 4],
      'line-opacity': 0.4
    }
  });

  map.addLayer({
    id: 'colonial-graticule-labels',
    type: 'symbol',
    source: 'colonial-graticule',
    layout: {
      visibility: 'none',
      'symbol-placement': 'line',
      'text-field': ['get', 'label'],
      'text-size': 9,
      'text-letter-spacing': 0.05,
    },
    paint: {
      'text-color': '#784421',
      'text-halo-color': 'rgba(255, 255, 255, 0.85)',
      'text-halo-width': 1.5
    }
  });
}

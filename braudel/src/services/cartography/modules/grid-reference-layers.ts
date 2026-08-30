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

export function generateGraticuleGeoJSON() {
  const features = [];
  const lonStep = 30;
  const latStep = 15;

  // Parallèles de -80° à +80° tous les 10°
  for (let lat = -80; lat <= 80; lat += 10) {
    const coords: [number, number][] = [];
    for (let lon = -180; lon <= 180; lon += lonStep) {
      coords.push([lon, lat]);
    }
    const isEquator = lat === 0;
    features.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: coords },
      properties: {
        type: isEquator ? 'equator' : 'latitude',
        label: isEquator ? 'Équateur (0°)' : `${Math.abs(lat)}°${lat > 0 ? 'N' : 'S'}`
      }
    });
  }

  // Méridiens de -180° à +180° tous les 10° (bornés à ±85° pour le Web Mercator)
  for (let lon = -180; lon <= 180; lon += 10) {
    const coords: [number, number][] = [];
    coords.push([lon, -85]);
    for (let lat = -75; lat <= 75; lat += latStep) {
      coords.push([lon, lat]);
    }
    coords.push([lon, 85]);
    const isPrime = lon === 0;
    features.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: coords },
      properties: {
        type: isPrime ? 'prime' : 'longitude',
        label: isPrime ? 'Greenwich (0°)' : `${Math.abs(lon)}°${lon > 0 ? 'E' : 'O'}`
      }
    });
  }

  return {
    type: 'FeatureCollection',
    features
  };
}

export function initColonialGraticuleLayer(map: Map | null, initialVisibility: boolean = true) {
  if (!map) return;
  if (!map.isStyleLoaded()) {
    map.once('style.load', () => initColonialGraticuleLayer(map, initialVisibility));
    return;
  }
  if (map.getSource('colonial-graticule')) {
    toggleGraticuleGrid(map, initialVisibility);
    return;
  }

  try {
    if (!map.getSource('colonial-graticule')) {
      map.addSource('colonial-graticule', {
        type: 'geojson',
        data: generateGraticuleGeoJSON() as any
      });
    }

    const visibility = initialVisibility ? 'visible' : 'none';

    if (!map.getLayer('colonial-graticule-lines')) {
      map.addLayer({
        id: 'colonial-graticule-lines',
        type: 'line',
        source: 'colonial-graticule',
        layout: { 
          visibility,
          'line-cap': 'round',
          'line-join': 'round'
        },
        paint: {
          'line-color': '#5c3a21',
          'line-width': ['match', ['get', 'type'], 'equator', 1.5, 'prime', 1.5, 0.75],
          'line-dasharray': [3, 3],
          'line-opacity': 0.65
        }
      });
    }

    if (!map.getLayer('colonial-graticule-labels')) {
      map.addLayer({
        id: 'colonial-graticule-labels',
        type: 'symbol',
        source: 'colonial-graticule',
        layout: {
          visibility,
          'symbol-placement': 'line',
          'text-field': ['get', 'label'],
          'text-size': 10,
          'text-letter-spacing': 0.05,
          'symbol-spacing': 300
        },
        paint: {
          'text-color': '#5c3a21',
          'text-halo-color': 'rgba(255, 255, 255, 0.9)',
          'text-halo-width': 1.5
        }
      });
    }
  } catch (err) {
    console.warn('initColonialGraticuleLayer deferred or caught error:', err);
  }
}

export function toggleGraticuleGrid(map: Map | null, visible: boolean) {
  if (!map) return;
  if (!map.isStyleLoaded()) {
    map.once('style.load', () => toggleGraticuleGrid(map, visible));
    return;
  }
  if (!map.getSource('colonial-graticule')) {
    initColonialGraticuleLayer(map, visible);
  }
  const visibility = visible ? 'visible' : 'none';
  ['colonial-graticule-lines', 'colonial-graticule-labels', 'graticule-grid-lines', 'graticule-grid-labels'].forEach((layerId) => {
    if (map.getLayer(layerId)) {
      try {
        map.setLayoutProperty(layerId, 'visibility', visibility);
      } catch (e) {}
    }
  });
}

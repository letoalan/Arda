// services/cartography/modules/grid-reference-layers.ts

import type { Map } from 'maplibre-gl';
import { geoReferenceLines } from '../../../data/geoReferenceLines';
import { BasemapStyleId } from '../../../core/styles.config';
import { getGraticuleStyleForBasemap } from '../../../core/styles/styleFeatureDefaults';
import { logCarto, logCartoWarn } from './carto-logger';

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
    layout: {
      visibility: 'none' // Par défaut désactivé pour éviter tout conflit avec le graticule 10°
    },
    paint: {
      'line-color': '#d0d0c8',
      'line-width': 1,
      'line-opacity': 0.1
    }
  });
}

export function initGeoReferenceLinesLayer(map: Map | null) {
  if (!map) return;
  const beforeId = map.getLayer('braudel-polygons') ? 'braudel-polygons' : undefined;

  if (!map.getSource('geo-reference-lines')) {
    map.addSource('geo-reference-lines', {
      type: 'geojson',
      data: geoReferenceLines as any
    });
  }

  if (!map.getLayer('geo-reference-lines')) {
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
    }, beforeId);
  }

  if (!map.getLayer('geo-reference-labels')) {
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
    }, beforeId);
  }
}

export function toggleGeoReferenceLines(map: Map | null, visible: boolean) {
  if (!map) return;
  const visibility = visible ? 'visible' : 'none';
  logCarto('GEO_REF_TOGGLE', `Visibilité lignes astronomiques -> ${visibility}`);
  ['geo-reference-lines', 'geo-reference-labels'].forEach((layerId) => {
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

export function initColonialGraticuleLayer(map: Map | null, initialVisibility: boolean = true, styleId?: BasemapStyleId) {
  if (!map) return;
  if (typeof map.getStyle === 'function' && !map.getStyle()) {
    logCarto('GRATICULE_DEFERRED', `Attente de style pour initialiser le graticule (styleId=${styleId})`);
    map.once('styledata', () => initColonialGraticuleLayer(map, initialVisibility, styleId));
    return;
  }

  try {
    const visibility = initialVisibility ? 'visible' : 'none';
    const graticuleStyle = getGraticuleStyleForBasemap(styleId || 'colonial');
    const beforeId = map.getLayer('braudel-polygons') ? 'braudel-polygons' : undefined;

    // 1. Source GeoJSON unique garantie
    if (!map.getSource('colonial-graticule')) {
      map.addSource('colonial-graticule', {
        type: 'geojson',
        data: generateGraticuleGeoJSON() as any
      });
      logCarto('GRATICULE_SOURCE_CREATED', 'Source colonial-graticule injectée.');
    }

    // 2. Calque des lignes méridiens/parallèles auto-réparateur
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
          'line-color': graticuleStyle.lineColor,
          'line-width': ['match', ['get', 'type'], 'equator', graticuleStyle.lineWidthEquatorPrime, 'prime', graticuleStyle.lineWidthEquatorPrime, graticuleStyle.lineWidthStandard],
          'line-dasharray': [3, 3],
          'line-opacity': graticuleStyle.lineOpacity
        }
      }, beforeId);
      logCarto('GRATICULE_LAYER_LINES_ADDED', `Calque colonial-graticule-lines créé (visibility=${visibility}, color=${graticuleStyle.lineColor})`);
    } else {
      map.setLayoutProperty('colonial-graticule-lines', 'visibility', visibility);
    }

    // 3. Calque des étiquettes de degrés auto-réparateur
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
          'text-color': graticuleStyle.textColor,
          'text-halo-color': graticuleStyle.textHaloColor,
          'text-halo-width': graticuleStyle.textHaloWidth
        }
      }, beforeId);
      logCarto('GRATICULE_LAYER_LABELS_ADDED', `Calque colonial-graticule-labels créé (visibility=${visibility})`);
    } else {
      map.setLayoutProperty('colonial-graticule-labels', 'visibility', visibility);
    }

    if (styleId) {
      updateGraticuleStyle(map, styleId);
    }
  } catch (err) {
    logCartoWarn('GRATICULE_INIT_ERROR', 'Erreur lors de l\'initialisation du graticule:', err);
  }
}

/**
 * Met à jour dynamiquement la couleur, l'opacité et les halos du graticule vectoriel 10°
 * en fonction du style de fond de carte actif pour un contraste impeccable.
 */
export function updateGraticuleStyle(map: Map | null, styleId: BasemapStyleId) {
  if (!map) return;
  if (typeof map.getStyle === 'function' && !map.getStyle()) {
    map.once('styledata', () => updateGraticuleStyle(map, styleId));
    return;
  }
  const style = getGraticuleStyleForBasemap(styleId);

  ['colonial-graticule-lines', 'graticule-grid-lines'].forEach((layerId) => {
    if (map.getLayer(layerId)) {
      try {
        map.setPaintProperty(layerId, 'line-color', style.lineColor);
        map.setPaintProperty(layerId, 'line-opacity', style.lineOpacity);
        map.setPaintProperty(layerId, 'line-width', [
          'match', ['get', 'type'],
          'equator', style.lineWidthEquatorPrime,
          'prime', style.lineWidthEquatorPrime,
          style.lineWidthStandard
        ]);
      } catch (e) {
        logCartoWarn('GRATICULE_PAINT_ERROR', `Erreur mise à jour peinture ${layerId}:`, e);
      }
    }
  });

  ['colonial-graticule-labels', 'graticule-grid-labels'].forEach((layerId) => {
    if (map.getLayer(layerId)) {
      try {
        map.setPaintProperty(layerId, 'text-color', style.textColor);
        map.setPaintProperty(layerId, 'text-halo-color', style.textHaloColor);
        map.setPaintProperty(layerId, 'text-halo-width', style.textHaloWidth);
      } catch (e) {
        logCartoWarn('GRATICULE_LABEL_PAINT_ERROR', `Erreur mise à jour étiquettes ${layerId}:`, e);
      }
    }
  });
  logCarto('GRATICULE_STYLE_SYNC', `Palette graticule synchronisée pour ${styleId} (lineColor=${style.lineColor}, opacity=${style.lineOpacity})`);
}

export function toggleGraticuleGrid(map: Map | null, visible: boolean, styleId?: BasemapStyleId) {
  if (!map) return;
  if (typeof map.getStyle === 'function' && !map.getStyle()) {
    logCarto('GRATICULE_TOGGLE_DEFERRED', `toggleGraticuleGrid différé sur styledata (visible=${visible})`);
    map.once('styledata', () => toggleGraticuleGrid(map, visible, styleId));
    return;
  }

  // Auto-réparation : si visible demandé mais que les calques ou la source manquent, forcer init
  if (visible && (!map.getSource('colonial-graticule') || !map.getLayer('colonial-graticule-lines'))) {
    logCarto('GRATICULE_AUTO_REPAIR', 'Graticule visible demandé mais calques absents -> Réinitialisation complète.');
    initColonialGraticuleLayer(map, true, styleId);
    return;
  }

  const visibility = visible ? 'visible' : 'none';
  let layersModified = 0;
  ['colonial-graticule-lines', 'colonial-graticule-labels', 'graticule-grid-lines', 'graticule-grid-labels', 'grid-layer'].forEach((layerId) => {
    if (map.getLayer(layerId)) {
      try {
        map.setLayoutProperty(layerId, 'visibility', visibility);
        layersModified++;
      } catch (e) {}
    }
  });

  // Si activation, synchroniser immédiatement la palette avec le style actif
  if (visible && styleId) {
    updateGraticuleStyle(map, styleId);
  }

  // Déclencher un rafraîchissement immédiat de la vue (crucial en 2D comme en 3D / Globe)
  try {
    map.triggerRepaint();
  } catch (e) {}

  logCarto('GRATICULE_TOGGLE_DONE', `Graticule basculé -> visibility=${visibility} (${layersModified} calques modifiés)`);
}

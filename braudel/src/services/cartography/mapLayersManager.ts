import maplibregl from 'maplibre-gl';
import { 
  initGridLayer, 
  initGeoReferenceLinesLayer, 
  initColonialGraticuleLayer 
} from './modules/grid-reference-layers';
import { initRhumbNetworkLayer } from './modules/rhumb-layers';

export function setupVectorLayers(map: maplibregl.Map) {
  // 0. Initialiser la couche d'ornementation cartographique (Lignes de rhumb & Portulan)
  initRhumbNetworkLayer(map);

  // 1. Initialiser les lignes de repères géographiques (Équateur, Tropiques, Cercles polaires)
  initGeoReferenceLinesLayer(map);
  initGridLayer(map);
  initColonialGraticuleLayer(map);

  // 2. Initialiser les calques vectoriels d'entités Braudel
  if (!map.getSource('braudel-entities')) {
    map.addSource('braudel-entities', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }

  if (!map.getLayer('braudel-polygons')) {
    map.addLayer({
      id: 'braudel-polygons',
      type: 'fill',
      source: 'braudel-entities',
      filter: ['==', '$type', 'Polygon'],
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': 0.35,
      },
    });
  }

  if (!map.getLayer('braudel-lines')) {
    map.addLayer({
      id: 'braudel-lines',
      type: 'line',
      source: 'braudel-entities',
      filter: ['==', '$type', 'LineString'],
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2.5,
      },
    });
  }

  if (!map.getLayer('braudel-points')) {
    map.addLayer({
      id: 'braudel-points',
      type: 'circle',
      source: 'braudel-entities',
      filter: ['==', '$type', 'Point'],
      paint: {
        'circle-radius': 6,
        'circle-color': ['get', 'color'],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });
  }
}

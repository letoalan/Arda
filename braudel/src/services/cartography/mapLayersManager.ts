import maplibregl from 'maplibre-gl';
import { 
  initGridLayer, 
  initGeoReferenceLinesLayer, 
  initColonialGraticuleLayer 
} from './modules/grid-reference-layers';
import { initRhumbNetworkLayer } from './modules/rhumb-layers';

export function setupVectorLayers(map: maplibregl.Map, portulanRhumbVisible: boolean = true, graticuleVisible: boolean = true) {
  // 0. Initialiser la couche d'ornementation cartographique (Lignes de rhumb & Portulan)
  initRhumbNetworkLayer(map, portulanRhumbVisible);

  // 1. Initialiser les lignes de repères géographiques (Équateur, Tropiques, Cercles polaires)
  initGeoReferenceLinesLayer(map);
  initGridLayer(map);
  initColonialGraticuleLayer(map, graticuleVisible);

  // 2. Initialiser les calques vectoriels d'entités Braudel
  if (!map.getSource('braudel-entities')) {
    map.addSource('braudel-entities', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }

  // 3. Calques Polygones : Remplissage avec couleur dynamique (Polygon et MultiPolygon)
  if (!map.getLayer('braudel-polygons')) {
    map.addLayer({
      id: 'braudel-polygons',
      type: 'fill',
      source: 'braudel-entities',
      filter: ['in', '$type', 'Polygon'],
      paint: {
        'fill-color': ['coalesce', ['get', 'fillColor'], ['get', 'color'], '#3B82F6'],
        'fill-opacity': ['coalesce', ['get', 'fillOpacity'], 0.45],
      },
    });
  }

  // 4. Calques Polygones : Trait de contour contrasté avec couleur dynamique
  if (!map.getLayer('braudel-polygons-outline')) {
    map.addLayer({
      id: 'braudel-polygons-outline',
      type: 'line',
      source: 'braudel-entities',
      filter: ['in', '$type', 'Polygon'],
      paint: {
        'line-color': ['coalesce', ['get', 'strokeColor'], ['get', 'color'], '#3B82F6'],
        'line-width': ['coalesce', ['get', 'lineWidth'], 1.5],
        'line-opacity': ['coalesce', ['get', 'strokeOpacity'], 0.9],
      },
    });
  }

  // 5. Calques Lignes & Routes (LineString et MultiLineString)
  if (!map.getLayer('braudel-lines')) {
    map.addLayer({
      id: 'braudel-lines',
      type: 'line',
      source: 'braudel-entities',
      filter: ['in', '$type', 'LineString'],
      paint: {
        'line-color': ['coalesce', ['get', 'color'], '#3B82F6'],
        'line-width': ['coalesce', ['get', 'lineWidth'], 2.5],
        'line-opacity': 0.9,
      },
    });
  }

  // 6. Calques Points & Villes (Point et MultiPoint)
  if (!map.getLayer('braudel-points')) {
    map.addLayer({
      id: 'braudel-points',
      type: 'circle',
      source: 'braudel-entities',
      filter: ['in', '$type', 'Point'],
      paint: {
        'circle-radius': 6,
        'circle-color': ['coalesce', ['get', 'color'], '#3B82F6'],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });
  }

}

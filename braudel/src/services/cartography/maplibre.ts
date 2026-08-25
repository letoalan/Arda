import { Map } from 'maplibre-gl';

import { store, type StoreState } from '../../store';

export interface CartographyOptions {
  container: string | HTMLElement;
  center: [number, number];
  zoom: number;
  style: string;
}

let mapInstance: Map | null = null;

const DEFAULT_OPTIONS: CartographyOptions = {
  container: 'map',
  center: [0, 0],
  zoom: 2,
  style: 'https://demotiles.maplibre.org/style.json',
};

export const initMap = (
    options?: Partial<CartographyOptions>
): Map => {
  if (mapInstance) {
    return mapInstance;
  }

  const mergedOptions: CartographyOptions = {
    ...DEFAULT_OPTIONS,
    ...(options ?? {}),
  };

  mapInstance = new Map({
    container: mergedOptions.container,
    center: mergedOptions.center,
    zoom: mergedOptions.zoom,
    style: mergedOptions.style,
    attributionControl: false,
  });

  mapInstance.on('load', () => {
    store.state.layers.forEach((layer) => {
      addLayerToMap(layer);
    });
  });

  return mapInstance;
};

export const addLayerToMap = (
    layer: StoreState['layers'][number]
): void => {
  if (!mapInstance) return;

  const sourceId = `source-${layer.id}`;
  const mapLayerId = `layer-${layer.id}`;

  if (!mapInstance.getSource(sourceId)) {
    mapInstance.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });
  }

  if (mapInstance.getLayer(mapLayerId)) {
    mapInstance.removeLayer(mapLayerId);
  }

  let paint: Record<string, unknown>;

  switch (layer.type) {
    case 'physical':
      paint = {
        'line-color': '#4a90e2',
        'line-width': 1,
      };
      break;

    case 'historical':
      paint = {
        'line-color': '#e67e22',
        'line-dasharray': [5, 5],
        'line-width': 1,
      };
      break;

    case 'political':
      paint = {
        'line-color': '#c0392b',
        'line-width': 2,
      };
      break;

    default:
      paint = {
        'line-color': '#7f8c8d',
        'line-width': 1,
      };
      break;
  }

  mapInstance.addLayer({
    id: mapLayerId,
    type: 'line',
    source: sourceId,
    layout: {},
    paint,
  });
};

export const removeLayerFromMap = (layerId: string): void => {
  if (!mapInstance) return;

  const mapLayerId = `layer-${layerId}`;
  const sourceId = `source-${layerId}`;

  if (mapInstance.getLayer(mapLayerId)) {
    mapInstance.removeLayer(mapLayerId);
  }

  if (mapInstance.getSource(sourceId)) {
    mapInstance.removeSource(sourceId);
  }
};

export const updateLayersOnMap = (
    layers: StoreState['layers']
): void => {
  if (!mapInstance) return;

  layers.forEach((layer) => {
    removeLayerFromMap(layer.id);
    addLayerToMap(layer);
  });
};

export const getMapInstance = (): Map | null => {
  return mapInstance;
};

export const fitWorldBounds = (): void => {
  if (!mapInstance) return;

  mapInstance.flyTo({
    center: [0, 0],
    zoom: 2,
    essential: true,
  });
};

export const destroyMap = (): void => {
  if (!mapInstance) return;

  mapInstance.remove();
  mapInstance = null;
};
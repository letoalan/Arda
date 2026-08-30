// services/cartography/modules/rhumb-layers.ts

import type { Map } from 'maplibre-gl';
import { 
  generateRhumbGeoJSON, 
  RHUMB_PALETTES,
  RhumbStylePreset,
  DEFAULT_OCEANIC_RHUMB_CENTERS,
  RhumbNetworkConfig
} from '../../../core/cartography/rhumb_network';

export function initRhumbNetworkLayer(map: Map | null, initialVisibility: boolean = true, config?: Partial<RhumbNetworkConfig>) {
  if (!map) return;
  if (!map.isStyleLoaded()) {
    map.once('style.load', () => initRhumbNetworkLayer(map, initialVisibility, config));
    return;
  }
  if (map.getSource('rhumb-network-lines')) {
    toggleRhumbLines(map, initialVisibility);
    return;
  }

  const preset = config?.stylePreset || 'renaissance';
  const palette = {
    ...RHUMB_PALETTES[preset],
    ...(config?.customPalette || {})
  };

  const geojsonData = generateRhumbGeoJSON({
    nodes: config?.nodes || DEFAULT_OCEANIC_RHUMB_CENTERS,
    stylePreset: preset,
    customPalette: palette
  });

  const visibility = initialVisibility ? 'visible' : 'none';

  // 1. Sources GeoJSON statiques pour les arêtes et centres de Delaunay
  if (!map.getSource('rhumb-network-lines')) {
    map.addSource('rhumb-network-lines', {
      type: 'geojson',
      data: geojsonData.lines as any
    });
  } else {
    (map.getSource('rhumb-network-lines') as any).setData(geojsonData.lines);
  }

  if (!map.getSource('rhumb-network-nodes')) {
    map.addSource('rhumb-network-nodes', {
      type: 'geojson',
      data: geojsonData.nodes as any
    });
  } else {
    (map.getSource('rhumb-network-nodes') as any).setData(geojsonData.nodes);
  }

  // 2. Calque des arêtes de triangulation — LOD par zoom et dégradé / couleur source
  if (!map.getLayer('rhumb-lines')) {
    map.addLayer({
      id: 'rhumb-lines',
      type: 'line',
      source: 'rhumb-network-lines',
      layout: {
        visibility,
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        // Dégradé ou couleur du nœud source avec dégressivité selon le tier
        'line-color': ['coalesce', ['get', 'source_color'], '#b45309'],
        'line-width': [
          'match', ['get', 'edge_tier'],
          'major', 1.5,
          0.9
        ],
        'line-opacity': [
          'match', ['get', 'edge_tier'],
          'major', 0.8,
          0.55
        ]
      }
    });
  }

  // 3. Calque des centres nodaux — LOD par zoom et couleur d'identité
  if (!map.getLayer('rhumb-centers')) {
    map.addLayer({
      id: 'rhumb-centers',
      type: 'circle',
      source: 'rhumb-network-nodes',
      layout: {
        visibility
      },
      paint: {
        'circle-radius': [
          'case',
          ['get', 'hasRose'], 7,
          4
        ],
        // Couleur unique par nœud — identité visuelle immédiate
        'circle-color': ['coalesce', ['get', 'center_color'], '#b45309'],
        'circle-stroke-width': 2,
        'circle-stroke-color': palette.roseBorder || '#f59e0b',
        'circle-opacity': 0.95
      }
    });
  }
}

export function updateRhumbPalette(map: Map | null, preset: RhumbStylePreset) {
  if (!map || !map.getLayer('rhumb-lines')) return;
  const palette = RHUMB_PALETTES[preset] || RHUMB_PALETTES.renaissance;

  try {
    if (map.getLayer('rhumb-centers')) {
      map.setPaintProperty('rhumb-centers', 'circle-stroke-color', palette.roseBorder);
    }
  } catch (e) {
    console.warn('Erreur lors de la mise à jour de la palette des rhumbs:', e);
  }
}

export function toggleRhumbLines(map: Map | null, visible: boolean) {
  if (!map) return;
  if (!map.isStyleLoaded()) {
    map.once('style.load', () => toggleRhumbLines(map, visible));
    return;
  }
  if (!map.getSource('rhumb-network-lines')) {
    initRhumbNetworkLayer(map, visible);
    return;
  }
  const visibility = visible ? 'visible' : 'none';
  ['rhumb-lines', 'rhumb-centers'].forEach((layerId) => {
    if (map.getLayer(layerId)) {
      try {
        map.setLayoutProperty(layerId, 'visibility', visibility);
      } catch (e) {}
    }
  });
}

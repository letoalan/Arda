// services/cartography/modules/rhumb-layers.ts

import type { Map } from 'maplibre-gl';
import { 
  generateRhumbGeoJSON, 
  RHUMB_PALETTES,
  RhumbStylePreset,
  DEFAULT_OCEANIC_RHUMB_CENTERS,
  RhumbNetworkConfig
} from '../../../core/cartography/rhumb_network';
import { BasemapStyleId } from '../../../core/styles.config';
import { logCarto, logCartoWarn } from './carto-logger';

export function initRhumbNetworkLayer(map: Map | null, initialVisibility: boolean = true, config?: Partial<RhumbNetworkConfig>, styleId?: BasemapStyleId) {
  if (!map) return;
  if (typeof map.getStyle === 'function' && !map.getStyle()) {
    logCarto('RHUMB_DEFERRED', `Attente de style pour initialiser les rhumbs (styleId=${styleId})`);
    map.once('styledata', () => initRhumbNetworkLayer(map, initialVisibility, config, styleId));
    return;
  }

  const preset = config?.stylePreset || (styleId === 'medieval' || styleId === 'al_idrisi' ? 'medieval' : 'renaissance');
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
  const beforeId = map.getLayer('braudel-polygons') ? 'braudel-polygons' : undefined;

  try {
    // 1. Sources GeoJSON pour les arêtes et centres de Delaunay
    if (!map.getSource('rhumb-network-lines')) {
      map.addSource('rhumb-network-lines', {
        type: 'geojson',
        data: geojsonData.lines as any
      });
      logCarto('RHUMB_SOURCE_LINES_CREATED', 'Source rhumb-network-lines injectée.');
    } else {
      const src = map.getSource('rhumb-network-lines') as any;
      if (src && typeof src.setData === 'function') {
        src.setData(geojsonData.lines);
      }
    }

    if (!map.getSource('rhumb-network-nodes')) {
      map.addSource('rhumb-network-nodes', {
        type: 'geojson',
        data: geojsonData.nodes as any
      });
      logCarto('RHUMB_SOURCE_NODES_CREATED', 'Source rhumb-network-nodes injectée.');
    } else {
      const srcNodes = map.getSource('rhumb-network-nodes') as any;
      if (srcNodes && typeof srcNodes.setData === 'function') {
        srcNodes.setData(geojsonData.nodes);
      }
    }

    // 2. Calque des arêtes de triangulation auto-réparateur
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
      }, beforeId);
      logCarto('RHUMB_LAYER_LINES_ADDED', `Calque rhumb-lines créé (visibility=${visibility})`);
    } else {
      map.setLayoutProperty('rhumb-lines', 'visibility', visibility);
    }

    // 3. Calque des centres nodaux auto-réparateur
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
          'circle-color': ['coalesce', ['get', 'center_color'], '#b45309'],
          'circle-stroke-width': 2,
          'circle-stroke-color': palette.roseBorder || '#f59e0b',
          'circle-opacity': 0.95
        }
      }, beforeId);
      logCarto('RHUMB_LAYER_CENTERS_ADDED', `Calque rhumb-centers créé (visibility=${visibility})`);
    } else {
      map.setLayoutProperty('rhumb-centers', 'visibility', visibility);
    }

    if (styleId) {
      updateRhumbPalette(map, preset, styleId);
    }
  } catch (err) {
    logCartoWarn('RHUMB_INIT_ERROR', 'Erreur lors de l\'initialisation des rhumbs:', err);
  }
}

/**
 * Met à jour harmonieusement la palette visuelle du réseau de rhumbs (centres et lignes)
 * selon le preset historique et le fond de carte actif.
 */
export function updateRhumbPalette(map: Map | null, preset: RhumbStylePreset = 'renaissance', styleId?: BasemapStyleId) {
  if (!map) return;
  if (typeof map.getStyle === 'function' && !map.getStyle()) {
    map.once('styledata', () => updateRhumbPalette(map, preset, styleId));
    return;
  }
  const palette = RHUMB_PALETTES[preset] || RHUMB_PALETTES.renaissance;

  const isDarkTheme = [
    'military_tactical_wargames',
    'contemporary_positron_lite',
    'nasa_night_lights',
    'journalism_electro_80s',
    'futuristic',
    'futuristic_cyberpunk_neon',
    'futuristic_space_opera',
    'tolkien_dark_fantasy',
  ].includes(styleId || '');

  const isSatellite = ['contemporary_satellite', 'realistic_satellite'].includes(styleId || '');

  try {
    if (map.getLayer('rhumb-centers')) {
      let strokeColor = palette.roseBorder;
      if (isDarkTheme) {
        strokeColor = styleId === 'military_tactical_wargames' ? '#22c55e' : (styleId === 'journalism_electro_80s' ? '#06b6d4' : (styleId === 'tolkien_dark_fantasy' ? '#ef4444' : '#38bdf8'));
      } else if (isSatellite) {
        strokeColor = '#f59e0b';
      } else if (styleId === 'tolkien_high_fantasy' || styleId === 'tolkien_light_fantasy') {
        strokeColor = '#d4af37';
      } else if (styleId === 'antiquity' || styleId === 'medieval' || styleId === 'renaissance' || styleId === 'al_idrisi' || styleId === 'modern' || styleId === 'jules_verne') {
        strokeColor = '#8b5a2b';
      }
      map.setPaintProperty('rhumb-centers', 'circle-stroke-color', strokeColor);
    }

    if (map.getLayer('rhumb-lines')) {
      if (isDarkTheme) {
        const darkLineColor = styleId === 'military_tactical_wargames' ? '#22c55e' : (styleId === 'journalism_electro_80s' ? '#06b6d4' : (styleId === 'tolkien_dark_fantasy' ? '#dc2626' : '#38bdf8'));
        map.setPaintProperty('rhumb-lines', 'line-color', ['coalesce', ['get', 'source_color'], darkLineColor]);
        map.setPaintProperty('rhumb-lines', 'line-opacity', 0.7);
      } else if (isSatellite) {
        map.setPaintProperty('rhumb-lines', 'line-color', ['coalesce', ['get', 'source_color'], '#38bdf8']);
        map.setPaintProperty('rhumb-lines', 'line-opacity', 0.75);
      } else if (styleId === 'antiquity' || styleId === 'medieval' || styleId === 'renaissance' || styleId === 'al_idrisi' || styleId === 'modern' || styleId === 'jules_verne') {
        map.setPaintProperty('rhumb-lines', 'line-color', ['coalesce', ['get', 'source_color'], '#7a3e1d']);
        map.setPaintProperty('rhumb-lines', 'line-opacity', [
          'match', ['get', 'edge_tier'],
          'major', 0.85,
          0.6
        ]);
      } else if (styleId === 'tolkien_high_fantasy' || styleId === 'tolkien_light_fantasy') {
        map.setPaintProperty('rhumb-lines', 'line-color', ['coalesce', ['get', 'source_color'], '#b8860b']);
        map.setPaintProperty('rhumb-lines', 'line-opacity', [
          'match', ['get', 'edge_tier'],
          'major', 0.85,
          0.6
        ]);
      } else {
        map.setPaintProperty('rhumb-lines', 'line-color', ['coalesce', ['get', 'source_color'], '#b45309']);
        map.setPaintProperty('rhumb-lines', 'line-opacity', [
          'match', ['get', 'edge_tier'],
          'major', 0.8,
          0.55
        ]);
      }
    }
    logCarto('RHUMB_PALETTE_SYNC', `Palette rhumb synchronisée pour ${styleId} (preset=${preset}, dark=${isDarkTheme})`);
  } catch (e) {
    logCartoWarn('RHUMB_PALETTE_ERROR', 'Erreur lors de la mise à jour de la palette des rhumbs:', e);
  }
}

export function toggleRhumbLines(map: Map | null, visible: boolean, styleId?: BasemapStyleId) {
  if (!map) return;
  if (typeof map.getStyle === 'function' && !map.getStyle()) {
    logCarto('RHUMB_TOGGLE_DEFERRED', `toggleRhumbLines différé sur styledata (visible=${visible})`);
    map.once('styledata', () => toggleRhumbLines(map, visible, styleId));
    return;
  }

  // Auto-réparation : si visible demandé mais que les calques ou la source manquent, forcer init
  if (visible && (!map.getSource('rhumb-network-lines') || !map.getLayer('rhumb-lines'))) {
    logCarto('RHUMB_AUTO_REPAIR', 'Rhumbs visibles demandés mais calques absents -> Réinitialisation complète.');
    initRhumbNetworkLayer(map, true, undefined, styleId);
    return;
  }

  const visibility = visible ? 'visible' : 'none';
  let layersModified = 0;
  ['rhumb-lines', 'rhumb-centers'].forEach((layerId) => {
    if (map.getLayer(layerId)) {
      try {
        map.setLayoutProperty(layerId, 'visibility', visibility);
        layersModified++;
      } catch (e) {}
    }
  });

  // Si activation, synchroniser immédiatement la palette avec le style actif
  if (visible && styleId) {
    const preset = (styleId === 'medieval' || styleId === 'al_idrisi') ? 'medieval' : 'renaissance';
    updateRhumbPalette(map, preset, styleId);
  }

  // Déclencher un rafraîchissement immédiat de la vue (crucial en 2D comme en 3D / Globe)
  try {
    map.triggerRepaint();
  } catch (e) {}

  logCarto('RHUMB_TOGGLE_DONE', `Lignes de rhumb basculées -> visibility=${visibility} (${layersModified} calques modifiés)`);
}

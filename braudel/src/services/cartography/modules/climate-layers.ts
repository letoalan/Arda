/**
 * Module de rendu des calottes glaciaires et de la modification du trait de côte / niveau marin dans MapLibre GL JS
 */

import { STYLE_CONFIGS } from '../../../core/styles.config';

export function generateIceCapsGeoJSON(iceCapLatitude: number) {
  const northLat = Math.min(89.5, Math.max(30.0, iceCapLatitude));
  const southLat = -northLat;

  const northRing: Array<[number, number]> = [];
  const southRing: Array<[number, number]> = [];

  for (let lon = -180; lon <= 180; lon += 10) {
    northRing.push([lon, northLat]);
    southRing.push([lon, southLat]);
  }
  northRing.push([180, 90], [-180, 90], northRing[0]);
  southRing.push([180, -90], [-180, -90], southRing[0]);

  return {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        properties: { hemisphere: 'north', latitude: northLat },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [northRing]
        }
      },
      {
        type: 'Feature' as const,
        properties: { hemisphere: 'south', latitude: southLat },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [southRing]
        }
      }
    ]
  };
}

interface InundationZoneDef {
  name: string;
  maxElevation: number; // Altitude seuil à partir de laquelle la zone est totalement inondée (en mètres)
  basePolygon: Array<[number, number]>;
}

// Définition des plaines littorales et deltas vulnérables (Low Elevation Coastal Zones)
const LOW_ELEVATION_COASTAL_ZONES: InundationZoneDef[] = [
  {
    name: 'Pays-Bas & Flandres',
    maxElevation: 10.0,
    basePolygon: [
      [3.3, 51.3], [3.8, 51.1], [4.5, 51.0], [5.5, 51.2], [6.2, 51.8],
      [7.2, 53.3], [7.1, 53.7], [5.8, 53.6], [4.6, 53.1], [4.3, 52.1],
      [3.5, 51.7], [3.3, 51.3]
    ]
  },
  {
    name: 'Venise & Plaine du Pô',
    maxElevation: 8.0,
    basePolygon: [
      [12.1, 45.6], [12.6, 45.7], [13.1, 45.6], [12.8, 44.8], [12.4, 44.4],
      [11.9, 44.7], [11.6, 45.1], [12.1, 45.6]
    ]
  },
  {
    name: 'Camargue & Delta du Rhône',
    maxElevation: 6.0,
    basePolygon: [
      [4.2, 43.6], [4.9, 43.6], [5.0, 43.3], [4.5, 43.4], [4.2, 43.5], [4.2, 43.6]
    ]
  },
  {
    name: 'Estuaire de la Tamise & The Fens',
    maxElevation: 9.0,
    basePolygon: [
      [0.0, 52.8], [0.6, 52.9], [1.1, 52.6], [1.3, 51.9], [0.9, 51.4],
      [0.2, 51.5], [-0.1, 52.1], [0.0, 52.8]
    ]
  },
  {
    name: 'Delta du Nil',
    maxElevation: 8.0,
    basePolygon: [
      [29.8, 31.3], [31.0, 31.6], [32.4, 31.3], [32.0, 30.6], [30.9, 30.2],
      [29.9, 30.7], [29.8, 31.3]
    ]
  },
  {
    name: 'Delta du Bengale & Bangladesh',
    maxElevation: 10.0,
    basePolygon: [
      [88.2, 21.6], [89.8, 21.8], [91.5, 22.4], [91.0, 23.8], [89.5, 24.2],
      [88.5, 23.5], [88.2, 21.6]
    ]
  },
  {
    name: 'Delta du Mékong',
    maxElevation: 7.0,
    basePolygon: [
      [104.8, 10.5], [106.8, 10.8], [107.0, 9.8], [106.0, 8.6], [104.9, 9.2], [104.8, 10.5]
    ]
  },
  {
    name: 'Floride & Everglades',
    maxElevation: 9.0,
    basePolygon: [
      [-81.8, 24.6], [-80.1, 25.8], [-80.0, 27.2], [-81.0, 27.5], [-82.6, 28.0],
      [-82.8, 26.5], [-81.8, 24.6]
    ]
  },
  {
    name: 'Louisiane & Delta du Mississippi',
    maxElevation: 8.0,
    basePolygon: [
      [-93.2, 29.8], [-91.5, 30.2], [-89.2, 30.2], [-89.0, 29.0], [-90.5, 29.0],
      [-92.5, 29.4], [-93.2, 29.8]
    ]
  },
  {
    name: 'Estuaire de la Gironde & Bassin d’Arcachon',
    maxElevation: 7.0,
    basePolygon: [
      [-1.3, 44.6], [-0.9, 44.8], [-0.5, 45.4], [-1.1, 45.6], [-1.4, 45.0], [-1.3, 44.6]
    ]
  }
];

// Plateaux continentaux émergés en période glaciaire (seaLevel < 0)
const EMERGED_CONTINENTAL_SHELVES = [
  {
    name: 'Doggerland (Mer du Nord)',
    minDropMeters: -20,
    basePolygon: [
      [1.0, 52.5], [3.0, 53.0], [6.0, 55.0], [4.5, 56.5], [1.5, 56.0],
      [-0.5, 54.0], [1.0, 52.5]
    ]
  },
  {
    name: 'Béringie (Détroit de Béring)',
    minDropMeters: -30,
    basePolygon: [
      [-172.0, 64.0], [-168.0, 66.5], [-164.0, 66.0], [-166.0, 63.5],
      [-170.0, 63.0], [-172.0, 64.0]
    ]
  },
  {
    name: 'Sundaland (Asie du Sud-Est)',
    minDropMeters: -40,
    basePolygon: [
      [102.0, 2.0], [108.0, 4.0], [112.0, 0.0], [108.0, -3.0],
      [104.0, -2.0], [102.0, 2.0]
    ]
  }
];

/**
 * Détermine la couleur exacte des mers et océans pour un style de carte donné.
 */
export function getWaterColorForBasemapStyle(styleId?: string, map?: any): string {
  // 1. Définition explicite dans la configuration de style
  if (styleId) {
    const config = STYLE_CONFIGS.find((s) => s.id === styleId);
    if (config?.mapPaintOverrides?.water) {
      return config.mapPaintOverrides.water;
    }
  }

  // 2. Inspection des couches vectorielles actives de MapLibre
  if (map && typeof map.getStyle === 'function') {
    const style = map.getStyle();
    if (style && style.layers) {
      for (const l of style.layers) {
        const lid = l.id.toLowerCase();
        if ((lid.includes('water') || lid.includes('ocean')) && l.type === 'fill' && !lid.startsWith('sea-level-')) {
          try {
            const c = map.getPaintProperty(l.id, 'fill-color');
            if (typeof c === 'string' && (c.startsWith('#') || c.startsWith('rgb'))) {
              return c;
            }
          } catch (e) {}
        }
      }
    }
  }

  // 3. Couleurs canoniques par identifiant de style
  switch (styleId) {
    case 'antiquity': return '#047857';
    case 'military_staff_ww1_ww2': return '#94a3b8';
    case 'colonial': return '#cbe2ee';
    case 'contemporary_current': return '#0284c7';
    case 'contemporary_positron_lite': return '#070f1e';
    case 'contemporary_satellite':
    case 'realistic_satellite': return '#0b2545';
    case 'nasa_night_lights': return '#020617';
    case 'contemporary_national_geographic': return '#cce2eb';
    case 'journalism_60s_70s': return '#d1e0e0';
    case 'journalism_electro_80s': return '#0f172a';
    case 'cnn_broadcast_90s_00s': return '#1e3a8a';
    case 'military_tactical_wargames': return '#0c4a6e';
    case 'futuristic':
    case 'futuristic_cyberpunk_neon':
    case 'futuristic_space_opera': return '#020617';
    case 'medieval':
    case 'al_idrisi': return '#0284c7';
    case 'renaissance': return '#cbd5e1';
    case 'modern': return '#ffffff';
    case 'tolkien_high_fantasy': return '#123a5c';
    case 'tolkien_light_fantasy': return '#2d6b7a';
    case 'tolkien_dark_fantasy': return '#0f172a';
    default: return '#cad2d3';
  }
}

/**
 * Génère le GeoJSON des zones inondées ou des plateaux émergés selon l'élévation du niveau marin.
 */
export function generateSeaLevelGeoJSON(seaLevelMeters: number) {
  const features: any[] = [];

  if (seaLevelMeters > 0) {
    // Réchauffement / Transgression marine : submersion des zones basses
    LOW_ELEVATION_COASTAL_ZONES.forEach((zone) => {
      // Calcul du coefficient d'inondation (0.2 à 1.0) selon le niveau marin
      const ratio = Math.min(1.0, Math.max(0.15, seaLevelMeters / zone.maxElevation));
      
      // Interpolation du polygone inondé autour du centroïde
      const centerLng = zone.basePolygon.reduce((acc, p) => acc + p[0], 0) / zone.basePolygon.length;
      const centerLat = zone.basePolygon.reduce((acc, p) => acc + p[1], 0) / zone.basePolygon.length;

      const scaledRing = zone.basePolygon.map(([lng, lat]) => {
        const scaledLng = centerLng + (lng - centerLng) * ratio;
        const scaledLat = centerLat + (lat - centerLat) * ratio;
        return [Number(scaledLng.toFixed(4)), Number(scaledLat.toFixed(4))];
      });

      features.push({
        type: 'Feature',
        properties: {
          name: zone.name,
          seaLevel: seaLevelMeters,
          type: 'inundated_coastal_lowland'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [scaledRing]
        }
      });
    });
  } else if (seaLevelMeters < -10) {
    // Glaciation / Régression marine : émersion des plateaux continentaux
    EMERGED_CONTINENTAL_SHELVES.forEach((shelf) => {
      if (seaLevelMeters <= shelf.minDropMeters) {
        features.push({
          type: 'Feature',
          properties: {
            name: shelf.name,
            seaLevel: seaLevelMeters,
            type: 'emerged_continental_shelf'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [shelf.basePolygon]
          }
        });
      }
    });
  }

  return {
    type: 'FeatureCollection' as const,
    features
  };
}

export function setupClimateLayers(map: any) {
  if (!map) return;

  // 1. Calottes glaciaires
  if (!map.getSource('ice-caps-source')) {
    map.addSource('ice-caps-source', {
      type: 'geojson',
      data: generateIceCapsGeoJSON(66.5)
    });
  }

  if (!map.getLayer('ice-caps-fill')) {
    map.addLayer({
      id: 'ice-caps-fill',
      type: 'fill',
      source: 'ice-caps-source',
      layout: { visibility: 'none' },
      paint: {
        'fill-color': '#e0f2fe',
        'fill-opacity': 0.55
      }
    });
  }

  if (!map.getLayer('ice-caps-border')) {
    map.addLayer({
      id: 'ice-caps-border',
      type: 'line',
      source: 'ice-caps-source',
      layout: { visibility: 'none' },
      paint: {
        'line-color': '#7dd3fc',
        'line-width': 1.5,
        'line-dasharray': [3, 2]
      }
    });
  }

  // 2. Trait de côte & Inondation du niveau marin
  if (!map.getSource('sea-level-source')) {
    map.addSource('sea-level-source', {
      type: 'geojson',
      data: generateSeaLevelGeoJSON(0)
    });
  }

  // Trouver la couche sous laquelle placer l'inondation pour préserver les étiquettes et bordures
  let beforeLayerId: string | undefined = undefined;
  const style = map.getStyle();
  if (style && style.layers) {
    const target = style.layers.find(
      (l: any) =>
        l.type === 'symbol' ||
        l.id.includes('admin') ||
        l.id.includes('border') ||
        l.id.includes('label') ||
        l.id.startsWith('braudel-')
    );
    if (target) beforeLayerId = target.id;
  }

  if (!map.getLayer('sea-level-fill')) {
    map.addLayer(
      {
        id: 'sea-level-fill',
        type: 'fill',
        source: 'sea-level-source',
        layout: { visibility: 'none' },
        paint: {
          'fill-color': '#0284c7',
          'fill-opacity': 1.0 // Parfaitement opaque pour fusionner sans couture avec la mer
        }
      },
      beforeLayerId
    );
  }
}

export function updateIceCapsLayer(map: any, iceCapLatitude: number, visible: boolean) {
  if (!map || !map.getSource('ice-caps-source')) return;

  const geojson = generateIceCapsGeoJSON(iceCapLatitude);
  map.getSource('ice-caps-source').setData(geojson);

  const vis = visible ? 'visible' : 'none';
  if (map.getLayer('ice-caps-fill')) map.setLayoutProperty('ice-caps-fill', 'visibility', vis);
  if (map.getLayer('ice-caps-border')) map.setLayoutProperty('ice-caps-border', 'visibility', vis);
}

export function updateSeaLevelLayer(map: any, seaLevelMeters: number, visible: boolean, styleId?: string) {
  if (!map || !map.getSource('sea-level-source')) return;

  const geojson = generateSeaLevelGeoJSON(seaLevelMeters);
  map.getSource('sea-level-source').setData(geojson);

  const waterColor = getWaterColorForBasemapStyle(styleId, map);

  const vis = visible && (seaLevelMeters !== 0 || geojson.features.length > 0) ? 'visible' : 'none';
  if (map.getLayer('sea-level-fill')) {
    map.setLayoutProperty('sea-level-fill', 'visibility', vis);
    map.setPaintProperty('sea-level-fill', 'fill-color', waterColor);
    map.setPaintProperty('sea-level-fill', 'fill-opacity', 1.0);
  }
}

// services/cartography/mapStylesManager.ts

import maplibregl from 'maplibre-gl';
import { STYLE_CONFIGS, BasemapStyleId } from '../../core/styles.config';
import { logCarto } from './modules/carto-logger';

let activeStyleUrl: string | null = null;

export function resetActiveStyleUrl() {
  activeStyleUrl = null;
}

export function setActiveStyleUrl(url: string | null) {
  activeStyleUrl = url;
}

export function applyBasemapStyle(map: maplibregl.Map, styleId: BasemapStyleId) {
  const styleConfig = STYLE_CONFIGS.find((s) => s.id === styleId);
  if (!styleConfig) return;

  const style = styleConfig.mapStyleUrl;
  const targetBearing = styleConfig.bearing ?? 0;
  logCarto('APPLY_BASEMAP_STYLE', { styleId, styleUrl: style, targetBearing });

  if (style) {
    if (activeStyleUrl !== style) {
      activeStyleUrl = style;
      map.setStyle(style as any);
    } else {
      logCarto('APPLY_BASEMAP_STYLE_REUSE', `Style URL déjà actif (${style}), réutilisation sans destruction du pipeline WebGL`);
    }
  }

  try {
    map.rotateTo(targetBearing, { duration: 1000 });
  } catch (e) {}
}

export function applyMapPaintOverrides(map: maplibregl.Map, styleId: BasemapStyleId) {
  const style = map.getStyle();
  if (!style || !style.layers) return;

  const styleConfig = STYLE_CONFIGS.find((s) => s.id === styleId);
  logCarto('APPLY_PAINT_OVERRIDES_START', { styleId, totalLayers: style.layers.length });

  // 1. Injection du fond raster pour l'imagerie Esri Satellitaire ou NASA Vue Nocturne
  if (styleId === 'contemporary_satellite' || styleId === 'nasa_night_lights') {
    const rasterSourceId = styleId === 'contemporary_satellite' ? 'esri-satellite-src' : 'nasa-night-src';
    const rasterLayerId = styleId === 'contemporary_satellite' ? 'esri-satellite-bg' : 'nasa-night-bg';
    const tileUrl = styleId === 'contemporary_satellite' 
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png';

    // Masquer le calque raster opposé si présent
    const otherRasterLayerId = styleId === 'contemporary_satellite' ? 'nasa-night-bg' : 'esri-satellite-bg';
    if (map.getLayer(otherRasterLayerId)) {
      try {
        map.setLayoutProperty(otherRasterLayerId, 'visibility', 'none');
      } catch (e) {}
    }

    if (!map.getSource(rasterSourceId)) {
      try {
        map.addSource(rasterSourceId, {
          type: 'raster',
          tiles: [tileUrl],
          tileSize: 256,
          minzoom: 0,
          maxzoom: 19,
          attribution: styleId === 'contemporary_satellite' ? 'Esri' : 'NASA GIBS'
        });
      } catch (e) {}
    }

    if (!map.getLayer(rasterLayerId)) {
      try {
        const secondLayerId = style.layers.length > 1 ? style.layers[1].id : undefined;
        map.addLayer(
          {
            id: rasterLayerId,
            type: 'raster',
            source: rasterSourceId,
            paint: { 'raster-opacity': 1.0 }
          },
          secondLayerId
        );
      } catch (e) {}
    } else {
      try {
        map.setLayoutProperty(rasterLayerId, 'visibility', 'visible');
      } catch (e) {}
    }

    style.layers.forEach((layer) => {
      const id = layer.id.toLowerCase();

      // Rendre le fond transparent/sombre pour permettre le rendu du raster en mode Plat et Globe 3D
      if (layer.type === 'background') {
        try {
          map.setPaintProperty(layer.id, 'background-color', styleId === 'nasa_night_lights' ? '#020617' : 'rgba(0,0,0,0)');
        } catch (e) {}
      }

      // Masquer les aplats de couleur (terres, eaux, parcs) pour révéler la photo satellitaire/nocturne
      if (layer.type === 'fill' && !id.startsWith('braudel-') && !id.startsWith('colonial-') && !id.startsWith('rhumb-') && !id.startsWith('geo-reference-')) {
        try {
          map.setPaintProperty(layer.id, 'fill-opacity', 0);
        } catch (e) {}
      }

      // Rehausser la lisibilité des villes et étiquettes
      if (layer.type === 'symbol' && !id.startsWith('braudel-') && !id.startsWith('geo-reference-') && !id.startsWith('colonial-graticule-') && !id.startsWith('rhumb-')) {
        try {
          map.setPaintProperty(layer.id, 'text-color', '#ffffff');
          map.setPaintProperty(layer.id, 'text-halo-color', '#000000');
          map.setPaintProperty(layer.id, 'text-halo-width', 2);
        } catch (e) {}
      }

      // Rehausser la visibilité des voies de communication
      if (layer.type === 'line' && (id.includes('road') || id.includes('highway') || id.includes('transportation')) && !id.startsWith('braudel-') && !id.startsWith('colonial-') && !id.startsWith('rhumb-')) {
        try {
          map.setPaintProperty(layer.id, 'line-color', styleId === 'nasa_night_lights' ? '#38bdf8' : '#ffffff');
          map.setPaintProperty(layer.id, 'line-opacity', 0.7);
        } catch (e) {}
      }
    });

    // Rehausser la visibilité des lignes géographiques (Équateur, Tropiques, Méridiens) sur fond satellite/nocturne
    if (map.getLayer('geo-reference-lines')) {
      try {
        map.setPaintProperty('geo-reference-lines', 'line-color', styleId === 'nasa_night_lights' ? '#fbbf24' : '#f59e0b');
        map.setPaintProperty('geo-reference-lines', 'line-opacity', 0.95);
        map.setPaintProperty('geo-reference-lines', 'line-width', 1.5);
      } catch (e) {}
    }

    if (map.getLayer('geo-reference-labels')) {
      try {
        map.setPaintProperty('geo-reference-labels', 'text-color', styleId === 'nasa_night_lights' ? '#fbbf24' : '#ffffff');
        map.setPaintProperty('geo-reference-labels', 'text-halo-color', '#000000');
        map.setPaintProperty('geo-reference-labels', 'text-halo-width', 2);
      } catch (e) {}
    }
  } else {
    // Si l'utilisateur choisit un autre style, s'assurer de masquer les calques rasters s'ils existent
    ['esri-satellite-bg', 'nasa-night-bg'].forEach((rId) => {
      if (map.getLayer(rId)) {
        try {
          map.setLayoutProperty(rId, 'visibility', 'none');
        } catch (e) {}
      }
    });
  }

  const overrides = styleConfig?.mapPaintOverrides;
  if (!overrides) return;

  style.layers.forEach((layer) => {
    const id = layer.id.toLowerCase();

    // 1. Fond général
    if (layer.type === 'background' && overrides.background) {
      try {
        map.setPaintProperty(layer.id, 'background-color', overrides.background);
      } catch (e) {}
    }

    // 2. Mers, océans, lacs, cours d'eau (avec transparence pour faire apparaître le relief 3D sous-marin)
    if (overrides.water && (id.includes('water') || id.includes('ocean') || id.includes('lake') || id.includes('river')) && !id.startsWith('braudel-')) {
      try {
        if (layer.type === 'fill') {
          map.setPaintProperty(layer.id, 'fill-color', overrides.water);
          map.setPaintProperty(layer.id, 'fill-opacity', 0.75);
        } else if (layer.type === 'line') {
          map.setPaintProperty(layer.id, 'line-color', overrides.water);
        } else if (layer.type === 'background') {
          map.setPaintProperty(layer.id, 'background-color', overrides.water);
        }
      } catch (e) {}
    }

    // 3. Terres, surfaces, plaines
    if (overrides.landcover && (id.includes('land') || id.includes('earth') || id.includes('sand') || id.includes('park') || id.includes('grass') || id.includes('crop') || id.includes('wood')) && !id.startsWith('braudel-')) {
      try {
        if (layer.type === 'fill') {
          map.setPaintProperty(layer.id, 'fill-color', overrides.landcover);
        }
      } catch (e) {}
    }

    // 4. Frontières et limites administratives du fond de carte
    if (overrides.borderColor && (id.includes('admin') || id.includes('border') || id.includes('boundary')) && !id.startsWith('braudel-') && !id.startsWith('colonial-') && !id.startsWith('rhumb-')) {
      try {
        if (layer.type === 'line') {
          map.setPaintProperty(layer.id, 'line-color', overrides.borderColor);
          map.setPaintProperty(layer.id, 'line-width', 1.2);
          map.setPaintProperty(layer.id, 'line-opacity', 0.9);
        }
      } catch (e) {}
    }
  });
}

export function applyLabelsVisibility(map: maplibregl.Map, visible: boolean) {
  const style = map.getStyle();
  if (!style || !style.layers) return;

  style.layers.forEach((layer) => {
    const id = layer.id.toLowerCase();
    const isLabelOrSymbol = 
      layer.type === 'symbol' ||
      id.includes('label') || 
      id.includes('place') || 
      id.includes('city') || 
      id.includes('town') || 
      id.includes('country') || 
      id.includes('state') || 
      id.includes('poi');
    
    if (isLabelOrSymbol && !id.startsWith('braudel-') && !id.startsWith('geo-reference-') && !id.startsWith('colonial-graticule-') && !id.startsWith('rhumb-')) {
      try {
        map.setLayoutProperty(layer.id, 'visibility', visible ? 'visible' : 'none');
      } catch (e) {}
    }
  });
}

export function applyBordersVisibility(map: maplibregl.Map, visible: boolean) {
  const style = map.getStyle();
  if (!style || !style.layers) return;

  style.layers.forEach((layer) => {
    const id = layer.id.toLowerCase();
    const isBorder = 
      id.includes('admin') || 
      id.includes('border') || 
      id.includes('boundary') || 
      id.includes('country-line');

    if (isBorder && !id.startsWith('braudel-') && !id.startsWith('colonial-graticule-') && !id.startsWith('rhumb-') && !id.startsWith('geo-reference-')) {
      try {
        map.setLayoutProperty(layer.id, 'visibility', visible ? 'visible' : 'none');
      } catch (e) {}
    }
  });
}

export function applyRoadsVisibility(map: maplibregl.Map, visible: boolean) {
  const style = map.getStyle();
  if (!style || !style.layers) return;

  style.layers.forEach((layer) => {
    const id = layer.id.toLowerCase();
    const isRoadOrTransport = 
      id.includes('road') || 
      id.includes('highway') || 
      id.includes('rail') || 
      id.includes('transit') || 
      id.includes('bridge') || 
      id.includes('tunnel') || 
      id.includes('transport') || 
      id.includes('street') || 
      id.includes('path') || 
      id.includes('route');

    if (isRoadOrTransport && !id.startsWith('braudel-') && !id.startsWith('geo-reference-') && !id.startsWith('colonial-graticule-') && !id.startsWith('rhumb-')) {
      try {
        map.setLayoutProperty(layer.id, 'visibility', visible ? 'visible' : 'none');
      } catch (e) {}
    }
  });
}

export function applyRiversVisibility(map: maplibregl.Map, visible: boolean) {
  const style = map.getStyle();
  if (!style || !style.layers) return;

  style.layers.forEach((layer) => {
    const id = layer.id.toLowerCase();
    const isRiverOrWaterway = 
      id.includes('river') || 
      id.includes('waterway') || 
      id.includes('stream') || 
      id.includes('canal');

    if (isRiverOrWaterway && !id.startsWith('braudel-')) {
      try {
        map.setLayoutProperty(layer.id, 'visibility', visible ? 'visible' : 'none');
      } catch (e) {}
    }
  });
}

export function applyReliefStyle(
  map: maplibregl.Map,
  exaggeration: number = 0.5,
  shadowColor: string = '#000000',
  highlightColor: string = '#FFFFFF',
  worldType: 'real' | 'fictional' = 'real'
) {
  const style = map.getStyle();
  if (!style || !style.layers) return;

  // Clamping strict dans l'intervalle [0, 1.0] conformément à la spécification MapLibre GL
  const clampedExaggeration = Math.min(1.0, Math.max(0, Number(exaggeration) || 0));

  if (worldType === 'fictional') {
    if (map.getLayer('braudel-hillshade')) {
      try {
        map.setLayoutProperty('braudel-hillshade', 'visibility', 'none');
      } catch (e) {}
    }
    return;
  }

  if (!map.getSource('maplibre-dem') && !map.getSource('mapbox-dem')) {
    try {
      map.addSource('maplibre-dem', {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        encoding: 'terrarium',
        tileSize: 256,
        minzoom: 0,
        maxzoom: 15,
        attribution: 'AWS Elevation Tiles / Mapzen'
      });
    } catch (e) {
      // Source might already be added
    }
  }

  const demSourceId = map.getSource('maplibre-dem') ? 'maplibre-dem' : (map.getSource('mapbox-dem') ? 'mapbox-dem' : null);
  if (!demSourceId) return;

  // Trouver la première couche de type symbole, ligne ou frontière administrative pour placer le hillshade au-dessus des fonds de terre et sous les bordures/étiquettes
  let beforeLayerId: string | undefined = undefined;
  if (style && style.layers) {
    const targetLayer = style.layers.find(l => 
      l.type === 'symbol' || 
      l.type === 'line' || 
      l.id.includes('admin') || 
      l.id.includes('border') || 
      l.id.includes('label') ||
      l.id.startsWith('braudel-')
    );
    if (targetLayer) {
      beforeLayerId = targetLayer.id;
    }
  }

  if (!map.getLayer('braudel-hillshade')) {
    try {
      map.addLayer(
        {
          id: 'braudel-hillshade',
          type: 'hillshade',
          source: demSourceId,
          layout: { visibility: 'visible' },
          paint: {
            'hillshade-exaggeration': clampedExaggeration,
            'hillshade-shadow-color': shadowColor,
            'hillshade-highlight-color': highlightColor,
          },
        },
        beforeLayerId
      );
    } catch (e) {
      // Layer might already exist or style not ready
    }
  } else {
    try {
      map.setLayoutProperty('braudel-hillshade', 'visibility', 'visible');
      map.setPaintProperty('braudel-hillshade', 'hillshade-exaggeration', clampedExaggeration);
      map.setPaintProperty('braudel-hillshade', 'hillshade-shadow-color', shadowColor);
      map.setPaintProperty('braudel-hillshade', 'hillshade-highlight-color', highlightColor);
    } catch (e) {}
  }
}

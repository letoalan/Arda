import { StyleConfig } from '../../../core/styles.config';
import { generateRhumbGeoJSON } from '../../../core/cartography/rhumb_network';

/**
 * Génère le script d'initialisation de MapLibre GL et des calques vectoriels
 * avec options anti-clipping aux frontières (buffer: 128, tolérance fine et overlap libre).
 */
export function getStandaloneMapInitScript(styleConfig: StyleConfig, ardaDocJsonString: string): string {
  const overridesJson = JSON.stringify((styleConfig as any).mapPaintOverrides || null);
  const rhumbLinesJson = JSON.stringify(styleConfig.rhumbLines || null);
  const graticuleConfigJson = JSON.stringify((styleConfig as any).graticule || null);

  const rhumbPreset = (styleConfig.rhumbLines?.preset as any) || (styleConfig.id === 'renaissance' ? 'renaissance' : 'medieval');
  const rhumbGeoJSONData = generateRhumbGeoJSON({ stylePreset: rhumbPreset });
  const rhumbGeoJSONJson = JSON.stringify(rhumbGeoJSONData);

  return `
    let doc = ${ardaDocJsonString};
    const styleOverrides = ${overridesJson};
    const rhumbConfig = ${rhumbLinesJson};
    const graticuleConfig = ${graticuleConfigJson};
    const rhumbGeoData = ${rhumbGeoJSONJson};
    const entitiesData = doc.entitiesGeoJSON || { type: 'FeatureCollection', features: [] };
    const relationsData = doc.relationsGeoJSON || { type: 'FeatureCollection', features: [] };

    const activeStyleId = doc.map?.styleId || '${styleConfig.id}';

    const isRhumbVisible = doc.map?.portulanRhumbVisible !== false;
    const isGraticuleVisible = doc.map?.graticuleVisible !== false;

    let currentWaypointIdx = 0;
    let currentContext = { returningTo: doc.waypoints?.[0]?.id || 'wp-1' };

    const map = new maplibregl.Map({
      container: 'map',
      style: doc.map.styleUrl || '${styleConfig.mapStyleUrl}',
      center: doc.map.center || [12.5, 42.0],
      zoom: doc.map.zoom || 4,
      bearing: doc.map.bearing || ${styleConfig.bearing || 0},
      pitch: doc.map.pitch || 0,
      projection: doc.map?.projection === 'globe' ? { type: 'globe' } : { type: 'mercator' }
    });

    function applyProjection() {
      if (doc.map?.projection === 'globe') {
        try {
          if (map.setProjection) {
            map.setProjection({ type: 'globe' });
          }
        } catch (_) {
          try { map.setProjection({ name: 'globe' }); } catch (__) {}
        }
        map.triggerRepaint();
      }
    }

    applyProjection();
    map.on('style.load', applyProjection);

    function applyStandalonePaintOverrides() {
      const mapStyle = map.getStyle();
      if (!mapStyle || !mapStyle.layers) return;

      const isLabelsVisible = doc.map?.basemapLabelsVisible !== false;
      const isBordersVisible = doc.map?.basemapBordersVisible !== false;
      const isRoadsVisible = doc.map?.basemapRoadsVisible !== false;
      const isRiversVisible = doc.map?.basemapRiversVisible !== false;

      if (map.getLayer('graticule-grid-lines')) {
        try { map.setLayoutProperty('graticule-grid-lines', 'visibility', isGraticuleVisible ? 'visible' : 'none'); } catch (_) {}
      }
      if (map.getLayer('graticule-grid-labels')) {
        try { map.setLayoutProperty('graticule-grid-labels', 'visibility', isGraticuleVisible ? 'visible' : 'none'); } catch (_) {}
      }

      if (map.getLayer('rhumb-lines')) {
        try { map.setLayoutProperty('rhumb-lines', 'visibility', isRhumbVisible ? 'visible' : 'none'); } catch (_) {}
      }
      if (map.getLayer('rhumb-centers')) {
        try { map.setLayoutProperty('rhumb-centers', 'visibility', isRhumbVisible ? 'visible' : 'none'); } catch (_) {}
      }

      mapStyle.layers.forEach((layer) => {
        const id = layer.id.toLowerCase();
        
        // 1. Visibilité des Noms de villes, capitales, POI & étiquettes
        const isLabel = layer.type === 'symbol' || id.includes('label') || id.includes('place') || id.includes('city') || id.includes('town') || id.includes('country') || id.includes('poi');
        if (isLabel && !id.startsWith('braudel-') && !id.startsWith('geo-reference-') && !id.startsWith('standalone-rhumb-') && !id.startsWith('rhumb-') && !id.startsWith('graticule-grid-')) {
          try {
            map.setLayoutProperty(layer.id, 'visibility', isLabelsVisible ? 'visible' : 'none');
          } catch (_) {}
        }

        // 2. Visibilité des Frontières & limites politiques d'États
        const isBorder = id.includes('admin') || id.includes('border') || id.includes('boundary') || id.includes('country-line');
        if (isBorder && !id.startsWith('braudel-') && !id.startsWith('geo-reference-') && !id.startsWith('rhumb-') && !id.startsWith('graticule-grid-')) {
          try {
            map.setLayoutProperty(layer.id, 'visibility', isBordersVisible ? 'visible' : 'none');
          } catch (_) {}
        }

        // 3. Visibilité des Réseaux de communication (routes, voies ferrées, transport)
        const isRoad = id.includes('road') || id.includes('highway') || id.includes('rail') || id.includes('transit') || id.includes('bridge') || id.includes('tunnel') || id.includes('transport') || id.includes('street') || id.includes('route');
        if (isRoad && !id.startsWith('braudel-') && !id.startsWith('geo-reference-') && !id.startsWith('rhumb-') && !id.startsWith('graticule-grid-')) {
          try {
            map.setLayoutProperty(layer.id, 'visibility', isRoadsVisible ? 'visible' : 'none');
          } catch (_) {}
        }

        // 4. Visibilité des Fleuves, rivières & cours d'eau
        const isRiver = id.includes('river') || id.includes('waterway') || id.includes('stream') || id.includes('canal');
        if (isRiver && !id.startsWith('braudel-') && !id.startsWith('rhumb-') && !id.startsWith('graticule-grid-')) {
          try {
            map.setLayoutProperty(layer.id, 'visibility', isRiversVisible ? 'visible' : 'none');
          } catch (_) {}
        }

        // 5. Remplacements de couleurs thématiques (styleOverrides)
        if (styleOverrides) {
          if (layer.type === 'background' && styleOverrides.background) {
            try { map.setPaintProperty(layer.id, 'background-color', styleOverrides.background); } catch (_) {}
          }
          if (styleOverrides.water && (id.includes('water') || id.includes('ocean') || id.includes('lake') || id.includes('river'))) {
            try {
              if (layer.type === 'fill') {
                map.setPaintProperty(layer.id, 'fill-color', styleOverrides.water);
                map.setPaintProperty(layer.id, 'fill-opacity', 0.85);
              } else if (layer.type === 'line') {
                map.setPaintProperty(layer.id, 'line-color', styleOverrides.water);
              } else if (layer.type === 'background') {
                map.setPaintProperty(layer.id, 'background-color', styleOverrides.water);
              }
            } catch (_) {}
          }
          if (styleOverrides.landcover && (id.includes('land') || id.includes('earth') || id.includes('sand') || id.includes('park') || id.includes('grass') || id.includes('crop') || id.includes('wood'))) {
            try {
              if (layer.type === 'fill') {
                map.setPaintProperty(layer.id, 'fill-color', styleOverrides.landcover);
              }
            } catch (_) {}
          }
          if (styleOverrides.borderColor && (id.includes('admin') || id.includes('border') || id.includes('boundary')) && !id.startsWith('braudel-')) {
            try {
              if (layer.type === 'line') {
                map.setPaintProperty(layer.id, 'line-color', styleOverrides.borderColor);
              }
            } catch (_) {}
          }
        }
      });

      if (map.getLayer('terrain-hillshade') && styleOverrides) {
        if (styleOverrides.hillshadeShadow) {
          try { map.setPaintProperty('terrain-hillshade', 'hillshade-shadow-color', styleOverrides.hillshadeShadow); } catch (_) {}
        }
        if (styleOverrides.hillshadeHighlight) {
          try { map.setPaintProperty('terrain-hillshade', 'hillshade-highlight-color', styleOverrides.hillshadeHighlight); } catch (_) {}
        }
        if (styleOverrides.hillshadeAccent) {
          try { map.setPaintProperty('terrain-hillshade', 'hillshade-accent-color', styleOverrides.hillshadeAccent); } catch (_) {}
        }
      }
    }

    map.on('load', () => {
      // Configuration anti-clipping aux limites de tuiles et frontières
      map.addSource('braudel-entities', {
        type: 'geojson',
        data: entitiesData,
        buffer: 128,
        tolerance: 0.375,
        promoteId: 'id'
      });

      map.addSource('braudel-relations', {
        type: 'geojson',
        data: relationsData,
        buffer: 128,
        tolerance: 0.375
      });

      // Calque de remplissage des polygones (Support Polygon & MultiPolygon)
      map.addLayer({
        id: 'braudel-polygons',
        type: 'fill',
        source: 'braudel-entities',
        filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
        paint: {
          'fill-color': ['coalesce', ['get', 'fillColor'], ['get', 'color'], '#3B82F6'],
          'fill-opacity': ['coalesce', ['get', 'fillOpacity'], 0.45]
        }
      });

      // Calque dédié aux bordures linéaires visibles des polygones (Chantier 3 - Polygon & MultiPolygon)
      map.addLayer({
        id: 'braudel-polygon-outline',
        type: 'line',
        source: 'braudel-entities',
        filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
        paint: {
          'line-color': ['coalesce', ['get', 'strokeColor'], ['get', 'color'], '#1D4ED8'],
          'line-width': ['coalesce', ['get', 'lineWidth'], 1.5],
          'line-opacity': ['coalesce', ['get', 'strokeOpacity'], 0.85]
        }
      });

      // Rétrocompatibilité / tracé secondaire
      map.addLayer({
        id: 'braudel-polygons-stroke',
        type: 'line',
        source: 'braudel-entities',
        filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
        paint: {
          'line-color': ['coalesce', ['get', 'strokeColor'], ['get', 'color'], '#1D4ED8'],
          'line-width': ['coalesce', ['get', 'lineWidth'], 1.2],
          'line-opacity': ['coalesce', ['get', 'strokeOpacity'], 0.85]
        }
      });

      map.addLayer({
        id: 'braudel-lines',
        type: 'line',
        source: 'braudel-entities',
        filter: ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#3B82F6'],
          'line-width': 2.5
        }
      });

      map.addLayer({
        id: 'braudel-points',
        type: 'circle',
        source: 'braudel-entities',
        filter: ['==', '$type', 'Point'],
        paint: {
          'circle-radius': 6,
          'circle-color': ['coalesce', ['get', 'color'], '#3B82F6'],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Configuration du relief (DEM distant) et Hillshade (Mercator uniquement)
      const isGlobeMode = doc.map?.projection === 'globe';
      if (doc.map?.terrain && doc.map.terrain.mode === 'remote') {
        const demUrl = doc.map.terrain.terrainTilesUrl || 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
        const encoding = doc.map.terrain.encoding || (demUrl.includes('terrarium') ? 'terrarium' : 'mapbox');
        const exaggeration = Math.min(1.0, Math.max(0, doc.map.terrain.exaggeration || 0.8));

        try {
          if (!map.getSource('terrain-dem')) {
            map.addSource('terrain-dem', {
              type: 'raster-dem',
              tiles: [demUrl],
              tileSize: 256,
              maxzoom: 15,
              encoding: encoding
            });
          }

          if (!isGlobeMode) {
            map.setTerrain({
              source: 'terrain-dem',
              exaggeration: exaggeration
            });
          }

          if (doc.map.terrain.hillshadeEnabled !== false && !map.getLayer('terrain-hillshade')) {
            // Trouver la couche avant laquelle insérer le hillshade
            const style = map.getStyle();
            let beforeId = 'braudel-polygons';
            if (style && style.layers) {
              const target = style.layers.find(l => 
                l.id === 'braudel-polygons' || 
                l.type === 'symbol' || 
                l.type === 'line' || 
                l.id.includes('label') || 
                l.id.includes('admin')
              );
              if (target) beforeId = target.id;
            }

            const rawExag = styleOverrides && styleOverrides.hillshadeExaggeration;
            const hillExag = Math.min(1.0, Math.max(0, typeof rawExag === 'number' ? rawExag : 0.8));

            map.addLayer({
              id: 'terrain-hillshade',
              type: 'hillshade',
              source: 'terrain-dem',
              paint: {
                'hillshade-exaggeration': hillExag,
                'hillshade-shadow-color': (styleOverrides && styleOverrides.hillshadeShadow) || '#0f172a',
                'hillshade-highlight-color': (styleOverrides && styleOverrides.hillshadeHighlight) || '#ffffff',
                'hillshade-accent-color': (styleOverrides && styleOverrides.hillshadeAccent) || '#8c421a'
              }
            }, beforeId);
          }
        } catch (err) {
          console.warn('Initialisation du relief raster-dem non disponible:', err);
        }
      }

      // Repères géographiques (Équateur, Tropiques, Cercles Polaires)
      map.addSource('geo-reference-lines', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            { type: 'Feature', properties: { name: 'Équateur' }, geometry: { type: 'LineString', coordinates: [[-180, 0], [180, 0]] } },
            { type: 'Feature', properties: { name: 'Tropique Nord' }, geometry: { type: 'LineString', coordinates: [[-180, 23.5], [180, 23.5]] } },
            { type: 'Feature', properties: { name: 'Tropique Sud' }, geometry: { type: 'LineString', coordinates: [[-180, -23.5], [180, -23.5]] } },
            { type: 'Feature', properties: { name: 'Cercle Polaire Arctique' }, geometry: { type: 'LineString', coordinates: [[-180, 66.5], [180, 66.5]] } },
            { type: 'Feature', properties: { name: 'Cercle Polaire Antarctique' }, geometry: { type: 'LineString', coordinates: [[-180, -66.5], [180, -66.5]] } }
          ]
        }
      });

      const isGeoRefVisible = doc.map?.geoReferenceLinesVisible !== false;
      map.addLayer({
        id: 'geo-reference-lines',
        type: 'line',
        source: 'geo-reference-lines',
        layout: { visibility: isGeoRefVisible ? 'visible' : 'none' },
        paint: {
          'line-color': '#78716c',
          'line-width': 1,
          'line-dasharray': [4, 4],
          'line-opacity': 0.6
        }
      });

      map.addLayer({
        id: 'geo-reference-labels',
        type: 'symbol',
        source: 'geo-reference-lines',
        layout: {
          visibility: isGeoRefVisible ? 'visible' : 'none',
          'symbol-placement': 'line',
          'text-field': ['get', 'name'],
          'text-size': 10,
          'text-offset': [0, 0.4],
          'text-anchor': 'top',
          'text-letter-spacing': 0.1
        },
        paint: {
          'text-color': '#78716c',
          'text-halo-color': 'rgba(255, 255, 255, 0.85)',
          'text-halo-width': 1.5
        }
      });

      // Réseau complet de Méridiens et Parallèles (Graticule historique / vectoriel)
      const graticuleFeatures = [];
      for (let lat = -80; lat <= 80; lat += 10) {
        const coords = [];
        for (let lon = -180; lon <= 180; lon += 30) {
          coords.push([lon, lat]);
        }
        const isEquator = lat === 0;
        graticuleFeatures.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
          properties: {
            type: isEquator ? 'equator' : 'latitude',
            label: isEquator ? 'Équateur (0°)' : Math.abs(lat) + '°' + (lat > 0 ? 'N' : 'S')
          }
        });
      }
      for (let lon = -180; lon <= 180; lon += 10) {
        const coords = [];
        coords.push([lon, -85]);
        for (let lat = -75; lat <= 75; lat += 15) {
          coords.push([lon, lat]);
        }
        coords.push([lon, 85]);
        const isPrime = lon === 0;
        graticuleFeatures.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
          properties: {
            type: isPrime ? 'prime' : 'longitude',
            label: isPrime ? 'Greenwich (0°)' : Math.abs(lon) + '°' + (lon > 0 ? 'E' : 'O')
          }
        });
      }

      map.addSource('graticule-grid', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: graticuleFeatures }
      });

      const gratColor = (graticuleConfig && graticuleConfig.color) || '#5c3a21';
      const gratLabelColor = (graticuleConfig && graticuleConfig.labelColor) || gratColor;
      const gratOpacity = (graticuleConfig && typeof graticuleConfig.opacity === 'number') ? graticuleConfig.opacity : 0.65;

      map.addLayer({
        id: 'graticule-grid-lines',
        type: 'line',
        source: 'graticule-grid',
        layout: { 
          visibility: isGraticuleVisible ? 'visible' : 'none',
          'line-cap': 'round',
          'line-join': 'round'
        },
        paint: {
          'line-color': gratColor,
          'line-width': ['match', ['get', 'type'], 'equator', 1.5, 'prime', 1.5, 0.75],
          'line-dasharray': [3, 3],
          'line-opacity': gratOpacity
        }
      });

      map.addLayer({
        id: 'graticule-grid-labels',
        type: 'symbol',
        source: 'graticule-grid',
        layout: {
          visibility: isGraticuleVisible ? 'visible' : 'none',
          'symbol-placement': 'line',
          'text-field': ['get', 'label'],
          'text-size': 10,
          'text-letter-spacing': 0.05,
          'symbol-spacing': 300
        },
        paint: {
          'text-color': gratLabelColor,
          'text-halo-color': 'rgba(255, 255, 255, 0.9)',
          'text-halo-width': 1.5
        }
      });

      // Lignes de Rhumb & Maillage Portulan (Delaunay authentique 25 nœuds)
      if (rhumbGeoData && rhumbGeoData.lines && rhumbGeoData.nodes) {
        map.addSource('rhumb-network-lines', {
          type: 'geojson',
          data: rhumbGeoData.lines
        });
        map.addSource('rhumb-network-nodes', {
          type: 'geojson',
          data: rhumbGeoData.nodes
        });

        map.addLayer({
          id: 'rhumb-lines',
          type: 'line',
          source: 'rhumb-network-lines',
          layout: {
            visibility: isRhumbVisible ? 'visible' : 'none',
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': ['coalesce', ['get', 'source_color'], '#b45309'],
            'line-width': ['match', ['get', 'edge_tier'], 'major', 1.5, 0.9],
            'line-opacity': ['match', ['get', 'edge_tier'], 'major', 0.8, 0.55]
          }
        }, 'braudel-polygons');

        map.addLayer({
          id: 'rhumb-centers',
          type: 'circle',
          source: 'rhumb-network-nodes',
          layout: { visibility: isRhumbVisible ? 'visible' : 'none' },
          paint: {
            'circle-radius': ['case', ['get', 'hasRose'], 7, 4],
            'circle-color': ['coalesce', ['get', 'center_color'], '#b45309'],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#f59e0b',
            'circle-opacity': 0.95
          }
        }, 'braudel-polygons');
      }

      // Application des couleurs de styles historiques / personnalisés
      applyStandalonePaintOverrides();

      // Garde-fou réseau : dégradation gracieuse en cas d'erreur sur les sources distantes
      map.on('error', (e) => {
        if (e.sourceId === 'terrain-dem' || e.error?.message?.includes('terrain')) {
          console.warn('Garde-fou relief actif : désactivation du terrain distant suite à une erreur réseau.');
          try {
            map.setTerrain(null);
            if (map.getLayer('terrain-hillshade')) map.removeLayer('terrain-hillshade');
          } catch (_) {}
        }
      });

      initTimeline();
      initWiki();
      initKeyboard();
      initModeExSidecar();

      if (doc.waypoints && doc.waypoints.length > 0) {
        goToWaypoint(doc.waypoints[0].id, false);
      }
    });
  `;
}

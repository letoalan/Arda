// services/cartography/map-service.ts

import maplibregl from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';

import { MapEventEmitter, EntityClickCallback, EditEntityCallback, DrawCompleteCallback } from './mapEvents';
import { applyBasemapStyle, applyLabelsVisibility, applyBordersVisibility, applyRoadsVisibility, applyRiversVisibility, applyReliefStyle, applyMapPaintOverrides } from './mapStylesManager';
import { buildEntitiesGeoJSON, updateMapSourceData } from './mapGeojsonRenderer';
import { setupVectorLayers } from './mapLayersManager';
import { createMapLibreDrawInstance, enableDrawingModeOnMap } from './mapDrawingService';

import { toggleGeoReferenceLines, toggleGraticuleGrid } from './modules/grid-reference-layers';
import { toggleRhumbLines, updateRhumbPalette } from './modules/rhumb-layers';
import { setupClimateLayers, updateIceCapsLayer, updateSeaLevelLayer } from './modules/climate-layers';
import { STYLE_CONFIGS } from '../../core/styles.config';
import { buildDEMGrid, renderDEMTileAsync } from './syntheticDemTileServer';

function buildOceanMaskGeoJSON(geojson: any) {
  const outerRing: [number, number][] = [
    [-180, -85.05112878],
    [180, -85.05112878],
    [180, 85.05112878],
    [-180, 85.05112878],
    [-180, -85.05112878],
  ];

  const rings: [number, number][][] = [outerRing];

  if (geojson && geojson.features) {
    for (const feat of geojson.features) {
      const type = feat.properties?.type || 'continent';
      if (type === 'continent') {
        const geom = feat.geometry;
        if (geom.type === 'Polygon' && geom.coordinates && geom.coordinates[0]) {
          rings.push(geom.coordinates[0]);
        } else if (geom.type === 'MultiPolygon' && geom.coordinates) {
          for (const poly of geom.coordinates) {
            if (poly[0]) rings.push(poly[0]);
          }
        }
      }
    }
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: rings,
        },
      },
    ],
  };
}

export class MapService {
  private map: maplibregl.Map | null = null;
  private draw: MapboxDraw | null = null;
  private emitter = new MapEventEmitter();

  private drawingEntityId: string | null = null;
  private activeEmpireFilter: string = 'all';
  private currentStyleId: any = 'contemporary_current';
  private lastLabelsVisible: boolean = true;
  private lastBordersVisible: boolean = true;
  private lastRoadsVisible: boolean = true;
  private lastRiversVisible: boolean = true;
  private lastGeoRefVisible: boolean = true;
  private lastPortulanRhumbVisible: boolean = true;
  private lastGraticuleVisible: boolean = true;
  private lastProjection: 'mercator' | 'globe' = 'mercator';
  private lastReliefParams: { exaggeration: number; shadowColor: string; highlightColor: string } | null = { exaggeration: 0.5, shadowColor: '#000000', highlightColor: '#FFFFFF' };
  private lastEntitiesArgs: { entities: any[]; relations: any[]; currentTime: number; proposal?: any; layers?: any[]; epochRange?: { validFrom?: number; validTo?: number } } | null = null;
  private lastClimateParams: { iceCapLatitude: number; iceCapVisible: boolean; seaLevelMeters: number; seaLevelVisible: boolean } | null = null;
  private lastContinentsData: any = null;
  private worldType: 'real' | 'fictional' = 'real';

  initialize(container: HTMLElement, worldType: 'real' | 'fictional' = 'real', continentsData?: any, styleConfig?: any, initialStyleId?: string) {
    if (this.map) this.cleanup();
    this.worldType = worldType;
    this.lastContinentsData = continentsData || null;

    // Synchronize currentStyleId with the store's basemapStyle to prevent
    // the React [basemapStyle] effect from triggering a redundant setStyle
    // that would wipe all layers (continents, climate, etc.)
    if (initialStyleId) {
      this.currentStyleId = initialStyleId;
    }

    let defaultStyle = styleConfig;
    if (!defaultStyle) {
      if (worldType === 'fictional') {
        const config = STYLE_CONFIGS.find(s => s.id === this.currentStyleId) || STYLE_CONFIGS.find(s => s.id === 'tolkien_high_fantasy');
        const oceanColor = config?.mapPaintOverrides?.water || config?.mapPaintOverrides?.background || '#123a5c';
        defaultStyle = {
          version: 8,
          name: 'Fictional Virgin Ocean',
          sources: {},
          layers: [{ id: 'bg', type: 'background', paint: { 'background-color': oceanColor } }]
        };
      } else {
        defaultStyle = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
      }
    }

    this.map = new maplibregl.Map({
      container,
      style: defaultStyle,
      center: [0, 20],
      zoom: 2,
      preserveDrawingBuffer: true,
    } as any);

    this.draw = createMapLibreDrawInstance();
    this.map.addControl(this.draw as any, 'top-right');

    const applyAllCustomLayers = () => {
      if (!this.map) return;
      // For inline styles (fictional worlds), isStyleLoaded() may return false
      // even though the style is fully available. Retry with a short delay.
      if (!this.map.isStyleLoaded()) {
        setTimeout(() => applyAllCustomLayers(), 50);
        return;
      }
      try {
        setupVectorLayers(this.map, this.lastPortulanRhumbVisible, this.lastGraticuleVisible);
        if (this.currentStyleId) {
          applyMapPaintOverrides(this.map, this.currentStyleId);
        }
        applyLabelsVisibility(this.map, this.lastLabelsVisible);
        applyBordersVisibility(this.map, this.lastBordersVisible);
        applyRoadsVisibility(this.map, this.lastRoadsVisible);
        applyRiversVisibility(this.map, this.lastRiversVisible);
        toggleGeoReferenceLines(this.map, this.lastGeoRefVisible && this.worldType === 'real');
        toggleRhumbLines(this.map, this.lastPortulanRhumbVisible);
        toggleGraticuleGrid(this.map, this.lastGraticuleVisible);
        updateRhumbPalette(this.map, (this.currentStyleId as any) || 'renaissance');
        setupClimateLayers(this.map);
        if (this.lastClimateParams) {
          updateIceCapsLayer(this.map, this.lastClimateParams.iceCapLatitude, this.lastClimateParams.iceCapVisible);
          updateSeaLevelLayer(this.map, this.lastClimateParams.seaLevelMeters, this.lastClimateParams.seaLevelVisible, this.currentStyleId);
        }

        if (this.lastProjection && (this.map as any).setProjection) {
          try {
            (this.map as any).setProjection({ type: this.lastProjection });
          } catch (e) {
            try {
              (this.map as any).setProjection({ name: this.lastProjection });
            } catch (e2) {}
          }
        }

        if (this.lastReliefParams) {
          applyReliefStyle(this.map, this.lastReliefParams.exaggeration, this.lastReliefParams.shadowColor, this.lastReliefParams.highlightColor, this.worldType);
        }
        if (this.lastEntitiesArgs) {
          this.updateEntities(
            this.lastEntitiesArgs.entities,
            this.lastEntitiesArgs.relations,
            this.lastEntitiesArgs.currentTime,
            this.lastEntitiesArgs.proposal,
            this.lastEntitiesArgs.layers
          );
        }
        if (this.lastContinentsData) {
          this.renderContinents(this.lastContinentsData);
        }
      } catch (err) {
        console.warn('Error applying custom map layers:', err);
      }
    };

    this.map.on('load', () => {
      applyAllCustomLayers();
    });

    this.map.on('style.load', applyAllCustomLayers);
    this.map.on('styledata', applyAllCustomLayers);
    this.map.on('idle', applyAllCustomLayers);

    this.map.on('click', (e) => {
      if (this.drawingEntityId) return;
      const features = this.map?.queryRenderedFeatures(e.point, {
        layers: ['braudel-polygons', 'braudel-lines', 'braudel-points'],
      });

      if (features && features.length > 0) {
        const entityId = features[0].properties?.id;
        if (entityId) this.emitter.emitEntityClick(entityId);
      }
    });

    this.map.on('dblclick', (e) => {
      if (this.drawingEntityId) return;
      const features = this.map?.queryRenderedFeatures(e.point, {
        layers: ['braudel-polygons', 'braudel-lines', 'braudel-points'],
      });

      if (features && features.length > 0) {
        const entityId = features[0].properties?.id;
        if (entityId) this.emitter.emitEditEntity(entityId);
      }
    });
  }

  getMap(): maplibregl.Map | null {
    return this.map;
  }

  updateEntities(entities: any[], relations: any[], currentTime: number, proposal?: any, layers?: any[], epochRange?: { validFrom?: number; validTo?: number }) {
    this.lastEntitiesArgs = { entities, relations, currentTime, proposal, layers, epochRange };
    if (!this.map || !this.map.isStyleLoaded()) return;

    const geojsonData = buildEntitiesGeoJSON(entities, relations, currentTime, this.activeEmpireFilter, layers, epochRange);

    if (proposal && proposal.type === 'addEntity' && proposal.data?.geometry) {
      geojsonData.features.push({
        type: 'Feature',
        id: 'ai-proposal-preview',
        geometry: proposal.data.geometry,
        properties: {
          id: 'ai-proposal-preview',
          name: proposal.data.name || 'Proposition IA',
          color: '#8B5CF6',
        },
      });
    }

    updateMapSourceData(this.map, 'braudel-entities', geojsonData);
  }

  enableDrawingMode(entityId: string, type: 'Point' | 'LineString' | 'Polygon', existingGeometry?: any, modeOverride?: 'simple_select' | 'direct_select') {
    if (!this.draw) return;
    this.drawingEntityId = entityId;
    enableDrawingModeOnMap(this.draw, entityId, type, existingGeometry, modeOverride);
  }

  confirmDrawing() {
    if (!this.draw || !this.drawingEntityId) return;
    const data = this.draw.getAll();
    if (data.features.length > 0) {
      const geometry = data.features[0].geometry;
      this.emitter.emitDrawComplete(this.drawingEntityId, geometry);
    }
    this.cancelDrawingMode();
  }

  cancelDrawingMode() {
    if (this.draw) {
      this.draw.deleteAll();
      this.draw.changeMode('simple_select');
    }
    this.drawingEntityId = null;
  }

  setBasemapStyle(styleId: any) {
    if (this.currentStyleId === styleId && this.map?.getStyle()) return;
    this.currentStyleId = styleId;
    if (this.map) {
      if (this.worldType === 'fictional') {
        const config = STYLE_CONFIGS.find(s => s.id === styleId) || STYLE_CONFIGS.find(s => s.id === 'tolkien_high_fantasy');
        const oceanColor = config?.mapPaintOverrides?.water || config?.mapPaintOverrides?.background || '#123a5c';
        const landColor = config?.mapPaintOverrides?.landcover || '#c2b280';
        const coastColor = config?.mapPaintOverrides?.borderColor || config?.texture?.borderColor || '#5c3a21';

        // 1. Appliquer le bearing du style (ex: 180° pour Al-Idrisi Sud en haut)
        if (config && typeof config.bearing === 'number') {
          this.map.rotateTo(config.bearing, { duration: 800 });
        }

        // 2. Mettre à jour la couleur de la mer / océan et du relief
        try {
          const existingStyle = this.map.getStyle();
          if (existingStyle?.layers?.[0]?.id === 'bg' || existingStyle?.layers?.[0]?.id === 'background') {
            this.map.setPaintProperty(existingStyle.layers[0].id, 'background-color', oceanColor);
          }
          if (this.map.getLayer('braudel-ocean-mask')) {
            this.map.setPaintProperty('braudel-ocean-mask', 'fill-color', oceanColor);
          }
          if (this.map.getLayer('braudel-continents-fill')) {
            this.map.setPaintProperty('braudel-continents-fill', 'fill-color', landColor);
          }
          if (this.map.getLayer('braudel-continents-outline')) {
            this.map.setPaintProperty('braudel-continents-outline', 'line-color', coastColor);
          }
          if (this.map.getLayer('braudel-synth-hillshade')) {
            const shadow = styleId?.includes('dark') ? '#020617' : '#1e1005';
            const highlight = styleId?.includes('dark') ? '#334155' : (config?.mapPaintOverrides?.background || '#fffbeb');
            this.map.setPaintProperty('braudel-synth-hillshade', 'hillshade-shadow-color', shadow);
            this.map.setPaintProperty('braudel-synth-hillshade', 'hillshade-highlight-color', highlight);
          }
        } catch (e) {
          console.warn('Error updating fictional basemap paints:', e);
        }
      } else {
        applyBasemapStyle(this.map, styleId);
        applyMapPaintOverrides(this.map, styleId);
      }
      toggleRhumbLines(this.map, this.lastPortulanRhumbVisible);
      toggleGraticuleGrid(this.map, this.lastGraticuleVisible);
      updateRhumbPalette(this.map, (styleId as any) || 'renaissance');
      if (this.lastClimateParams) {
        updateSeaLevelLayer(this.map, this.lastClimateParams.seaLevelMeters, this.lastClimateParams.seaLevelVisible, styleId);
      }
    }
  }

  setLabelsVisible(visible: boolean) {
    this.lastLabelsVisible = visible;
    if (this.map) applyLabelsVisibility(this.map, visible);
  }

  setBordersVisible(visible: boolean) {
    this.lastBordersVisible = visible;
    if (this.map) applyBordersVisibility(this.map, visible);
  }

  setRoadsVisible(visible: boolean) {
    this.lastRoadsVisible = visible;
    if (this.map) applyRoadsVisibility(this.map, visible);
  }

  setRiversVisible(visible: boolean) {
    this.lastRiversVisible = visible;
    if (this.map) applyRiversVisibility(this.map, visible);
  }

  setGeoReferenceLinesVisible(visible: boolean) {
    this.lastGeoRefVisible = visible;
    if (this.map) toggleGeoReferenceLines(this.map, visible && this.worldType === 'real');
  }

  setPortulanRhumbVisible(visible: boolean) {
    this.lastPortulanRhumbVisible = visible;
    if (this.map) toggleRhumbLines(this.map, visible);
  }

  setGraticuleVisible(visible: boolean) {
    this.lastGraticuleVisible = visible;
    if (this.map) toggleGraticuleGrid(this.map, visible);
  }

  setProjection(projectionType: 'mercator' | 'globe') {
    this.lastProjection = projectionType;
    if (this.map) {
      try {
        if ((this.map as any).setProjection) {
          (this.map as any).setProjection({ type: projectionType });
        }
        this.map.triggerRepaint();
      } catch (e) {
        try {
          (this.map as any).setProjection({ name: projectionType });
          this.map.triggerRepaint();
        } catch (e2) {}
      }
    }
  }

  setReliefStyle(exaggeration: number = 0.5, shadowColor: string = '#000000', highlightColor: string = '#FFFFFF') {
    this.lastReliefParams = { exaggeration, shadowColor, highlightColor };
    if (this.map && this.map.isStyleLoaded()) {
      try {
        applyReliefStyle(this.map, exaggeration, shadowColor, highlightColor, this.worldType);
      } catch (e) {
        console.warn('Error applying relief style:', e);
      }
    }
  }

  updateClimateLayers(
    iceCapLatitude: number,
    iceCapVisible: boolean,
    seaLevelMeters: number = 0,
    seaLevelVisible: boolean = false
  ) {
    this.lastClimateParams = { iceCapLatitude, iceCapVisible, seaLevelMeters, seaLevelVisible };
    if (this.map && this.map.isStyleLoaded()) {
      try {
        updateIceCapsLayer(this.map, iceCapLatitude, iceCapVisible);
        updateSeaLevelLayer(this.map, seaLevelMeters, seaLevelVisible, this.currentStyleId);
      } catch (e) {
        console.warn('Error updating climate layers:', e);
      }
    }
  }

  setActiveEmpireFilter(empire: string) {
    this.activeEmpireFilter = empire;
  }

  regenerateFictionalRelief() {
    // No-op: topography regeneration is handled by ContinentBuilderView
  }

  renderContinents(geojson: any, _retryCount: number = 0) {
    this.lastContinentsData = geojson;
    if (!this.map || !geojson) return;
    if (!this.map.isStyleLoaded()) {
      if (_retryCount < 20) {
        setTimeout(() => this.renderContinents(geojson, _retryCount + 1), 50);
      }
      return;
    }

    // Resolve palette from current Tolkien theme
    const styleConfig = STYLE_CONFIGS.find(s => s.id === this.currentStyleId);
    const overrides = styleConfig?.mapPaintOverrides;
    const oceanColor = overrides?.water || overrides?.background || '#123a5c';
    const landColor = overrides?.landcover || '#c2b280';
    const coastColor = overrides?.borderColor || styleConfig?.texture?.borderColor || '#5c3a21';
    const shadowColor = this.currentStyleId?.includes('dark') ? '#0a0505' : '#2a1a0a';
    const highlightColor = this.currentStyleId?.includes('dark') ? '#4a3a2a' : '#fffbe6';

    const oceanMask = buildOceanMaskGeoJSON(geojson);

    try {
      // 1. Initialiser le Hillshade DEM procédural d'abord
      if (this.worldType === 'fictional' && !this.map.getSource('braudel-synth-dem')) {
        this.injectSyntheticHillshade(geojson, shadowColor, highlightColor);
      }

      // 2. Masque Océanique — Océan pur 100% avec les trous des continents
      if (this.map.getSource('braudel-ocean-mask')) {
        (this.map.getSource('braudel-ocean-mask') as maplibregl.GeoJSONSource).setData(oceanMask as any);
      } else {
        this.map.addSource('braudel-ocean-mask', { type: 'geojson', data: oceanMask as any });
        this.map.addLayer({
          id: 'braudel-ocean-mask',
          type: 'fill',
          source: 'braudel-ocean-mask',
          paint: {
            'fill-color': oceanColor,
            'fill-opacity': 1.0,
          },
        });
      }

      // 3. Continents & Terres
      if (this.map.getSource('braudel-continents')) {
        (this.map.getSource('braudel-continents') as maplibregl.GeoJSONSource).setData(geojson);
      } else {
        this.map.addSource('braudel-continents', { type: 'geojson', data: geojson });

        // Fond continental — teinte hypsométrique riche du thème (posée au-dessus du relief pour le draper)
        this.map.addLayer({
          id: 'braudel-continents-fill',
          type: 'fill',
          source: 'braudel-continents',
          filter: ['all', ['==', '$type', 'Polygon'], ['in', ['get', 'type'], ['literal', ['continent', '']]]],
          paint: {
            'fill-color': landColor,
            'fill-opacity': 0.65,
          },
        });

        // Trait de côte net et contrasté
        this.map.addLayer({
          id: 'braudel-continents-outline',
          type: 'line',
          source: 'braudel-continents',
          filter: ['all', ['==', '$type', 'Polygon'], ['in', ['get', 'type'], ['literal', ['continent', '']]]],
          paint: {
            'line-color': coastColor,
            'line-width': 2.0,
            'line-opacity': 0.9,
          },
        });
      }
    } catch (e) {
      console.warn('Error rendering continents:', e);
    }
  }

  /**
   * Generate a synthetic DEM from the continents GeoJSON, encode it as
   * Terrarium tiles, register as raster-dem source, and add a hillshade layer
   * ON TOP of the continent fill to simulate real terrain tile rendering.
   */
  private async injectSyntheticHillshade(geojson: any, shadowColor: string, highlightColor: string) {
    if (!this.map) return;

    try {
      const grid = buildDEMGrid(geojson, this.currentStyleId);

      const protocolName = 'synth-dem';
      try {
        maplibregl.addProtocol(protocolName, async (params: any) => {
          const url = params.url || params;
          const parts = url.replace(`${protocolName}://`, '').split('/');
          const z = parseInt(parts[0]);
          const x = parseInt(parts[1]);
          const y = parseInt(parts[2]);
          const buffer = await renderDEMTileAsync(grid, z, x, y);
          return { data: buffer };
        });
      } catch (_) {
        // Protocol may already be registered
      }

      if (!this.map.getSource('braudel-synth-dem')) {
        this.map.addSource('braudel-synth-dem', {
          type: 'raster-dem',
          tiles: [`${protocolName}://{z}/{x}/{y}`],
          encoding: 'terrarium',
          tileSize: 256,
          minzoom: 0,
          maxzoom: 6,
        });
      }

      // Hillshade sous le masque d'océan et sous la teinte continentale
      if (!this.map.getLayer('braudel-synth-hillshade')) {
        const beforeLayer = this.map.getLayer('braudel-ocean-mask') ? 'braudel-ocean-mask' : undefined;
        this.map.addLayer({
          id: 'braudel-synth-hillshade',
          type: 'hillshade',
          source: 'braudel-synth-dem',
          layout: { visibility: 'visible' },
          paint: {
            'hillshade-exaggeration': 0.85,
            'hillshade-shadow-color': shadowColor,
            'hillshade-highlight-color': highlightColor,
            'hillshade-illumination-direction': 315,
          },
        }, beforeLayer);
      }
    } catch (e) {
      console.warn('Error injecting synthetic hillshade:', e);
    }
  }

  onEntityClick(cb: EntityClickCallback) { this.emitter.onEntityClick(cb); }
  onEditEntity(cb: EditEntityCallback) { this.emitter.onEditEntity(cb); }
  onDrawComplete(cb: DrawCompleteCallback) { this.emitter.onDrawComplete(cb); }

  cleanup() {
    this.emitter.clearAll();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.draw = null;
    this.drawingEntityId = null;
  }
}

export const mapService = new MapService();

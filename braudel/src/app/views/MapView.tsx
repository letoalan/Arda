// views/MapView.tsx

import React, { useEffect, useRef } from 'react';
import { mapService } from '../../services/cartography/map-service';
import { useStore } from '../state/store';
import { TextureFilters } from './TextureFilters';
import { MapOverlay } from './MapOverlay';
import { LegendPanel } from './LegendPanel';
import { STYLE_CONFIGS } from '../../core/styles.config';
import { RhumbLinesCanvas } from '../components/map/RhumbLinesCanvas';
import { generateTolkienClimateScenario } from '../../core/climate/tolkienClimateGenerator';
import { buildBraudelClimateScenario } from '../../core/climate/braudelClimateService';
import { interpolateClimateAtYear, tempToIceCapLatitude, tempToSeaLevel } from '../../core/climate/climatePhysics';

export const MapView: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const { 
    world, 
    currentTime, 
    setSelectedEntity, 
    basemapStyle, 
    basemapLabelsVisible,
    basemapBordersVisible,
    basemapRoadsVisible,
    basemapRiversVisible,
    geoReferenceLinesVisible,
    portulanRhumbVisible,
    graticuleVisible,
    mapProjection,
    activeEmpire,
    setMapLoading,
    mapLoading,
    mapLoadingProgress,
    selectedProposal,
    climateSeaLevelVisible,
    climateIceCapVisible,
    climateMedianTarget,
    climateRcpVariability,
    climateSelectedRcp,
    tolkienClimateParams,
    startYear,
    endYear
  } = useStore();

  useEffect(() => {
    if (!mapContainer.current) return;
    
    const isDone = useStore.getState().isFirstLoadDone;
    if (!isDone) {
      setMapLoading(true, 55000);
    }
    
    const worldRecord = useStore.getState().world.world[0];
    const worldType = worldRecord?.worldType || 'real';
    const continents = worldRecord?.continents;

    let style: any;
    if (worldType === 'fictional') {
      const bStyle = useStore.getState().basemapStyle || 'tolkien_high_fantasy';
      const config = STYLE_CONFIGS.find(s => s.id === bStyle) || STYLE_CONFIGS.find(s => s.id === 'tolkien_high_fantasy');
      const oceanColor = config?.mapPaintOverrides?.water || config?.mapPaintOverrides?.background || '#123a5c';
      style = {
        version: 8,
        name: 'Fictional Virgin Ocean',
        sources: {},
        layers: [{ id: 'bg', type: 'background', paint: { 'background-color': oceanColor } }]
      };
    } else {
      const bStyle = useStore.getState().basemapStyle;
      const config = STYLE_CONFIGS.find(s => s.id === bStyle);
      style = config?.mapStyleUrl || 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
    }

    mapService.initialize(mapContainer.current, worldType, continents, style, useStore.getState().basemapStyle);

    mapService.onEntityClick((entityId) => {
      setSelectedEntity(entityId);
    });

    mapService.onEditEntity((entityId) => {
      const entity = useStore.getState().world.entities.find(e => e.id === entityId);
      if (entity && entity.geometry) {
        setSelectedEntity(entityId);
        if (!entity.properties?.isRelation) {
          mapService.enableDrawingMode(entityId, entity.geometry.type as any, entity.geometry, 'direct_select');
        }
      }
    });

    mapService.onDrawComplete((entityId, geometry) => {
      useStore.getState().updateEntityGeometry(entityId, geometry);
    });

    return () => {
      mapService.cleanup();
    };
  }, []);

  useEffect(() => {
    mapService.updateEntities(world.entities, world.relations, currentTime, selectedProposal, world.layers);
  }, [world.entities, world.relations, world.layers, currentTime, selectedProposal]);

  const reliefStyle = world.styles?.find((s) => s.type === 'relief');
  const reliefProps = reliefStyle?.properties as { exaggeration?: number; shadowColor?: string; highlightColor?: string } | undefined;
  const exaggeration = typeof reliefProps?.exaggeration === 'number' ? reliefProps.exaggeration : 0.5;
  const shadowColor = typeof reliefProps?.shadowColor === 'string' ? reliefProps.shadowColor : '#000000';
  const highlightColor = typeof reliefProps?.highlightColor === 'string' ? reliefProps.highlightColor : '#FFFFFF';

  useEffect(() => {
    mapService.setBasemapStyle(basemapStyle);
  }, [basemapStyle]);

  useEffect(() => {
    mapService.setLabelsVisible(basemapLabelsVisible);
    mapService.setBordersVisible(basemapBordersVisible);
    mapService.setRoadsVisible(basemapRoadsVisible);
    mapService.setRiversVisible(basemapRiversVisible);
    mapService.setGeoReferenceLinesVisible(geoReferenceLinesVisible);
    mapService.setPortulanRhumbVisible(portulanRhumbVisible);
    mapService.setGraticuleVisible(graticuleVisible);
  }, [basemapLabelsVisible, basemapBordersVisible, basemapRoadsVisible, basemapRiversVisible, geoReferenceLinesVisible, portulanRhumbVisible, graticuleVisible]);

  useEffect(() => {
    mapService.setProjection(mapProjection);
  }, [mapProjection]);

  useEffect(() => {
    mapService.setActiveEmpireFilter(activeEmpire);
  }, [activeEmpire]);

  useEffect(() => {
    mapService.setReliefStyle(exaggeration, shadowColor, highlightColor);
  }, [exaggeration, shadowColor, highlightColor]);

  // Synchronisation des calottes glaciaires et du trait de côte avec la Timeline
  useEffect(() => {
    const worldType = world.world?.[0]?.worldType || 'real';
    let deltaT = 0;
    if (worldType === 'fictional') {
      const scen = generateTolkienClimateScenario(tolkienClimateParams, startYear || 0, endYear || 3000, 30);
      deltaT = interpolateClimateAtYear(scen.points, currentTime);
    } else {
      const rcp = climateRcpVariability ? (climateSelectedRcp || undefined) : undefined;
      const scen = buildBraudelClimateScenario(climateMedianTarget, rcp, true);
      deltaT = interpolateClimateAtYear(scen.points, currentTime);
    }
    const lat = tempToIceCapLatitude(deltaT);
    const seaLevel = tempToSeaLevel(deltaT);
    mapService.updateClimateLayers(lat, climateIceCapVisible, seaLevel, climateSeaLevelVisible);
  }, [currentTime, climateIceCapVisible, climateSeaLevelVisible, climateMedianTarget, climateRcpVariability, climateSelectedRcp, tolkienClimateParams, world.world, startYear, endYear]);

  // Synchronisation des continents imaginaires dessinés
  useEffect(() => {
    const worldRecord = world.world?.[0];
    if (worldRecord?.worldType === 'fictional' && worldRecord?.continents) {
      mapService.renderContinents(worldRecord.continents);
    }
  }, [world.world]);

  const currentStyleConfig = STYLE_CONFIGS.find((s) => s.id === basemapStyle) || STYLE_CONFIGS[0];

  const blurAmount = mapLoading ? Math.max(0, ((100 - mapLoadingProgress) / 100) * 16) : 0;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <TextureFilters />
      <MapOverlay />
      <LegendPanel />
      <RhumbLinesCanvas rhumbConfig={currentStyleConfig.rhumbLines} />
      <div
        ref={mapContainer}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          filter: blurAmount > 0 ? `blur(${blurAmount.toFixed(1)}px)` : 'none',
          transition: 'filter 0.15s ease-out'
        }}
      />
    </div>
  );
};

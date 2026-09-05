// views/MapView.tsx

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Compass } from 'lucide-react';
import { mapService } from '../../services/cartography/map-service';
import { useStore } from '../state/store';
import { TextureFilters } from './TextureFilters';
import { MapOverlay } from './MapOverlay';
import { LegendPanel } from './LegendPanel';
import { STYLE_CONFIGS } from '../../core/styles.config';
import { RhumbLinesCanvas } from '../components/map/RhumbLinesCanvas';
import { EckertIVWarpCanvas } from '../components/map/EckertIVWarpCanvas';
import { EckertIVOverlay } from '../components/map/EckertIVOverlay';
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
    setMapProjection,
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
    endYear,
    isStudioMode
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
  const rawExaggeration = typeof reliefProps?.exaggeration === 'number' ? reliefProps.exaggeration : 0.5;
  const exaggeration = Math.min(1.0, Math.max(0, rawExaggeration));
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

  // Gestion cinématique de transition fluide entre Eckert IV et Globe 3D
  const [transitionState, setTransitionState] = useState<'idle' | 'eckert_to_globe' | 'globe_to_eckert'>('idle');
  const [eckertOpacity, setEckertOpacity] = useState<number>(mapProjection === 'eckert4' ? 1 : 0);
  const [eckertScale, setEckertScale] = useState<number>(1.0);
  const [transformOrigin, setTransformOrigin] = useState<string>('center center');
  const isTransitioningRef = useRef<boolean>(false);

  const [eckertTransform, setEckertTransform] = useState<{ zoom: number; panX: number; panY: number }>({
    zoom: 1.0,
    panX: 0,
    panY: 0
  });

  const handleTransformChange = useCallback((action: React.SetStateAction<{ zoom: number; panX: number; panY: number }>) => {
    setEckertTransform(prev => {
      try {
        const next = typeof action === 'function' ? action(prev) : action;
        if (!next || isNaN(next.zoom) || isNaN(next.panX) || isNaN(next.panY)) {
          return prev;
        }
        return next;
      } catch (err) {
        console.warn('[MapView] Erreur dans le setter eckertTransform ignorée:', err);
        return prev;
      }
    });
  }, []);

  // Calcule le facteur d'échelle dynamique nécessaire pour que le contour elliptique et le cadre
  // d'Eckert IV dépassent complètement les 4 bords de l'écran, invisibilisant le cadre et affichant
  // la carte en plein écran (full bleed) sans rupture visuelle.
  const getOffscreenScale = () => {
    if (typeof window === 'undefined') return 1.85;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const maxW = Math.max(100, w - 56);
    const maxH = Math.max(100, h - 56);
    let boxW = maxW;
    let boxH = boxW / 2;
    if (boxH > maxH) {
      boxH = maxH;
      boxW = boxH * 2;
    }
    const scaleX = w / Math.max(1, boxW);
    const scaleY = h / Math.max(1, boxH);
    return Math.max(1.85, Math.max(scaleX, scaleY) * 1.45);
  };

  const triggerEckertToGlobe = (geo?: { lon: number; lat: number }, screenPos?: { x: number; y: number }) => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setTransitionState('eckert_to_globe');

    if (screenPos) {
      setTransformOrigin(`${screenPos.x}px ${screenPos.y}px`);
    } else {
      setTransformOrigin('center center');
    }

    const targetLon = geo ? geo.lon : 0;
    const targetLat = geo ? geo.lat : 20;

    // 1. Préparer MapLibre en mode Globe sous le masque
    const map = mapService.getMap();
    if (map) {
      try {
        (map as any).setProjection({ type: 'globe' });
        map.jumpTo({
          center: [targetLon, targetLat],
          zoom: 1.15,
          pitch: 0,
          bearing: 0
        });
        // Déclencher le vol cinématique fluide vers la région ciblée
        map.flyTo({
          center: [targetLon, targetLat],
          zoom: 3.2,
          duration: 1800,
          essential: true
        });
      } catch (_) {}
    }

    const offscreenScale = getOffscreenScale();

    // 2. Fondu enchaîné & expansion optique fluide d'Eckert au-delà des limites de l'écran
    setEckertOpacity(0);
    setEckertScale(offscreenScale);

    // 3. Finalisation après la fin du fondu (540ms)
    setTimeout(() => {
      setMapProjection('globe');
      setTransitionState('idle');
      setEckertScale(1.0);
      setEckertOpacity(0);
      setTransformOrigin('center center');
      isTransitioningRef.current = false;
    }, 540);
  };

  const triggerGlobeToEckert = () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setTransitionState('globe_to_eckert');
    setTransformOrigin('center center');

    const map = mapService.getMap();
    // 1. Le Globe 3D entame un dézoom fluide et élégant vers la vue globale dans l'espace
    if (map) {
      try {
        map.flyTo({
          center: [0, 0],
          zoom: 1.12,
          pitch: 0,
          bearing: 0,
          duration: 480,
          essential: true
        });
      } catch (_) {}
    }

    const offscreenScale = getOffscreenScale();

    // 2. Dès 160ms, le planisphère Eckert IV apparaît à l'échelle plein écran (bords hors écran)
    //    et se rétracte doucement vers son cadre d'atlas 2:1 centré
    setTimeout(() => {
      setEckertOpacity(0);
      setEckertScale(offscreenScale);

      requestAnimationFrame(() => {
        setEckertOpacity(1);
        setEckertScale(1.0);
      });

      // 3. À 780ms (lorsque Eckert est à 100% d'opacité et couvre complètement l'écran),
      //    on bascule silencieusement MapLibre en Mercator en sous-main
      setTimeout(() => {
        if (map) {
          try {
            (map as any).setProjection({ type: 'mercator' });
            map.jumpTo({ center: [0, 0], zoom: 1.0, pitch: 0, bearing: 0 });
          } catch (_) {}
        }
        setMapProjection('eckert4');
        setTransitionState('idle');
        isTransitioningRef.current = false;
      }, 620);
    }, 160);
  };

  // Détection du dézoom molette en mode Globe 3D pour retour automatique et fluide vers Eckert IV
  useEffect(() => {
    const container = mapContainer.current;
    if (!container) return;

    const handleGlobeWheel = (e: WheelEvent) => {
      if (mapProjection === 'globe' && transitionState === 'idle' && !isTransitioningRef.current) {
        // e.deltaY > 0 correspond au dézoom molette arrière
        if (e.deltaY > 0) {
          const map = mapService.getMap();
          if (map) {
            const currentZoom = map.getZoom();
            // Si l'utilisateur est déjà en vue globale orbitale (zoom <= 1.35) et continue de dézoomer
            if (currentZoom <= 1.35) {
              e.preventDefault();
              e.stopPropagation();
              triggerGlobeToEckert();
            }
          }
        }
      }
    };

    container.addEventListener('wheel', handleGlobeWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleGlobeWheel);
    };
  }, [mapProjection, transitionState]);

  // Synchronisation avec les changements de mapProjection (ex: depuis StylePanel)
  const prevProjRef = useRef(mapProjection);
  useEffect(() => {
    const prev = prevProjRef.current;
    prevProjRef.current = mapProjection;
    if (prev === mapProjection || isTransitioningRef.current) return;

    if (prev === 'eckert4' && mapProjection === 'globe') {
      triggerEckertToGlobe();
    } else if (prev === 'globe' && mapProjection === 'eckert4') {
      triggerGlobeToEckert();
    } else {
      mapService.setProjection(mapProjection);
      setEckertOpacity(mapProjection === 'eckert4' ? 1 : 0);
      setEckertScale(1.0);
    }
  }, [mapProjection]);

  const handleEckertReset = () => {
    setEckertTransform({ zoom: 1.0, panX: 0, panY: 0 });
    const map = mapService.getMap();
    if (map) {
      map.jumpTo({ center: [0, 0], zoom: 1.0, bearing: 0, pitch: 0 });
    }
  };

  const handleEckertZoomIn = () => {
    if (eckertTransform.zoom >= 2.6) {
      triggerEckertToGlobe();
    } else {
      setEckertTransform(prev => ({
        ...prev,
        zoom: Math.min(15.0, prev.zoom * 1.25)
      }));
    }
  };

  const handleEckertZoomOut = () => {
    setEckertTransform(prev => ({
      ...prev,
      zoom: Math.max(1.0, prev.zoom / 1.25)
    }));
  };

  const currentStyleConfig = STYLE_CONFIGS.find((s) => s.id === basemapStyle) || STYLE_CONFIGS[0];

  const blurAmount = mapLoading ? Math.max(0, ((100 - mapLoadingProgress) / 100) * 16) : 0;

  const isEckertVisible = mapProjection === 'eckert4' || transitionState !== 'idle';

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#070b14' }}>
      <TextureFilters />
      <MapOverlay />
      {!isStudioMode && <LegendPanel />}
      <RhumbLinesCanvas rhumbConfig={currentStyleConfig.rhumbLines} />

      {/* Conteneur de projection Eckert IV avec animation fluide de transition vers Globe 3D */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          opacity: eckertOpacity,
          transform: `scale(${eckertScale})`,
          transformOrigin: transformOrigin,
          transition: transitionState === 'globe_to_eckert'
            ? 'opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1)'
            : 'opacity 540ms cubic-bezier(0.25, 0.1, 0.25, 1), transform 540ms cubic-bezier(0.25, 0.1, 0.25, 1)',
          pointerEvents: mapProjection === 'eckert4' && transitionState === 'idle' ? 'auto' : 'none',
          display: isEckertVisible ? 'block' : 'none',
          willChange: 'opacity, transform'
        }}
      >
        <EckertIVWarpCanvas
          visible={isEckertVisible}
          isTransitioning={transitionState !== 'idle'}
          transform={eckertTransform}
          onTransformChange={handleTransformChange}
          onTransitionToGlobe={triggerEckertToGlobe}
        />
        <EckertIVOverlay
          visible={isEckertVisible}
          transform={eckertTransform}
          onZoomIn={handleEckertZoomIn}
          onZoomOut={handleEckertZoomOut}
          onReset={handleEckertReset}
          onTransitionToGlobe={triggerEckertToGlobe}
        />
      </div>

      {mapProjection === 'globe' && transitionState === 'idle' && (
        <button
          onClick={triggerGlobeToEckert}
          title="Basculer fluidement vers le planisphère d'ensemble Eckert IV 2D (surfaces équivalentes)"
          style={{
            position: 'absolute',
            bottom: '22px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 4,
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
            borderRadius: '20px',
            padding: '7px 16px',
            color: '#38bdf8',
            fontSize: '0.8rem',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease-in-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(56, 189, 248, 0.22)';
            e.currentTarget.style.borderColor = '#38bdf8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.88)';
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
          }}
        >
          <Compass size={14} />
          <span>Planisphère Eckert IV</span>
        </button>
      )}

      <div
        ref={mapContainer}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          opacity: 1,
          pointerEvents: mapProjection === 'eckert4' ? 'none' : 'auto',
          filter: blurAmount > 0 ? `blur(${blurAmount.toFixed(1)}px)` : 'none',
          transition: 'filter 0.15s ease-out'
        }}
      />
    </div>
  );
};

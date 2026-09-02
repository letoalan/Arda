// views/DataPanel.tsx

import React, { useRef, useState, useMemo } from 'react';
import { useStore } from '../state/store';
import { Database, Download, UploadCloud, XCircle } from 'lucide-react';
import { mapService } from '../../services/cartography/map-service';
import { STYLE_CONFIGS } from '../../core/styles.config';
import { exportMultiEpochPDF, exportTimelineDrivenPDF, exportToJPEG, exportMultiEpochZIP } from '../../services/export/export-multimedia';


import { generateStandaloneHtml } from '../../services/export/standalone-template';
import { exportStoryboardZIP } from '../../services/export/storyboard-export';
import { exportStoryToWebM, VideoExportProgress } from '../../services/export/video-export';
import { loadStoryFromStorage } from '../../services/export/story-export';
import { ExportMultimediaSection } from '../components/data/ExportMultimediaSection';
import { ExportPdfModal } from '../components/data/ExportPdfModal';
import { ExportZipModal } from '../components/data/ExportZipModal';
import { ExportVideoModal } from '../components/data/ExportVideoModal';
import { GEOPOLITICA_SOURCES } from '../../services/import/geopoliticaRegistry';
import { getCatalogTemporalEntities } from '../../services/import/geojson-catalog-service';
import { extractActiveEpochs } from '../../services/export/pdf-timeline-utils';



export const DataPanel: React.FC = () => {
  const {
    exportWorld,
    importWorldFile,
    exportLoading,
    exportError,
    importError,
    clearErrors,
    world,
    currentTime,
    startYear,
    endYear,
    basemapStyle,
    viewMode,
    mapProjection,
    geoReferenceLinesVisible,
    portulanRhumbVisible,
    graticuleVisible,
    basemapLabelsVisible,
    basemapBordersVisible,
    basemapRoadsVisible,
    basemapRiversVisible,
    setCurrentTime
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const [isZipModalOpen, setIsZipModalOpen] = useState(false);
  const [isZipExporting, setIsZipExporting] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isVideoExporting, setIsVideoExporting] = useState(false);
  const [videoProgress, setVideoProgress] = useState<VideoExportProgress | null>(null);

  const worldName = world.world[0]?.name || 'Monde Braudel';

  const activePeriod = useMemo(() => {
    if (!GEOPOLITICA_SOURCES.length) return undefined;
    const sorted = [...GEOPOLITICA_SOURCES].sort((a, b) => a.referenceYear - b.referenceYear);
    let candidate = sorted[0];
    for (const source of sorted) {
      if (source.referenceYear <= currentTime) {
        candidate = source;
      } else {
        break;
      }
    }
    return candidate?.label;
  }, [currentTime]);

  const handleExportJson = async () => {
    try {
      await exportWorld();
      clearErrors();
    } catch (error) {
      console.error('Erreur d\'export JSON:', error);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importWorldFile(file).catch((error) => {
      console.error('Erreur d\'import:', error);
    }).finally(() => {
      if (fileInputRef.current) fileInputRef.current.value = '';
    });
  };

  const handleOpenPdfModal = () => {
    setIsPdfModalOpen(true);
  };

  const handleConfirmSinglePdf = async (year: number, periodLabel?: string) => {
    const map = mapService.getMap();
    if (!map) return;
    setIsPdfExporting(true);
    try {
      const state = useStore.getState();
      const currentWorld = state.world;
      const config = STYLE_CONFIGS.find(s => s.id === basemapStyle) || STYLE_CONFIGS[0];
      const catalogEntities = getCatalogTemporalEntities();
      await exportTimelineDrivenPDF(
        worldName,
        config,
        map,
        (t) => setCurrentTime(t),
        (t) => {
          const liveWorld = useStore.getState().world;
          mapService.updateEntities(liveWorld.entities, liveWorld.relations, t, undefined, liveWorld.layers);
        },
        currentWorld.entities,
        currentWorld.relations,
        {
          startTime: year,
          multi: false,
          catalogEntities,
          historicalPeriod: periodLabel || activePeriod,
        }
      );
      setIsPdfModalOpen(false);
    } catch (err) {
      console.error('Erreur lors de l\'export PDF:', err);
    } finally {
      setIsPdfExporting(false);
    }
  };

  const handleConfirmMultiPdf = async (selectedEpochs: { year: number; label: string; referenceYear?: number; validFrom?: number; validTo?: number }[]) => {
    const map = mapService.getMap();
    if (!map) return;
    setIsPdfExporting(true);
    setExportProgress(0);
    const initialTime = currentTime;
    try {
      const state = useStore.getState();
      const currentWorld = state.world;
      const config = STYLE_CONFIGS.find(s => s.id === basemapStyle) || STYLE_CONFIGS[0];
      await exportMultiEpochPDF(
        worldName,
        selectedEpochs,
        config,
        map,
        (year) => setCurrentTime(year),
        (time, epochTarget) => {
          const liveWorld = useStore.getState().world;
          const epochRange = epochTarget && epochTarget.validFrom !== undefined && epochTarget.validTo !== undefined
            ? { validFrom: epochTarget.validFrom, validTo: epochTarget.validTo }
            : undefined;
          mapService.updateEntities(liveWorld.entities, liveWorld.relations, time, undefined, liveWorld.layers, epochRange);
        },
        currentWorld.entities,
        currentWorld.relations,
        {},
        (pct) => setExportProgress(pct)
      );
      setIsPdfModalOpen(false);
    } catch (err) {
      console.error('Erreur lors de l\'export Atlas PDF multi-époques:', err);
    } finally {
      setIsPdfExporting(false);
      setExportProgress(null);
      setCurrentTime(initialTime);
      const liveWorld = useStore.getState().world;
      mapService.updateEntities(liveWorld.entities, liveWorld.relations, initialTime, undefined, liveWorld.layers);
    }
  };




  const handleJpegExport = async () => {
    const map = mapService.getMap();
    if (!map) return;
    const config = STYLE_CONFIGS.find(s => s.id === basemapStyle) || STYLE_CONFIGS[0];
    await exportToJPEG(worldName, currentTime, map, config);
  };

  const handleHtmlSimpleExport = () => {
    const config = STYLE_CONFIGS.find(s => s.id === basemapStyle) || STYLE_CONFIGS[0];
    const storyProject = loadStoryFromStorage(worldName);
    const effectiveConfig = {
      ...config,
      demEnabled: viewMode === '3D' || Boolean((config as any).demEnabled),
    };

    const htmlContent = generateStandaloneHtml(
      worldName,
      effectiveConfig,
      { type: 'FeatureCollection', features: world.entities.map(e => ({ ...e, type: 'Feature' })) },
      { type: 'FeatureCollection', features: world.relations.map(r => ({ ...r, type: 'Feature' })) },
      storyProject?.scenes && storyProject.scenes.length > 0 ? 'story' : 'map',
      storyProject,
      undefined,
      {
        geoReferenceLinesVisible,
        portulanRhumbVisible,
        graticuleVisible,
        basemapLabelsVisible,
        basemapBordersVisible,
        basemapRoadsVisible,
        basemapRiversVisible,
        projection: mapProjection,
        pitch: viewMode === '3D' ? 45 : 0,
      }
    );

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.download = `${worldName.toLowerCase().replace(/\s+/g, '_')}_carte_interactive.html`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  const handleConfirmSingleZip = async (year: number) => {
    const map = mapService.getMap();
    if (!map) return;
    setIsZipExporting(true);
    try {
      const config = STYLE_CONFIGS.find(s => s.id === basemapStyle) || STYLE_CONFIGS[0];
      await exportToJPEG(worldName, year, map, config);
      setIsZipModalOpen(false);
    } catch (err) {
      console.error('Erreur export JPEG unitaire:', err);
    } finally {
      setIsZipExporting(false);
    }
  };

  const handleConfirmMultiZip = async (selectedEpochs: { year: number; label: string; referenceYear?: number; validFrom?: number; validTo?: number; targetYear?: number }[]) => {
    const map = mapService.getMap();
    if (!map) return;
    setIsZipExporting(true);
    setExportProgress(0);
    const initialTime = currentTime;
    try {
      const state = useStore.getState();
      const currentWorld = state.world;
      const config = STYLE_CONFIGS.find(s => s.id === basemapStyle) || STYLE_CONFIGS[0];
      await exportMultiEpochZIP(
        worldName,
        selectedEpochs,
        map,
        (year) => setCurrentTime(year),
        currentWorld.entities,
        currentWorld.relations,
        config,
        (pct) => setExportProgress(pct)
      );
      setIsZipModalOpen(false);
    } catch (err) {
      console.error('Erreur lors de l\'export Atlas ZIP multi-époques:', err);
    } finally {
      setIsZipExporting(false);
      setExportProgress(null);
      setCurrentTime(initialTime);
      const liveWorld = useStore.getState().world;
      mapService.updateEntities(liveWorld.entities, liveWorld.relations, initialTime, undefined, liveWorld.layers);
    }
  };

  const handleStoryboardExport = async () => {
    const map = mapService.getMap();
    if (!map) return;
    const config = STYLE_CONFIGS.find(s => s.id === basemapStyle) || STYLE_CONFIGS[0];
    const defaultBg = config?.mapPaintOverrides?.background || '#ffffff';
    const currentBearing = map.getBearing();
    const currentPitch = map.getPitch();
    const currentCenter = [map.getCenter().lng, map.getCenter().lat] as [number, number];
    const currentZoom = map.getZoom();

    let story = loadStoryFromStorage(worldName);
    // Si la story n'a que la scène par défaut, cibler automatiquement les époques actives (comme pour le PDF)
    if (story.scenes.length === 1 && story.scenes[0].id === 'scene-1') {
      const activeEpochs = extractActiveEpochs(world.entities, world.relations, startYear, endYear);
      const importedEpochs = activeEpochs.filter(e => e.isImportedOnMap || e.entityCount > 0);
      const epochsList = importedEpochs.length > 0 ? importedEpochs : activeEpochs;

      if (epochsList.length > 1) {
        story = {
          ...story,
          scenes: epochsList.map((ep, idx) => ({
            id: `scene-epoch-${idx + 1}`,
            title: ep.label || `Époque ${ep.year}`,
            body: `Capture cartographique de l'époque ${ep.label || ep.year}.`,
            mapState: {
              center: currentCenter,
              zoom: currentZoom,
              bearing: currentBearing,
              pitch: currentPitch,
              timelineYear: ep.targetYear,
              visibleLayerIds: []
            },
            layout: 'split',
            transition: {
              profile: 'standard',
              durationMode: 'auto',
              pauseAfterMs: 800,
              reduceMotionPolicy: 'essential-for-export'
            }
          }))
        };
      } else {
        story.scenes[0].mapState = {
          ...story.scenes[0].mapState,
          center: currentCenter,
          zoom: currentZoom,
          bearing: currentBearing,
          pitch: currentPitch,
          timelineYear: currentTime
        };
      }
    }

    setExportProgress(0);
    try {
      await exportStoryboardZIP(worldName, story, map, setCurrentTime, (pct) => setExportProgress(pct), world.entities, defaultBg);
    } catch (e) {
      console.error('Erreur export storyboard:', e);
    } finally {
      setExportProgress(null);
    }
  };

  const prepareStoryForExport = () => {
    const map = mapService.getMap();
    const currentBearing = map ? map.getBearing() : 0;
    const currentPitch = map ? map.getPitch() : 0;
    const currentCenter = map ? [map.getCenter().lng, map.getCenter().lat] as [number, number] : [2, 45] as [number, number];
    const currentZoom = map ? map.getZoom() : 3;

    let story = loadStoryFromStorage(worldName);
    if (story.scenes.length === 1 && story.scenes[0].id === 'scene-1') {
      const activeEpochs = extractActiveEpochs(world.entities, world.relations, startYear, endYear);
      const importedEpochs = activeEpochs.filter(e => e.isImportedOnMap || e.entityCount > 0);
      const epochsList = importedEpochs.length > 0 ? importedEpochs : activeEpochs;
      const totalEpochs = epochsList.length;

      if (totalEpochs > 1) {
        story = {
          ...story,
          scenes: epochsList.map((ep, idx) => {
            const yearStr = ep.year < 0 ? `${Math.abs(ep.year)} av. J.-C.` : `An ${ep.year}`;
            const label = ep.label ? `${ep.label} (${yearStr})` : yearStr;
            return {
              id: `scene-epoch-${idx + 1}`,
              periodNumber: idx + 1,
              totalPeriods: totalEpochs,
              title: `Période ${idx + 1}/${totalEpochs} — ${label}`,
              body: `Capture cartographique de la période ${idx + 1} (${label}).`,
              mapState: {
                center: currentCenter,
                zoom: currentZoom,
                bearing: currentBearing,
                pitch: currentPitch,
                timelineYear: ep.targetYear !== undefined ? ep.targetYear : ep.year,
                visibleLayerIds: []
              },
              layout: 'split',
              transition: {
                profile: 'standard',
                durationMode: 'auto',
                pauseAfterMs: 1200,
                reduceMotionPolicy: 'essential-for-export'
              }
            };
          })
        };
      } else {
        const yearStr = currentTime < 0 ? `${Math.abs(currentTime)} av. J.-C.` : `An ${currentTime}`;
        story.scenes[0] = {
          ...story.scenes[0],
          periodNumber: 1,
          totalPeriods: 1,
          title: `Période 1/1 — ${yearStr}`,
          mapState: {
            ...story.scenes[0].mapState,
            center: currentCenter,
            zoom: currentZoom,
            bearing: currentBearing,
            pitch: currentPitch,
            timelineYear: currentTime
          }
        };
      }
    } else {
      // Scénario personnalisé existant : assigner automatiquement les numéros de périodes séquentiels
      const total = story.scenes.length;
      story = {
        ...story,
        scenes: story.scenes.map((scene, idx) => {
          const rawTitle = scene.title || `Période ${idx + 1}`;
          const cleanTitle = rawTitle.replace(/^Période\s+\d+(\/\d+)?\s*[-—:]\s*/i, '');
          const year = scene.mapState.timelineYear ?? currentTime;
          const formattedYear = year < 0 ? `${Math.abs(year)} av. J.-C.` : `An ${year}`;
          return {
            ...scene,
            periodNumber: idx + 1,
            totalPeriods: total,
            title: `Période ${idx + 1}/${total} — ${cleanTitle.startsWith('Scène') ? formattedYear : cleanTitle}`,
            mapState: {
              ...scene.mapState,
              timelineYear: scene.mapState.timelineYear ?? currentTime
            }
          };
        })
      };
    }
    return story;
  };

  const handleStartVideoExport = async (fps: number, includeLegend: boolean = true) => {
    const map = mapService.getMap();
    if (!map) return;
    setIsVideoExporting(true);
    setVideoProgress({
      phase: 'stabilizing',
      percent: 0,
      generationPercent: 0,
      encodingPercent: 0,
      currentSceneIndex: 0,
      totalScenes: 1,
      elapsedMs: 0,
      estimatedRemainingMs: 0,
      estimatedTotalDurationMs: 0,
      recordedBytes: 0,
      chunkCount: 0,
      statusMessage: 'Initialisation de l\'exportateur vidéo…'
    });

    const storyToExport = prepareStoryForExport();

    try {
      const liveWorld = useStore.getState().world;
      await exportStoryToWebM(
        worldName,
        storyToExport,
        map,
        setCurrentTime,
        (progress: VideoExportProgress) => setVideoProgress(progress),
        fps,
        {
          entities: liveWorld.entities,
          relations: liveWorld.relations,
          layers: liveWorld.layers,
          includeLegend,
          updateEntities: (t) => {
            const w = useStore.getState().world;
            mapService.updateEntities(w.entities, w.relations, t, undefined, w.layers);
          }
        }
      );
    } catch (e) {
      console.error('Erreur export vidéo WebM:', e);
    } finally {
      setIsVideoExporting(false);
    }
  };

  return (
    <div className="panel-content" style={{ borderBottom: '1px solid var(--glass-border)' }}>
      <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
        <Database size={16} /> Import / Export de Données
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button className="btn btn-primary" onClick={handleExportJson} disabled={exportLoading}>
          <Download size={16} /> {exportLoading ? 'Exportation...' : 'Exporter le monde en JSON'}
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          accept=".json"
          style={{ display: 'none' }}
        />

        <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
          <UploadCloud size={16} /> Importer un monde (JSON)
        </button>
      </div>

      {(exportError || importError) && (
        <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '4px', color: '#ef4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{exportError || importError}</span>
          <XCircle size={14} style={{ cursor: 'pointer' }} onClick={clearErrors} />
        </div>
      )}

      <ExportMultimediaSection
        exportProgress={exportProgress}
        onPdfExport={handleOpenPdfModal}
        onZipEpochsExport={() => setIsZipModalOpen(true)}
        onJpegExport={handleJpegExport}
        onHtmlSimpleExport={handleHtmlSimpleExport}
        onStoryboardExport={handleStoryboardExport}
        onWebmExport={() => {
          setVideoProgress(null);
          setIsVideoModalOpen(true);
        }}
      />

      {/* Modale Dédiée : Export Atlas PDF */}
      <ExportPdfModal
        isOpen={isPdfModalOpen}
        currentTime={currentTime}
        startYear={startYear}
        endYear={endYear}
        entities={world.entities}
        relations={world.relations}
        isExporting={isPdfExporting}
        exportProgress={exportProgress}
        onConfirmSingle={handleConfirmSinglePdf}
        onConfirmMulti={handleConfirmMultiPdf}
        onClose={() => !isPdfExporting && setIsPdfModalOpen(false)}
      />

      {/* Modale Dédiée : Collection Images JPEG (ZIP) */}
      <ExportZipModal
        isOpen={isZipModalOpen}
        currentTime={currentTime}
        startYear={startYear}
        endYear={endYear}
        entities={world.entities}
        relations={world.relations}
        isExporting={isZipExporting}
        exportProgress={exportProgress}
        onConfirmSingleZip={handleConfirmSingleZip}
        onConfirmMultiZip={handleConfirmMultiZip}
        onClose={() => !isZipExporting && setIsZipModalOpen(false)}
      />

      {/* Modale Dédiée : Export Vidéo Cinématique */}
      <ExportVideoModal
        isOpen={isVideoModalOpen}
        worldName={worldName}
        story={prepareStoryForExport()}
        canvasDimensions={(() => {
          const liveCanvas = mapService.getMap()?.getCanvas();
          return liveCanvas
            ? { width: liveCanvas.width, height: liveCanvas.height }
            : { width: 1920, height: 1080 };
        })()}
        isExporting={isVideoExporting}
        videoProgress={videoProgress}
        onStartExport={handleStartVideoExport}
        onClose={() => !isVideoExporting && setIsVideoModalOpen(false)}
      />
    </div>
  );
};


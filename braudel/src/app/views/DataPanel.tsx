// views/DataPanel.tsx

import React, { useRef, useState } from 'react';
import { useStore } from '../state/store';
import { Database, Download, UploadCloud, XCircle } from 'lucide-react';
import { mapService } from '../../services/cartography/map-service';
import { STYLE_CONFIGS } from '../../core/styles.config';
import { exportToPDF, exportToJPEG } from '../../services/export/export-multimedia';
import { generateStandaloneHtml } from '../../services/export/standalone-template';
import { exportStoryboardZIP } from '../../services/export/storyboard-export';
import { exportStoryToWebM } from '../../services/export/video-export';
import { loadStoryFromStorage } from '../../services/export/story-export';
import { ExportMultimediaSection } from '../components/data/ExportMultimediaSection';

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
    basemapStyle,
    setCurrentTime
  } = useStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportProgress, setExportProgress] = useState<number | null>(null);

  const worldName = world.world[0]?.name || 'Monde Braudel';

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

  const handlePdfExport = async () => {
    const map = mapService.getMap();
    if (!map) return;
    const config = STYLE_CONFIGS.find(s => s.id === basemapStyle) || STYLE_CONFIGS[0];
    await exportToPDF(worldName, currentTime, config, map, world.entities);
  };

  const handleJpegExport = () => {
    const map = mapService.getMap();
    if (!map) return;
    exportToJPEG(worldName, currentTime, map);
  };

  const handleHtmlSimpleExport = () => {
    const config = STYLE_CONFIGS.find(s => s.id === basemapStyle) || STYLE_CONFIGS[0];
    const htmlContent = generateStandaloneHtml(
      worldName,
      config,
      { type: 'FeatureCollection', features: world.entities.map(e => ({ ...e, type: 'Feature' })) },
      { type: 'FeatureCollection', features: world.relations.map(r => ({ ...r, type: 'Feature' })) },
      'map'
    );

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.download = `${worldName.toLowerCase().replace(/\s+/g, '_')}_carte_interactive.html`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  const handleStoryboardExport = async () => {
    const map = mapService.getMap();
    if (!map) return;
    const story = loadStoryFromStorage(worldName);
    setExportProgress(0);
    try {
      await exportStoryboardZIP(worldName, story, map, setCurrentTime, (pct) => setExportProgress(pct));
    } catch (e) {
      console.error('Erreur export storyboard:', e);
    } finally {
      setExportProgress(null);
    }
  };

  const handleWebmExport = async () => {
    const map = mapService.getMap();
    if (!map) return;
    const story = loadStoryFromStorage(worldName);
    setExportProgress(0);
    try {
      await exportStoryToWebM(worldName, story, map, setCurrentTime, (pct) => setExportProgress(pct));
    } catch (e) {
      console.error('Erreur export vidéo WebM:', e);
    } finally {
      setExportProgress(null);
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
        onPdfExport={handlePdfExport}
        onJpegExport={handleJpegExport}
        onHtmlSimpleExport={handleHtmlSimpleExport}
        onStoryboardExport={handleStoryboardExport}
        onWebmExport={handleWebmExport}
      />
    </div>
  );
};

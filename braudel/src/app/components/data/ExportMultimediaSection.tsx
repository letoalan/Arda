// app/components/data/ExportMultimediaSection.tsx

import React from 'react';
import { FileText, Image as ImageIcon, Globe, BookOpen, Video, Film } from 'lucide-react';

interface ExportMultimediaSectionProps {
  exportProgress: number | null;
  onPdfExport: () => void;
  onZipEpochsExport?: () => void;
  onJpegExport: () => void;
  onHtmlSimpleExport: () => void;
  onStoryboardExport: () => void;
  onWebmExport: () => void;
  onStudioOpen?: () => void;
}

export const ExportMultimediaSection: React.FC<ExportMultimediaSectionProps> = ({
  exportProgress,
  onPdfExport,
  onZipEpochsExport,
  onJpegExport,
  onHtmlSimpleExport,
  onStoryboardExport,
  onWebmExport,
  onStudioOpen,
}) => {
  return (
    <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
      <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <FileText size={14} /> Exportations Cartographiques & Récit
      </h4>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button className="btn btn-secondary" onClick={onPdfExport} style={{ fontSize: '0.75rem', padding: '6px' }} title="Exporter une page ou l'atlas complet des époques en PDF">
          <FileText size={13} /> Atlas PDF
        </button>
        <button className="btn btn-secondary" onClick={onZipEpochsExport || onPdfExport} style={{ fontSize: '0.75rem', padding: '6px' }} title="Exporter la collection d'images JPEG HD zippées pour chaque époque active">
          <BookOpen size={13} /> Collection JPEG (ZIP)
        </button>
        <button className="btn btn-secondary" onClick={onJpegExport} style={{ fontSize: '0.75rem', padding: '6px' }} title="Capturer la vue actuelle de la carte en JPEG HD">
          <ImageIcon size={13} /> Image JPEG HD
        </button>
        <button className="btn btn-secondary" onClick={onHtmlSimpleExport} style={{ fontSize: '0.75rem', padding: '6px' }} title="Exporter l'application autonome Bento interactive">
          <Globe size={13} /> HTML Autonome
        </button>
        <button
          className="btn btn-secondary"
          onClick={onStoryboardExport}
          disabled={exportProgress !== null}
          style={{ fontSize: '0.75rem', padding: '6px' }}
          title="Exporter le pack de scènes narratives du Story Editor (visuels HD, story.json, script.md)"
        >
          <BookOpen size={13} /> Storyboard Pack
        </button>
        <button
          className="btn btn-secondary"
          onClick={onWebmExport}
          disabled={exportProgress !== null}
          style={{ fontSize: '0.75rem', padding: '6px' }}
          title="Exporter une vidéo WebM fluide du récit (VP9 30fps)"
        >
          <Video size={13} /> Vidéo WebM
        </button>

        {onStudioOpen && (
          <button
            className="btn btn-secondary"
            onClick={onStudioOpen}
            disabled={exportProgress !== null}
            style={{
              fontSize: '0.75rem',
              padding: '6px',
              gridColumn: 'span 2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: '#c084fc',
              borderColor: 'rgba(168, 85, 247, 0.4)',
              background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(56,189,248,0.08))'
            }}
            title="Ouvrir l'éditeur Studio CapCut (montage multi-pistes, durées personnalisées, audio)"
          >
            <Film size={13} /> Studio Vidéo & Audio (CapCut-like)
          </button>
        )}
      </div>

      {exportProgress !== null && (
        <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--accent-primary)', textAlign: 'center' }}>
          Génération en cours… {exportProgress}%
        </div>
      )}
    </div>
  );
};

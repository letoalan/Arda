// app/components/data/ExportMultimediaSection.tsx

import React from 'react';
import { FileText, Image as ImageIcon, Globe, BookOpen, Video } from 'lucide-react';

interface ExportMultimediaSectionProps {
  exportProgress: number | null;
  onPdfExport: () => void;
  onJpegExport: () => void;
  onHtmlSimpleExport: () => void;
  onStoryboardExport: () => void;
  onWebmExport: () => void;
}

export const ExportMultimediaSection: React.FC<ExportMultimediaSectionProps> = ({
  exportProgress,
  onPdfExport,
  onJpegExport,
  onHtmlSimpleExport,
  onStoryboardExport,
  onWebmExport,
}) => {
  return (
    <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
      <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <FileText size={14} /> Exportations Cartographiques & Récit
      </h4>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button className="btn btn-secondary" onClick={onPdfExport} style={{ fontSize: '0.75rem', padding: '6px' }}>
          <FileText size={13} /> Export PDF
        </button>
        <button className="btn btn-secondary" onClick={onJpegExport} style={{ fontSize: '0.75rem', padding: '6px' }}>
          <ImageIcon size={13} /> Image JPEG
        </button>
        <button className="btn btn-secondary" onClick={onHtmlSimpleExport} style={{ fontSize: '0.75rem', padding: '6px' }}>
          <Globe size={13} /> HTML Autonome
        </button>
        <button
          className="btn btn-secondary"
          onClick={onStoryboardExport}
          disabled={exportProgress !== null}
          style={{ fontSize: '0.75rem', padding: '6px' }}
        >
          <BookOpen size={13} /> Storyboard ZIP
        </button>
      </div>

      <div style={{ marginTop: '8px' }}>
        <button
          className="btn btn-secondary"
          onClick={onWebmExport}
          disabled={exportProgress !== null}
          style={{ width: '100%', fontSize: '0.75rem', padding: '6px' }}
        >
          <Video size={13} /> Export Vidéo WebM (VP9 30fps)
        </button>
      </div>

      {exportProgress !== null && (
        <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--accent-primary)', textAlign: 'center' }}>
          Génération en cours… {exportProgress}%
        </div>
      )}
    </div>
  );
};

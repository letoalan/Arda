import React, { useState } from 'react';
import { GeojsonCatalogEntry } from '../../../core/schema/geojson-catalog';
import { Download, FileCode, HardDrive, ShieldCheck, Calendar } from 'lucide-react';

interface CatalogEntryCardProps {
  entry: GeojsonCatalogEntry;
  onImport: (entry: GeojsonCatalogEntry, customStartYear?: number, customEndYear?: number) => void;
  isLoading?: boolean;
}

export const CatalogEntryCard: React.FC<CatalogEntryCardProps> = ({
  entry,
  onImport,
  isLoading
}) => {
  const defaultStart = entry.referenceYear ?? entry.temporalRange?.[0] ?? -3000;
  const defaultEnd = entry.temporalRange?.[1] ?? 2100;

  const [startYear, setStartYear] = useState<number>(defaultStart);
  const [endYear, setEndYear] = useState<number>(defaultEnd);

  const sizeMb = entry.sizeBytes ? (entry.sizeBytes / (1024 * 1024)).toFixed(2) : null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      padding: '10px',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      marginBottom: '8px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {entry.label}
        </span>
        <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', background: 'var(--bg-tertiary)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
          {entry.family}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '12px', fontSize: '0.7rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <ShieldCheck size={11} /> {entry.source}
        </span>
        {sizeMb && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <HardDrive size={11} /> {sizeMb} MB
          </span>
        )}
        {entry.referenceYear !== undefined && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <FileCode size={11} /> Ref. An {entry.referenceYear}
          </span>
        )}
      </div>

      {/* Reglage de temporalité lors de l'import */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', background: 'var(--bg-tertiary)', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
        <Calendar size={12} color="var(--accent-primary)" />
        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Temporalité :</span>
        <input 
          type="number"
          value={startYear}
          onChange={(e) => setStartYear(parseInt(e.target.value) || -3000)}
          title="Année de début"
          style={{ width: '60px', fontSize: '0.7rem', padding: '2px 4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '3px' }}
        />
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>à</span>
        <input 
          type="number"
          value={endYear}
          onChange={(e) => setEndYear(parseInt(e.target.value) || 2100)}
          title="Année de fin"
          style={{ width: '60px', fontSize: '0.7rem', padding: '2px 4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '3px' }}
        />
      </div>

      <button
        onClick={() => onImport(entry, startYear, endYear)}
        disabled={isLoading}
        className="btn btn-primary"
        style={{ marginTop: '4px', fontSize: '0.75rem', padding: '4px 8px', justifyContent: 'center', gap: '4px' }}
      >
        <Download size={13} /> {isLoading ? 'Importation...' : `Importer (${startYear} - ${endYear})`}
      </button>
    </div>
  );
};

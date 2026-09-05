// app/components/geojson/ImportPreviewModal.tsx

import React, { useState, useMemo, useEffect } from 'react';
import type { ImportCandidate } from '../../../services/import/candidateIndexer';
import type { Layer } from '../../../core/schema/types';
import { X, AlertTriangle, Database, Search, Layers, Check } from 'lucide-react';
import { ImportCandidateTable } from './ImportCandidateTable';

interface ImportPreviewModalProps {
  isOpen: boolean;
  sourceTitle: string;
  candidates: ImportCandidate[];
  layers: Layer[];
  defaultLayerId: string;
  onConfirm: (selectedCandidates: ImportCandidate[], targetLayerId: string) => void;
  onClose: () => void;
}

export const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({
  isOpen,
  sourceTitle,
  candidates,
  layers,
  defaultLayerId,
  onConfirm,
  onClose,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(candidates.map((c) => c.tempId)));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLayerId, setSelectedLayerId] = useState(defaultLayerId || (layers[0]?.id ?? 'layer-1'));

  useEffect(() => {
    setSelectedIds(new Set(candidates.map((c) => c.tempId)));
    setSearchQuery('');
  }, [candidates]);

  useEffect(() => {
    if (defaultLayerId) {
      setSelectedLayerId(defaultLayerId);
    } else if (layers.length > 0) {
      setSelectedLayerId(layers[0].id);
    }
  }, [defaultLayerId, layers]);

  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return candidates;
    const q = searchQuery.toLowerCase();
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.continent && c.continent.toLowerCase().includes(q)) ||
        c.geometryType.toLowerCase().includes(q)
    );
  }, [candidates, searchQuery]);

  const selectedCandidatesList = useMemo(
    () => candidates.filter((c) => selectedIds.has(c.tempId)),
    [candidates, selectedIds]
  );

  const totalSizeKB = useMemo(
    () => selectedCandidatesList.reduce((acc, c) => acc + c.approxSizeKB, 0),
    [selectedCandidatesList]
  );

  const isOverSizeLimit = totalSizeKB > 20000;

  const toggleSelectAll = () => {
    if (selectedIds.size === candidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidates.map((c) => c.tempId)));
    }
  };

  const toggleSelectCandidate = (tempId: string) => {
    const next = new Set(selectedIds);
    if (next.has(tempId)) {
      next.delete(tempId);
    } else {
      next.add(tempId);
    }
    setSelectedIds(next);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '750px',
          maxHeight: '85vh',
          backgroundColor: 'var(--bg-panel, #1e1e24)',
          border: '1px solid var(--border-color, #333)',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--text-color, #eee)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color, #333)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={20} color="var(--accent-primary, #3b82f6)" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Prévisualisation GeoJSON</h3>
              <span style={{ fontSize: '0.8rem', color: '#aaa' }}>{sourceTitle}</span>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn" style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Filtrer par nom, continent ou type géométrique..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px' }}
              />
            </div>
            <button className="btn btn-secondary" onClick={toggleSelectAll} style={{ fontSize: '0.8rem' }}>
              {selectedIds.size === candidates.length ? 'Tout décocher' : 'Tout cocher'}
            </button>
          </div>

          <ImportCandidateTable
            candidates={filteredCandidates}
            selectedIds={selectedIds}
            onToggleCandidate={toggleSelectCandidate}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '0.85rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} /> Couche cible :
            </label>
            <select
              className="select-field"
              value={selectedLayerId}
              onChange={(e) => setSelectedLayerId(e.target.value)}
              style={{ flex: 1 }}
            >
              {layers.map((l) => {
                const isAlpha = l.order === 0 || (l.meta as any)?.isBaseLayer || l.name.includes('(Alpha)');
                return (
                  <option key={l.id} value={l.id}>
                    {isAlpha ? '🛡️ [Alpha] ' : ''}{l.name} ({l.type})
                  </option>
                );
              })}
            </select>
          </div>

          {isOverSizeLimit && (
            <div style={{ padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} />
              <span>Attention : La sélection dépasse 20 MB ({Math.round(totalSizeKB / 1024)} MB). Cela risque de ralentir la carte.</span>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color, #333)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', color: '#aaa' }}>
            Sélection : <strong>{selectedIds.size}</strong> / {candidates.length} entité(s) ({Math.round(totalSizeKB)} KB)
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn" onClick={onClose}>Annuler</button>
            <button
              className="btn btn-primary"
              disabled={selectedIds.size === 0 || !selectedLayerId}
              onClick={() => onConfirm(selectedCandidatesList, selectedLayerId)}
            >
              <Check size={16} /> Importer la sélection ({selectedIds.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

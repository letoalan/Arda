// app/components/data/ExportPdfModal.tsx

import React, { useState, useMemo } from 'react';
import { X, FileText, Layers, Calendar, Download, CheckSquare, Square, CheckCircle2 } from 'lucide-react';
import { extractActiveEpochs, getHistoricalPeriodLabel } from '../../../services/export/pdf-timeline-utils';

export type PdfExportScopeMode = 'current' | 'all_active';

interface ExportPdfModalProps {
  isOpen: boolean;
  currentTime: number;
  startYear?: number;
  endYear?: number;
  entities: any[];
  relations: any[];
  isExporting: boolean;
  exportProgress: number | null;
  onConfirmSingle: (year: number, periodLabel?: string) => Promise<void>;
  onConfirmMulti: (selectedEpochs: { year: number; label: string }[]) => Promise<void>;
  onClose: () => void;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  currentTime,
  startYear = -3000,
  endYear = 2100,
  entities,
  relations,
  isExporting,
  exportProgress,
  onConfirmSingle,
  onConfirmMulti,
  onClose,
}) => {
  const [scopeMode, setScopeMode] = useState<PdfExportScopeMode>('current');

  // Analyse et extraction des époques actives
  const activeEpochs = useMemo(() => {
    return extractActiveEpochs(entities, relations, startYear, endYear);
  }, [entities, relations, startYear, endYear]);

  // Époques qui ont des apports ou fonds réellement importés sur la carte
  const importedEpochs = useMemo(() => {
    return activeEpochs.filter(e => e.isImportedOnMap || e.entityCount > 0);
  }, [activeEpochs]);

  // Ensemble des années sélectionnées pour l'export complet
  const [selectedYears, setSelectedYears] = useState<Set<number>>(() => {
    const initialList = importedEpochs.length > 0 ? importedEpochs : activeEpochs;
    return new Set(initialList.map(e => e.year));
  });

  // À chaque réouverture de la modale, réinitialiser sur les époques importées
  const prevIsOpenRef = React.useRef(isOpen);
  React.useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const initialList = importedEpochs.length > 0 ? importedEpochs : activeEpochs;
      setSelectedYears(new Set(initialList.map(e => e.year)));
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, importedEpochs, activeEpochs]);

  const toggleYear = (year: number) => {
    setSelectedYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedYears(new Set(activeEpochs.map(e => e.year)));
  };

  const selectImportedOnly = () => {
    setSelectedYears(new Set(importedEpochs.map(e => e.year)));
  };

  const deselectAll = () => {
    setSelectedYears(new Set());
  };

  const currentPeriodLabel = useMemo(() => {
    return getHistoricalPeriodLabel(currentTime) || 'Époque courante';
  }, [currentTime]);

  const currentYearFormatted = currentTime < 0 ? `${Math.abs(currentTime)} av. J.-C.` : `An ${currentTime}`;

  const currentActiveEntitiesCount = useMemo(() => {
    const entCount = entities.filter(e => {
      if (e.properties?.isRelation) return false;
      if (!e.temporalRange) return true;
      const from = (e.temporalRange as any).validFrom !== undefined 
        ? Number((e.temporalRange as any).validFrom)
        : Array.isArray(e.temporalRange) 
        ? Number(e.temporalRange[0]) 
        : -Infinity;
      const to = (e.temporalRange as any).validTo !== undefined 
        ? Number((e.temporalRange as any).validTo)
        : Array.isArray(e.temporalRange) 
        ? Number(e.temporalRange[1]) 
        : Infinity;
      return from <= currentTime && to >= currentTime;
    }).length;
    const relCount = relations.filter(r => {
      if (!r.temporalRange) return true;
      const from = (r.temporalRange as any).validFrom !== undefined 
        ? Number((r.temporalRange as any).validFrom)
        : Array.isArray(r.temporalRange) 
        ? Number(r.temporalRange[0]) 
        : -Infinity;
      const to = (r.temporalRange as any).validTo !== undefined 
        ? Number((r.temporalRange as any).validTo)
        : Array.isArray(r.temporalRange) 
        ? Number(r.temporalRange[1]) 
        : Infinity;
      return from <= currentTime && to >= currentTime;
    }).length;
    return entCount + relCount;
  }, [entities, relations, currentTime]);

  const selectedEpochsList = useMemo(() => {
    return activeEpochs.filter(e => selectedYears.has(e.year));
  }, [activeEpochs, selectedYears]);

  const handleStartExport = async () => {
    if (scopeMode === 'current') {
      await onConfirmSingle(currentTime, currentPeriodLabel);
    } else {
      if (selectedEpochsList.length === 0) return;
      await onConfirmMulti(selectedEpochsList.map(e => ({ 
        year: e.targetYear, // Snapshot au milieu de période (ex: -450 pour [-500, -400])
        label: e.label,
        referenceYear: e.year,
        validFrom: e.validFrom,
        validTo: e.validTo
      })));
    }
  };


  if (!isOpen) return null;



  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
    }}>
      <div style={{
        background: 'var(--bg-primary, #1e293b)',
        borderRadius: '12px',
        border: '1px solid var(--border-color, #334155)',
        width: '100%',
        maxWidth: '580px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color, #334155)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-secondary, #0f172a)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(59, 130, 246, 0.15)',
              padding: '6px',
              borderRadius: '8px',
              color: 'var(--accent-primary, #3b82f6)',
              display: 'flex'
            }}>
              <FileText size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
                Export Cartographique PDF
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                Format A4 Paysage normalisé avec échelle et légende
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Sélection du mode de capture */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', marginBottom: '8px', display: 'block' }}>
              Périmètre de l'exportation :
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {/* Option 1 : Date courante */}
              <div
                onClick={() => !isExporting && setScopeMode('current')}
                style={{
                  border: `2px solid ${scopeMode === 'current' ? 'var(--accent-primary, #3b82f6)' : 'var(--border-color, #334155)'}`,
                  background: scopeMode === 'current' ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-secondary, #0f172a)',
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="var(--accent-primary, #3b82f6)" /> Période Courante
                  </span>
                  <input
                    type="radio"
                    name="scopeMode"
                    checked={scopeMode === 'current'}
                    onChange={() => setScopeMode('current')}
                    disabled={isExporting}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.3 }}>
                  Capture la carte exacte sous le curseur temporel (1 page A4).
                </p>
                <div style={{ marginTop: '4px', fontSize: '0.72rem', color: 'var(--accent-primary, #3b82f6)', fontWeight: 500 }}>
                  {currentYearFormatted} • {currentActiveEntitiesCount} apport(s)
                </div>
              </div>

              {/* Option 2 : Toutes les époques avec apports */}
              <div
                onClick={() => !isExporting && setScopeMode('all_active')}
                style={{
                  border: `2px solid ${scopeMode === 'all_active' ? 'var(--accent-primary, #3b82f6)' : 'var(--border-color, #334155)'}`,
                  background: scopeMode === 'all_active' ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-secondary, #0f172a)',
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={14} color="var(--accent-primary, #3b82f6)" /> Atlas Multi-Époques
                  </span>
                  <input
                    type="radio"
                    name="scopeMode"
                    checked={scopeMode === 'all_active'}
                    onChange={() => setScopeMode('all_active')}
                    disabled={isExporting}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.3 }}>
                  Génère un livret complet des époques sélectionnées (1 page par époque cochée).
                </p>
                <div style={{ marginTop: '4px', fontSize: '0.72rem', color: 'var(--accent-primary, #3b82f6)', fontWeight: 500 }}>
                  {selectedEpochsList.length} / {activeEpochs.length} époque(s) cochée(s)
                </div>
              </div>
            </div>
          </div>

          {/* Détails du mode actif */}
          {scopeMode === 'current' ? (
            <div style={{
              background: 'var(--bg-secondary, #0f172a)',
              borderRadius: '8px',
              padding: '12px 14px',
              border: '1px solid var(--border-color, #334155)'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '4px' }}>
                Contexte historique capturé :
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
                {currentPeriodLabel} ({currentYearFormatted})
              </div>
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-secondary, #0f172a)',
              borderRadius: '8px',
              padding: '12px 14px',
              border: '1px solid var(--border-color, #334155)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)' }}>
                  Sélection des époques ({selectedEpochsList.length} / {activeEpochs.length}) :
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {importedEpochs.length > 0 && (
                    <button
                      type="button"
                      onClick={selectImportedOnly}
                      disabled={isExporting}
                      className="btn"
                      style={{ fontSize: '0.7rem', padding: '3px 8px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-primary, #3b82f6)', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                      title="Ne sélectionner que les époques avec des fonds ou entités importés"
                    >
                      <CheckCircle2 size={11} /> Importées ({importedEpochs.length})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={selectAll}
                    disabled={isExporting}
                    className="btn"
                    style={{ fontSize: '0.7rem', padding: '3px 7px', background: 'var(--bg-tertiary, #1e293b)' }}
                  >
                    Tout
                  </button>
                  <button
                    type="button"
                    onClick={deselectAll}
                    disabled={isExporting}
                    className="btn"
                    style={{ fontSize: '0.7rem', padding: '3px 7px', background: 'var(--bg-tertiary, #1e293b)' }}
                  >
                    Aucun
                  </button>
                </div>
              </div>

              {/* Liste scrollable des époques */}
              <div style={{
                maxHeight: '220px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                paddingRight: '6px'
              }}>
                {activeEpochs.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', textAlign: 'center', padding: '12px' }}>
                    Aucune époque avec apports trouvée dans la plage temporelle du projet.
                  </div>
                ) : (
                  activeEpochs.map(epoch => {
                    const isSelected = selectedYears.has(epoch.year);
                    const formatYear = (y: number) => y < 0 ? `${Math.abs(y)} av. J.-C.` : `An ${y}`;
                    const rangeLabel = `${formatYear(epoch.validFrom)} → ${formatYear(epoch.validTo)}`;
                    const midLabel = `Photo : ${formatYear(epoch.targetYear)}`;

                    return (
                      <div
                        key={epoch.year}
                        onClick={() => !isExporting && toggleYear(epoch.year)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-tertiary, #1e293b)',
                          border: `1px solid ${isSelected ? 'rgba(59, 130, 246, 0.45)' : 'var(--border-color, #334155)'}`,
                          cursor: isExporting ? 'not-allowed' : 'pointer',
                          fontSize: '0.76rem',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                          <span style={{ display: 'flex', alignItems: 'center', color: isSelected ? 'var(--accent-primary, #3b82f6)' : 'var(--text-muted, #94a3b8)' }}>
                            {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 600, color: isSelected ? 'var(--accent-primary, #3b82f6)' : 'var(--text-primary, #f8fafc)', whiteSpace: 'nowrap' }}>
                                [{rangeLabel}]
                              </span>
                              <span style={{ color: 'var(--text-secondary, #cbd5e1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {epoch.label}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted, #94a3b8)' }}>
                              {midLabel}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          {epoch.isImportedOnMap && (
                            <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                              Importé
                            </span>
                          )}
                          <span style={{ fontSize: '0.7rem', color: epoch.entityCount > 0 ? 'var(--text-primary, #f8fafc)' : 'var(--text-muted, #94a3b8)' }}>
                            {epoch.entityCount} apport(s)
                          </span>
                        </div>
                      </div>
                    );
                  })

                )}
              </div>
            </div>
          )}

          {/* Feedback de progression */}
          {isExporting && (
            <div style={{
              padding: '10px 12px',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--accent-primary, #3b82f6)', fontWeight: 600 }}>
                <span>Génération du PDF en cours…</span>
                <span>{exportProgress !== null ? `${exportProgress}%` : ''}</span>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  width: `${exportProgress || 50}%`,
                  height: '100%',
                  background: 'var(--accent-primary, #3b82f6)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-color, #334155)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          background: 'var(--bg-secondary, #0f172a)',
        }}>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            Annuler
          </button>
          <button
            onClick={handleStartExport}
            disabled={isExporting || (scopeMode === 'all_active' && selectedEpochsList.length === 0)}
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} />
            {isExporting 
              ? 'Export en cours...' 
              : scopeMode === 'current' 
                ? 'Exporter 1 page A4' 
                : `Générer l'Atlas (${selectedEpochsList.length} page${selectedEpochsList.length > 1 ? 's' : ''})`}
          </button>
        </div>
      </div>
    </div>
  );
};




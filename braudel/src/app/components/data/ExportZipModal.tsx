// app/components/data/ExportZipModal.tsx

import React, { useState, useMemo } from 'react';
import { X, Archive, Layers, Download, CheckSquare, Square, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { extractActiveEpochs, getHistoricalPeriodLabel } from '../../../services/export/pdf-timeline-utils';

export type ZipExportScopeMode = 'current' | 'all_active';

interface ExportZipModalProps {
  isOpen: boolean;
  currentTime: number;
  startYear?: number;
  endYear?: number;
  entities: any[];
  relations: any[];
  isExporting: boolean;
  exportProgress: number | null;
  onConfirmSingleZip: (year: number, periodLabel?: string) => Promise<void>;
  onConfirmMultiZip: (selectedEpochs: { year: number; label: string; referenceYear?: number; validFrom?: number; validTo?: number; targetYear?: number }[]) => Promise<void>;
  onClose: () => void;
}

export const ExportZipModal: React.FC<ExportZipModalProps> = ({
  isOpen,
  currentTime,
  startYear = -3000,
  endYear = 2100,
  entities,
  relations,
  isExporting,
  exportProgress,
  onConfirmSingleZip,
  onConfirmMultiZip,
  onClose,
}) => {
  const [scopeMode, setScopeMode] = useState<ZipExportScopeMode>('all_active');

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

  const currentPeriodLabel = useMemo(() => {
    return getHistoricalPeriodLabel(currentTime);
  }, [currentTime]);

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

  const selectNone = () => {
    setSelectedYears(new Set());
  };

  const selectImportedOnly = () => {
    setSelectedYears(new Set(importedEpochs.map(e => e.year)));
  };

  const selectedEpochsList = useMemo(() => {
    return activeEpochs.filter(e => selectedYears.has(e.year));
  }, [activeEpochs, selectedYears]);

  const handleStartExport = async () => {
    if (scopeMode === 'current') {
      await onConfirmSingleZip(currentTime, currentPeriodLabel);
    } else {
      if (selectedEpochsList.length === 0) return;
      await onConfirmMultiZip(selectedEpochsList.map(e => ({
        year: e.targetYear,
        label: e.label,
        referenceYear: e.year,
        validFrom: e.validFrom,
        validTo: e.validTo,
        targetYear: e.targetYear
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
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-secondary, #0f172a)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b'
            }}>
              <Archive size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
                Collection d'Images JPEG (Archive ZIP)
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)' }}>
                Générez une collection de fichiers JPEG HD par époque avec orientation préservée
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary, #94a3b8)',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          flex: 1,
        }}>
          {/* Scope Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)', marginBottom: '8px' }}>
              Périmètre de l'archive ZIP
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {/* Option 1: Collection multi-époques */}
              <div
                onClick={() => !isExporting && setScopeMode('all_active')}
                style={{
                  border: `2px solid ${scopeMode === 'all_active' ? '#f59e0b' : 'var(--border-color, #334155)'}`,
                  background: scopeMode === 'all_active' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Layers size={16} color={scopeMode === 'all_active' ? '#f59e0b' : 'var(--text-secondary, #94a3b8)'} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: scopeMode === 'all_active' ? 'var(--text-primary, #f8fafc)' : 'var(--text-secondary, #94a3b8)' }}>
                    Collection Multi-Époques
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.3 }}>
                  1 fichier JPEG HD par époque ciblée + descriptif README.md & manifest.json
                </div>
              </div>

              {/* Option 2: Image Unique */}
              <div
                onClick={() => !isExporting && setScopeMode('current')}
                style={{
                  border: `2px solid ${scopeMode === 'current' ? '#f59e0b' : 'var(--border-color, #334155)'}`,
                  background: scopeMode === 'current' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ImageIcon size={16} color={scopeMode === 'current' ? '#f59e0b' : 'var(--text-secondary, #94a3b8)'} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: scopeMode === 'current' ? 'var(--text-primary, #f8fafc)' : 'var(--text-secondary, #94a3b8)' }}>
                    Vue Actuelle Unique
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.3 }}>
                  Une seule image JPEG ({currentTime < 0 ? `${Math.abs(currentTime)} av. J.-C.` : `An ${currentTime}`})
                </div>
              </div>
            </div>
          </div>

          {/* Epoch Selector (visible if all_active) */}
          {scopeMode === 'all_active' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              border: '1px solid var(--border-color, #334155)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
                  Époques ciblées ({selectedEpochsList.length} / {activeEpochs.length})
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {importedEpochs.length > 0 && (
                    <button
                      onClick={selectImportedOnly}
                      disabled={isExporting}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.7rem', padding: '2px 6px', height: '22px' }}
                      title="Sélectionner uniquement les époques avec des données importées"
                    >
                      Importées ({importedEpochs.length})
                    </button>
                  )}
                  <button
                    onClick={selectAll}
                    disabled={isExporting}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.7rem', padding: '2px 6px', height: '22px' }}
                  >
                    Tout
                  </button>
                  <button
                    onClick={selectNone}
                    disabled={isExporting}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.7rem', padding: '2px 6px', height: '22px' }}
                  >
                    Aucun
                  </button>
                </div>
              </div>

              {/* Epoch Checklist */}
              <div style={{
                maxHeight: '180px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                paddingRight: '4px',
              }}>
                {activeEpochs.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', fontStyle: 'italic', textAlign: 'center', padding: '10px' }}>
                    Aucune époque temporelle détectée dans ce projet.
                  </div>
                ) : (
                  activeEpochs.map(epoch => {
                    const isSelected = selectedYears.has(epoch.year);
                    return (
                      <div
                        key={epoch.year}
                        onClick={() => !isExporting && toggleYear(epoch.year)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: isSelected ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                          border: `1px solid ${isSelected ? 'rgba(245, 158, 11, 0.3)' : 'transparent'}`,
                          cursor: isExporting ? 'not-allowed' : 'pointer',
                          fontSize: '0.75rem',
                          userSelect: 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isSelected ? (
                            <CheckSquare size={14} color="#f59e0b" />
                          ) : (
                            <Square size={14} color="var(--text-secondary, #94a3b8)" />
                          )}
                          <span style={{ fontWeight: isSelected ? 600 : 400, color: 'var(--text-primary, #f8fafc)' }}>
                            {epoch.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {epoch.isImportedOnMap && (
                            <span style={{
                              fontSize: '0.65rem',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: 'rgba(16, 185, 129, 0.2)',
                              color: '#10b981',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              <CheckCircle2 size={10} /> Importé
                            </span>
                          )}
                          <span style={{ color: 'var(--text-secondary, #94a3b8)', fontFamily: 'monospace', fontSize: '0.7rem' }}>
                            {epoch.year < 0 ? `${Math.abs(epoch.year)} av. J.-C.` : `An ${epoch.year}`}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Format Details Info Banner */}
          <div style={{
            padding: '10px 12px',
            background: 'rgba(245, 158, 11, 0.05)',
            borderRadius: '6px',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary, #94a3b8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: 600 }}>
              <Archive size={14} /> Caractéristiques de l'archive ZIP
            </div>
            <div>• Clichés JPEG haute définition à la racine du fichier compressé.</div>
            <div>• <strong>Orientation cartographique préservée</strong> (y compris <em>bearing 180° Sud en haut</em> pour Al-Idrisi).</div>
            <div>• Fichiers récapitulatifs <code>README.md</code> et <code>manifest.json</code> inclus dans l'archive.</div>
          </div>

          {/* Progress Bar during Export */}
          {isExporting && (
            <div style={{
              padding: '10px 12px',
              background: 'rgba(245, 158, 11, 0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
                <span>Capture et compression des JPEG en cours…</span>
                <span>{exportProgress !== null ? `${exportProgress}%` : ''}</span>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  width: `${exportProgress || 50}%`,
                  height: '100%',
                  background: '#f59e0b',
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
            style={{
              fontSize: '0.8rem',
              padding: '6px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#f59e0b',
              borderColor: '#d97706',
              color: '#000000',
              fontWeight: 600,
            }}
          >
            <Download size={14} />
            {isExporting 
              ? 'Export en cours...' 
              : scopeMode === 'current' 
                ? 'Télécharger 1 image JPEG' 
                : `Télécharger l'Archive ZIP (${selectedEpochsList.length} image${selectedEpochsList.length > 1 ? 's' : ''})`}
          </button>
        </div>
      </div>
    </div>
  );
};

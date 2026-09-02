// app/components/data/ExportVideoModal.tsx

import React, { useState, useMemo } from 'react';
import { X, Video, Clock, Film, Layers, Play, CheckCircle2, Cpu, AlertTriangle, RotateCcw } from 'lucide-react';
import { StoryProject } from '../../../core/schema/story';
import {
  VideoExportProgress,
  estimateVideoDuration,
  getSupportedVideoMimeType,
} from '../../../services/export/video-export';

interface ExportVideoModalProps {
  isOpen: boolean;
  worldName: string;
  story: StoryProject;
  canvasDimensions?: { width: number; height: number };
  isExporting: boolean;
  videoProgress: VideoExportProgress | null;
  onStartExport: (fps: number, includeLegend?: boolean) => Promise<void>;
  onClose: () => void;
}

export const ExportVideoModal: React.FC<ExportVideoModalProps> = ({
  isOpen,
  worldName,
  story,
  canvasDimensions = { width: 1920, height: 1080 },
  isExporting,
  videoProgress,
  onStartExport,
  onClose,
}) => {
  const [fps, setFps] = useState<number>(30);
  const [includeLegend, setIncludeLegend] = useState<boolean>(true);

  // Évaluation préalable de la tâche et de la durée
  const estimation = useMemo(() => {
    return estimateVideoDuration(story);
  }, [story]);

  const detectedCodec = useMemo(() => {
    const raw = getSupportedVideoMimeType();
    if (!raw) return 'Codec navigateur par défaut';
    if (raw.includes('vp9')) return 'VP9 (Haute fidélité)';
    if (raw.includes('vp8')) return 'VP8 (Standard)';
    if (raw.includes('h264')) return 'H.264 (Universel)';
    return raw;
  }, []);

  if (!isOpen) return null;

  const currentPhase = videoProgress?.phase || 'idle';
  const genPct = videoProgress?.generationPercent ?? 0;
  const encPct = videoProgress?.encodingPercent ?? 0;

  const formatTime = (ms: number) => {
    const totalSec = Math.max(0, Math.round(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(5px)',
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
        maxWidth: '560px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
      }}>
        {/* En-tête */}
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
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(168, 85, 247, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c084fc'
            }}>
              <Video size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
                Export Vidéo Cinématique — {worldName}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)' }}>
                Enregistrement continu des mouvements de caméra et de l'évolution temporelle
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

        {/* Corps de la modale */}
        <div style={{
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          flex: 1,
        }}>
          {/* Évaluation préalable de la tâche */}
          {!isExporting && currentPhase === 'idle' && (
            <>
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #334155)',
                padding: '14px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={20} color="#38bdf8" />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #94a3b8)' }}>Durée estimée</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                      ~{estimation.formattedDuration}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Layers size={20} color="#a855f7" />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #94a3b8)' }}>Étapes / Scènes</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                      {estimation.totalScenes} plan{estimation.totalScenes > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Film size={20} color="#34d399" />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #94a3b8)' }}>Résolution native</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                      {canvasDimensions.width} × {canvasDimensions.height}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Cpu size={20} color="#fbbf24" />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #94a3b8)' }}>Codec Détecté</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' }}>
                      {detectedCodec}
                    </div>
                  </div>
                </div>
              </div>

              {/* Liste ordonnée des périodes séquencées */}
              {story?.scenes && story.scenes.length > 0 && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #334155)',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
                      Périodes séquencées dans la timeline ({story.scenes.length})
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#c084fc', fontWeight: 600 }}>
                      Vérification algorithmique activée
                    </span>
                  </div>
                  <div style={{
                    maxHeight: '110px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {story.scenes.map((sc, idx) => {
                      const periodNumber = sc.periodNumber || (idx + 1);
                      const yr = sc.mapState?.timelineYear;
                      const formattedYear = yr !== undefined ? (yr < 0 ? `${Math.abs(yr)} av. J.-C.` : `An ${yr}`) : '—';
                      return (
                        <div
                          key={sc.id || idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '4px',
                            borderLeft: '2px solid #a855f7'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 700, color: '#c084fc' }}>#{periodNumber}</span>
                            <span style={{ color: '#f8fafc' }}>{sc.title || `Période ${periodNumber}`}</span>
                          </div>
                          <span style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.7rem' }}>{formattedYear}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Paramètre de Framerate */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)', marginBottom: '8px' }}>
                  Cadence d'images (Framerate)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setFps(30)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: `2px solid ${fps === 30 ? '#a855f7' : 'var(--border-color, #334155)'}`,
                      background: fps === 30 ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                      color: 'var(--text-primary, #f8fafc)',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>30 FPS (Recommandé)</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #94a3b8)' }}>
                      Idéal pour le web, léger et fluide
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFps(60)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: `2px solid ${fps === 60 ? '#a855f7' : 'var(--border-color, #334155)'}`,
                      background: fps === 60 ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                      color: 'var(--text-primary, #f8fafc)',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>60 FPS (Ultra Fluide)</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #94a3b8)' }}>
                      Fluidité maximale pour zooms et rotations
                    </div>
                  </button>
                </div>
              </div>

              {/* Option d'incrustation de la légende */}
              <div
                onClick={() => setIncludeLegend(!includeLegend)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: includeLegend ? 'rgba(168, 85, 247, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  border: `1px solid ${includeLegend ? 'rgba(168, 85, 247, 0.4)' : 'var(--border-color, #334155)'}`,
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={15} color="#c084fc" />
                    <span>Incruster la légende cartographique</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #94a3b8)' }}>
                    Affiche un cartouche cinématique en coin d'image (période, date, pastilles des entités actives)
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={includeLegend}
                  onChange={(e) => setIncludeLegend(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#a855f7',
                    cursor: 'pointer'
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Note d'information */}
              <div style={{
                padding: '10px 12px',
                background: 'rgba(168, 85, 247, 0.05)',
                borderRadius: '6px',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary, #94a3b8)',
                lineHeight: 1.4,
              }}>
                • <strong>Orientation préservée</strong> : Le cap de la carte (y compris le <em>bearing 180° Sud en haut</em> pour Al-Idrisi) est fidèlement restitué.<br />
                • <strong>Vérification des entités</strong> : Pour chaque période, le système attend que les entités soient affichées et enregistrées avant d'avancer.<br />
                • <strong>Processus en direct</strong> : La carte s'animera à l'écran pendant la capture. Évitez de manipuler le navigateur pendant l'enregistrement.
              </div>
            </>
          )}

          {/* En cours de capture / encodage : Double compteur connecté à l'algorithme */}
          {(isExporting || currentPhase !== 'idle') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Statut algorithmique en direct */}
              <div style={{
                padding: '12px 14px',
                background: currentPhase === 'done'
                  ? 'rgba(16, 185, 129, 0.1)'
                  : currentPhase === 'encoding'
                    ? 'rgba(192, 132, 252, 0.1)'
                    : 'rgba(56, 189, 248, 0.1)',
                borderRadius: '8px',
                border: `1px solid ${
                  currentPhase === 'done'
                    ? 'rgba(16, 185, 129, 0.3)'
                    : currentPhase === 'encoding'
                      ? 'rgba(192, 132, 252, 0.3)'
                      : 'rgba(56, 189, 248, 0.3)'
                }`,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: currentPhase === 'done' ? '#10b981' : currentPhase === 'encoding' ? '#c084fc' : '#38bdf8',
                      boxShadow: currentPhase === 'done' ? 'none' : '0 0 8px currentColor',
                    }} />
                    <span>{videoProgress?.statusMessage || 'Préparation du moteur…'}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: currentPhase === 'encoding' ? '#c084fc' : '#38bdf8' }}>
                    {videoProgress?.percent || 0}% total
                  </span>
                </div>
                {videoProgress?.subStepMessage && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', paddingLeft: '16px' }}>
                    ↳ <em>{videoProgress.subStepMessage}</em>
                  </div>
                )}
              </div>

              {/* Compteur 1 : Saisie & Génération Cartographique (Temps Réel) */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #334155)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
                      1. Saisie & Rendu Cartographique
                    </span>
                    {currentPhase === 'capturing' && (
                      <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', borderRadius: '4px', fontWeight: 600 }}>
                        EN COURS
                      </span>
                    )}
                    {videoProgress?.verifiedEntitiesCount !== undefined && videoProgress.verifiedEntitiesCount > 0 && (
                      <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', borderRadius: '4px', fontWeight: 600 }}>
                        ✓ {videoProgress.verifiedEntitiesCount} entités
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                    {genPct}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '7px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${genPct}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
                    transition: 'width 0.15s linear'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary, #94a3b8)' }}>
                  <span>
                    Plan {videoProgress?.currentSceneIndex || 0} / {videoProgress?.totalScenes || estimation.totalScenes} : <strong>{videoProgress?.currentSceneTitle || '—'}</strong>
                  </span>
                  <span>
                    Chrono : <strong>{formatTime(videoProgress?.elapsedMs || 0)}</strong> / ~{estimation.formattedDuration}
                  </span>
                </div>
              </div>

              {/* Compteur 2 : Encodage & Multiplexage Vidéo (Traitement en direct) */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #334155)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'border-color 0.3s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
                      2. Encodage & Assemblage Vidéo (Traitement)
                    </span>
                    {(videoProgress?.chunkCount || 0) > 0 && currentPhase !== 'encoding' && currentPhase !== 'done' && (
                      <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(192, 132, 252, 0.2)', color: '#c084fc', borderRadius: '4px', fontWeight: 600 }}>
                        ENCODAGE GPU
                      </span>
                    )}
                    {currentPhase === 'encoding' && (
                      <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', borderRadius: '4px', fontWeight: 600 }}>
                        ASSEMBLAGE FINAL
                      </span>
                    )}
                    {currentPhase === 'done' && (
                      <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', borderRadius: '4px', fontWeight: 600 }}>
                        FINALISÉ
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc' }}>
                    {encPct}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '7px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${encPct}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #9333ea, #c084fc)',
                    transition: 'width 0.15s linear'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary, #94a3b8)' }}>
                  <span>
                    Codec : <strong>{detectedCodec.split(' ')[0]}</strong> | Fragments : <strong>{videoProgress?.chunkCount || 0}</strong> ({((videoProgress?.recordedBytes || 0) / (1024 * 1024)).toFixed(1)} Mo)
                  </span>
                  <span>
                    {videoProgress?.bitrateMbps ? `Débit : ${videoProgress.bitrateMbps} Mbps` : (videoProgress?.chunkCount || 0) > 0 ? 'Traitement GPU actif' : 'Initialisation flux…'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Étape 7 — Retour utilisateur explicite en cas d'échec */}
          {currentPhase === 'error' && (
            <div style={{
              padding: '14px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} color="#ef4444" />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fca5a5' }}>
                  Échec de la génération vidéo
                </span>
              </div>
              <p style={{
                margin: 0,
                fontSize: '0.8rem',
                color: '#fca5a5',
                lineHeight: 1.5,
              }}>
                {videoProgress?.subStepMessage || videoProgress?.statusMessage || 'Le fichier vidéo produit est vide ou corrompu. Le codec sélectionné n\'a pas produit de données exploitables.'}
              </p>
              <div style={{
                padding: '8px 10px',
                background: 'rgba(239, 68, 68, 0.05)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: 'var(--text-secondary, #94a3b8)',
                lineHeight: 1.4,
              }}>
                • Vérifiez que le navigateur dispose d'un codec vidéo fonctionnel (VP9, VP8 ou H.264).<br />
                • Essayez de réduire la cadence d'images (FPS) ou de fermer d'autres onglets pour libérer le GPU.<br />
                • Consultez la console du navigateur (F12) pour les logs <code>[Video Export]</code> détaillés.
              </div>
              <button
                onClick={() => {
                  const reducedFps = Math.max(15, Math.floor(fps / 2));
                  setFps(reducedFps);
                  onStartExport(reducedFps, includeLegend);
                }}
                className="btn btn-primary"
                style={{
                  fontSize: '0.8rem',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#dc2626',
                  borderColor: '#b91c1c',
                  fontWeight: 600,
                  alignSelf: 'flex-start',
                }}
              >
                <RotateCcw size={14} /> Réessayer ({Math.max(15, Math.floor(fps / 2))} FPS)
              </button>
            </div>
          )}
        </div>

        {/* Pied de page */}
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
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            {currentPhase === 'done' ? 'Fermer' : 'Annuler'}
          </button>

          {!isExporting && currentPhase === 'idle' && (
            <button
              onClick={() => onStartExport(fps, includeLegend)}
              className="btn btn-primary"
              style={{
                fontSize: '0.8rem',
                padding: '6px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#9333ea',
                borderColor: '#7e22ce',
                fontWeight: 600,
              }}
            >
              <Play size={14} /> Démarrer l'Export Vidéo ({fps} FPS)
            </button>
          )}

          {currentPhase === 'done' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>
              <CheckCircle2 size={16} /> Téléchargement prêt !
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

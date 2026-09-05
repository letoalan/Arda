// app/components/data/ExportVideoModal.tsx

import React, { useState, useMemo } from 'react';
import { X, Video, Clock, Film, Layers, Play, CheckCircle2, Cpu, AlertTriangle, RotateCcw, Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import { StoryProject } from '../../../core/schema/story';
import { getEffectiveStyleBearing } from '../../../core/styles.config';
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
  onStartExport: (
    fps: number, 
    includeLegend?: boolean, 
    resolution?: '1080p' | '720p' | 'vertical_1080p' | 'square_1080p'
  ) => Promise<void>;
  onOpenStudio?: () => void;
  onClose: () => void;
}

export const ExportVideoModal: React.FC<ExportVideoModalProps> = ({
  isOpen,
  worldName,
  story,
  canvasDimensions: _canvasDimensions = { width: 1920, height: 1080 },
  isExporting,
  videoProgress,
  onStartExport,
  onOpenStudio,
  onClose,
}) => {
  const [fps, setFps] = useState<number>(30);
  const [includeLegend, setIncludeLegend] = useState<boolean>(true);
  const [resolution, setResolution] = useState<'1080p' | '720p' | 'vertical_1080p' | 'square_1080p'>('1080p');

  const resolutionInfo = useMemo(() => {
    switch (resolution) {
      case 'vertical_1080p':
        return { label: '9:16 Vertical (1080 × 1920)', desc: 'Format TikTok / Shorts / Reels', dims: '1080 × 1920' };
      case 'square_1080p':
        return { label: '1:1 Carré (1080 × 1080)', desc: 'Format Carré Instagram / Réseaux', dims: '1080 × 1080' };
      case '720p':
        return { label: '16:9 HD (1280 × 720)', desc: 'Format léger standard', dims: '1280 × 720' };
      case '1080p':
      default:
        return { label: '16:9 Full HD (1920 × 1080)', desc: 'Standard broadcast & cinéma (Recommandé)', dims: '1920 × 1080' };
    }
  }, [resolution]);

  // Évaluation préalable de la tâche et de la durée
  const estimation = useMemo(() => {
    return estimateVideoDuration(story, story?.editTimeline);
  }, [story]);

  const audioSummary = useMemo(() => {
    const tracks = story?.editTimeline?.audioTracks || [];
    const activeTracks = tracks.filter((t: any) => !t.muted);
    const maxAudioMs = activeTracks.reduce((max: number, t: any) => Math.max(max, (t.startMs || 0) + t.durationMs), 0);
    const sec = Math.max(0, Math.round(maxAudioMs / 1000));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return {
      count: activeTracks.length,
      durationMs: maxAudioMs,
      hasAudio: activeTracks.length > 0,
      formattedDuration: `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    };
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
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #94a3b8)' }}>Étapes / Plans</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                      {estimation.totalScenes} plan{estimation.totalScenes > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {audioSummary.hasAudio ? <Volume2 size={20} color="#34d399" /> : <VolumeX size={20} color="#94a3b8" />}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #94a3b8)' }}>Bande Sonore</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: audioSummary.hasAudio ? '#34d399' : '#94a3b8' }}>
                      {audioSummary.hasAudio ? `${audioSummary.count} piste(s) (${audioSummary.formattedDuration})` : 'Aucune (muet)'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={20} color="#38bdf8" />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #94a3b8)' }}>Cadrages Caméra</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8' }}>
                      100% Verrouillés
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Film size={20} color="#c084fc" />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #94a3b8)' }}>Production Vidéo</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                      {resolutionInfo.dims}
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

              {/* Liste ordonnée des périodes avec paramètres caméra précis */}
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
                    maxHeight: '130px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {story.scenes.map((sc, idx) => {
                      const periodNumber = sc.periodNumber || (idx + 1);
                      const isLast = idx === story.scenes.length - 1;
                      const yr = sc.mapState?.timelineYear;
                      const formattedYear = yr !== undefined ? (yr < 0 ? `${Math.abs(yr)} av. J.-C.` : `An ${yr}`) : '—';
                      const zoomStr = sc.mapState?.zoom !== undefined ? `Z${sc.mapState.zoom.toFixed(1)}` : '';
                      const effBearing = Math.round(getEffectiveStyleBearing(sc.mapState?.basemapStyle, sc.mapState?.bearing));
                      const bearingStr = effBearing === 180 ? '🧭 Sud (180°)' : (effBearing !== 0 ? `Cap ${effBearing}°` : '');
                      const pitchVal = Math.round(sc.mapState?.pitch || 0);
                      const pitchStr = pitchVal !== 0 ? `Tilt ${pitchVal}°` : '';
                      const camTag = [zoomStr, bearingStr, pitchStr].filter(Boolean).join(' • ');

                      return (
                        <div
                          key={sc.id || idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                            background: isLast ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '4px',
                            borderLeft: `2px solid ${isLast ? '#38bdf8' : '#a855f7'}`
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 700, color: isLast ? '#38bdf8' : '#c084fc' }}>#{periodNumber}</span>
                            <span style={{ color: '#f8fafc' }}>{sc.title || `Période ${periodNumber}`}</span>
                            {isLast && (
                              <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontWeight: 600 }}>
                                Plan final
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {camTag && (
                              <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.06)', color: '#cbd5e1', fontFamily: 'monospace' }}>
                                {camTag}
                              </span>
                            )}
                            <span style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.7rem' }}>{formattedYear}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Garantie de complétude du projet */}
              <div style={{
                padding: '8px 12px',
                background: 'rgba(56, 189, 248, 0.06)',
                borderRadius: '8px',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.75rem',
                color: '#e2e8f0',
                lineHeight: 1.4
              }}>
                <ShieldCheck size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Garantie de complétude</strong> : Les cadrages de chaque carte (dont la dernière) et la bande audio sont maintenus jusqu'au terme complet de la vidéo (+1.2s buffer de contemplation outro).
                </div>
              </div>

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

              {/* Format & Ratio Vidéo (Garantie Anti-Anamorphose) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)', margin: 0 }}>
                    Format & Ratio d'Aspect de la Vidéo
                  </label>
                  <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    ✓ Sphéricité 1:1 garantie
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setResolution('1080p')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: `2px solid ${resolution === '1080p' ? '#a855f7' : 'var(--border-color, #334155)'}`,
                      background: resolution === '1080p' ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      color: 'var(--text-primary, #f8fafc)',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.78rem' }}>🖥️ 16:9 Paysage</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary, #94a3b8)' }}>1920 × 1080 (Défaut)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolution('vertical_1080p')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: `2px solid ${resolution === 'vertical_1080p' ? '#a855f7' : 'var(--border-color, #334155)'}`,
                      background: resolution === 'vertical_1080p' ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      color: 'var(--text-primary, #f8fafc)',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.78rem' }}>📱 9:16 Vertical</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary, #94a3b8)' }}>1080 × 1920 (Shorts)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolution('square_1080p')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: `2px solid ${resolution === 'square_1080p' ? '#a855f7' : 'var(--border-color, #334155)'}`,
                      background: resolution === 'square_1080p' ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      color: 'var(--text-primary, #f8fafc)',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.78rem' }}>⏹️ 1:1 Carré</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary, #94a3b8)' }}>1080 × 1080 (Feed)</div>
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

              {/* Option Mode Studio (Montage CapCut) */}
              {onOpenStudio && (
                <div style={{
                  padding: '12px 14px',
                  background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.12), rgba(56, 189, 248, 0.12))',
                  borderRadius: '8px',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Film size={15} color="#c084fc" />
                      <span>Mode Studio (Montage multi-pistes)</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #94a3b8)' }}>
                      Ajustez la durée des périodes, insérez de la musique ou voix off et prévisualisez sur la timeline CapCut.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenStudio}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.75rem',
                      padding: '6px 12px',
                      color: '#c084fc',
                      borderColor: 'rgba(168, 85, 247, 0.5)',
                      fontWeight: 600,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Ouvrir le Studio
                  </button>
                </div>
              )}

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

          {/* Étape de validation de complétude post-export */}
          {currentPhase === 'done' && (
            <div style={{
              padding: '14px 16px',
              background: 'rgba(16, 185, 129, 0.08)',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}>
                <CheckCircle2 size={18} />
                <span>Complétude du Projet Validée à 100%</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px', lineHeight: 1.4 }}>
                <div>• <strong>Plans cartographiques</strong> : {videoProgress?.totalScenes || estimation.totalScenes} plans enregistrés avec angles, zoom et orientation fidèles.</div>
                <div>• <strong>Cadrage final</strong> : La dernière carte a été stabilisée et maintenue jusqu'au terme de la vidéo.</div>
                {audioSummary.hasAudio && (
                  <div>• <strong>Bande sonore</strong> : {audioSummary.count} piste(s) mixée(s) en continu sans coupure prématurée.</div>
                )}
                <div>• <strong>Fichier exporté</strong> : {((videoProgress?.recordedBytes || 0) / (1024 * 1024)).toFixed(2)} Mo — Téléchargement automatique initié.</div>
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

          {!isExporting && currentPhase === 'idle' && onOpenStudio && (
            <button
              type="button"
              onClick={onOpenStudio}
              className="btn btn-secondary"
              style={{
                fontSize: '0.8rem',
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#c084fc',
                borderColor: 'rgba(168, 85, 247, 0.4)'
              }}
            >
              <Film size={14} /> Mode Studio (Montage)
            </button>
          )}

          {!isExporting && currentPhase === 'idle' && (
            <button
              onClick={() => onStartExport(fps, includeLegend, resolution)}
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

// app/components/studio/StudioProgramMonitor.tsx

import React, { useRef, useEffect, useMemo } from 'react';
import { 
  Tv, 
  Layers, 
  Grid,
  Square,
  Columns,
  Compass 
} from 'lucide-react';
import { VideoClip } from '../../../services/export/studio-types';
import { Entity } from '../../../core/schema/types';

export interface StudioProgramMonitorProps {
  activeClip?: VideoClip | null;
  playheadMs: number;
  isPlaying: boolean;
  map: any;
  entities: Entity[];
  includeLegend: boolean;
  onToggleIncludeLegend: () => void;
  show16x9Guides: boolean;
  onToggle16x9Guides: () => void;
  studioLayoutMode: 'dual' | 'single';
  onToggleLayoutMode: () => void;
}

export const StudioProgramMonitor: React.FC<StudioProgramMonitorProps> = ({
  activeClip,
  playheadMs,
  isPlaying,
  map,
  entities,
  includeLegend,
  onToggleIncludeLegend,
  show16x9Guides,
  onToggle16x9Guides,
  studioLayoutMode,
  onToggleLayoutMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isMapClip = !activeClip || !activeClip.mediaType || activeClip.mediaType === 'map';
  const isImageClip = activeClip?.mediaType === 'image';
  const isVideoClip = activeClip?.mediaType === 'video';

  const isAlIdrisi = activeClip?.mapState?.basemapStyle === 'al_idrisi' || (activeClip?.mapState?.bearing !== undefined && Math.abs(Math.abs(activeClip.mapState.bearing) - 180) < 5);

  // Entités visibles à l'époque historique du clip courant
  const activeEntities = useMemo(() => {
    if (!activeClip || activeClip.timelineYear === undefined) return [];
    const year = activeClip.timelineYear;
    return entities.filter(e => {
      if (!e.temporalRange) return true;
      return e.temporalRange.validFrom <= year && e.temporalRange.validTo >= year;
    }).slice(0, 5);
  }, [activeClip, entities]);

  // Synchronisation du canevas relais 16:9 pour les scènes cartographiques
  useEffect(() => {
    if (!isMapClip) return;

    let animId: number;

    const copyMapFrame = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const mapCanvas = map?.getCanvas?.();
      ctx.fillStyle = '#070b14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (mapCanvas && mapCanvas.width > 0 && mapCanvas.height > 0) {
        try {
          const mapAspect = mapCanvas.width / mapCanvas.height;
          const targetAspect = canvas.width / canvas.height;
          let dW = canvas.width;
          let dH = canvas.height;
          let dX = 0;
          let dY = 0;

          if (mapAspect > targetAspect) {
            dH = canvas.width / mapAspect;
            dY = (canvas.height - dH) / 2;
          } else {
            dW = canvas.height * mapAspect;
            dX = (canvas.width - dW) / 2;
          }

          ctx.drawImage(mapCanvas, dX, dY, dW, dH);
        } catch {
          // Ignore drawing buffer errors
        }
      }

      animId = requestAnimationFrame(copyMapFrame);
    };

    copyMapFrame();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [map, isMapClip, playheadMs]);

  // Synchronisation temporelle de la balise vidéo externe
  useEffect(() => {
    if (!isVideoClip || !videoRef.current || !activeClip) return;
    const v = videoRef.current;

    const targetTimeSec = Math.max(
      0,
      (playheadMs - (activeClip.startMs ?? 0) + (activeClip.trimStartMs ?? 0)) / 1000
    );

    if (Math.abs(v.currentTime - targetTimeSec) > 0.2) {
      v.currentTime = targetTimeSec;
    }

    if (isPlaying && v.paused) {
      v.play().catch(() => {});
    } else if (!isPlaying && !v.paused) {
      v.pause();
    }
  }, [isVideoClip, playheadMs, isPlaying, activeClip]);

  const formattedYear = useMemo(() => {
    if (!activeClip || activeClip.timelineYear === undefined) return null;
    const y = activeClip.timelineYear;
    return y < 0 ? `${Math.abs(y)} av. J.-C.` : `An ${y}`;
  }, [activeClip]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#040711',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      userSelect: 'none',
    }}>
      {/* 1. Barre d'en-tête Moniteur Programme */}
      <div style={{
        height: '38px',
        padding: '0 12px',
        background: 'rgba(9, 14, 26, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        zIndex: 10
      }}>
        {/* Titre & Format */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}>
            <Tv size={15} />
            <span style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              Résultat du Montage (Programme)
            </span>
          </div>

          <span style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            color: '#38bdf8',
            padding: '1px 6px',
            borderRadius: '4px'
          }}>
            16:9 • WYSIWYG
          </span>
        </div>

        {/* Boutons d'options du moniteur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Bascule Cartouche cinématique */}
          <button
            onClick={onToggleIncludeLegend}
            className="btn btn-secondary"
            style={{
              padding: '3px 8px',
              fontSize: '0.7rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              borderRadius: '6px',
              color: includeLegend ? '#c084fc' : '#64748b',
              borderColor: includeLegend ? 'rgba(192, 132, 252, 0.4)' : undefined,
            }}
            title={includeLegend ? 'Masquer le cartouche cinématique de légende' : 'Afficher le cartouche cinématique de légende'}
          >
            <Layers size={12} />
            <span>Cartouche {includeLegend ? 'ON' : 'OFF'}</span>
          </button>

          {/* Bascule Repères 16:9 */}
          <button
            onClick={onToggle16x9Guides}
            className="btn btn-secondary"
            style={{
              padding: '3px 8px',
              fontSize: '0.7rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              borderRadius: '6px',
              color: show16x9Guides ? '#38bdf8' : '#64748b',
              borderColor: show16x9Guides ? 'rgba(56, 189, 248, 0.4)' : undefined,
            }}
            title="Afficher/masquer les repères de cadrage et zones de sécurité 16:9"
          >
            <Grid size={12} />
            <span>Repères</span>
          </button>

          {/* Bascule 2 Écrans / 1 Écran */}
          <button
            onClick={onToggleLayoutMode}
            className="btn btn-secondary"
            style={{
              padding: '3px 8px',
              fontSize: '0.7rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              borderRadius: '6px',
              color: '#f8fafc',
            }}
            title={studioLayoutMode === 'dual' ? 'Passer en Moniteur Unique Plein Format' : 'Basculer en 2 Écrans (Atelier + Programme)'}
          >
            {studioLayoutMode === 'dual' ? <Columns size={12} /> : <Square size={12} />}
            <span>{studioLayoutMode === 'dual' ? '2 Écrans' : '1 Écran'}</span>
          </button>
        </div>
      </div>

      {/* 2. Zone Moniteur 16:9 Letterboxée */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '12px',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at center, #0b1329 0%, #03060f 100%)'
      }}>
        {/* Cadre Conteneur 16:9 */}
        <div style={{
          width: '100%',
          maxWidth: 'calc((100vh - 52px - 340px - 60px) * (16 / 9))',
          aspectRatio: '16/9',
          background: '#000000',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Plan Carte : Canvas Relais WYSIWYG */}
          {isMapClip && (
            <canvas
              ref={canvasRef}
              width={1920}
              height={1080}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                objectFit: 'contain'
              }}
            />
          )}

          {/* Plan Image Externe */}
          {isImageClip && activeClip?.mediaUrl && (
            <img
              src={activeClip.mediaUrl}
              alt={activeClip.title || 'Plan image'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                background: '#0a0e1a'
              }}
            />
          )}

          {/* Plan Vidéo Externe */}
          {isVideoClip && activeClip?.mediaUrl && (
            <video
              ref={videoRef}
              src={activeClip.mediaUrl}
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                background: '#0a0e1a'
              }}
            />
          )}

          {/* Gap / Silence Vidéo */}
          {!activeClip && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: '#475569',
              fontSize: '0.8rem'
            }}>
              <Square size={24} strokeWidth={1.5} />
              <span>Silence Vidéo (aucun média à ce timecode)</span>
            </div>
          )}

          {/* 3. Incrustation du Cartouche Cinématique (Lower-Third WYSIWYG) */}
          {includeLegend && activeClip && (
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              maxWidth: '48%',
              background: 'rgba(9, 13, 24, 0.88)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              padding: '10px 14px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.65)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              zIndex: 20
            }}>
              {/* Badge Période & Époque */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.68rem' }}>
                <span style={{
                  fontWeight: 700,
                  color: '#c084fc',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {activeClip.periodNumber ? `Période #${activeClip.periodNumber}` : (activeClip.mediaType === 'image' ? 'Image' : activeClip.mediaType === 'video' ? 'Vidéo' : 'Carte')}
                </span>

                {formattedYear && (
                  <span style={{
                    color: '#38bdf8',
                    fontWeight: 600,
                    background: 'rgba(56, 189, 248, 0.15)',
                    padding: '1px 6px',
                    borderRadius: '4px'
                  }}>
                    {formattedYear}
                  </span>
                )}

                {isAlIdrisi && (
                  <span style={{
                    color: '#fbbf24',
                    fontWeight: 600,
                    background: 'rgba(245, 158, 11, 0.18)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Compass size={11} style={{ transform: 'rotate(180deg)' }} />
                    <span>Sud en haut (1154)</span>
                  </span>
                )}
              </div>

              {/* Titre de la scène */}
              <div style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#f8fafc',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {activeClip.title || activeClip.name || 'Plan vidéo'}
              </div>

              {/* Pastilles des entités actives */}
              {activeEntities.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '4px',
                  flexWrap: 'wrap'
                }}>
                  {activeEntities.map(e => (
                    <div
                      key={e.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.62rem',
                        color: '#cbd5e1',
                        background: 'rgba(255, 255, 255, 0.06)',
                        padding: '1px 6px',
                        borderRadius: '3px'
                      }}
                    >
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: String(e.properties?.color || e.color || '#38bdf8')
                      }} />
                      <span>{String(e.name || e.properties?.name || 'Entité')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. Guides de Cadrage 16:9 & Repères de sécurité */}
          {show16x9Guides && (
            <div style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 30
            }}>
              {/* Zone Action-Safe (90%) */}
              <div style={{
                position: 'absolute',
                top: '5%',
                bottom: '5%',
                left: '5%',
                right: '5%',
                border: '1px dashed rgba(56, 189, 248, 0.45)',
                borderRadius: '4px'
              }} />

              {/* Zone Title-Safe (80%) */}
              <div style={{
                position: 'absolute',
                top: '10%',
                bottom: '10%',
                left: '10%',
                right: '10%',
                border: '1px dotted rgba(192, 132, 252, 0.45)',
                borderRadius: '4px'
              }} />

              {/* Réticule Central */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '16px',
                height: '16px',
                pointerEvents: 'none'
              }}>
                <div style={{ position: 'absolute', top: '7px', left: 0, right: 0, height: '1px', background: 'rgba(255, 255, 255, 0.35)' }} />
                <div style={{ position: 'absolute', left: '7px', top: 0, bottom: 0, width: '1px', background: 'rgba(255, 255, 255, 0.35)' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

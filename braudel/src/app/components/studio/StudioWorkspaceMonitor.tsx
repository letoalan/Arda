// app/components/studio/StudioWorkspaceMonitor.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Crosshair, 
  RotateCcw, 
  Compass, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Layers, 
  CheckCircle2
} from 'lucide-react';
import { VideoClip } from '../../../services/export/studio-types';
import { useStore } from '../../state/store';

export interface StudioWorkspaceMonitorProps {
  selectedClip?: VideoClip | null;
  map: any;
  onSaveCamera: (clipId: string, mapState: any) => void;
  onResetCamera: (clipId: string) => void;
}

export const StudioWorkspaceMonitor: React.FC<StudioWorkspaceMonitorProps> = ({
  selectedClip,
  map,
  onSaveCamera,
  onResetCamera,
}) => {
  const { basemapStyle } = useStore();
  const [currentCamera, setCurrentCamera] = useState<{
    zoom: number;
    bearing: number;
    pitch: number;
    center: [number, number];
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 2500);
  }, []);

  const isAlIdrisi = basemapStyle === 'al_idrisi' || selectedClip?.mapState?.basemapStyle === 'al_idrisi';

  const handleAlignToSouth = useCallback(() => {
    if (!map) return;
    if (typeof map.rotateTo === 'function') {
      map.rotateTo(180, { duration: 400 });
    } else if (typeof map.setBearing === 'function') {
      map.setBearing(180);
    }
    showToast('🧭 Orientation Sud rétablie (180° Al-Idrisi)');
  }, [map, showToast]);

  // Écoute les mouvements de la carte pour afficher les coordonnées en temps réel
  useEffect(() => {
    if (!map) return;

    const updateCameraMetrics = () => {
      if (typeof map.getCenter === 'function' && typeof map.getZoom === 'function') {
        const centerObj = map.getCenter();
        const center: [number, number] = [
          Number(centerObj.lng?.toFixed(3) ?? 0),
          Number(centerObj.lat?.toFixed(3) ?? 0)
        ];
        const zoom = Number(map.getZoom().toFixed(2));
        const bearing = Number((map.getBearing?.() ?? 0).toFixed(1));
        const pitch = Number((map.getPitch?.() ?? 0).toFixed(1));
        setCurrentCamera({ zoom, bearing, pitch, center });
      }
    };

    updateCameraMetrics();
    map.on?.('move', updateCameraMetrics);
    map.on?.('zoom', updateCameraMetrics);
    map.on?.('rotate', updateCameraMetrics);
    map.on?.('pitch', updateCameraMetrics);

    return () => {
      map.off?.('move', updateCameraMetrics);
      map.off?.('zoom', updateCameraMetrics);
      map.off?.('rotate', updateCameraMetrics);
      map.off?.('pitch', updateCameraMetrics);
    };
  }, [map]);

  const handleSaveCurrentCamera = () => {
    if (!selectedClip || !map) return;

    const centerObj = map.getCenter();
    let rawBearing = map.getBearing?.() ?? 0;
    // Si c'est Al-Idrisi et que l'angle est proche du Sud ou non défini, normaliser à 180°
    if (isAlIdrisi && (Math.abs(Math.abs(rawBearing) - 180) < 3 || rawBearing === 0)) {
      rawBearing = 180;
    }

    const mapState = {
      center: [centerObj.lng, centerObj.lat] as [number, number],
      zoom: map.getZoom(),
      bearing: rawBearing,
      pitch: map.getPitch?.() ?? 0,
      basemapStyle: selectedClip.mapState?.basemapStyle || basemapStyle,
      timelineYear: selectedClip.timelineYear
    };

    onSaveCamera(selectedClip.id, mapState);
    showToast(`Cadrage enregistré pour ce plan !${rawBearing === 180 ? ' (Sud 180°)' : ''}`);
  };

  const isMapClip = !selectedClip || !selectedClip.mediaType || selectedClip.mediaType === 'map';
  const isImageClip = selectedClip?.mediaType === 'image';
  const isVideoClip = selectedClip?.mediaType === 'video';

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      userSelect: 'none',
      zIndex: 10,
    }}>
      {/* 1. Barre d'en-tête Atelier */}
      <div style={{
        pointerEvents: 'auto',
        margin: '10px 12px 0 12px',
        padding: '6px 14px',
        background: 'rgba(9, 14, 26, 0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(168, 85, 247, 0.35)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)',
        flexShrink: 0
      }}>
        {/* Titre & Type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c084fc' }}>
            <Compass size={16} />
            <span style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              Atelier Cadrage & Source
            </span>
          </div>

          {selectedClip && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              color: '#94a3b8'
            }}>
              {isImageClip && <ImageIcon size={12} color="#38bdf8" />}
              {isVideoClip && <VideoIcon size={12} color="#fbbf24" />}
              {isMapClip && <Layers size={12} color="#c084fc" />}
              <span style={{ color: '#f8fafc', fontWeight: 600, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedClip.title || selectedClip.name || 'Plan actif'}
              </span>
              {selectedClip.timelineYear !== undefined && (
                <span style={{ color: '#38bdf8' }}>
                  ({selectedClip.timelineYear < 0 ? `${Math.abs(selectedClip.timelineYear)} av. J.-C.` : `An ${selectedClip.timelineYear}`})
                </span>
              )}
            </div>
          )}

          {isAlIdrisi && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '0.70rem',
              color: '#fbbf24',
              fontWeight: 600
            }}>
              <Compass size={12} style={{ transform: 'rotate(180deg)' }} />
              <span>Al-Idrisi : 180° (Sud en haut)</span>
            </div>
          )}
        </div>

        {/* Actions de Cadrage pour la carte */}
        {isMapClip && selectedClip && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={handleSaveCurrentCamera}
              className="btn btn-primary"
              style={{
                padding: '4px 10px',
                fontSize: '0.72rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'linear-gradient(135deg, #9333ea, #7c3aed)',
                borderRadius: '6px',
                color: '#ffffff',
                fontWeight: 600
              }}
              title="Figer le cadrage actuel de la carte pour ce plan"
            >
              <Crosshair size={13} />
              <span>Enregistrer Cadrage</span>
            </button>

            <button
              onClick={() => onResetCamera(selectedClip.id)}
              className="btn btn-secondary"
              style={{
                padding: '4px 8px',
                fontSize: '0.72rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                borderRadius: '6px',
                color: '#94a3b8'
              }}
              title="Restaurer le cadrage initialement mémorisé pour ce plan"
            >
              <RotateCcw size={13} />
              <span>Réinit</span>
            </button>

            {isAlIdrisi && (
              <button
                onClick={handleAlignToSouth}
                className="btn btn-secondary"
                style={{
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderRadius: '6px',
                  background: 'rgba(217, 119, 6, 0.25)',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                  color: '#fde68a',
                  fontWeight: 600
                }}
                title="Réaligner la carte vers le Sud (180° Al-Idrisi)"
              >
                <Compass size={13} style={{ transform: 'rotate(180deg)' }} />
                <span>180° Sud</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Toast de confirmation de cadrage */}
      {toastMessage && (
        <div style={{
          position: 'absolute',
          top: '55px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(16, 185, 129, 0.95)',
          color: '#ffffff',
          padding: '4px 14px',
          borderRadius: '8px',
          fontSize: '0.75rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          zIndex: 30,
          pointerEvents: 'none',
        }}>
          <CheckCircle2 size={14} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Affichage Inspecteur si Image ou Vidéo externe sélectionnée */}
      {isImageClip && selectedClip?.mediaUrl && (
        <div style={{
          pointerEvents: 'auto',
          position: 'absolute',
          inset: 0,
          background: '#070b14',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '50px 20px 40px 20px',
          zIndex: 5
        }}>
          <img
            src={selectedClip.mediaUrl}
            alt={selectedClip.name || 'Média source'}
            style={{
              maxWidth: '100%',
              maxHeight: '80%',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}
          />
          <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', gap: '12px' }}>
            <span>Image fixe : <strong style={{ color: '#f8fafc' }}>{selectedClip.name || selectedClip.title}</strong></span>
            <span>Durée : <strong>{(selectedClip.durationMs / 1000).toFixed(1)}s</strong></span>
          </div>
        </div>
      )}

      {isVideoClip && selectedClip?.mediaUrl && (
        <div style={{
          pointerEvents: 'auto',
          position: 'absolute',
          inset: 0,
          background: '#070b14',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '50px 20px 40px 20px',
          zIndex: 5
        }}>
          <video
            src={selectedClip.mediaUrl}
            controls
            style={{
              maxWidth: '100%',
              maxHeight: '80%',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
              border: '1px solid rgba(251, 191, 36, 0.3)'
            }}
          />
          <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', gap: '12px' }}>
            <span>Clip vidéo source : <strong style={{ color: '#f8fafc' }}>{selectedClip.name || selectedClip.title}</strong></span>
            <span>Durée : <strong>{(selectedClip.durationMs / 1000).toFixed(1)}s</strong></span>
          </div>
        </div>
      )}

      {/* 3. Pied d'écran Atelier : Métriques Caméra en direct */}
      {isMapClip && (
        <div style={{
          pointerEvents: 'none',
          margin: '0 12px 10px 12px',
          padding: '4px 12px',
          background: 'rgba(9, 14, 26, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.68rem',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {currentCamera && (
              <>
                <span>Zoom : <strong style={{ color: '#f8fafc' }}>{currentCamera.zoom}</strong></span>
                <span>Coord : <strong style={{ color: '#f8fafc' }}>{currentCamera.center[1]}°, {currentCamera.center[0]}°</strong></span>
                <span>Angle : <strong style={{ color: '#f8fafc' }}>{currentCamera.bearing}°</strong></span>
                <span>Inclinaison : <strong style={{ color: '#f8fafc' }}>{currentCamera.pitch}°</strong></span>
                {isAlIdrisi && (
                  <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                    <Compass size={11} style={{ transform: 'rotate(180deg)' }} />
                    <span>Sud en haut (180°)</span>
                  </span>
                )}
              </>
            )}
          </div>
          <div style={{ color: '#94a3b8' }}>
            Zoomez et déplacez la carte librement
          </div>
        </div>
      )}
    </div>
  );
};

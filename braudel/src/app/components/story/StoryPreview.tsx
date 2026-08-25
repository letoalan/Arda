import React, { useState } from 'react';
import { StoryProject } from '../../../core/schema/story';
import { ChevronLeft, ChevronRight, Square, MapPin } from 'lucide-react';
import { mapService } from '../../../services/cartography/map-service';
import { playSceneTransition } from '../../../services/cartography/camera-orchestrator';

interface StoryPreviewProps {
  story: StoryProject;
  setCurrentTime: (year: number) => void;
  onClose?: () => void;
}

export const StoryPreview: React.FC<StoryPreviewProps> = ({
  story,
  setCurrentTime,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const currentScene = story.scenes[currentIndex];

  if (!currentScene) {
    return (
      <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        Aucune scène disponible dans ce récit.
      </div>
    );
  }

  const handleGoToScene = async (idx: number) => {
    if (idx < 0 || idx >= story.scenes.length || isTransitioning) return;
    const prevScene = story.scenes[currentIndex];
    const scene = story.scenes[idx];

    setIsTransitioning(true);
    setCurrentIndex(idx);

    // Déplacer le temps
    if (scene.mapState.timelineYear !== undefined) {
      setCurrentTime(scene.mapState.timelineYear);
    }

    // Vol cartographique orchestré
    const map = mapService.getMap();
    if (map && scene.mapState.center) {
      await playSceneTransition(
        map,
        scene.transition || { profile: 'standard', durationMode: 'auto', pauseAfterMs: 800, reduceMotionPolicy: 'respect' },
        prevScene?.mapState,
        scene.mapState,
        false
      );
    }

    setIsTransitioning(false);
  };

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      zIndex: 50,
      width: '360px',
      background: 'var(--bg-glass-panel)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px',
      boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
      backdropFilter: 'blur(12px)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Scène {currentIndex + 1} / {story.scenes.length}
        </span>
        {onClose && (
          <button onClick={onClose} className="btn" style={{ padding: '2px 6px', fontSize: '0.75rem' }}>
            <Square size={12} /> Quitter
          </button>
        )}
      </div>

      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
        {currentScene.title || 'Scène sans titre'}
      </h3>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '14px', maxHeight: '160px', overflowY: 'auto' }}>
        {currentScene.body || 'Aucun texte renseigné pour cette scène.'}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
        <button 
          onClick={() => handleGoToScene(currentIndex - 1)}
          disabled={currentIndex === 0 || isTransitioning}
          className="btn btn-secondary"
          style={{ fontSize: '0.75rem', padding: '4px 8px', gap: '4px' }}
        >
          <ChevronLeft size={14} /> Précédent
        </button>

        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <MapPin size={10} style={{ display: 'inline', marginRight: '2px' }} /> An {currentScene.mapState.timelineYear || 1800}
        </span>

        <button 
          onClick={() => handleGoToScene(currentIndex + 1)}
          disabled={currentIndex === story.scenes.length - 1 || isTransitioning}
          className="btn btn-primary"
          style={{ fontSize: '0.75rem', padding: '4px 8px', gap: '4px' }}
        >
          {isTransitioning ? 'Vol...' : 'Suivant'} <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

// app/components/story/StoryPlayer.tsx

import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, X } from 'lucide-react';
import type { StoryProject, StoryScene } from '../../../core/schema/story';

interface StoryPlayerProps {
  story: StoryProject;
  isOpen: boolean;
  onClose: () => void;
  onPlayScene: (scene: StoryScene) => void;
}

export const StoryPlayer: React.FC<StoryPlayerProps> = ({
  story,
  isOpen,
  onClose,
  onPlayScene,
}) => {
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const activeScene = story.scenes[currentSceneIdx];

  useEffect(() => {
    if (isPlaying && activeScene) {
      onPlayScene(activeScene);
      const timer = setTimeout(() => {
        if (currentSceneIdx < story.scenes.length - 1) {
          setCurrentSceneIdx((prev) => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, (activeScene.durationHint || 5) * 1000);

      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentSceneIdx, activeScene, story.scenes.length, onPlayScene]);

  if (!isOpen || !activeScene) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9990,
        backgroundColor: 'var(--bg-panel, #1e1e24)',
        border: '1px solid var(--border-color, #333)',
        borderRadius: '12px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        color: '#fff',
        maxWidth: '600px',
        width: '90%',
      }}
    >
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'var(--accent-primary, #3B82F6)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Scène {currentSceneIdx + 1}/{story.scenes.length} : {activeScene.title || 'Sans titre'}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '2px' }}>
          {activeScene.body || 'Aucune description'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          disabled={currentSceneIdx === 0}
          onClick={() => setCurrentSceneIdx((prev) => Math.max(0, prev - 1))}
          style={{
            background: 'transparent',
            border: 'none',
            color: currentSceneIdx === 0 ? '#555' : '#ccc',
            cursor: currentSceneIdx === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <SkipBack size={18} />
        </button>

        <button
          disabled={currentSceneIdx === story.scenes.length - 1}
          onClick={() => setCurrentSceneIdx((prev) => Math.min(story.scenes.length - 1, prev + 1))}
          style={{
            background: 'transparent',
            border: 'none',
            color: currentSceneIdx === story.scenes.length - 1 ? '#555' : '#ccc',
            cursor: currentSceneIdx === story.scenes.length - 1 ? 'not-allowed' : 'pointer',
          }}
        >
          <SkipForward size={18} />
        </button>

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#aaa',
            cursor: 'pointer',
            marginLeft: '8px',
          }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

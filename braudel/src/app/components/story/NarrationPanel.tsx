// app/components/story/NarrationPanel.tsx

import React from 'react';
import { AudioRecorder } from './AudioRecorder';
import { Mic } from 'lucide-react';
import type { StoryScene } from '../../../core/schema/story';

interface NarrationPanelProps {
  scene: StoryScene;
  onUpdateScene: (updatedScene: StoryScene) => void;
}

export const NarrationPanel: React.FC<NarrationPanelProps> = ({ scene, onUpdateScene }) => {
  const handleAudioSave = (_sceneId: string, _audioDataUrl: string) => {
    onUpdateScene({
      ...scene,
      transition: {
        ...scene.transition,
      },
      durationHint: 10,
    });
  };

  const handleAudioDelete = (_sceneId: string) => {
    onUpdateScene({
      ...scene,
    });
  };

  return (
    <div
      style={{
        marginTop: '12px',
        padding: '12px',
        backgroundColor: 'var(--bg-secondary, rgba(255, 255, 255, 0.02))',
        borderRadius: '8px',
        border: '1px solid var(--border-color, #333)',
      }}
    >
      <h4 style={{ margin: '0 0 8px 0', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
        <Mic size={15} /> Studio de Narration & Voix Off
      </h4>

      <p style={{ margin: '0 0 10px 0', fontSize: '0.78rem', color: 'var(--text-tertiary, #aaa)' }}>
        Enregistrez une voix off pour la scène "{scene.title || 'Sans titre'}". L'enregistrement sera synchronisé lors de l'export vidéo ou storyboard.
      </p>

      <AudioRecorder
        sceneId={scene.id}
        onAudioSave={handleAudioSave}
        onAudioDelete={handleAudioDelete}
      />
    </div>
  );
};

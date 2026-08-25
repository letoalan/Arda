import React, { useState, useEffect } from 'react';
import { useStore } from '../state/store';
import { BookOpen, Globe, Play } from 'lucide-react';
import { StoryProject, StoryScene } from '../../core/schema/story';
import { loadStoryFromStorage, saveStoryToStorage } from '../../services/export/story-export';
import { StorySceneList } from '../components/story/StorySceneList';
import { StorySceneEditor } from '../components/story/StorySceneEditor';
import { generateStandaloneHtml } from '../../services/export/standalone-template';
import { STYLE_CONFIGS } from '../../core/styles.config';

interface StoryEditorPanelProps {
  onStartPreview?: (story: StoryProject) => void;
}

export const StoryEditorPanel: React.FC<StoryEditorPanelProps> = ({ onStartPreview }) => {
  const { world, currentTime, basemapStyle } = useStore();
  const worldName = world.world[0]?.name || 'Monde Braudel';

  const [story, setStory] = useState<StoryProject>(() => loadStoryFromStorage(worldName));
  const [activeSceneId, setActiveSceneId] = useState<string | null>(story.scenes[0]?.id || null);

  useEffect(() => {
    saveStoryToStorage(story);
  }, [story]);

  const activeScene = story.scenes.find(s => s.id === activeSceneId) || story.scenes[0];

  const handleAddScene = () => {
    const newScene: StoryScene = {
      id: `scene-${Date.now()}`,
      title: `Nouvelle Scène #${story.scenes.length + 1}`,
      body: 'Décrivez cette nouvelle étape de votre récit...',
      mapState: {
        center: [2, 45],
        zoom: 3,
        timelineYear: currentTime,
        visibleLayerIds: []
      },
      layout: 'split',
      transition: {
        profile: 'standard',
        durationMode: 'auto',
        pauseAfterMs: 800,
        reduceMotionPolicy: 'respect'
      }
    };
    const updatedScenes = [...story.scenes, newScene];
    setStory({ ...story, scenes: updatedScenes });
    setActiveSceneId(newScene.id);
  };

  const handleDeleteScene = (sceneId: string) => {
    if (story.scenes.length <= 1) {
      alert('Un récit doit conserver au moins une scène.');
      return;
    }
    const updated = story.scenes.filter(s => s.id !== sceneId);
    setStory({ ...story, scenes: updated });
    if (activeSceneId === sceneId) {
      setActiveSceneId(updated[0].id);
    }
  };

  const handleMoveScene = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= story.scenes.length) return;

    const newScenes = [...story.scenes];
    const [moved] = newScenes.splice(index, 1);
    newScenes.splice(targetIdx, 0, moved);
    setStory({ ...story, scenes: newScenes });
  };

  const handleUpdateScene = (updatedScene: StoryScene) => {
    const newScenes = story.scenes.map(s => s.id === updatedScene.id ? updatedScene : s);
    setStory({ ...story, scenes: newScenes });
  };

  const handleExportStoryHtml = () => {
    const config = STYLE_CONFIGS.find(s => s.id === basemapStyle) || STYLE_CONFIGS[0];
    const htmlContent = generateStandaloneHtml(
      worldName,
      config,
      { type: 'FeatureCollection', features: world.entities.map(e => ({ ...e, type: 'Feature' })) },
      { type: 'FeatureCollection', features: world.relations.map(r => ({ ...r, type: 'Feature' })) },
      'story',
      story
    );

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.download = `${worldName.toLowerCase().replace(/\s+/g, '_')}_recit_bento.html`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  return (
    <div className="panel-content" style={{ borderBottom: '1px solid var(--glass-border)' }}>
      <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', color: 'var(--text-secondary)' }}>
        <BookOpen size={18} /> Récit Bento & Scénarisation
      </h3>

      {/* Titre du Projet Récit */}
      <div style={{ marginBottom: '12px' }}>
        <input 
          type="text" 
          value={story.title}
          onChange={(e) => setStory({ ...story, title: e.target.value })}
          placeholder="Titre global du récit..."
          style={{ width: '100%', padding: '6px 8px', fontSize: '0.85rem', fontWeight: 600, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }}
        />
      </div>

      {/* Actions Générales */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
        <button 
          onClick={() => onStartPreview && onStartPreview(story)}
          className="btn btn-primary"
          style={{ fontSize: '0.75rem', gap: '6px', justifyContent: 'center' }}
        >
          <Play size={14} /> Tester la narration
        </button>

        <button 
          onClick={handleExportStoryHtml}
          className="btn btn-secondary"
          style={{ fontSize: '0.75rem', gap: '6px', justifyContent: 'center' }}
        >
          <Globe size={14} /> Exporter en HTML Bento
        </button>
      </div>

      {/* Liste des scènes */}
      <div style={{ marginBottom: '16px' }}>
        <StorySceneList 
          scenes={story.scenes}
          activeSceneId={activeSceneId}
          onSelectScene={setActiveSceneId}
          onAddScene={handleAddScene}
          onDeleteScene={handleDeleteScene}
          onMoveScene={handleMoveScene}
        />
      </div>

      {/* Éditeur de la scène sélectionnée */}
      {activeScene && (
        <StorySceneEditor 
          scene={activeScene}
          currentTime={currentTime}
          onUpdateScene={handleUpdateScene}
        />
      )}
    </div>
  );
};

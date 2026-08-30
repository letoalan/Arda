import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../state/store';
import { BookOpen, Globe, Play, FolderOpen } from 'lucide-react';
import { StoryProject, StoryScene, StorySlideBlock } from '../../core/schema/story';
import { loadStoryFromStorage, saveStoryToStorage } from '../../services/export/story-export';
import { StorySceneList } from '../components/story/StorySceneList';
import { StorySceneEditor } from '../components/story/StorySceneEditor';
import { generateStandaloneHtml } from '../../services/export/standalone-template';
import { STYLE_CONFIGS } from '../../core/styles.config';
import { parseArdaDocFromHtml, migrateArdaDoc } from '../../services/export/modules/arda-doc-parser';
import { SlideEditorModal } from './SlideEditorModal';

interface StoryEditorPanelProps {
  onStartPreview?: (story: StoryProject) => void;
}

export const StoryEditorPanel: React.FC<StoryEditorPanelProps> = ({ onStartPreview }) => {
  const { 
    world, 
    currentTime, 
    basemapStyle, 
    viewMode, 
    mapProjection,
    geoReferenceLinesVisible, 
    portulanRhumbVisible, 
    graticuleVisible,
    basemapLabelsVisible, 
    basemapBordersVisible,
    basemapRoadsVisible,
    basemapRiversVisible
  } = useStore();
  const worldName = world.world[0]?.name || 'Monde Braudel';

  const [story, setStory] = useState<StoryProject>(() => loadStoryFromStorage(worldName));
  const [activeSceneId, setActiveSceneId] = useState<string | null>(story.scenes[0]?.id || null);
  const [isSlideEditorOpen, setIsSlideEditorOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSaveSlideBlocks = (blocks: StorySlideBlock[]) => {
    if (!activeScene) return;
    handleUpdateScene({
      ...activeScene,
      blocks
    });
  };

  const handleExportStoryHtml = () => {
    const config = STYLE_CONFIGS.find(s => s.id === basemapStyle) || STYLE_CONFIGS[0];
    const effectiveConfig = {
      ...config,
      demEnabled: viewMode === '3D' || Boolean((config as any).demEnabled),
    };

    const htmlContent = generateStandaloneHtml(
      worldName,
      effectiveConfig,
      { type: 'FeatureCollection', features: world.entities.map(e => ({ ...e, type: 'Feature' })) },
      { type: 'FeatureCollection', features: world.relations.map(r => ({ ...r, type: 'Feature' })) },
      'story',
      story,
      undefined,
      {
        geoReferenceLinesVisible,
        portulanRhumbVisible,
        graticuleVisible,
        basemapLabelsVisible,
        basemapBordersVisible,
        basemapRoadsVisible,
        basemapRiversVisible,
        projection: mapProjection,
        pitch: viewMode === '3D' ? 45 : 0,
      }
    );

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.download = `${worldName.toLowerCase().replace(/\s+/g, '_')}_recit_bento.html`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  const handleImportArdaHtml = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const rawDoc = parseArdaDocFromHtml(text);
        const migratedDoc = migrateArdaDoc(rawDoc);

        // Reconversion du document en scènes de récit
        const reconstructedScenes: StoryScene[] = (migratedDoc.waypoints || []).map((wp, idx) => {
          const matchingSlide = (migratedDoc.slides || []).find(s => wp.slideRefs?.includes(s.id) || s.attachedToWaypoint === wp.id);
          return {
            id: wp.id.replace('wp-', '') || `scene-${idx + 1}`,
            title: wp.label || `Étape ${idx + 1}`,
            body: wp.narrationText,
            mapState: {
              center: wp.cameraState?.center || [12.5, 42.0],
              zoom: wp.cameraState?.zoom ?? 4,
              pitch: wp.cameraState?.pitch || 0,
              bearing: wp.cameraState?.bearing || 0,
              timelineYear: wp.year,
              visibleLayerIds: []
            },
            layout: 'split',
            blocks: matchingSlide?.elements as any,
            transition: {
              profile: 'standard',
              durationMode: 'auto',
              pauseAfterMs: 800,
              reduceMotionPolicy: 'respect'
            }
          };
        });

        const newStory: StoryProject = {
          id: `imported-${Date.now()}`,
          title: migratedDoc.title || 'Récit importé',
          defaultFps: 30,
          scenes: reconstructedScenes.length > 0 ? reconstructedScenes : story.scenes
        };

        setStory(newStory);
        if (newStory.scenes.length > 0) setActiveSceneId(newStory.scenes[0].id);
        alert(`Document ARDA "${migratedDoc.title}" importé avec succès (${reconstructedScenes.length} scènes restaurées).`);
      } catch (err: any) {
        alert(`Erreur lors de l'importation du fichier HTML : ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
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
          <Globe size={14} /> Exporter HTML Bento
        </button>
      </div>

      {/* Importation Canonique */}
      <div style={{ marginBottom: '16px' }}>
        <input 
          type="file" 
          ref={fileInputRef} 
          accept=".html" 
          style={{ display: 'none' }} 
          onChange={handleImportArdaHtml} 
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-secondary"
          style={{ width: '100%', fontSize: '0.75rem', gap: '6px', justifyContent: 'center' }}
        >
          <FolderOpen size={14} /> Ouvrir un fichier ARDA (.html)
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
          onOpenSlideEditor={() => setIsSlideEditorOpen(true)}
        />
      )}

      {/* Modale d'Édition de Diapositive 16:9 */}
      {activeScene && (
        <SlideEditorModal 
          isOpen={isSlideEditorOpen}
          slideTitle={activeScene.title || 'Sans titre'}
          initialBlocks={activeScene.blocks || []}
          onClose={() => setIsSlideEditorOpen(false)}
          onSave={handleSaveSlideBlocks}
        />
      )}
    </div>
  );
};

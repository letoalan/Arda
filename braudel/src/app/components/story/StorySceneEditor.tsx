import React from 'react';
import { StoryScene, StoryLayout, TransitionProfile, DurationMode } from '../../../core/schema/story';
import { Camera, Layout, Zap, Clock, ShieldCheck } from 'lucide-react';
import { mapService } from '../../../services/cartography/map-service';
import { getEffectiveStyleBearing } from '../../../core/styles.config';

interface StorySceneEditorProps {
  scene: StoryScene;
  currentTime: number;
  onUpdateScene: (updatedScene: StoryScene) => void;
  onOpenSlideEditor?: () => void;
}

export const StorySceneEditor: React.FC<StorySceneEditorProps> = ({
  scene,
  currentTime,
  onUpdateScene,
  onOpenSlideEditor
}) => {
  const handleCaptureCamera = () => {
    const map = mapService.getMap();
    if (!map) return;
    const center = map.getCenter();
    const zoom = map.getZoom();
    const pitch = map.getPitch();
    const rawBearing = map.getBearing();
    const activeStyle = scene.mapState?.basemapStyle || (mapService.getCurrentStyleId ? mapService.getCurrentStyleId() : undefined);
    const bearing = getEffectiveStyleBearing(activeStyle, rawBearing);

    onUpdateScene({
      ...scene,
      mapState: {
        ...scene.mapState,
        center: [center.lng, center.lat],
        zoom,
        pitch,
        bearing,
        basemapStyle: activeStyle,
        timelineYear: currentTime
      }
    });
  };

  const currentTransition = scene.transition || {
    profile: 'standard',
    durationMode: 'auto',
    pauseAfterMs: 800,
    reduceMotionPolicy: 'respect'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
      <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
        Édition de la Scène
      </h4>

      {/* Titre */}
      <div>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
          Titre de la scène
        </label>
        <input 
          type="text" 
          value={scene.title || ''} 
          onChange={(e) => onUpdateScene({ ...scene, title: e.target.value })}
          placeholder="Ex: Fondation d'Osgiliath"
          style={{ width: '100%', padding: '6px 8px', fontSize: '0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }}
        />
      </div>

      {/* Partie du Plan Argumentatif (Mode EX - Dissertation Géohistorique) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Partie du Plan (EX)
          </label>
          <input 
            type="text" 
            value={scene.partOfArgument || ''} 
            onChange={(e) => onUpdateScene({ ...scene, partOfArgument: e.target.value })}
            placeholder="Ex: I.1, II.2"
            style={{ width: '100%', padding: '6px 8px', fontSize: '0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Document Recommandé
          </label>
          <input 
            type="text" 
            value={scene.recommendedDocumentId || ''} 
            onChange={(e) => onUpdateScene({ ...scene, recommendedDocumentId: e.target.value })}
            placeholder="ID document clé (ex: doc-042)"
            style={{ width: '100%', padding: '6px 8px', fontSize: '0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }}
          />
        </div>
      </div>

      {/* Récit / Contenu textuel */}
      <div>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
          Texte explicatif (Narration & Scrollytelling)
        </label>
        <textarea 
          rows={3}
          value={scene.body || ''} 
          onChange={(e) => onUpdateScene({ ...scene, body: e.target.value })}
          placeholder="Décrivez les enjeux géohistoriques de cette scène..."
          style={{ width: '100%', padding: '6px 8px', fontSize: '0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', resize: 'vertical' }}
        />
      </div>

      {/* Capture État de Carte */}
      <button 
        onClick={handleCaptureCamera}
        className="btn btn-secondary"
        style={{ width: '100%', fontSize: '0.75rem', gap: '6px', justifyContent: 'center' }}
      >
        <Camera size={14} /> Capturer le cadrage carte & la date actuelle ({currentTime})
      </button>

      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Centre : [{scene.mapState.center[0].toFixed(2)}, {scene.mapState.center[1].toFixed(2)}] • Zoom : {scene.mapState.zoom.toFixed(1)} • Date : {scene.mapState.timelineYear || currentTime}
      </div>

      {/* Layout & Profil de Transition */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            <Layout size={12} style={{ display: 'inline', marginRight: '3px' }} /> Disposition Bento
          </label>
          <select 
            value={scene.layout}
            onChange={(e) => onUpdateScene({ ...scene, layout: e.target.value as StoryLayout })}
            style={{ width: '100%', padding: '4px', fontSize: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }}
          >
            <option value="split">Split (Texte + Carte)</option>
            <option value="map-full">Carte plein écran</option>
            <option value="map-text">Focus Texte</option>
            <option value="media-focus">Focus Média</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            <Zap size={12} style={{ display: 'inline', marginRight: '3px' }} /> Profil Vitesse / Vol
          </label>
          <select 
            value={currentTransition.profile}
            onChange={(e) => onUpdateScene({
              ...scene,
              transition: { ...currentTransition, profile: e.target.value as TransitionProfile }
            })}
            style={{ width: '100%', padding: '4px', fontSize: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }}
          >
            <option value="documentary">Documentaire (Lent - 0.6x)</option>
            <option value="standard">Standard (1.2x)</option>
            <option value="dynamic">Dynamique (Rapide - 2.2x)</option>
            <option value="cut">Coupe Nette (Saut instantané)</option>
            <option value="custom">Personnalisé</option>
          </select>
        </div>
      </div>

      {/* Mode de Durée (Automatique vs Imposé) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '4px', borderTop: '1px dashed var(--border-color)' }}>
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            <Clock size={12} style={{ display: 'inline', marginRight: '3px' }} /> Régime de Durée
          </label>
          <select 
            value={currentTransition.durationMode}
            onChange={(e) => onUpdateScene({
              ...scene,
              transition: { ...currentTransition, durationMode: e.target.value as DurationMode }
            })}
            style={{ width: '100%', padding: '4px', fontSize: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }}
          >
            <option value="auto">Automatique (Profil de vitesse)</option>
            <option value="fixed">Durée imposée (Fixe ms)</option>
          </select>
        </div>

        {currentTransition.durationMode === 'fixed' ? (
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Durée de vol (ms)
            </label>
            <input 
              type="number"
              value={currentTransition.durationMs || 3000}
              onChange={(e) => onUpdateScene({
                ...scene,
                transition: { ...currentTransition, durationMs: parseInt(e.target.value) || 3000 }
              })}
              step={500}
              min={1000}
              max={15000}
              style={{ width: '100%', padding: '4px', fontSize: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }}
            />
          </div>
        ) : (
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Pause lecture (ms)
            </label>
            <input 
              type="number"
              value={currentTransition.pauseAfterMs ?? 800}
              onChange={(e) => onUpdateScene({
                ...scene,
                transition: { ...currentTransition, pauseAfterMs: parseInt(e.target.value) || 800 }
              })}
              step={200}
              min={200}
              max={10000}
              style={{ width: '100%', padding: '4px', fontSize: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }}
            />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        <ShieldCheck size={12} color="var(--accent-primary)" />
        <span>Attente d'état idle activée pour la netteté du rendu vidéo</span>
      </div>

      {/* Édition de Diapositive d'Appui */}
      <button 
        onClick={() => {
          if (onOpenSlideEditor) onOpenSlideEditor();
        }}
        className="btn btn-primary"
        style={{ width: '100%', fontSize: '0.8rem', gap: '6px', justifyContent: 'center', marginTop: '4px' }}
      >
        <span>★</span> Éditer la Diapositive d'Appui ({scene.blocks?.length || 0} éléments)
      </button>
    </div>
  );
};

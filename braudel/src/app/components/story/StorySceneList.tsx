import React from 'react';
import { StoryScene } from '../../../core/schema/story';
import { Plus, Trash2, ArrowUp, ArrowDown, MapPin } from 'lucide-react';

interface StorySceneListProps {
  scenes: StoryScene[];
  activeSceneId: string | null;
  onSelectScene: (sceneId: string) => void;
  onAddScene: () => void;
  onDeleteScene: (sceneId: string) => void;
  onMoveScene: (index: number, direction: 'up' | 'down') => void;
}

export const StorySceneList: React.FC<StorySceneListProps> = ({
  scenes,
  activeSceneId,
  onSelectScene,
  onAddScene,
  onDeleteScene,
  onMoveScene
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Scènes du Récit ({scenes.length})
        </span>
        <button 
          onClick={onAddScene}
          className="btn btn-primary"
          style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
        >
          <Plus size={14} /> Nouvelle Scène
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
        {scenes.map((scene, idx) => {
          const isActive = scene.id === activeSceneId;
          return (
            <div 
              key={scene.id}
              onClick={() => onSelectScene(scene.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                background: isActive ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', minWidth: '18px' }}>
                  #{idx + 1}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {scene.title || 'Scène sans titre'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={10} /> Z{Math.round(scene.mapState.zoom)} • An {scene.mapState.timelineYear || 1800}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onMoveScene(idx, 'up'); }}
                  disabled={idx === 0}
                  className="btn"
                  style={{ padding: '2px 4px', background: 'transparent' }}
                  title="Monter"
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onMoveScene(idx, 'down'); }}
                  disabled={idx === scenes.length - 1}
                  className="btn"
                  style={{ padding: '2px 4px', background: 'transparent' }}
                  title="Descendre"
                >
                  <ArrowDown size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteScene(scene.id); }}
                  className="btn"
                  style={{ padding: '2px 4px', background: 'transparent', color: 'var(--accent-danger)' }}
                  title="Supprimer"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// app/components/welcome/ExistingWorldsList.tsx

import React from 'react';
import { Globe, Calendar, Play, Copy, Trash2 } from 'lucide-react';

interface ExistingWorldsListProps {
  worldsList: any[];
  onOpenWorld: (worldId: string) => void;
  onDuplicateWorld: (worldId: string, name: string) => void;
  onDeleteWorld: (worldId: string, name: string) => void;
}

export const ExistingWorldsList: React.FC<ExistingWorldsListProps> = ({
  worldsList,
  onOpenWorld,
  onDuplicateWorld,
  onDeleteWorld,
}) => {
  if (!worldsList || worldsList.length === 0) return null;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Globe size={18} style={{ color: 'var(--accent-primary)' }} /> Mondes Existants ({worldsList.length})
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
        {worldsList.map((w: any) => (
          <div
            key={w.id}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s ease',
            }}
          >
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {w.name}
              </div>
              {w.description && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {w.description}
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} /> {w.worldType === 'fictional' ? 'Fictif / Tolkien' : 'Historique'} ({w.startYear ?? -3000} à {w.endYear ?? 2100})
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
              <button
                onClick={() => onOpenWorld(w.id)}
                className="btn btn-primary"
                style={{ flex: 1, padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
              >
                <Play size={13} /> Ouvrir
              </button>

              <button
                onClick={() => onDuplicateWorld(w.id, w.name)}
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                title="Dupliquer"
              >
                <Copy size={13} />
              </button>

              <button
                onClick={() => onDeleteWorld(w.id, w.name)}
                className="btn"
                style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--accent-danger)' }}
                title="Supprimer"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

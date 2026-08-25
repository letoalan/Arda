// app/components/ia/ProposalSubEntitiesList.tsx

import React from 'react';
import { Trash2 } from 'lucide-react';
import type { AISubEntity } from '../../../types/ia';

interface ProposalSubEntitiesListProps {
  subEntities: AISubEntity[];
  onToggleSubEntity: (subId: string) => void;
  onRemoveSubEntity: (subId: string) => void;
}

export const ProposalSubEntitiesList: React.FC<ProposalSubEntitiesListProps> = ({
  subEntities,
  onToggleSubEntity,
  onRemoveSubEntity,
}) => {
  if (subEntities.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
      {subEntities.map((sub) => (
        <div
          key={sub.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: sub.selected !== false ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
            border: '1px solid',
            borderColor: sub.selected !== false ? 'rgba(59, 130, 246, 0.3)' : 'var(--border-color)',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
            <input
              type="checkbox"
              checked={sub.selected !== false}
              onChange={() => onToggleSubEntity(sub.id)}
              style={{ accentColor: 'var(--accent-primary)' }}
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{sub.name}</span>
            <span style={{ fontSize: '0.72rem', opacity: 0.6, textTransform: 'capitalize' }}>({sub.type})</span>
          </label>

          <button
            onClick={() => onRemoveSubEntity(sub.id)}
            className="icon-btn danger"
            style={{ padding: '4px' }}
            title="Supprimer la sous-entité"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

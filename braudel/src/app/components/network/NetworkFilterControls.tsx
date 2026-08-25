// app/components/network/NetworkFilterControls.tsx

import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import type { NetworkFilters } from '../../../core/network';

interface NetworkFilterControlsProps {
  networkFilters: NetworkFilters;
  uniqueTypes: string[];
  onUpdateFilters: (updates: Partial<NetworkFilters>) => void;
  onResetFilters: () => void;
}

export const NetworkFilterControls: React.FC<NetworkFilterControlsProps> = ({
  networkFilters,
  uniqueTypes,
  onUpdateFilters,
  onResetFilters,
}) => {
  return (
    <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={14} /> Filtres de Graphe
        </h4>
        <button className="btn btn-secondary" onClick={onResetFilters} style={{ fontSize: '0.72rem', padding: '2px 6px', gap: '4px' }}>
          <RotateCcw size={12} /> Réinitialiser
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Poids Min ({networkFilters.minWeight ?? 0})</label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={networkFilters.minWeight ?? 0}
            onChange={(e) => onUpdateFilters({ minWeight: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Poids Max ({networkFilters.maxWeight ?? 10})</label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={networkFilters.maxWeight ?? 10}
            onChange={(e) => onUpdateFilters({ maxWeight: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {uniqueTypes.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
          {uniqueTypes.map((t) => {
            const isSelected = !networkFilters.types || networkFilters.types.includes(t);
            return (
              <button
                key={t}
                onClick={() => {
                  const currentTypes = networkFilters.types || uniqueTypes;
                  const newTypes = isSelected ? currentTypes.filter((x) => x !== t) : [...currentTypes, t];
                  onUpdateFilters({ types: newTypes });
                }}
                className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.72rem', padding: '2px 6px' }}
              >
                {t}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

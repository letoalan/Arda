// app/components/network/NetworkToolbar.tsx

import React from 'react';
import { Activity, Network, BarChart2 } from 'lucide-react';

interface NetworkToolbarProps {
  explorationMode: boolean;
  selectedEntityId: string | null;
  trimLeaves: boolean;
  sizeMetric: 'degree' | 'betweenness' | 'closeness';
  onToggleExploration: () => void;
  onToggleTrimLeaves: () => void;
  onChangeSizeMetric: (metric: 'degree' | 'betweenness' | 'closeness') => void;
}

export const NetworkToolbar: React.FC<NetworkToolbarProps> = ({
  explorationMode,
  selectedEntityId,
  trimLeaves,
  sizeMetric,
  onToggleExploration,
  onToggleTrimLeaves,
  onChangeSizeMetric,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        zIndex: 10,
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        background: 'rgba(23, 26, 33, 0.85)',
        backdropFilter: 'blur(10px)',
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <button
        onClick={onToggleExploration}
        className={`btn ${explorationMode ? 'btn-primary' : 'btn-secondary'}`}
        disabled={!selectedEntityId}
        style={{ fontSize: '0.75rem', padding: '4px 8px', gap: '4px' }}
        title={selectedEntityId ? "Mode Égo-Réseau (Centré sur l'entité)" : "Sélectionnez une entité d'abord"}
      >
        <Activity size={13} /> Égo-Réseau
      </button>

      <button
        onClick={onToggleTrimLeaves}
        className={`btn ${trimLeaves ? 'btn-primary' : 'btn-secondary'}`}
        style={{ fontSize: '0.75rem', padding: '4px 8px', gap: '4px' }}
      >
        <Network size={13} /> Tronquer les feuilles
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <BarChart2 size={13} /> Taille :
        <select
          value={sizeMetric}
          onChange={(e) => onChangeSizeMetric(e.target.value as any)}
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '2px 4px',
            fontSize: '0.75rem',
          }}
        >
          <option value="degree">Degré</option>
          <option value="betweenness">Intermédiarité</option>
          <option value="closeness">Proximité</option>
        </select>
      </div>
    </div>
  );
};

// app/components/continent/ContinentToolbar.tsx

import React from 'react';
import type { TerrainFeatureType } from '../../views/ContinentBuilderView';

interface ContinentToolbarProps {
  selectedFeatureType: TerrainFeatureType;
  drawingMode: 'click' | 'freehand';
  currentDraftName: string;
  onSelectFeatureType: (type: TerrainFeatureType) => void;
  onSelectDrawingMode: (mode: 'click' | 'freehand') => void;
  onChangeDraftName: (name: string) => void;
  onClearAll: () => void;
}

export const ContinentToolbar: React.FC<ContinentToolbarProps> = ({
  selectedFeatureType,
  drawingMode,
  currentDraftName,
  onSelectFeatureType,
  onSelectDrawingMode,
  onChangeDraftName,
  onClearAll,
}) => {
  return (
    <div
      style={{
        padding: '12px 20px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Type de Relief :</label>
        <select
          className="select-field"
          value={selectedFeatureType}
          onChange={(e) => onSelectFeatureType(e.target.value as TerrainFeatureType)}
          style={{ fontSize: '0.8rem', padding: '4px 8px', width: '150px' }}
        >
          <option value="continent">Continent / Terre</option>
          <option value="mountain">Chaîne de Montagnes</option>
          <option value="hills">Collines</option>
          <option value="valley">Vallée</option>
          <option value="ridge">Dorsale / Crête</option>
        </select>

        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '8px' }}>Mode Tracer :</label>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className={`btn ${drawingMode === 'click' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onSelectDrawingMode('click')}
            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
          >
            Clic par Clic
          </button>
          <button
            className={`btn ${drawingMode === 'freehand' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onSelectDrawingMode('freehand')}
            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
          >
            Main Levée
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="text"
          className="input-field"
          placeholder="Nom du relief (optionnel)..."
          value={currentDraftName}
          onChange={(e) => onChangeDraftName(e.target.value)}
          style={{ fontSize: '0.8rem', width: '200px' }}
        />
        <button className="btn btn-secondary" onClick={onClearAll} style={{ fontSize: '0.75rem', color: '#ef4444' }}>
          Effacer Tout
        </button>
      </div>
    </div>
  );
};

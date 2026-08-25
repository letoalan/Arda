// app/components/style/ReliefControlsSection.tsx

import React from 'react';
import { Wand2 } from 'lucide-react';

interface ReliefControlsSectionProps {
  exaggeration: number;
  shadowColor: string;
  highlightColor: string;
  onChangeExaggeration: (val: number) => void;
  onChangeShadowColor: (val: string) => void;
  onChangeHighlightColor: (val: string) => void;
  onApplyChanges: () => void;
  onApplyPreset: (preset: 'soft' | 'dramatic') => void;
}

export const ReliefControlsSection: React.FC<ReliefControlsSectionProps> = ({
  exaggeration,
  shadowColor,
  highlightColor,
  onChangeExaggeration,
  onChangeShadowColor,
  onChangeHighlightColor,
  onApplyChanges,
  onApplyPreset,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
          Exagération du relief ({exaggeration}x)
        </label>
        <input 
          type="range" 
          min="0" 
          max="3" 
          step="0.1" 
          value={exaggeration} 
          onChange={(e) => onChangeExaggeration(parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Ombre
          </label>
          <input 
            type="color" 
            value={shadowColor} 
            onChange={(e) => onChangeShadowColor(e.target.value)}
            style={{ width: '100%', height: '32px', cursor: 'pointer', background: 'none', border: 'none' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Lumière
          </label>
          <input 
            type="color" 
            value={highlightColor} 
            onChange={(e) => onChangeHighlightColor(e.target.value)}
            style={{ width: '100%', height: '32px', cursor: 'pointer', background: 'none', border: 'none' }}
          />
        </div>
      </div>

      <button className="btn btn-primary" onClick={onApplyChanges} style={{ width: '100%', marginTop: '4px' }}>
        Appliquer les ombrages
      </button>

      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <button className="btn btn-secondary" onClick={() => onApplyPreset('soft')} style={{ flex: 1, fontSize: '0.75rem' }}>
          <Wand2 size={14} /> Ombrage Doux
        </button>
        <button className="btn btn-secondary" onClick={() => onApplyPreset('dramatic')} style={{ flex: 1, fontSize: '0.75rem' }}>
          <Wand2 size={14} /> Dramatique
        </button>
      </div>
    </div>
  );
};

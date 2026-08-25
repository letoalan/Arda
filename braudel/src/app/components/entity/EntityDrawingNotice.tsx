// app/components/entity/EntityDrawingNotice.tsx

import React from 'react';
import { Check } from 'lucide-react';

interface EntityDrawingNoticeProps {
  drawingEntityId: string | null;
  onFinishDrawing: () => void;
  onCancelDrawing: () => void;
}

export const EntityDrawingNotice: React.FC<EntityDrawingNoticeProps> = ({
  drawingEntityId,
  onFinishDrawing,
  onCancelDrawing,
}) => {
  if (!drawingEntityId) return null;

  return (
    <div
      style={{
        padding: '12px',
        marginBottom: '16px',
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <span style={{ fontSize: '0.875rem', color: '#3B82F6' }}>
        Mode dessin actif — Dessinez sur la carte, puis cliquez Terminer.
      </span>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn btn-primary" onClick={onFinishDrawing} style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '4px' }}>
          <Check size={16} /> Terminer
        </button>
        <button className="btn" onClick={onCancelDrawing} style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '4px', fontSize: '0.85rem' }}>
          Annuler
        </button>
      </div>
    </div>
  );
};

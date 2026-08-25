// app/components/entity/EntityDetailsCard.tsx

import React from 'react';
import { Navigation, Edit3, Move, Eraser, BookOpen } from 'lucide-react';
import { useStore } from '../../state/store';
import type { Entity } from '../../../core/schema/types';

interface EntityDetailsCardProps {
  selectedEntity: Entity;
  onStartDrawing: (entityId: string, type: 'Point' | 'LineString' | 'Polygon', geometry?: any, modeOverride?: 'simple_select' | 'direct_select') => void;
  onClearGeometry: (entityId: string) => void;
}

export const EntityDetailsCard: React.FC<EntityDetailsCardProps> = ({
  selectedEntity,
  onStartDrawing,
  onClearGeometry,
}) => {
  const setWikiModalEntityId = useStore((s) => s.setWikiModalEntityId);
  return (
    <div
      style={{
        marginTop: '16px',
        padding: '12px',
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
        border: '1px solid var(--glass-border)',
      }}
    >
      <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
        Détails : {selectedEntity.name}
      </h4>

      {selectedEntity.geometry && selectedEntity.geometry.type === 'Point' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '6px' }}>
          <Navigation size={16} color="#3B82F6" />
          <div>
            <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--text-muted)' }}>Coordonnées</p>
            <p style={{ fontSize: '0.9rem', margin: '4px 0 0', fontFamily: 'monospace' }}>
              {selectedEntity.geometry.coordinates[1].toFixed(6)}° N, {selectedEntity.geometry.coordinates[0].toFixed(6)}° E
            </p>
          </div>
        </div>
      ) : selectedEntity.geometry ? (
        <div style={{ padding: '8px', textAlign: 'center', background: 'var(--bg-tertiary)', borderRadius: '6px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0 }}>Géométrie : {selectedEntity.geometry.type}</p>
        </div>
      ) : (
        <div style={{ padding: '8px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Aucune géométrie définie</p>
        </div>
      )}

      {selectedEntity.geometry && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1, fontSize: '0.8rem', padding: '6px' }}
            onClick={() => onStartDrawing(selectedEntity.id, selectedEntity.geometry!.type as any, selectedEntity.geometry, 'direct_select')}
          >
            <Edit3 size={14} /> Éditer
          </button>
          <button
            className="btn"
            style={{ flex: 1, fontSize: '0.8rem', padding: '6px' }}
            onClick={() => onStartDrawing(selectedEntity.id, selectedEntity.geometry!.type as any, selectedEntity.geometry, 'simple_select')}
          >
            <Move size={14} /> Déplacer
          </button>
          <button
            className="btn danger"
            style={{ flex: 1, fontSize: '0.8rem', padding: '6px', color: 'var(--accent-danger)' }}
            onClick={() => {
              if (window.confirm('Voulez-vous vraiment effacer cette géométrie pour la redessiner ?')) {
                onClearGeometry(selectedEntity.id);
              }
            }}
          >
            <Eraser size={14} /> Effacer
          </button>
        </div>
      )}

      <div style={{ marginTop: '12px' }}>
        <button
          className="btn"
          style={{
            width: '100%',
            fontSize: '0.85rem',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: selectedEntity.wikiContent ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-tertiary)',
            color: selectedEntity.wikiContent ? '#F59E0B' : 'var(--text-secondary)',
            border: selectedEntity.wikiContent ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--glass-border)'
          }}
          onClick={() => setWikiModalEntityId(selectedEntity.id)}
        >
          <BookOpen size={14} /> {selectedEntity.wikiContent ? 'Consulter la Fiche Wiki' : 'Rédiger une Fiche Wiki'}
        </button>
      </div>
    </div>
  );
};


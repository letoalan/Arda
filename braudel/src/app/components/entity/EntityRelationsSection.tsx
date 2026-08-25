// app/components/entity/EntityRelationsSection.tsx

import React, { useState } from 'react';
import { GitCommit, Plus } from 'lucide-react';
import type { Entity } from '../../../core/schema/types';

interface EntityRelationsSectionProps {
  entities: Entity[];
  onAddRelation: (
    sourceId: string,
    targetId: string,
    type: string,
    direction: 'directed' | 'undirected' | 'bidirectional',
    weight?: number
  ) => void;
}

export const EntityRelationsSection: React.FC<EntityRelationsSectionProps> = ({
  entities,
  onAddRelation,
}) => {
  const [convSourceId, setConvSourceId] = useState('');
  const [convTargetId, setConvTargetId] = useState('');
  const [convType, setConvType] = useState('');
  const [convDirection, setConvDirection] = useState<'directed' | 'undirected' | 'bidirectional'>('directed');
  const [convWeight, setConvWeight] = useState<number | ''>('');

  const handleAddRelation = () => {
    if (convSourceId && convTargetId && convType.trim() && convSourceId !== convTargetId) {
      const weightVal = convWeight !== '' ? Number(convWeight) : 1;
      onAddRelation(convSourceId, convTargetId, convType.trim(), convDirection, weightVal);
      setConvType('');
      setConvWeight('');
    }
  };

  return (
    <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
      <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <GitCommit size={14} /> Création Rapide de Relation
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <select
          className="select-field"
          value={convSourceId}
          onChange={(e) => setConvSourceId(e.target.value)}
        >
          <option value="">-- Source --</option>
          {entities.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>

        <select
          className="select-field"
          value={convTargetId}
          onChange={(e) => setConvTargetId(e.target.value)}
        >
          <option value="">-- Cible --</option>
          {entities.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          className="input-field"
          placeholder="Type de relation (ex: alliance, commerce...)"
          value={convType}
          onChange={(e) => setConvType(e.target.value)}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <select
            className="select-field"
            value={convDirection}
            onChange={(e) => setConvDirection(e.target.value as any)}
          >
            <option value="directed">Orientée (→)</option>
            <option value="undirected">Non orientée (—)</option>
            <option value="bidirectional">Bidirectionnelle (↔)</option>
          </select>

          <input
            type="number"
            className="input-field"
            placeholder="Poids (ex: 1.5)"
            value={convWeight}
            onChange={(e) => setConvWeight(e.target.value !== '' ? Number(e.target.value) : '')}
          />
        </div>

        <button
          className="btn btn-secondary"
          onClick={handleAddRelation}
          disabled={!convSourceId || !convTargetId || !convType.trim() || convSourceId === convTargetId}
        >
          <Plus size={14} /> Ajouter la relation
        </button>
      </div>
    </div>
  );
};

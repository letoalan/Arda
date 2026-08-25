// app/components/entity/EntityAddForm.tsx

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Layer } from '../../../core/schema/types';

interface EntityAddFormProps {
  layers: Layer[];
  onAddEntity: (name: string, layerId: string, validFrom?: number, validTo?: number) => void;
}

export const EntityAddForm: React.FC<EntityAddFormProps> = ({ layers, onAddEntity }) => {
  const [newEntityName, setNewEntityName] = useState('');
  const [selectedLayer, setSelectedLayer] = useState<string>('');
  const [validFrom, setValidFrom] = useState<string>('');
  const [validTo, setValidTo] = useState<string>('');

  const handleAdd = () => {
    const layerToUse = selectedLayer || layers[0]?.id;
    if (newEntityName.trim() && layerToUse) {
      const vFrom = validFrom !== '' ? Number(validFrom) : undefined;
      const vTo = validTo !== '' ? Number(validTo) : undefined;

      if (vFrom !== undefined && vTo !== undefined && vFrom > vTo) {
        alert('L\'année de début doit être inférieure ou égale à l\'année de fin.');
        return;
      }

      onAddEntity(newEntityName.trim(), layerToUse, vFrom, vTo);
      setNewEntityName('');
      setValidFrom('');
      setValidTo('');
    }
  };

  return (
    <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <input
        type="text"
        className="input-field"
        placeholder="Nom de l'entité..."
        value={newEntityName}
        onChange={(e) => setNewEntityName(e.target.value)}
      />

      <select
        className="select-field"
        value={selectedLayer || (layers[0]?.id ?? '')}
        onChange={(e) => setSelectedLayer(e.target.value)}
      >
        {layers.map((l) => (
          <option key={l.id} value={l.id}>
            Couche : {l.name} ({l.type})
          </option>
        ))}
      </select>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <input
          type="number"
          className="input-field"
          placeholder="Début (ex: -1200)"
          value={validFrom}
          onChange={(e) => setValidFrom(e.target.value)}
        />
        <input
          type="number"
          className="input-field"
          placeholder="Fin (ex: 476)"
          value={validTo}
          onChange={(e) => setValidTo(e.target.value)}
        />
      </div>

      <button className="btn btn-primary" onClick={handleAdd} disabled={!newEntityName.trim()}>
        <Plus size={16} /> Ajouter l'entité
      </button>
    </div>
  );
};

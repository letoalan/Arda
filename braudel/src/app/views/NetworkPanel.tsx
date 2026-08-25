// views/NetworkPanel.tsx

import React, { useState, useMemo } from 'react';
import { useStore } from '../state/store';
import { filterNetwork } from '../../core/network';
import { Network, Plus, Trash2 } from 'lucide-react';
import { getCenter } from '../../utils/geometry';
import { NetworkFilterControls } from '../components/network/NetworkFilterControls';

export const NetworkPanel: React.FC = () => {
  const { 
    world, 
    networkFilters, 
    setNetworkFilters, 
    addRelation, 
    removeRelation, 
    addEntity, 
    updateEntityGeometry, 
    updateEntityProperties,
    setSelectedEntity,
  } = useStore();

  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [type, setType] = useState('');
  const [direction, setDirection] = useState<'directed' | 'undirected' | 'bidirectional'>('directed');
  const [weight, setWeight] = useState<number | ''>('');
  const [spatialMode, setSpatialMode] = useState<'none' | 'new' | 'existing'>('none');
  const [existingEntityId, setExistingEntityId] = useState('');
  const [entityName, setEntityName] = useState('');
  const [validFrom, setValidFrom] = useState<number | ''>('');
  const [validTo, setValidTo] = useState<number | ''>('');

  const handleAdd = () => {
    if (sourceId && targetId && type.trim() && sourceId !== targetId) {
      if (spatialMode === 'new' && !entityName.trim()) {
        alert('Veuillez entrer un nom pour la relation spatiale.');
        return;
      }
      
      let newEntityId = undefined;
      const relationIsSpatial = spatialMode !== 'none';
      
      if (spatialMode === 'new') {
        const sourceEnt = world.entities.find(e => e.id === sourceId);
        const targetEnt = world.entities.find(e => e.id === targetId);
        
        if (sourceEnt) {
          const from = validFrom !== '' ? validFrom : undefined;
          const to = validTo !== '' ? validTo : undefined;
          newEntityId = addEntity(sourceEnt.layerId, entityName.trim(), 'concept', from, to);
          updateEntityProperties(newEntityId, { isRelation: true });
          
          if (sourceEnt.geometry && targetEnt?.geometry) {
            const center1 = getCenter(sourceEnt.geometry);
            const center2 = getCenter(targetEnt.geometry);
            if (center1 && center2) {
              updateEntityGeometry(newEntityId, {
                type: 'LineString',
                coordinates: [center1, center2]
              });
            }
          }
        }
      } else if (spatialMode === 'existing') {
        if (!existingEntityId) {
          alert('Veuillez sélectionner un figuré existant.');
          return;
        }
        newEntityId = existingEntityId;
        updateEntityProperties(newEntityId, { isRelation: true });
      }

      const from = validFrom !== '' ? validFrom : undefined;
      const to = validTo !== '' ? validTo : undefined;
      addRelation(sourceId, targetId, type.trim(), direction, weight !== '' ? weight : undefined, relationIsSpatial, newEntityId, from, to);
      
      setType('');
      setWeight('');
      setSpatialMode('none');
      setEntityName('');
      setExistingEntityId('');
      setValidFrom('');
      setValidTo('');
    }
  };

  const entities = world.entities;
  const filteredRelations = useMemo(() => {
    return filterNetwork(world.relations, entities as any, networkFilters);
  }, [world.relations, entities, networkFilters]);

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(world.relations.map(r => r.type)));
  }, [world.relations]);

  return (
    <div className="panel-content" style={{ borderBottom: '1px solid var(--glass-border)' }}>
      <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', color: 'var(--text-secondary)' }}>
        <Network size={18} /> Réseau & Flux Spatio-Temporels
      </h3>

      <NetworkFilterControls
        networkFilters={networkFilters}
        uniqueTypes={uniqueTypes}
        onUpdateFilters={(updates) => setNetworkFilters({ ...networkFilters, ...updates })}
        onResetFilters={() => setNetworkFilters({ minWeight: undefined, maxWeight: undefined, types: undefined })}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <select className="select-field" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
          <option value="">-- Source --</option>
          {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>

        <select className="select-field" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
          <option value="">-- Cible --</option>
          {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>

        <input
          type="text"
          className="input-field"
          placeholder="Type (ex: alliance, commerce...)"
          value={type}
          onChange={(e) => setType(e.target.value)}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <select className="select-field" value={direction} onChange={(e) => setDirection(e.target.value as any)}>
            <option value="directed">Orientée (→)</option>
            <option value="undirected">Non-orientée (—)</option>
            <option value="bidirectional">Bidirectionnelle (↔)</option>
          </select>

          <input
            type="number"
            className="input-field"
            placeholder="Poids (ex: 1.0)"
            value={weight}
            onChange={(e) => setWeight(e.target.value !== '' ? Number(e.target.value) : '')}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={!sourceId || !targetId || !type.trim() || sourceId === targetId}
        >
          <Plus size={16} /> Ajouter la relation
        </button>
      </div>

      <div style={{ marginTop: '16px' }}>
        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Relations ({filteredRelations.length})
        </h4>
        <div className="list-container" style={{ maxHeight: '180px', overflowY: 'auto' }}>
          {filteredRelations.map(r => {
            const s = entities.find(e => e.id === r.sourceId);
            const t = entities.find(e => e.id === r.targetId);
            return (
              <div key={r.id} className="list-item" onClick={() => setSelectedEntity(r.id)}>
                <span style={{ fontSize: '0.8rem' }}>
                  {s?.name || 'Inconnu'} {r.direction === 'directed' ? '→' : r.direction === 'bidirectional' ? '↔' : '—'} {t?.name || 'Inconnu'}
                  <span style={{ opacity: 0.6, marginLeft: '6px' }}>({r.type})</span>
                </span>
                <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); removeRelation(r.id); }}>
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

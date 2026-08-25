import React, { useState } from 'react';
import { useStore } from '../state/store';
import { Layers, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

export const LayerPanel: React.FC = () => {
  const { world, addLayer, toggleLayerVisibility, removeLayer } = useStore();
  const [newLayerName, setNewLayerName] = useState('');

  const handleAdd = () => {
    if (newLayerName.trim()) {
      addLayer(newLayerName.trim(), 'physical');
      setNewLayerName('');
    }
  };

  return (
    <div className="panel-content" style={{ borderBottom: '1px solid var(--glass-border)' }}>
      <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', color: 'var(--text-secondary)' }}>
        <Layers size={18} /> Couches
      </h3>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input 
          className="input-field"
          value={newLayerName} 
          onChange={(e) => setNewLayerName(e.target.value)} 
          placeholder="Nouvelle couche" 
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button className="btn btn-primary" onClick={handleAdd} title="Ajouter">
          <Plus size={16} />
        </button>
      </div>
      <ul className="list-container">
        {world.layers.map(layer => (
          <li key={layer.id} className="list-item animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                className="icon-btn" 
                onClick={() => toggleLayerVisibility(layer.id)}
                title={layer.visible ? "Masquer" : "Afficher"}
              >
                {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <span style={{ fontSize: '0.9rem', opacity: layer.visible ? 1 : 0.5 }}>{layer.name}</span>
            </div>
            <button className="icon-btn danger" onClick={() => removeLayer(layer.id)} title="Supprimer">
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

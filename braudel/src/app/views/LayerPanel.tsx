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
        {world.layers.map(layer => {
          const isAlpha = layer.order === 0 || (layer.meta as any)?.isBaseLayer || layer.name.includes('(Alpha)');
          const entityCount = world.entities.filter(e => e.layerId === layer.id).length;

          return (
            <li 
              key={layer.id} 
              className="list-item animate-fade-in"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md, 6px)',
                background: isAlpha ? 'rgba(56, 189, 248, 0.05)' : undefined,
                border: isAlpha ? '1px solid rgba(56, 189, 248, 0.18)' : undefined
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <button 
                  className="icon-btn" 
                  onClick={() => toggleLayerVisibility(layer.id)}
                  title={layer.visible ? "Masquer la couche" : "Afficher la couche"}
                >
                  {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span 
                      style={{ 
                        fontSize: '0.9rem', 
                        opacity: layer.visible ? 1 : 0.5,
                        fontWeight: isAlpha ? 600 : 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {layer.name}
                    </span>
                    {isAlpha && (
                      <span 
                        style={{ 
                          fontSize: '0.65rem', 
                          padding: '1px 5px', 
                          borderRadius: '4px', 
                          background: 'rgba(56, 189, 248, 0.15)', 
                          color: '#38bdf8', 
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          fontWeight: 600,
                          letterSpacing: '0.02em'
                        }}
                      >
                        Alpha
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary, #888)' }}>
                    {entityCount} entité{entityCount > 1 ? 's' : ''} • {layer.type}
                  </span>
                </div>
              </div>
              <button 
                className="icon-btn danger" 
                onClick={() => {
                  if (world.layers.length <= 1) {
                    alert('Impossible de supprimer la seule couche du projet.');
                    return;
                  }
                  if (isAlpha && !confirm('Attention : vous êtes sur le point de supprimer la couche socle Alpha. Les entités géopolitiques associées seront supprimées. Confirmer ?')) {
                    return;
                  }
                  removeLayer(layer.id);
                }} 
                title="Supprimer la couche"
              >
                <Trash2 size={16} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

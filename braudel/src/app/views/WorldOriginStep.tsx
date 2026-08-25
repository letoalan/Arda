import React, { useState } from 'react';
import { Globe, Sparkles, Check } from 'lucide-react';
import { STYLE_CONFIGS } from '../../core/styles.config';

interface WorldOriginStepProps {
  onWorldTypeSelected: (worldType: 'real' | 'fictional', basemapStyle?: string) => void;
  onBack?: () => void;
}

export const WorldOriginStep: React.FC<WorldOriginStepProps> = ({ onWorldTypeSelected, onBack }) => {
  const [selectedType, setSelectedType] = useState<'real' | 'fictional' | null>(null);
  const [selectedBasemap, setSelectedBasemap] = useState<string>('contemporary_current');

  const handleTypeClick = (type: 'real' | 'fictional') => {
    if (type === 'fictional') {
      onWorldTypeSelected('fictional');
    } else {
      setSelectedType('real');
    }
  };

  const handleCreateRealWorld = () => {
    onWorldTypeSelected('real', selectedBasemap);
  };

  return (
    <div className="welcome-card" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {onBack && (
          <button 
            onClick={onBack}
            className="btn"
            style={{ padding: '4px 10px', fontSize: '0.75rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}
          >
            ← Retour
          </button>
        )}
        <h3 style={{ textAlign: 'center', color: 'var(--text-primary)', margin: 0, flex: 1 }}>
          Type de monde
        </h3>
        {onBack && <div style={{ width: '65px' }} />}
      </div>
      
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button 
          className={`btn ${selectedType === 'real' ? 'btn-primary' : ''}`}
          onClick={() => handleTypeClick('real')}
          style={{ flex: 1, padding: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
        >
          <Globe size={22} />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Braudel</div>
            <small style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', marginTop: '2px' }}>Carte du monde réel</small>
          </div>
        </button>

        <button 
          className="btn"
          onClick={() => handleTypeClick('fictional')}
          style={{ flex: 1, padding: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
        >
          <Sparkles size={22} />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Tolkien</div>
            <small style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', marginTop: '2px' }}>Monde imaginaire</small>
          </div>
        </button>
      </div>

      {selectedType === 'real' && (
        <div style={{ 
          marginTop: '12px', 
          paddingTop: '16px', 
          borderTop: '1px solid var(--glass-border)',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px' 
        }}>
          <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 4px 0', textAlign: 'center' }}>
            Choisir le fond de carte initial
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '110px', overflowY: 'auto', paddingRight: '4px' }}>
            {STYLE_CONFIGS.map((config) => (
              <div 
                key={config.id}
                onClick={() => setSelectedBasemap(config.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  backgroundColor: selectedBasemap === config.id ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-secondary)',
                  border: selectedBasemap === config.id ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{config.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Époque : {config.era}</div>
                </div>
                {selectedBasemap === config.id && (
                  <Check size={14} style={{ color: 'var(--accent-primary)' }} />
                )}
              </div>
            ))}
          </div>

          <button 
            className="btn btn-primary"
            onClick={handleCreateRealWorld}
            style={{ width: '100%', padding: '10px', marginTop: '4px' }}
          >
            Créer le monde (Braudel)
          </button>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { GeojsonFamily } from '../../../core/schema/geojson-catalog';
import { Landmark, Globe, Map, Anchor, Search, Filter } from 'lucide-react';

interface CatalogFiltersProps {
  selectedFamily: GeojsonFamily | 'all';
  searchQuery: string;
  scopeFilter: 'all' | 'timeline';
  timelineCount: number;
  totalCount: number;
  onSelectFamily: (family: GeojsonFamily | 'all') => void;
  onSearchChange: (query: string) => void;
  onSelectScope: (scope: 'all' | 'timeline') => void;
}

export const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  selectedFamily,
  searchQuery,
  scopeFilter,
  timelineCount,
  totalCount,
  onSelectFamily,
  onSearchChange,
  onSelectScope
}) => {
  const families: { id: GeojsonFamily | 'all'; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Tous', icon: null },
    { id: 'historical', label: 'Historique', icon: <Landmark size={12} /> },
    { id: 'contemporary', label: 'Contemporain', icon: <Globe size={12} /> },
    { id: 'administrative', label: 'Territoires', icon: <Map size={12} /> },
    { id: 'maritime', label: 'Maritime', icon: <Anchor size={12} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
      {/* Portée : Tout le catalogue vs Période du projet */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={() => onSelectScope('all')}
          className="btn"
          style={{
            flex: 1,
            fontSize: '0.72rem',
            padding: '4px',
            background: scopeFilter === 'all' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            color: scopeFilter === 'all' ? 'white' : 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          Tous les fonds ({totalCount})
        </button>
        <button
          onClick={() => onSelectScope('timeline')}
          className="btn"
          style={{
            flex: 1,
            fontSize: '0.72rem',
            padding: '4px',
            background: scopeFilter === 'timeline' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            color: scopeFilter === 'timeline' ? 'white' : 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <Filter size={11} /> Projet ({timelineCount})
        </button>
      </div>

      {/* Barre de recherche */}
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: '8px', top: '8px', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher un fond, pays, époque..."
          style={{
            width: '100%',
            padding: '6px 8px 6px 28px',
            fontSize: '0.8rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-sm)'
          }}
        />
      </div>

      {/* Onglets par famille */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {families.map(fam => {
          const isActive = selectedFamily === fam.id;
          return (
            <button
              key={fam.id}
              onClick={() => onSelectFamily(fam.id)}
              className="btn"
              style={{
                fontSize: '0.73rem',
                padding: '3px 7px',
                gap: '4px',
                background: isActive ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                color: isActive ? 'white' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              {fam.icon}
              {fam.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};


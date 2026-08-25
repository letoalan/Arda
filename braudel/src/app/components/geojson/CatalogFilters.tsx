import React from 'react';
import { GeojsonFamily } from '../../../core/schema/geojson-catalog';
import { Landmark, Globe, Map, Anchor, Search } from 'lucide-react';

interface CatalogFiltersProps {
  selectedFamily: GeojsonFamily | 'all';
  searchQuery: string;
  onSelectFamily: (family: GeojsonFamily | 'all') => void;
  onSearchChange: (query: string) => void;
}

export const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  selectedFamily,
  searchQuery,
  onSelectFamily,
  onSearchChange
}) => {
  const families: { id: GeojsonFamily | 'all'; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Tous', icon: null },
    { id: 'historical', label: 'Historique', icon: <Landmark size={12} /> },
    { id: 'contemporary', label: 'Contemporain', icon: <Globe size={12} /> },
    { id: 'administrative', label: 'Territoires', icon: <Map size={12} /> },
    { id: 'maritime', label: 'Maritime', icon: <Anchor size={12} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
      {/* Barre de recherche */}
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: '8px', top: '8px', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher un fond cartographique..."
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
                fontSize: '0.75rem',
                padding: '4px 8px',
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

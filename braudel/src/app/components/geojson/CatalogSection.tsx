// app/components/geojson/CatalogSection.tsx

import React, { useState, useMemo } from 'react';
import { GeojsonFamily, GeojsonCatalogEntry } from '../../../core/schema/geojson-catalog';
import { getCatalogEntries, searchCatalogEntries } from '../../../services/import/geojson-catalog-service';
import { CatalogFilters } from './CatalogFilters';
import { CatalogEntryCard } from './CatalogEntryCard';

interface CatalogSectionProps {
  loadingCatalogId: string | null;
  onOpenPreview: (entry: GeojsonCatalogEntry) => void;
}

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  loadingCatalogId,
  onOpenPreview,
}) => {
  const [selectedCatalogFamily, setSelectedCatalogFamily] = useState<GeojsonFamily | 'all'>('all');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState<string>('');

  const filteredCatalogEntries = useMemo(() => {
    let entries = getCatalogEntries(selectedCatalogFamily === 'all' ? undefined : selectedCatalogFamily);
    if (catalogSearchQuery) {
      entries = searchCatalogEntries(catalogSearchQuery);
    }
    return entries;
  }, [selectedCatalogFamily, catalogSearchQuery]);

  return (
    <div style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid var(--border-color)' }}>
      <CatalogFilters 
        selectedFamily={selectedCatalogFamily}
        searchQuery={catalogSearchQuery}
        onSelectFamily={setSelectedCatalogFamily}
        onSearchChange={setCatalogSearchQuery}
      />

      <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
        {filteredCatalogEntries.map(entry => (
          <CatalogEntryCard 
            key={entry.id}
            entry={entry}
            isLoading={loadingCatalogId === entry.id}
            onImport={onOpenPreview}
          />
        ))}
      </div>
    </div>
  );
};

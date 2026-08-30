// app/components/geojson/CatalogSection.tsx

import React, { useState, useMemo } from 'react';
import { GeojsonFamily, GeojsonCatalogEntry } from '../../../core/schema/geojson-catalog';
import { getCatalogEntries, GEOJSON_CATALOG_REGISTRY } from '../../../services/import/geojson-catalog-service';
import { CatalogFilters } from './CatalogFilters';
import { CatalogEntryCard } from './CatalogEntryCard';
import { Eye, Clock } from 'lucide-react';

interface CatalogSectionProps {
  loadingCatalogId: string | null;
  currentTime?: number;
  startYear?: number;
  endYear?: number;
  onOpenPreview: (entry: GeojsonCatalogEntry, customStartYear?: number, customEndYear?: number) => void;
  onSetTimelineYear?: (year: number) => void;
}

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  loadingCatalogId,
  currentTime,
  startYear,
  endYear,
  onOpenPreview,
  onSetTimelineYear,
}) => {
  const [selectedCatalogFamily, setSelectedCatalogFamily] = useState<GeojsonFamily | 'all'>('all');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState<string>('');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'timeline'>('all');

  const effectiveStart = typeof startYear === 'number' ? startYear : -3000;
  const effectiveEnd = typeof endYear === 'number' ? endYear : 2100;

  // Entrée du catalogue la plus proche de l'année actuelle de la timeline
  const activeTimelineEntry = useMemo(() => {
    if (currentTime === undefined) return null;
    const historicalEntries = GEOJSON_CATALOG_REGISTRY.filter(
      e => e.referenceYear !== undefined && (e.family === 'historical' || e.family === 'contemporary')
    ).sort((a, b) => (a.referenceYear ?? 0) - (b.referenceYear ?? 0));

    let candidate = historicalEntries[0] || null;
    for (const entry of historicalEntries) {
      if (entry.referenceYear! <= currentTime) {
        candidate = entry;
      } else {
        break;
      }
    }
    return candidate;
  }, [currentTime]);

  const timelineEntriesCount = useMemo(() => {
    return GEOJSON_CATALOG_REGISTRY.filter(e => {
      const year = e.referenceYear ?? e.temporalRange?.[0];
      return year !== undefined && year >= effectiveStart && year <= effectiveEnd;
    }).length;
  }, [effectiveStart, effectiveEnd]);

  const filteredCatalogEntries = useMemo(() => {
    let list = getCatalogEntries(
      selectedCatalogFamily === 'all' ? undefined : selectedCatalogFamily,
      catalogSearchQuery
    );

    if (scopeFilter === 'timeline') {
      list = list.filter(e => {
        const year = e.referenceYear ?? e.temporalRange?.[0];
        return year === undefined || (year >= effectiveStart && year <= effectiveEnd);
      });
    }

    return list;
  }, [selectedCatalogFamily, catalogSearchQuery, scopeFilter, effectiveStart, effectiveEnd]);

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Période active sur la timeline courante */}
      {activeTimelineEntry && (
        <div style={{
          marginBottom: '12px',
          padding: '8px 10px',
          background: 'rgba(59, 130, 246, 0.08)',
          borderRadius: '6px',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={11} /> Période Timeline Active (An {currentTime})
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-primary)', marginTop: '2px' }}>
              {activeTimelineEntry.label}
            </div>
          </div>
          <button
            onClick={() => onOpenPreview(activeTimelineEntry)}
            disabled={loadingCatalogId !== null}
            className="btn btn-secondary"
            style={{ fontSize: '0.72rem', padding: '4px 8px', gap: '4px', flexShrink: 0 }}
            title="Prévisualiser et importer les frontières de cette époque"
          >
            <Eye size={12} /> {loadingCatalogId === activeTimelineEntry.id ? 'Chargement…' : 'Prévisualiser'}
          </button>
        </div>
      )}

      <CatalogFilters 
        selectedFamily={selectedCatalogFamily}
        searchQuery={catalogSearchQuery}
        scopeFilter={scopeFilter}
        timelineCount={timelineEntriesCount}
        totalCount={GEOJSON_CATALOG_REGISTRY.length}
        onSelectFamily={setSelectedCatalogFamily}
        onSearchChange={setCatalogSearchQuery}
        onSelectScope={setScopeFilter}
      />

      <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '2px' }}>
        {filteredCatalogEntries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Aucun fond cartographique ne correspond à votre filtre.
          </div>
        ) : (
          filteredCatalogEntries.map(entry => (
            <CatalogEntryCard 
              key={entry.id}
              entry={entry}
              isLoading={loadingCatalogId === entry.id}
              onImport={onOpenPreview}
              onSetTimelineYear={onSetTimelineYear}
            />
          ))
        )}
      </div>
    </div>
  );
};


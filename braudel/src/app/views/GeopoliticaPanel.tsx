// views/GeopoliticaPanel.tsx

import React, { useState, useEffect } from 'react';
import { useStore } from '../state/store';
import { Database } from 'lucide-react';
import { GeojsonCatalogEntry } from '../../core/schema/geojson-catalog';
import { buildCandidateIndex, ImportCandidate } from '../../services/import/candidateIndexer';
import { normalizeSelectedFeatures } from '../../services/import/geopoliticaImporter';
import { ImportPreviewModal } from '../components/geojson/ImportPreviewModal';
import { CatalogSection } from '../components/geojson/CatalogSection';

export const GeopoliticaPanel: React.FC = () => {
  const { world, currentTime, startYear, endYear, importBatchEntities, setCurrentTime } = useStore();
  const worldType = world.world[0]?.worldType || 'real';
  const worldId = world.world[0]?.id || 'world-1';

  const [loadingCatalogId, setLoadingCatalogId] = useState<string | null>(null);

  // Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewCandidates, setPreviewCandidates] = useState<ImportCandidate[]>([]);
  const [targetLayerId, setTargetLayerId] = useState('');

  useEffect(() => {
    if (world.layers.length > 0 && !targetLayerId) {
      setTargetLayerId(world.layers[0].id);
    }
  }, [world.layers, targetLayerId]);

  const handleOpenCatalogPreview = async (
    entry: GeojsonCatalogEntry,
    customStartYear?: number,
    customEndYear?: number
  ) => {
    setLoadingCatalogId(entry.id);
    try {
      const resp = await fetch(entry.url);
      if (!resp.ok) {
        throw new Error(`HTTP Error ${resp.status}`);
      }
      const geojson = await resp.json();
      const features = geojson.features || [];

      const candidates = buildCandidateIndex(features, {
        sourceId: entry.id,
        sourceType: 'catalogue',
        family: entry.family,
        referenceYear: entry.referenceYear,
        defaultStartYear: customStartYear ?? entry.referenceYear ?? entry.temporalRange?.[0] ?? -3000,
        defaultEndYear: customEndYear ?? entry.temporalRange?.[1] ?? 2100,
        label: entry.label,
      });

      setPreviewTitle(entry.label);
      setPreviewCandidates(candidates);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error(`Erreur de chargement pour ${entry.label}:`, err);
      alert(`Impossible de charger le fond "${entry.label}". Vérifiez le chemin ou la connexion.`);
    } finally {
      setLoadingCatalogId(null);
    }
  };

  const handleConfirmImport = async (selectedCandidates: ImportCandidate[], chosenLayerId: string) => {
    setIsPreviewOpen(false);
    if (selectedCandidates.length === 0) return;

    const importBatchId = `batch-${Date.now()}`;
    const normalizedEntities = normalizeSelectedFeatures(
      selectedCandidates,
      chosenLayerId || targetLayerId || world.layers[0]?.id || 'layer-1',
      worldId,
      importBatchId
    );

    await importBatchEntities(normalizedEntities, previewTitle);
  };

  if (worldType !== 'real') return null;

  return (
    <div className="panel-content" style={{ borderBottom: '1px solid var(--glass-border)' }}>
      {/* SECTION CATALOGUE UNIFIÉ */}
      <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
        <Database size={16} /> Catalogue GeoJSON & Fonds Cartographiques
      </h3>

      <CatalogSection
        loadingCatalogId={loadingCatalogId}
        currentTime={currentTime}
        startYear={startYear}
        endYear={endYear}
        onOpenPreview={handleOpenCatalogPreview}
        onSetTimelineYear={setCurrentTime}
      />

      {/* Modale d'importation et de sélection de polygones */}
      <ImportPreviewModal
        isOpen={isPreviewOpen}
        sourceTitle={previewTitle}
        candidates={previewCandidates}
        layers={world.layers as any[]}
        defaultLayerId={targetLayerId}
        onConfirm={handleConfirmImport}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
};


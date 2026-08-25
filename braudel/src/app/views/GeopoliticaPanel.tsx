// views/GeopoliticaPanel.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../state/store';
import { GEOPOLITICA_SOURCES } from '../../services/import/geopoliticaRegistry';
import { Layers, Database } from 'lucide-react';
import { GeojsonCatalogEntry } from '../../core/schema/geojson-catalog';
import { buildCandidateIndex, ImportCandidate } from '../../services/import/candidateIndexer';
import { normalizeSelectedFeatures } from '../../services/import/geopoliticaImporter';
import { ImportPreviewModal } from '../components/geojson/ImportPreviewModal';
import { CatalogSection } from '../components/geojson/CatalogSection';

const SORTED_SOURCES = [...GEOPOLITICA_SOURCES].sort((a, b) => a.referenceYear - b.referenceYear);

export const GeopoliticaPanel: React.FC = () => {
  const { world, startYear, endYear, importProgress, importBatchEntities } = useStore();
  const worldType = world.world[0]?.worldType || 'real';
  const worldId = world.world[0]?.id || 'world-1';

  const [loadingCatalogId, setLoadingCatalogId] = useState<string | null>(null);

  // Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewCandidates, setPreviewCandidates] = useState<ImportCandidate[]>([]);

  // Core state
  const [enabled, setEnabled] = useState(false);
  const [targetLayerId, setTargetLayerId] = useState('');

  // Filter sources within the project timeline
  const effectiveStart = typeof startYear === 'number' ? startYear : -3000;
  const effectiveEnd = typeof endYear === 'number' ? endYear : 2100;

  const availableSources = useMemo(() =>
    SORTED_SOURCES.filter(s => s.referenceYear >= effectiveStart && s.referenceYear <= effectiveEnd),
    [effectiveStart, effectiveEnd]
  );

  useEffect(() => {
    if (world.layers.length > 0 && !targetLayerId) {
      setTargetLayerId(world.layers[0].id);
    }
  }, [world.layers, targetLayerId]);

  const handleOpenCatalogPreview = async (entry: GeojsonCatalogEntry) => {
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
        defaultStartYear: entry.referenceYear ?? entry.temporalRange?.[0] ?? -3000,
        defaultEndYear: entry.temporalRange?.[1] ?? 2100,
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

  const handleOpenGeopoliticaPreview = async () => {
    if (availableSources.length === 0) return;
    setLoadingCatalogId('geopolitica-batch');

    try {
      const allCandidates: ImportCandidate[] = [];

      for (const source of availableSources) {
        const resp = await fetch(source.url);
        if (!resp.ok) continue;
        const geojson = await resp.json();
        const candidates = buildCandidateIndex(geojson.features || [], {
          sourceId: source.id,
          sourceType: 'geopolitica',
          referenceYear: source.referenceYear,
          defaultStartYear: source.referenceYear,
          defaultEndYear: source.referenceYear + 1000,
          label: source.label,
        });
        allCandidates.push(...candidates);
      }

      setPreviewTitle(`Géopolitica (${availableSources.length} périodes)`);
      setPreviewCandidates(allCandidates);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error("Erreur d'indexation Géopolitica:", err);
      alert("Erreur lors de la préparation de la prévisualisation Géopolitica.");
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

  const isImporting = importProgress !== null || loadingCatalogId !== null;

  return (
    <div className="panel-content" style={{ borderBottom: '1px solid var(--glass-border)' }}>
      <h3 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
        <Database size={16} /> Catalogue GeoJSON & Fonds Cartographiques
      </h3>

      <CatalogSection
        loadingCatalogId={loadingCatalogId}
        onOpenPreview={handleOpenCatalogPreview}
      />

      <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Layers size={14} /> Importateur Sélectif Géopolitica
      </h4>

      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '10px' }}>
        <input
          type="checkbox"
          checked={enabled}
          disabled={isImporting}
          onChange={(e) => setEnabled(e.target.checked)}
          style={{ width: '15px', height: '15px', accentColor: 'var(--accent-primary)' }}
        />
        <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>Activer la sélection par période</span>
      </label>

      {enabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            className="btn btn-primary"
            onClick={handleOpenGeopoliticaPreview}
            disabled={availableSources.length === 0 || !targetLayerId || isImporting}
            style={{ width: '100%', padding: '8px', fontSize: '0.8rem' }}
          >
            {isImporting ? `Chargement…` : `Prévisualiser & Sélectionner (${availableSources.length} périodes)`}
          </button>
        </div>
      )}

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

// services/import/geopoliticaImporter.ts

import type { Entity } from '../../core/schema/types';
import type { GeopoliticaImportConfig, GeopoliticaSourceFile } from '../../core/schema/geopoliticaImport';
import type { ImportCandidate } from './candidateIndexer';

export function computeAutomaticRange(
  sources: GeopoliticaSourceFile[],
  currentId: string,
): [number, number] {
  const sorted = [...sources].sort((a, b) => a.referenceYear - b.referenceYear);
  const idx = sorted.findIndex((s) => s.id === currentId);
  if (idx < 0) return [-3000, 2100];
  const start = sorted[idx].referenceYear;
  const end = idx + 1 < sorted.length ? sorted[idx + 1].referenceYear : start + 1000;
  return [start, end];
}

function resolveDisplayName(props: Record<string, any>): string {
  if (props.NAME && props.NAME !== 'Unknown') return props.NAME;
  if (props.nom && props.nom !== 'Unknown') return props.nom;
  if (props.nom_reg) return props.nom_reg;
  if (props.SUBJECTO && props.SUBJECTO !== 'Unknown') return props.SUBJECTO;
  if (props.label) return props.label;
  if (props.name) return props.name;
  if (props.CONTINENT) return `Zone non identifiée (${props.CONTINENT})`;
  return 'Entité inconnue';
}

export function normalizeSelectedFeatures(
  selectedCandidates: ImportCandidate[],
  targetLayerId: string,
  worldId: string,
  importBatchId: string
): Entity[] {
  return selectedCandidates.map((candidate) => {
    const props = candidate.rawFeatureRef.properties || {};
    const name = candidate.name || resolveDisplayName(props);

    const validFrom = candidate.validFrom ?? -3000;
    const validTo = candidate.validTo ?? 2100;

    const color = candidate.family === 'maritime' ? '#06B6D4' : '#3B82F6';

    return {
      id: crypto.randomUUID(),
      worldId,
      layerId: targetLayerId,
      type: 'place',
      name,
      geometry: candidate.rawFeatureRef.geometry as any,
      temporalRange: {
        validFrom,
        validTo,
      },
      properties: {
        importBatchId,
        sourceCatalogId: candidate.sourceId,
        sourceType: candidate.sourceType,
        sourceMeta: {
          originalName: name,
          partOf: props.PARTOF ?? props.partOf ?? 'Unknown',
          continent: props.CONTINENT ?? props.continent ?? 'Unknown',
          borderPrecision: props.BORDERPRECISION ?? 1,
          sourceFileId: candidate.sourceId,
          importBatchId,
        },
        fillOpacity: 0.4,
        strokeOpacity: 0.8,
        lineWidth: 1,
        color,
      },
    };
  });
}

export async function importGeopoliticaLayer(
  config: GeopoliticaImportConfig,
  availableSources: GeopoliticaSourceFile[],
  existingEntities: Entity[],
  worldId: string,
): Promise<Entity[]> {
  const newEntities: Entity[] = [];
  const batchId = `batch-${Date.now()}`;

  for (const selection of config.selections) {
    const source = availableSources.find((s) => s.id === selection.sourceId);
    if (!source) continue;

    const response = await fetch(source.url);
    const geojson = await response.json();

    const temporalRange =
      config.mode === 'automatic'
        ? computeAutomaticRange(availableSources, source.id)
        : selection.temporalRangeOverride ?? [source.referenceYear, source.referenceYear + 1000];

    for (const feature of geojson.features) {
      const name = resolveDisplayName(feature.properties ?? {});

      const included =
        selection.selectedNames.includes('*') || selection.selectedNames.includes(name);
      if (!included) continue;

      const geometry = feature.geometry;

      const conflicting = config.mergeWithExisting
        ? existingEntities.find((e) => (e.properties?.sourceMeta as any)?.originalName === name)
        : undefined;

      const entity: Entity = {
        id: conflicting?.id ?? crypto.randomUUID(),
        worldId,
        layerId: config.targetLayerId,
        type: 'place',
        name,
        geometry,
        temporalRange: {
          validFrom: temporalRange[0],
          validTo: temporalRange[1]
        },
        properties: {
          importBatchId: batchId,
          sourceMeta: {
            originalName: name,
            partOf: feature.properties?.PARTOF ?? 'Unknown',
            continent: feature.properties?.CONTINENT ?? 'Unknown',
            borderPrecision: feature.properties?.BORDERPRECISION ?? 1,
            sourceFileId: source.id,
            importBatchId: batchId,
          },
          fillOpacity: 0.35,
          strokeOpacity: 0.8,
          lineWidth: 1,
          color: '#3B82F6',
        },
      };

      newEntities.push(entity);
    }
  }

  return newEntities;
}

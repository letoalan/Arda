// services/import/candidateIndexer.ts

import type { Feature } from 'geojson';
import type { GeojsonFamily } from '../../core/schema/geojson-catalog';

export type ImportCandidate = {
  tempId: string;
  name: string;
  sourceId: string;
  sourceType: 'geopolitica' | 'catalogue';
  family?: GeojsonFamily;
  referenceYear?: number;
  validFrom?: number;
  validTo?: number;
  geometryType: string;
  approxSizeKB: number;
  continent?: string;
  partOf?: string;
  rawFeatureRef: Feature;
};

export interface CandidateSourceMeta {
  sourceId: string;
  sourceType: 'geopolitica' | 'catalogue';
  family?: GeojsonFamily;
  referenceYear?: number;
  defaultStartYear?: number;
  defaultEndYear?: number;
  label?: string;
}

function resolveCandidateName(props: Record<string, any>, defaultLabel?: string): string {
  if (props.NAME && props.NAME !== 'Unknown') return props.NAME;
  if (props.nom && props.nom !== 'Unknown') return props.nom;
  if (props.nom_reg) return props.nom_reg;
  if (props.SUBJECTO && props.SUBJECTO !== 'Unknown') return props.SUBJECTO;
  if (props.label) return props.label;
  if (props.name) return props.name;
  if (props.CONTINENT) return `Zone non identifiée (${props.CONTINENT})`;
  return defaultLabel || 'Entité sans nom';
}

export function buildCandidateIndex(
  features: Feature[],
  sourceMeta: CandidateSourceMeta
): ImportCandidate[] {
  return features.map((feature, idx) => {
    const props = feature.properties || {};
    const name = resolveCandidateName(props, sourceMeta.label);
    const geometryType = feature.geometry ? feature.geometry.type : 'Unknown';
    const jsonStr = JSON.stringify(feature);
    const approxSizeKB = Math.ceil(new Blob([jsonStr]).size / 1024);

    const validFrom = sourceMeta.defaultStartYear ?? sourceMeta.referenceYear ?? -3000;
    const validTo = sourceMeta.defaultEndYear ?? (sourceMeta.referenceYear !== undefined ? sourceMeta.referenceYear + 1000 : 2100);

    return {
      tempId: `cand-${sourceMeta.sourceId}-${idx}-${Date.now()}`,
      name,
      sourceId: sourceMeta.sourceId,
      sourceType: sourceMeta.sourceType,
      family: sourceMeta.family,
      referenceYear: sourceMeta.referenceYear,
      validFrom,
      validTo,
      geometryType,
      approxSizeKB,
      continent: props.CONTINENT || props.continent || undefined,
      partOf: props.PARTOF || props.partOf || undefined,
      rawFeatureRef: feature,
    };
  });
}

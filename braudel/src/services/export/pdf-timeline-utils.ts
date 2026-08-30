// services/export/pdf-timeline-utils.ts

import { GEOPOLITICA_SOURCES } from '../import/geopoliticaRegistry';

export interface TimelineEpochItem {
  year: number; // Année de référence / début de période (ex: -500)
  targetYear: number; // Année médiane de capture (ex: -450 pour [-500, -400])
  validFrom: number;
  validTo: number;
  label: string;
  source: 'imported' | 'geopolitica' | 'entity' | 'relation';
  isImportedOnMap: boolean;
  entityCount: number;
}

/**
 * Extrait toutes les époques / années distinctes contenant des apports :
 * - Calcule l'instant médian précis au milieu de chaque période (ex: -500 --> -400 = -450)
 * - Les époques qui ont des entités/couches réellement importées sur la carte (`isImportedOnMap`)
 * - Les années des entités et relations définies dans le projet
 * - Les années de référence des sources Géopolitica (dans la plage temporelle du projet)
 */
export function extractActiveEpochs(
  entities: any[] = [],
  relations: any[] = [],
  minYear: number = -3000,
  maxYear: number = 2100
): TimelineEpochItem[] {
  const epochsMap = new Map<number, TimelineEpochItem>();

  const sortedGeopolitica = [...GEOPOLITICA_SOURCES].sort((a, b) => a.referenceYear - b.referenceYear);

  const getRange = (temporalRange: any): [number | undefined, number | undefined] => {
    if (!temporalRange) return [undefined, undefined];
    if (Array.isArray(temporalRange)) {
      return [
        typeof temporalRange[0] === 'number' ? temporalRange[0] : undefined,
        typeof temporalRange[1] === 'number' ? temporalRange[1] : undefined,
      ];
    }
    return [
      typeof temporalRange.validFrom === 'number' ? temporalRange.validFrom : undefined,
      typeof temporalRange.validTo === 'number' ? temporalRange.validTo : undefined,
    ];
  };

  // 1. Détection des entités et couches réellement présentes sur la carte
  for (const entity of entities) {
    const [yFromRaw, yToRaw] = getRange(entity.temporalRange);
    if (yFromRaw !== undefined) {
      const yFrom = yFromRaw;
      const yTo = yToRaw !== undefined ? yToRaw : yFrom;
      if (yFrom >= minYear && yFrom <= maxYear) {
        const isFromCatalog = !!(entity.properties?.importBatchId || entity.properties?.sourceCatalogId || entity.properties?.sourceMeta?.sourceFileId);
        
        if (!epochsMap.has(yFrom)) {
          const yearStr = yFrom < 0 ? `${Math.abs(yFrom)} av. J.-C.` : `An ${yFrom}`;
          const midYear = Math.round((yFrom + yTo) / 2);
          epochsMap.set(yFrom, {
            year: yFrom,
            targetYear: midYear,
            validFrom: yFrom,
            validTo: yTo,
            label: isFromCatalog 
              ? (getHistoricalPeriodLabel(yFrom) || `Fond importé (${yearStr})`)
              : `Entités du projet (${yearStr})`,
            source: isFromCatalog ? 'imported' : 'entity',
            isImportedOnMap: true,
            entityCount: 0,
          });
        } else {
          const existing = epochsMap.get(yFrom)!;
          if (isFromCatalog) {
            existing.isImportedOnMap = true;
            existing.source = 'imported';
          }
        }
      }
    }
  }

  // 2. Années des relations
  for (const relation of relations) {
    const [yFromRaw, yToRaw] = getRange(relation.temporalRange);
    if (yFromRaw !== undefined) {
      const yFrom = yFromRaw;
      const yTo = yToRaw !== undefined ? yToRaw : yFrom;
      if (yFrom >= minYear && yFrom <= maxYear) {
        if (!epochsMap.has(yFrom)) {
          const yearStr = yFrom < 0 ? `${Math.abs(yFrom)} av. J.-C.` : `An ${yFrom}`;
          const midYear = Math.round((yFrom + yTo) / 2);
          epochsMap.set(yFrom, {
            year: yFrom,
            targetYear: midYear,
            validFrom: yFrom,
            validTo: yTo,
            label: `Relations & flux (${yearStr})`,
            source: 'relation',
            isImportedOnMap: true,
            entityCount: 0,
          });
        } else {
          epochsMap.get(yFrom)!.isImportedOnMap = true;
        }
      }
    }
  }

  // 3. Époques Géopolitica de référence dans la plage temporelle du projet avec calcul du milieu de période
  for (let i = 0; i < sortedGeopolitica.length; i++) {
    const source = sortedGeopolitica[i];
    const yFrom = source.referenceYear;
    const yTo = i + 1 < sortedGeopolitica.length ? sortedGeopolitica[i + 1].referenceYear : yFrom + 50;

    if (yFrom >= minYear && yFrom <= maxYear) {
      const midYear = Math.round((yFrom + yTo) / 2);
      if (!epochsMap.has(yFrom)) {
        epochsMap.set(yFrom, {
          year: yFrom,
          targetYear: midYear,
          validFrom: yFrom,
          validTo: yTo,
          label: source.label,
          source: 'geopolitica',
          isImportedOnMap: false,
          entityCount: 0,
        });
      } else {
        const item = epochsMap.get(yFrom)!;
        item.validTo = yTo;
        item.targetYear = midYear;
      }
    }
  }

  // Calcul du nombre d'entités et relations actives pour chaque époque
  const sortedEpochs = Array.from(epochsMap.values()).sort((a, b) => a.year - b.year);

  for (const epoch of sortedEpochs) {
    const t = epoch.targetYear;
    const activeEntCount = entities.filter(e => {
      if (e.properties?.isRelation) return false;
      if (!e.temporalRange) return true;
      const [from, to] = getRange(e.temporalRange);
      const f = from ?? -Infinity;
      const o = to ?? Infinity;
      // Valide au point médian OU chevauchant la tranche de l'époque
      return (f <= t && o >= t) || (f <= epoch.validTo && o >= epoch.validFrom);
    }).length;

    const activeRelCount = relations.filter(r => {
      if (!r.temporalRange) return true;
      const [from, to] = getRange(r.temporalRange);
      const f = from ?? -Infinity;
      const o = to ?? Infinity;
      return (f <= t && o >= t) || (f <= epoch.validTo && o >= epoch.validFrom);
    }).length;

    epoch.entityCount = activeEntCount + activeRelCount;
    if (epoch.entityCount > 0) {
      epoch.isImportedOnMap = true;
    }
  }

  return sortedEpochs;
}



/**
 * Trouve le label de l'époque correspondant le mieux à une année donnée
 */
export function getHistoricalPeriodLabel(year: number): string | undefined {
  if (!GEOPOLITICA_SOURCES.length) return undefined;
  const sorted = [...GEOPOLITICA_SOURCES].sort((a, b) => a.referenceYear - b.referenceYear);
  let candidate = sorted[0];
  for (const source of sorted) {
    if (source.referenceYear <= year) {
      candidate = source;
    } else {
      break;
    }
  }
  return candidate?.label;
}

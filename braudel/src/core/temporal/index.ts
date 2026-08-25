/**
 * core/temporal — Utilitaires de filtrage temporel isolés.
 * Arbitrage : on modélise le temps comme un entier (année), compatible
 * avec validFrom/validTo dans TemporalRange. Pas de gestion de calendrier complexe en V1.
 */

export interface TemporalRange {
  validFrom: number;
  validTo: number;
}

export interface TemporallyBounded {
  temporalRange?: TemporalRange;
}

/**
 * Détermine si un objet borné temporellement est visible à l'année donnée.
 * Un objet sans temporalRange est toujours visible (existence permanente).
 */
export const isVisibleAt = (item: TemporallyBounded, year: number): boolean => {
  if (!item.temporalRange) return true;
  return year >= item.temporalRange.validFrom && year <= item.temporalRange.validTo;
};

/**
 * Filtre une liste d'objets temporellement bornés pour une année donnée.
 */
export const filterByTime = <T extends TemporallyBounded>(items: T[], year: number): T[] =>
  items.filter(item => isVisibleAt(item, year));

/**
 * Vérifie qu'un TemporalRange est cohérent (validFrom <= validTo).
 */
export const isValidTemporalRange = (range: TemporalRange): boolean =>
  range.validFrom <= range.validTo;

/**
 * Calcule l'union temporelle de plusieurs ranges.
 * Retourne undefined si la liste est vide.
 */
export const unionTemporalRange = (ranges: TemporalRange[]): TemporalRange | undefined => {
  if (ranges.length === 0) return undefined;
  return {
    validFrom: Math.min(...ranges.map(r => r.validFrom)),
    validTo: Math.max(...ranges.map(r => r.validTo)),
  };
};

/**
 * Vérifie si deux ranges temporels se chevauchent.
 */
export const overlapsTemporalRange = (a: TemporalRange, b: TemporalRange): boolean =>
  a.validFrom <= b.validTo && b.validFrom <= a.validTo;

// services/timeline/changepoints.ts

export interface TemporalEntity {
  id: string;
  temporalRange: [number, number]; // [validFrom, validTo]
}

/**
 * Calcule tous les instants où l'ensemble des entités actives change (points de rupture).
 * Complexité : O(n log n), n = nombre d'entités avec temporalRange.
 */
export function computeChangepoints(entities: TemporalEntity[]): number[] {
  const points = new Set<number>();
  for (const e of entities) {
    if (e.temporalRange && Array.isArray(e.temporalRange) && e.temporalRange.length >= 2) {
      if (typeof e.temporalRange[0] === 'number') points.add(e.temporalRange[0]);
      if (typeof e.temporalRange[1] === 'number') points.add(e.temporalRange[1]);
    }
  }
  return Array.from(points).sort((a, b) => a - b);
}

/**
 * Renvoie le prochain point de rupture strictement supérieur à `currentTime`.
 * Retourne `null` si la timeline est épuisée (fin de catalogue).
 */
export function getNextChangepoint(
  currentTime: number,
  changepoints: number[]
): number | null {
  for (const t of changepoints) {
    if (t > currentTime) return t;
  }
  return null;
}

/**
 * Renvoie le point de rupture immédiatement antérieur à `currentTime` (période -1).
 */
export function getPreviousChangepoint(
  currentTime: number,
  changepoints: number[]
): number | null {
  for (let i = changepoints.length - 1; i >= 0; i--) {
    if (changepoints[i] < currentTime) return changepoints[i];
  }
  return null;
}


/**
 * Détermine la liste complète ordonnée des instants de capture pour garantir une couverture exhaustive.
 * Pour obtenir une couverture complète, le point de départ se positionne sur la période antérieure (offset -1 / époque précédente).
 */
export function computeCoverageTimelineYears(
  startYearParam: number,
  changepoints: number[],
  maxPages = 200
): number[] {
  if (changepoints.length === 0) return [startYearParam];

  // Le point de départ effectif est l'instant demandé (qui correspond à la période -1)
  const effectiveStart = startYearParam;

  const result: number[] = [effectiveStart];
  let current = effectiveStart;

  while (result.length < maxPages) {
    const next = getNextChangepoint(current, changepoints);
    if (next === null) break;
    current = next;
    result.push(current);
  }

  return result;
}



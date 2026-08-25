/**
 * core/network — Utilitaires de validation et filtrage du réseau ANT.
 * Arbitrage V1 : pas d'analyse topologique avancée (centralité, chemin court).
 * On garantit uniquement la cohérence référentielle (pas d'orphelins).
 */

import { isVisibleAt, TemporallyBounded } from '../temporal/index';

export interface NetworkNode extends TemporallyBounded {
  id: string;
}

export interface NetworkEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  direction: 'directed' | 'undirected' | 'bidirectional';
  weight?: number;
  isSpatial?: boolean;
  entityId?: string;
}

export interface NetworkFilters {
  type?: string;
  types?: string[];
  minWeight?: number;
  maxWeight?: number;
  start?: number;
  end?: number;
}

/**
 * Vérifie que sourceId et targetId d'une relation référencent des entités existantes.
 */
export const isRelationValid = (edge: NetworkEdge, nodeIds: Set<string>): boolean =>
  nodeIds.has(edge.sourceId) && nodeIds.has(edge.targetId);

/**
 * Filtre les relations orphelines (dont source ou cible n'existe plus).
 */
export const filterOrphanedRelations = <T extends NetworkEdge>(
  relations: T[],
  entities: NetworkNode[]
): T[] => {
  const nodeIds = new Set(entities.map(e => e.id));
  return relations.filter(r => isRelationValid(r, nodeIds));
};

/**
 * Retourne les relations qui impliquent un nœud donné (en source ou en cible).
 */
export const getRelationsForNode = <T extends NetworkEdge>(
  relations: T[],
  nodeId: string
): T[] => relations.filter(r => r.sourceId === nodeId || r.targetId === nodeId);

/**
 * Retourne les voisins directs d'un nœud.
 */
export const getNeighbors = (relations: NetworkEdge[], nodeId: string): string[] => {
  const neighbors = new Set<string>();
  for (const rel of relations) {
    if (rel.sourceId === nodeId) neighbors.add(rel.targetId);
    if (rel.targetId === nodeId) neighbors.add(rel.sourceId);
  }
  return Array.from(neighbors);
};

/**
 * Filtre les relations par type.
 */
export const filterByType = <T extends NetworkEdge>(relations: T[], type: string): T[] =>
  relations.filter(r => r.type === type);

/**
 * Retourne les types uniques de relations présents dans le réseau.
 */
export const getUniqueRelationTypes = (relations: NetworkEdge[]): string[] =>
  Array.from(new Set(relations.map(r => r.type)));

/**
 * Filter relations based on provided filters.
 */
export const filterNetwork = (
  relations: NetworkEdge[],
  entities: NetworkNode[],
  filters: NetworkFilters = {}
): NetworkEdge[] => {
  let result = relations;

  if (filters.type) {
    result = filterByType(result, filters.type);
  }

  if (filters.minWeight !== undefined || filters.maxWeight !== undefined) {
    result = result.filter(edge => {
      const weight = edge.weight ?? 0;
      if (filters.minWeight !== undefined && weight < filters.minWeight) return false;
      if (filters.maxWeight !== undefined && weight > filters.maxWeight) return false;
      return true;
    });
  }

  if (filters.start !== undefined || filters.end !== undefined) {
    const startYear = filters.start ?? -Infinity;
    const endYear = filters.end ?? Infinity;
    const nodeMap = new Map(entities.map(e => [e.id, e]));
    result = result.filter(rel => {
      const source = nodeMap.get(rel.sourceId);
      const target = nodeMap.get(rel.targetId);
      if (!source || !target) return false;
      const sourceVisible = isVisibleAt(source, startYear) && isVisibleAt(source, endYear);
      const targetVisible = isVisibleAt(target, startYear) && isVisibleAt(target, endYear);
      return sourceVisible && targetVisible;
    });
  }

  return result;
};

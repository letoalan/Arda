import { EntitySchema } from '../schema/entities';
import { RelationSchema } from '../schema/relations';

export interface NodeMetrics {
  degree: number;
  reducedDegree: number;
  betweenness: number;
  closeness: number;
}

/**
 * Calcule les métriques de centralité pour le réseau donné.
 */
export function computeCentrality(entities: EntitySchema[], relations: RelationSchema[]): Record<string, NodeMetrics> {
  const metrics: Record<string, NodeMetrics> = {};
  const neighbors: Record<string, Set<string>> = {};
  
  const entityIds = new Set(entities.map(e => e.id));

  // Initialisation des structures
  entities.forEach(e => {
    metrics[e.id] = { degree: 0, reducedDegree: 0, betweenness: 0, closeness: 0 };
    neighbors[e.id] = new Set();
  });

  // Construction de la liste d'adjacence pour le graphe non orienté
  relations.forEach(r => {
    if (entityIds.has(r.sourceId) && entityIds.has(r.targetId)) {
      if (metrics[r.sourceId]) {
        metrics[r.sourceId].degree += 1;
        if (r.targetId !== r.sourceId) {
          neighbors[r.sourceId].add(r.targetId);
        }
      }
      if (metrics[r.targetId] && r.sourceId !== r.targetId) {
        metrics[r.targetId].degree += 1;
        neighbors[r.targetId].add(r.sourceId);
      }
    }
  });

  // Remplissage du degré réduit (nombre de voisins uniques)
  entities.forEach(e => {
    if (metrics[e.id]) {
      metrics[e.id].reducedDegree = neighbors[e.id].size;
    }
  });

  const n = entities.length;
  if (n === 0) return metrics;

  // 1. Calcul de la Closeness Centrality pour chaque nœud (via BFS)
  entities.forEach(startNode => {
    const distances: Record<string, number> = {};
    const queue: string[] = [startNode.id];
    distances[startNode.id] = 0;

    let sumDistances = 0;
    let reachableCount = 0;

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const currDist = distances[curr];

      for (const neighbor of neighbors[curr]) {
        if (distances[neighbor] === undefined) {
          distances[neighbor] = currDist + 1;
          sumDistances += currDist + 1;
          reachableCount += 1;
          queue.push(neighbor);
        }
      }
    }

    if (reachableCount > 0 && sumDistances > 0) {
      // Formule de Wasserman-Faust pour les graphes non connexes
      const rawCloseness = reachableCount / sumDistances;
      const closenessNormalization = reachableCount / (n - 1);
      metrics[startNode.id].closeness = rawCloseness * closenessNormalization;
    } else {
      metrics[startNode.id].closeness = 0;
    }
  });

  // 2. Calcul de la Betweenness Centrality (Algorithme de Brandes)
  const betweenness: Record<string, number> = {};
  entities.forEach(e => { betweenness[e.id] = 0; });

  entities.forEach(s => {
    const sourceId = s.id;
    const S: string[] = []; // Pile
    const P: Record<string, string[]> = {}; // Liste des prédécesseurs
    const sigma: Record<string, number> = {}; // Compteur de chemins les plus courts
    const d: Record<string, number> = {}; // Distances

    entities.forEach(w => {
      P[w.id] = [];
      sigma[w.id] = 0;
      d[w.id] = -1;
    });

    sigma[sourceId] = 1;
    d[sourceId] = 0;

    const Q: string[] = [sourceId];

    while (Q.length > 0) {
      const v = Q.shift()!;
      S.push(v);

      for (const w of neighbors[v]) {
        // Chemin découvert
        if (d[w] < 0) {
          d[w] = d[v] + 1;
          Q.push(w);
        }
        // Comptage des chemins
        if (d[w] === d[v] + 1) {
          sigma[w] += sigma[v];
          P[w].push(v);
        }
      }
    }

    const delta: Record<string, number> = {};
    entities.forEach(w => { delta[w.id] = 0; });

    while (S.length > 0) {
      const w = S.pop()!;
      for (const v of P[w]) {
        delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      }
      if (w !== sourceId) {
        betweenness[w] += delta[w];
      }
    }
  });

  // Pour un graphe non orienté, diviser par 2 car chaque paire (s, t) est traitée deux fois
  entities.forEach(e => {
    if (metrics[e.id]) {
      metrics[e.id].betweenness = betweenness[e.id] / 2;
    }
  });

  return metrics;
}

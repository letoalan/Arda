import { describe, it, expect } from 'vitest';
import {
  isRelationValid,
  filterOrphanedRelations,
  getRelationsForNode,
  getNeighbors,
  filterByType,
  getUniqueRelationTypes,
} from '../core/network/index';

const makeNode = (id: string) => ({ id });
const makeEdge = (id: string, sourceId: string, targetId: string, type = 'link', direction: 'directed' | 'undirected' = 'directed') =>
  ({ id, sourceId, targetId, type, direction });

describe('core/network — validation des relations', () => {
  describe('isRelationValid', () => {
    it('valide une relation dont source et target existent', () => {
      const nodeIds = new Set(['a', 'b', 'c']);
      expect(isRelationValid(makeEdge('r1', 'a', 'b'), nodeIds)).toBe(true);
    });

    it('invalide une relation orpheline (source manquante)', () => {
      const nodeIds = new Set(['b', 'c']);
      expect(isRelationValid(makeEdge('r1', 'a', 'b'), nodeIds)).toBe(false);
    });

    it('invalide une relation orpheline (target manquante)', () => {
      const nodeIds = new Set(['a', 'c']);
      expect(isRelationValid(makeEdge('r1', 'a', 'b'), nodeIds)).toBe(false);
    });

    it('invalide une auto-relation (source === target inexistant)', () => {
      const nodeIds = new Set<string>();
      expect(isRelationValid(makeEdge('r1', 'a', 'a'), nodeIds)).toBe(false);
    });
  });

  describe('filterOrphanedRelations', () => {
    const entities = [makeNode('e1'), makeNode('e2'), makeNode('e3')];
    const relations = [
      makeEdge('r1', 'e1', 'e2'), // valide
      makeEdge('r2', 'e1', 'e4'), // orpheline (e4 absent)
      makeEdge('r3', 'e5', 'e2'), // orpheline (e5 absent)
      makeEdge('r4', 'e2', 'e3'), // valide
    ];

    it('supprime les relations orphelines', () => {
      const result = filterOrphanedRelations(relations, entities);
      expect(result.map(r => r.id)).toEqual(['r1', 'r4']);
    });

    it('retourne toutes les relations si toutes sont valides', () => {
      const validOnly = [makeEdge('r1', 'e1', 'e2'), makeEdge('r2', 'e2', 'e3')];
      expect(filterOrphanedRelations(validOnly, entities)).toHaveLength(2);
    });

    it('retourne liste vide si aucune entité', () => {
      expect(filterOrphanedRelations(relations, [])).toHaveLength(0);
    });
  });

  describe('getRelationsForNode', () => {
    const relations = [
      makeEdge('r1', 'e1', 'e2'),
      makeEdge('r2', 'e3', 'e1'),
      makeEdge('r3', 'e2', 'e3'),
    ];

    it('retourne les relations dont e1 est source ou target', () => {
      const result = getRelationsForNode(relations, 'e1');
      expect(result.map(r => r.id)).toEqual(expect.arrayContaining(['r1', 'r2']));
      expect(result).toHaveLength(2);
    });

    it('retourne liste vide si le nœud n\'est impliqué dans aucune relation', () => {
      expect(getRelationsForNode(relations, 'e99')).toHaveLength(0);
    });
  });

  describe('getNeighbors', () => {
    const relations = [
      makeEdge('r1', 'e1', 'e2'),
      makeEdge('r2', 'e3', 'e1'),
      makeEdge('r3', 'e2', 'e3'),
    ];

    it('retourne les voisins directs de e1', () => {
      const neighbors = getNeighbors(relations, 'e1');
      expect(neighbors).toEqual(expect.arrayContaining(['e2', 'e3']));
      expect(neighbors).toHaveLength(2);
    });

    it('retourne liste vide pour un nœud isolé', () => {
      expect(getNeighbors(relations, 'e99')).toHaveLength(0);
    });
  });

  describe('filterByType', () => {
    const relations = [
      makeEdge('r1', 'e1', 'e2', 'commerce'),
      makeEdge('r2', 'e2', 'e3', 'alliance'),
      makeEdge('r3', 'e1', 'e3', 'commerce'),
    ];

    it('filtre par type commerce', () => {
      const result = filterByType(relations, 'commerce');
      expect(result.map(r => r.id)).toEqual(['r1', 'r3']);
    });

    it('retourne liste vide si type inexistant', () => {
      expect(filterByType(relations, 'guerre')).toHaveLength(0);
    });
  });

  describe('getUniqueRelationTypes', () => {
    it('retourne les types uniques sans doublons', () => {
      const relations = [
        makeEdge('r1', 'e1', 'e2', 'commerce'),
        makeEdge('r2', 'e2', 'e3', 'alliance'),
        makeEdge('r3', 'e1', 'e3', 'commerce'),
      ];
      const types = getUniqueRelationTypes(relations);
      expect(types).toEqual(expect.arrayContaining(['commerce', 'alliance']));
      expect(types).toHaveLength(2);
    });

    it('retourne liste vide pour réseau vide', () => {
      expect(getUniqueRelationTypes([])).toHaveLength(0);
    });
  });
});

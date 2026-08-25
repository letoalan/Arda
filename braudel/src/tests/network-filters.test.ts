import { describe, it, expect } from 'vitest';
import { filterNetwork, NetworkEdge } from '../core/network/index';

const makeNode = (id: string, validFrom?: number, validTo?: number) => ({
  id,
  temporalRange: validFrom !== undefined && validTo !== undefined ? { validFrom, validTo } : undefined
});

const makeEdge = (id: string, sourceId: string, targetId: string, type = 'link', weight?: number): NetworkEdge =>
  ({ id, sourceId, targetId, type, direction: 'directed', weight });

describe('core/network — filterNetwork', () => {
  const nodes = [
    makeNode('n1', 1000, 1500),
    makeNode('n2', 1200, 1800),
    makeNode('n3') // permanent
  ];

  const edges = [
    makeEdge('e1', 'n1', 'n2', 'trade', 5),
    makeEdge('e2', 'n2', 'n3', 'war', 10),
    makeEdge('e3', 'n1', 'n3', 'trade', 2)
  ];

  it('filters by type', () => {
    const result = filterNetwork(edges, nodes as any, { type: 'trade' });
    expect(result.map(e => e.id)).toEqual(['e1', 'e3']);
  });

  it('filters by minWeight', () => {
    const result = filterNetwork(edges, nodes as any, { minWeight: 5 });
    expect(result.map(e => e.id)).toEqual(['e1', 'e2']);
  });

  it('filters by maxWeight', () => {
    const result = filterNetwork(edges, nodes as any, { maxWeight: 5 });
    expect(result.map(e => e.id)).toEqual(['e1', 'e3']);
  });

  it('filters by weight range', () => {
    const result = filterNetwork(edges, nodes as any, { minWeight: 3, maxWeight: 8 });
    expect(result.map(e => e.id)).toEqual(['e1']);
  });

  it('filters temporally', () => {
    // Year 1100: n1 and n3 exist, n2 does not exist (starts at 1200).
    const result = filterNetwork(edges, nodes as any, { start: 1100, end: 1100 });
    expect(result.map(e => e.id)).toEqual(['e3']);
  });

  it('filters with multiple criteria', () => {
    const result = filterNetwork(edges, nodes as any, { type: 'trade', minWeight: 4, start: 1300, end: 1400 });
    expect(result.map(e => e.id)).toEqual(['e1']);
  });
});

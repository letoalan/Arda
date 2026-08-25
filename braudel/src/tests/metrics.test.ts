import { describe, it, expect } from 'vitest';
import { computeCentrality } from '../core/network/metrics';
import { EntitySchema } from '../core/schema/entities';
import { RelationSchema } from '../core/schema/relations';

describe('computeCentrality', () => {
  const worldId = '11111111-1111-1111-1111-111111111111';

  it('calculates metrics for a simple path graph A - B - C', () => {
    const entities: EntitySchema[] = [
      { id: 'A', worldId, name: 'Entity A', type: 'actor', layerId: 'L1', temporalRange: { validFrom: 0, validTo: 100 }, meta: {} },
      { id: 'B', worldId, name: 'Entity B', type: 'place', layerId: 'L1', temporalRange: { validFrom: 0, validTo: 100 }, meta: {} },
      { id: 'C', worldId, name: 'Entity C', type: 'event', layerId: 'L1', temporalRange: { validFrom: 0, validTo: 100 }, meta: {} }
    ];

    const relations: RelationSchema[] = [
      { id: 'R1', worldId, sourceId: 'A', targetId: 'B', type: 'trade', direction: 'undirected', isSpatial: false, meta: {} },
      { id: 'R2', worldId, sourceId: 'B', targetId: 'C', type: 'alliance', direction: 'undirected', isSpatial: false, meta: {} }
    ];

    const metrics = computeCentrality(entities, relations);

    // Node B should have the highest betweenness centrality (middle of the path)
    expect(metrics['B'].degree).toBe(2);
    expect(metrics['B'].reducedDegree).toBe(2);
    expect(metrics['B'].betweenness).toBe(1.0); // path A-C passes through B

    expect(metrics['A'].degree).toBe(1);
    expect(metrics['A'].betweenness).toBe(0.0);
    expect(metrics['C'].degree).toBe(1);
    expect(metrics['C'].betweenness).toBe(0.0);

    // Node B is closer to everyone
    expect(metrics['B'].closeness).toBeGreaterThan(metrics['A'].closeness);
    expect(metrics['B'].closeness).toBeGreaterThan(metrics['C'].closeness);
  });
});

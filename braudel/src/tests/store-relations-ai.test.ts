// tests/store-relations-ai.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../services/persistence/indexeddb', () => ({
  openDB: vi.fn().mockResolvedValue(undefined),
  get: vi.fn(),
  put: vi.fn().mockResolvedValue(undefined),
  deleteRecord: vi.fn().mockResolvedValue(undefined),
  queryByWorldId: vi.fn().mockResolvedValue([]),
  getAll: vi.fn().mockResolvedValue([]),
}));

import { useStore, emptyWorld } from '../app/state/store';

const WORLD_ID = crypto.randomUUID();
const resetStore = () => {
  useStore.setState({
    world: {
      ...emptyWorld,
      world: [{ id: WORLD_ID, name: 'Test World', worldType: 'real' as const, meta: { id: 'meta', schemaVersion: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }],
    },
    currentTime: 2000,
    aiProposals: [],
    aiSessions: [],
    selectedProposal: null,
    exportLoading: false,
    importLoading: false,
    exportError: null,
    importError: null,
  });
};

describe('store — relations et propositions IA', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('relations', () => {
    it('addRelation crée une relation avec worldId réel', () => {
      const { addLayer, addEntity, addRelation } = useStore.getState();
      addLayer('Couche', 'physical');
      const layerId = useStore.getState().world.layers[0].id;
      addEntity(layerId, 'Rome', 'place');
      addEntity(layerId, 'Carthage', 'place');

      const entityAId = useStore.getState().world.entities[0].id;
      const entityBId = useStore.getState().world.entities[1].id;

      addRelation(entityAId, entityBId, 'guerre', 'directed');

      const relation = useStore.getState().world.relations[0];
      expect(relation.worldId).toBe(WORLD_ID);
      expect(relation.sourceId).toBe(entityAId);
      expect(relation.targetId).toBe(entityBId);
      expect(relation.type).toBe('guerre');
    });

    it('removeEntity supprime aussi les relations associées', () => {
      const { addLayer, addEntity, addRelation, removeEntity } = useStore.getState();
      addLayer('Couche', 'physical');
      const layerId = useStore.getState().world.layers[0].id;
      addEntity(layerId, 'A', 'place');
      addEntity(layerId, 'B', 'place');

      const idA = useStore.getState().world.entities[0].id;
      const idB = useStore.getState().world.entities[1].id;

      addRelation(idA, idB, 'commerce', 'undirected');
      removeEntity(idA);

      expect(useStore.getState().world.relations).toHaveLength(0);
    });
  });

  describe('propositions IA', () => {
    it('addAiProposal et acceptAiProposal ajoutent et valident une proposition', async () => {
      const { addLayer, addAiProposal, acceptAiProposal } = useStore.getState();
      addLayer('Couche', 'physical');
      const createdLayerId = useStore.getState().world.layers[0].id;

      const proposal = {
        id: 'prop-1',
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        worldId: WORLD_ID,
        type: 'addEntity' as const,
        status: 'pending' as const,
        confidence: 0.9,
        reasoning: 'Entité suggérée par IA',
        data: { name: 'Sparte', type: 'place', layerId: createdLayerId },
        createdAt: new Date().toISOString(),
      };

      addAiProposal(proposal);
      expect(useStore.getState().aiProposals).toHaveLength(1);

      await acceptAiProposal('prop-1');
      expect(useStore.getState().aiProposals[0].status).toBe('accepted');
    });
  });
});

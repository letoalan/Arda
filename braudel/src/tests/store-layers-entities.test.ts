// tests/store-layers-entities.test.ts

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

describe('store — couches et entités', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('couches (layers)', () => {
    it('addLayer crée une couche avec un ordre déterministe', () => {
      const { addLayer } = useStore.getState();
      addLayer('Géophysique', 'physical');
      addLayer('Géohistoire', 'historical');

      const { world } = useStore.getState();
      expect(world.layers).toHaveLength(2);
      expect(world.layers[0].name).toBe('Géophysique');
      expect(world.layers[0].order).toBe(0);
      expect(world.layers[1].order).toBe(1);
    });

    it('addLayer utilise le worldId réel (pas dummy)', () => {
      const { addLayer } = useStore.getState();
      addLayer('Test', 'political');
      const { world } = useStore.getState();
      expect(world.layers[0].worldId).toBe(WORLD_ID);
    });

    it('toggleLayerVisibility inverse la visibilité', () => {
      const { addLayer, toggleLayerVisibility } = useStore.getState();
      addLayer('Couche', 'physical');
      const layerId = useStore.getState().world.layers[0].id;

      toggleLayerVisibility(layerId);
      expect(useStore.getState().world.layers[0].visible).toBe(false);

      toggleLayerVisibility(layerId);
      expect(useStore.getState().world.layers[0].visible).toBe(true);
    });

    it('removeLayer supprime la couche et ses entités associées', () => {
      const { addLayer, addEntity, removeLayer } = useStore.getState();
      addLayer('Couche A', 'physical');
      const layerId = useStore.getState().world.layers[0].id;
      addEntity(layerId, 'Entité A', 'place');
      addEntity(layerId, 'Entité B', 'actor');

      removeLayer(layerId);

      const { world } = useStore.getState();
      expect(world.layers).toHaveLength(0);
      expect(world.entities).toHaveLength(0);
    });
  });

  describe('entités', () => {
    it('addEntity crée une entité avec worldId réel et temporalRange correct', () => {
      const { addLayer, addEntity } = useStore.getState();
      addLayer('Couche', 'physical');
      const layerId = useStore.getState().world.layers[0].id;

      addEntity(layerId, 'Rome', 'place', -753, 476);

      const entity = useStore.getState().world.entities[0];
      expect(entity.worldId).toBe(WORLD_ID);
      expect(entity.name).toBe('Rome');
      expect(entity.temporalRange).toEqual({ validFrom: -753, validTo: 476 });
    });

    it('updateEntityTemporalRange modifie les bornes temporelles', () => {
      const { addLayer, addEntity, updateEntityTemporalRange } = useStore.getState();
      addLayer('Couche', 'physical');
      const layerId = useStore.getState().world.layers[0].id;

      addEntity(layerId, 'Athènes', 'place', -500, -300);
      const entityId = useStore.getState().world.entities[0].id;

      updateEntityTemporalRange(entityId, -800, -146);

      const updated = useStore.getState().world.entities[0];
      expect(updated.temporalRange).toEqual({ validFrom: -800, validTo: -146 });
    });
  });
});

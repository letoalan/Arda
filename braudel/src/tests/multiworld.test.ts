import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── In-Memory Mock Datastore ──
let mockDb: Record<string, any[]> = {};

vi.mock('../services/persistence/indexeddb', () => ({
  openDB: vi.fn().mockResolvedValue(undefined),
  get: vi.fn(async (storeName, id) => {
    return mockDb[storeName]?.find(r => r.id === id);
  }),
  put: vi.fn(async (storeName, data) => {
    if (!mockDb[storeName]) mockDb[storeName] = [];
    mockDb[storeName] = mockDb[storeName].filter(r => r.id !== (data as any).id);
    mockDb[storeName].push(data);
  }),
  deleteRecord: vi.fn(async (storeName, id) => {
    if (mockDb[storeName]) {
      mockDb[storeName] = mockDb[storeName].filter(r => r.id !== id);
    }
  }),
  queryByWorldId: vi.fn(async (storeName, worldId) => {
    return mockDb[storeName]?.filter(r => r.worldId === worldId) || [];
  }),
  getAll: vi.fn(async (storeName) => {
    return mockDb[storeName] || [];
  }),
  deleteWorldCascade: vi.fn(async (worldId) => {
    const storesToScope = ['layers', 'entities', 'relations', 'timelines', 'styles', 'imports', 'ai', 'views', 'history'];
    storesToScope.forEach(storeName => {
      if (mockDb[storeName]) {
        mockDb[storeName] = mockDb[storeName].filter(r => r.worldId !== worldId);
      }
    });
    if (mockDb['world']) {
      mockDb['world'] = mockDb['world'].filter(r => r.id !== worldId);
    }
  })
}));

import { useStore, emptyWorld } from '../app/state/store';

describe('Multi-World Database Isolation', () => {
  beforeEach(() => {
    mockDb = {
      meta: [],
      world: [],
      layers: [],
      entities: [],
      relations: [],
      timelines: [],
      styles: [],
      imports: [],
      ai: [],
      views: [],
      history: []
    };
    
    // Clear Zustand store state
    useStore.setState({
      world: emptyWorld,
      worldsList: [],
      isLoading: false,
      selectedEntityId: null
    });
  });

  it('isolates entities and layers between created worlds', async () => {
    const { createRealWorld, initFromDB, addLayer } = useStore.getState();

    // 1. Create World A
    const idA = await createRealWorld('World A', 'Test real world A', 'contemporary_current', 0, 100);
    expect(idA).toBeDefined();

    // Add layer to World A
    addLayer('Layer A', 'historical');
    // Save state layers into mock db
    mockDb['layers'] = useStore.getState().world.layers;

    // 2. Create World B
    const idB = await createRealWorld('World B', 'Test real world B', 'contemporary_current', 0, 100);
    expect(idB).toBeDefined();

    // Add layer to World B
    addLayer('Layer B', 'political');
    // Save state layers into mock db
    mockDb['layers'] = [...mockDb['layers'], ...useStore.getState().world.layers.filter(l => l.worldId === idB)];

    // 3. Load World A and verify it has both Alpha Layer and Layer A (isolated from World B)
    await initFromDB(idA);
    const stateA = useStore.getState();
    expect(stateA.world.world[0].name).toBe('World A');
    expect(stateA.world.layers.length).toBe(2);
    expect(stateA.world.layers.some(l => l.name === 'Layer A')).toBe(true);
    expect(stateA.world.layers.some(l => l.name.includes('(Alpha)'))).toBe(true);

    // 4. Load World B and verify it has both Alpha Layer and Layer B (isolated from World A)
    await initFromDB(idB);
    const stateB = useStore.getState();
    expect(stateB.world.world[0].name).toBe('World B');
    expect(stateB.world.layers.length).toBe(2);
    expect(stateB.world.layers.some(l => l.name === 'Layer B')).toBe(true);
    expect(stateB.world.layers.some(l => l.name.includes('(Alpha)'))).toBe(true);
  });

  it('duplicates worlds successfully including the Alpha base layer', async () => {
    const { createRealWorld, initFromDB, addLayer, duplicateWorld } = useStore.getState();

    const idOrig = await createRealWorld('Original World', 'original', 'contemporary_current', 0, 100);
    addLayer('Original Layer', 'physical');
    // Save state layers into mock db
    mockDb['layers'] = useStore.getState().world.layers;

    // Duplicate
    await duplicateWorld(idOrig!, 'Duplicated World');

    const allWorlds = mockDb['world'] || [];
    const dupWorld = allWorlds.find(w => w.name === 'Duplicated World');
    expect(dupWorld).toBeDefined();

    // Load duplicated world and verify it copied both the Alpha layer and custom layer
    await initFromDB(dupWorld.id);
    const dupState = useStore.getState();
    expect(dupState.world.layers.length).toBe(2);
    expect(dupState.world.layers.some(l => l.name === 'Original Layer')).toBe(true);
    expect(dupState.world.layers.some(l => l.name.includes('(Alpha)'))).toBe(true);
    expect(dupState.world.layers.every(l => l.worldId === dupWorld.id)).toBe(true);
  });

  it('creates initial Alpha layer with order 0 and political type on real world creation', async () => {
    const { createRealWorld } = useStore.getState();
    const id = await createRealWorld('Alpha World', 'Testing alpha layer', 'contemporary_current', 0, 500);
    expect(id).toBeDefined();

    const state = useStore.getState();
    expect(state.world.layers.length).toBe(1);
    expect(state.world.layers[0].name).toBe('Fond Géopolitique (Alpha)');
    expect(state.world.layers[0].type).toBe('political');
    expect(state.world.layers[0].order).toBe(0);
    expect(state.world.layers[0].visible).toBe(true);
    expect((state.world.layers[0].meta as any)?.isBaseLayer).toBe(true);
  });
});

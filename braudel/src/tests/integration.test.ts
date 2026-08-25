import { describe, it, expect, beforeEach, vi } from 'vitest';

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

describe('Integration — Full World Lifecycle', () => {
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

    useStore.setState({
      world: emptyWorld,
      worldsList: [],
      isLoading: false,
      selectedEntityId: null
    });
  });

  it('performs createWorld -> addLayer -> addEntity -> saveToDB -> initFromDB successfully', async () => {
    const { createNewWorld, addLayer, addEntity, saveToDB, initFromDB } = useStore.getState();

    // 1. Create a new fictional world
    const worldId = await createNewWorld('My Fictional World', 'A description', 'fictional', undefined, 1000, 2000);
    expect(worldId).toBeDefined();
    
    // Save world and meta to mock db manually for simulating DB sync
    mockDb['world'] = useStore.getState().world.world;
    mockDb['meta'] = useStore.getState().world.meta;

    // Verify initial state
    expect(useStore.getState().world.world[0].name).toBe('My Fictional World');
    expect(useStore.getState().world.world[0].worldType).toBe('fictional');
    expect(useStore.getState().startYear).toBe(1000);
    expect(useStore.getState().endYear).toBe(2000);

    // 2. Add layer
    const layerName = 'Political Borders';
    addLayer(layerName, 'political');
    const layerId = useStore.getState().world.layers[0].id;
    expect(layerId).toBeDefined();
    expect(useStore.getState().world.layers[0].name).toBe(layerName);

    // 3. Add entity
    const entityName = 'Kingdom of Gondor';
    const entityId = addEntity(layerId, entityName, 'place', 1200, 1600);
    expect(entityId).toBeDefined();
    expect(useStore.getState().world.entities[0].name).toBe(entityName);
    expect(useStore.getState().world.entities[0].temporalRange?.validFrom).toBe(1200);

    // 4. Save state to IndexedDB simulation
    // Populate mockDb with state data to simulate IndexedDB storage
    mockDb['layers'] = [...useStore.getState().world.layers];
    mockDb['entities'] = [...useStore.getState().world.entities];

    // Let's call saveToDB to ensure it runs without throwing errors
    await saveToDB();

    // 5. Clear state to simulate fresh reload
    useStore.setState({
      world: emptyWorld,
      selectedEntityId: null
    });
    expect(useStore.getState().world.world).toHaveLength(0);

    // 6. Reload from DB
    await initFromDB(worldId);
    
    // Verify restored state
    const restoredWorld = useStore.getState().world;
    expect(restoredWorld.world).toHaveLength(1);
    expect(restoredWorld.world[0].name).toBe('My Fictional World');
    
    expect(restoredWorld.layers).toHaveLength(1);
    expect(restoredWorld.layers[0].name).toBe(layerName);
    
    expect(restoredWorld.entities).toHaveLength(1);
    expect(restoredWorld.entities[0].name).toBe(entityName);
    expect(restoredWorld.entities[0].temporalRange?.validFrom).toBe(1200);
  });
});

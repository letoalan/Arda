// app/state/storeBatchImport.ts

import * as db from '../../services/persistence/indexeddb';

export async function executeImportBatchEntities(set: any, get: any, entities: any[], batchTitle = 'Batch GeoJSON') {
  const total = entities.length;
  set({ importProgress: { current: 0, total, title: batchTitle } });
  const batchSize = 50;

  for (let i = 0; i < total; i += batchSize) {
    const chunk = entities.slice(i, i + batchSize);
    for (const ent of chunk) {
      await db.put('entities', ent);
    }
    set({ importProgress: { current: Math.min(i + batchSize, total), total, title: batchTitle } });
    await new Promise((r) => setTimeout(r, 10));
  }

  const { world } = get();
  await get().initFromDB(world.world[0]?.id);
  set({ importProgress: null });
}

export async function executeRollbackImportBatch(get: any, importBatchId: string) {
  const { world } = get();
  const worldId = world.world[0]?.id || 'world-1';
  const deletedCount = await db.deleteEntitiesByBatch(worldId, importBatchId);
  await get().initFromDB(worldId);
  return deletedCount;
}

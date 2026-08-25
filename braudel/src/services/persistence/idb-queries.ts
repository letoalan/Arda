// services/persistence/idb-queries.ts

import { openDB, db, StoreName } from './idb-core';

export const getRecord = async <T>(storeName: StoreName, id: string): Promise<T | undefined> => {
  await openDB();
  return new Promise<T | undefined>((resolve, reject) => {
    if (!db) return reject(new Error('Database not initialized.'));
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as T | undefined);
  });
};

export const putRecord = async <T>(storeName: StoreName, data: T): Promise<void> => {
  await openDB();
  return new Promise<void>((resolve, reject) => {
    if (!db) return reject(new Error('Database not initialized.'));
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    store.put(data);

    transaction.onerror = () => reject(transaction.error || new Error('Transaction error'));
    transaction.oncomplete = () => resolve();
  });
};

export const deleteRecord = async (storeName: StoreName, id: string): Promise<void> => {
  await openDB();
  return new Promise<void>((resolve, reject) => {
    if (!db) return reject(new Error('Database not initialized.'));
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    store.delete(id);

    transaction.onerror = () => reject(transaction.error || new Error('Transaction error'));
    transaction.oncomplete = () => resolve();
  });
};

export const queryByWorldId = async <T>(storeName: StoreName, worldId: string): Promise<T[]> => {
  await openDB();
  return new Promise<T[]>((resolve, reject) => {
    if (storeName === 'meta') return reject(new Error(`Store '${storeName}' does not have a 'worldId' index.`));
    if (!db) return reject(new Error('Database not initialized.'));
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index('worldId');
    const request = index.getAll(worldId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as T[]);
  });
};

export const getAllRecords = async <T>(storeName: StoreName): Promise<T[]> => {
  await openDB();
  return new Promise<T[]>((resolve, reject) => {
    if (!db) return reject(new Error('Database not initialized.'));
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as T[]);
  });
};

export const deleteWorldCascade = async (worldId: string): Promise<void> => {
  await openDB();
  if (!db) throw new Error('Database not initialized.');

  const storesToScope: StoreName[] = [
    'layers', 'entities', 'relations', 'timelines', 'styles', 'imports', 'ai', 'views', 'history'
  ];

  for (const storeName of storesToScope) {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const index = store.index('worldId');
    
    const records = await new Promise<any[]>((resolve, reject) => {
      const req = index.getAll(worldId);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
    });

    for (const record of records) {
      if (record.id) {
        await new Promise<void>((resolve, reject) => {
          const req = store.delete(record.id);
          req.onerror = () => reject(req.error);
          req.onsuccess = () => resolve();
        });
      }
    }
  }

  await deleteRecord('world', worldId);
};

export const deleteEntitiesByBatch = async (worldId: string, importBatchId: string): Promise<number> => {
  await openDB();
  if (!db) throw new Error('Database not initialized.');

  const transaction = db.transaction(['entities'], 'readwrite');
  const store = transaction.objectStore('entities');
  const index = store.index('worldId');

  const records = await new Promise<any[]>((resolve, reject) => {
    const req = index.getAll(worldId);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });

  let deletedCount = 0;
  for (const record of records) {
    if (record.properties?.importBatchId === importBatchId || record.properties?.sourceMeta?.importBatchId === importBatchId) {
      await new Promise<void>((resolve, reject) => {
        const req = store.delete(record.id);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve();
      });
      deletedCount++;
    }
  }

  return deletedCount;
};

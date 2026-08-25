// services/persistence/idb-core.ts

export const DB_NAME = 'braudel-db';
export const DB_VERSION = 1;

export type StoreName = 'meta' | 'world' | 'layers' | 'entities' | 'relations' | 'timelines' | 'styles' | 'imports' | 'ai' | 'views' | 'history';

export const objectStoreNames: StoreName[] = [
  'meta',
  'world',
  'layers',
  'entities',
  'relations',
  'timelines',
  'styles',
  'imports',
  'ai',
  'views',
  'history'
];

export let db: IDBDatabase | null = null;

export const openDB = (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    if (db) {
      resolve();
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const database = (event.target as IDBOpenDBRequest).result;

      objectStoreNames.forEach(storeName => {
        if (!database.objectStoreNames.contains(storeName)) {
          const store = database.createObjectStore(storeName, { keyPath: 'id' });
          if (storeName !== 'meta') {
            store.createIndex('worldId', 'worldId', { unique: false });
          }
        }
      });
    };
  });
};

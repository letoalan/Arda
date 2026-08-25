// services/persistence/indexeddb.ts

import { 
  getRecord, 
  putRecord, 
  deleteRecord, 
  queryByWorldId, 
  getAllRecords, 
  deleteWorldCascade, 
  deleteEntitiesByBatch 
} from './idb-queries';
import { openDB, StoreName, DB_NAME, DB_VERSION } from './idb-core';

export type { StoreName };
export { openDB, DB_NAME, DB_VERSION };
export { queryByWorldId, deleteWorldCascade, deleteEntitiesByBatch, deleteRecord };

export const get = getRecord;
export const put = putRecord;
export const deleteItem = deleteRecord;
export const getAll = getAllRecords;

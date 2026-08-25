// services/import/importSyncer.ts

import { DatabaseSchema } from '../../core/schema';
import * as db from '../persistence/indexeddb';
import type { StoreName } from '../persistence/indexeddb';

export const synchronizeImport = async (data: DatabaseSchema): Promise<void> => {
  const storesToSync: StoreName[] = [
    'meta', 'world', 'layers', 'entities', 'relations', 
    'timelines', 'styles', 'imports', 'ai', 'views', 'history'
  ];

  for (const storeName of storesToSync) {
    const items = data[storeName as keyof DatabaseSchema] as any[];
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item && typeof item === 'object' && item.id) {
          await db.put(storeName, item);
        }
      }
    }
  }
};

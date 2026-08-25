// app/state/storeActions.ts

import { createMeta } from '../../core/schema/meta';
import { createRealWorld as createRealWorldRecord, createFictionalWorld as createFictionalWorldRecord } from '../../core/schema/world';
import { BasemapStyleId } from '../../core/styles.config';
import * as db from '../../services/persistence/indexeddb';
import * as importService from '../../services/import/index';
import { emptyWorld } from './worldSlice';

export async function executeCreateRealWorld(name: string, description?: string, basemapStyle?: BasemapStyleId, startYear = -3000, endYear = 2100) {
  const meta = createMeta(1);
  const worldRecord = createRealWorldRecord(name, meta, basemapStyle, startYear, endYear);
  if (description) worldRecord.description = description;

  await db.put('meta', meta);
  await db.put('world', worldRecord);

  const loadedWorld = {
    ...emptyWorld,
    world: [worldRecord],
    layers: [],
    entities: [],
    relations: [],
  };

  return {
    id: worldRecord.id,
    stateUpdate: {
      world: loadedWorld,
      selectedEntityId: null,
      startYear,
      endYear,
      currentTime: startYear,
      basemapStyle: basemapStyle || 'contemporary_current',
    },
  };
}

export async function executeCreateFictionalWorld(name: string, description?: string, startYear = -3000, endYear = 2100) {
  const meta = createMeta(1);
  const worldRecord = createFictionalWorldRecord(name, meta, startYear, endYear);
  if (description) worldRecord.description = description;

  await db.put('meta', meta);
  await db.put('world', worldRecord);

  const loadedWorld = {
    ...emptyWorld,
    world: [worldRecord],
    layers: [],
    entities: [],
    relations: [],
  };

  return {
    id: worldRecord.id,
    stateUpdate: {
      world: loadedWorld,
      selectedEntityId: null,
      startYear,
      endYear,
      currentTime: startYear,
      basemapStyle: 'tolkien_high_fantasy' as const,
    },
  };
}

export async function executeExportWorld(world: any) {
  const worldName = world.world[0]?.name || 'Monde';
  const fileName = `${worldName.toLowerCase().replace(/\s+/g, '_')}_export.json`;
  const jsonStr = JSON.stringify(world, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function executeImportWorldFile(file: File) {
  const res = await importService.importFromFile(file);
  if (!res.success || !res.data) throw new Error(res.errors?.join(', ') || "Erreur d'importation");
  return res.data.world[0]?.id;
}

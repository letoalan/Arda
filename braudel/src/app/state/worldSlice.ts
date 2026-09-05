// app/state/worldSlice.ts

import { DatabaseSchema } from '../../core/schema';
import { Layer, Entity } from '../../core/schema/types';
import { 
  openDB, 
  getAll, 
  queryByWorldId, 
  get as getDbRecord,
  put
} from '../../services/persistence/indexeddb';
import { createMeta } from '../../core/schema/meta';
import { STYLE_CONFIGS } from '../../core/styles.config';
import { createLayer } from '../../core/schema/layers';

export const emptyWorld: DatabaseSchema = {
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

export interface WorldState {
  world: DatabaseSchema;
  worldsList: any[];
  isLoading: boolean;
  isFirstLoadDone: boolean;
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

export async function handleInitFromDB(worldId?: string) {
  await openDB();
  const allWorlds = await getAll<any>('world');
  
  let targetWorldRecord = null;
  if (worldId) {
    targetWorldRecord = allWorlds.find((w: any) => w.id === worldId);
  } else if (allWorlds.length > 0) {
    targetWorldRecord = allWorlds[0];
  }

  if (!targetWorldRecord) {
    return {
      worldsList: allWorlds,
      world: emptyWorld,
      selectedEntityId: null
    };
  }

  const id = (targetWorldRecord as any).id;
  const wRecord = targetWorldRecord as any;

  let layers = dedupeById(await queryByWorldId<Layer>('layers', id));

  // Auto-réparation rétrocompatible : si aucune couche n'existe (anciens mondes), créer la couche Alpha
  if (layers.length === 0) {
    const isFictional = wRecord.worldType === 'fictional';
    const alphaLayer = createLayer(
      id,
      isFictional ? 'physical' : 'political',
      isFictional ? 'Fond Géographique (Alpha)' : 'Fond Géopolitique (Alpha)',
      0
    );
    if (alphaLayer.meta) {
      (alphaLayer.meta as any).isBaseLayer = true;
    }
    await put('layers', alphaLayer);
    layers = [alphaLayer];
  }

  let entities = dedupeById(await queryByWorldId<Entity>('entities', id));
  // Si des entités ont un layerId orphelin (inexistant dans layers), les réassigner à la couche Alpha
  const layerIdsSet = new Set(layers.map((l: any) => l.id));
  const alphaLayerId = layers[0].id;
  entities = entities.map((e: any) => {
    if (!e.layerId || !layerIdsSet.has(e.layerId)) {
      const updated = { ...e, layerId: alphaLayerId };
      put('entities', updated);
      return updated;
    }
    return e;
  });

  const loadedWorld: DatabaseSchema = {
    meta: dedupeById(await getAll('meta')),
    world: [targetWorldRecord as any],
    layers,
    entities,
    relations: dedupeById(await queryByWorldId('relations', id)),
    timelines: dedupeById(await queryByWorldId('timelines', id)),
    styles: dedupeById(await queryByWorldId('styles', id)),
    imports: dedupeById(await queryByWorldId('imports', id)),
    ai: dedupeById(await queryByWorldId('ai', id)),
    views: dedupeById(await queryByWorldId('views', id)),
    history: dedupeById(await queryByWorldId('history', id))
  };
  
  const defaultStyle = wRecord.worldType === 'fictional' ? 'tolkien_high_fantasy' : 'contemporary_current';
  const effectiveStyle = (wRecord.basemapStyle as any) || defaultStyle;
  const styleConfig = STYLE_CONFIGS.find(s => s.id === effectiveStyle);

  return {
    world: loadedWorld,
    worldsList: allWorlds,
    basemapStyle: effectiveStyle,
    basemapLabelsVisible: wRecord.basemapLabelsVisible !== undefined ? wRecord.basemapLabelsVisible : true,
    basemapBordersVisible: wRecord.basemapBordersVisible !== undefined ? wRecord.basemapBordersVisible : (styleConfig ? styleConfig.bordersVisibleByDefault : true),
    activeEmpire: (wRecord.activeEmpire as any) || 'all',
    startYear: wRecord.startYear !== undefined ? wRecord.startYear : -3000,
    endYear: wRecord.endYear !== undefined ? wRecord.endYear : 2100,
    currentTime: wRecord.startYear !== undefined ? wRecord.startYear : -3000,
    prometheanMode: wRecord.prometheanMode !== undefined ? wRecord.prometheanMode : false,
  };
}

export async function handleDuplicateWorld(worldId: string, newName: string) {
  const originalWorld = await getDbRecord<any>('world', worldId);
  if (!originalWorld) return;

  const newWorldId = crypto.randomUUID();
  const meta = createMeta(1);
  
  const newWorldRecord = {
    ...originalWorld,
    id: newWorldId,
    name: newName,
    metaId: meta.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await put('world', newWorldRecord);

  const layers = await queryByWorldId<any>('layers', worldId);
  for (const l of layers) {
    await put('layers', { ...l, id: crypto.randomUUID(), worldId: newWorldId });
  }

  const entities = await queryByWorldId<any>('entities', worldId);
  for (const e of entities) {
    await put('entities', { ...e, id: crypto.randomUUID(), worldId: newWorldId });
  }

  return await getAll<any>('world');
}

// app/state/slices/worldSlice.ts

import { DatabaseSchema } from '../../../core/schema';
import { Layer, Entity } from '../../../core/schema/types';
import { 
  openDB, 
  getAll, 
  queryByWorldId, 
  get as getDbRecord, 
  put 
} from '../../../services/persistence/indexeddb';
import { createMeta } from '../../../core/schema/meta';
import { createLayer } from '../../../core/schema/layers';
import { getBasemapFeatureDefaults } from '../../../core/styles/styleFeatureDefaults';

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

  let layers = await queryByWorldId<Layer>('layers', id);

  // Auto-réparation rétrocompatible : si aucune couche n'existe, créer la couche Alpha
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

  let entities = await queryByWorldId<Entity>('entities', id);
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
    meta: await getAll('meta'),
    world: [targetWorldRecord as any],
    layers,
    entities,
    relations: await queryByWorldId('relations', id),
    timelines: await queryByWorldId('timelines', id),
    styles: await queryByWorldId('styles', id),
    imports: await queryByWorldId('imports', id),
    ai: await queryByWorldId('ai', id),
    views: await queryByWorldId('views', id),
    history: await queryByWorldId('history', id)
  };
  
  const defaultStyle = wRecord.worldType === 'fictional' ? 'tolkien_high_fantasy' : 'contemporary_current';
  const effectiveStyle = (wRecord.basemapStyle as any) || defaultStyle;
  const defaults = getBasemapFeatureDefaults(effectiveStyle);

  return {
    world: loadedWorld,
    worldsList: allWorlds,
    basemapStyle: effectiveStyle,
    basemapLabelsVisible: wRecord.basemapLabelsVisible !== undefined ? wRecord.basemapLabelsVisible : true,
    basemapBordersVisible: wRecord.basemapBordersVisible !== undefined ? wRecord.basemapBordersVisible : defaults.bordersVisible,
    portulanRhumbVisible: wRecord.portulanRhumbVisible !== undefined ? wRecord.portulanRhumbVisible : defaults.portulanRhumbVisible,
    graticuleVisible: wRecord.graticuleVisible !== undefined ? wRecord.graticuleVisible : defaults.graticuleVisible,
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
  await put('meta', meta);

  const layers = await queryByWorldId<any>('layers', worldId);
  const entities = await queryByWorldId<any>('entities', worldId);
  const relations = await queryByWorldId<any>('relations', worldId);
  const timelines = await queryByWorldId<any>('timelines', worldId);
  const styles = await queryByWorldId<any>('styles', worldId);
  const imports = await queryByWorldId<any>('imports', worldId);
  const ai = await queryByWorldId<any>('ai', worldId);
  const views = await queryByWorldId<any>('views', worldId);

  const idMap: Record<string, string> = {};

  for (const layer of layers) {
    const newLayerId = crypto.randomUUID();
    idMap[layer.id] = newLayerId;
    await put('layers', { ...layer, id: newLayerId, worldId: newWorldId });
  }

  for (const entity of entities) {
    const newEntityId = crypto.randomUUID();
    idMap[entity.id] = newEntityId;
    await put('entities', { 
      ...entity, 
      id: newEntityId, 
      worldId: newWorldId,
      layerId: idMap[entity.layerId] || entity.layerId 
    });
  }

  for (const relation of relations) {
    await put('relations', {
      ...relation,
      id: crypto.randomUUID(),
      worldId: newWorldId,
      sourceId: idMap[relation.sourceId] || relation.sourceId,
      targetId: idMap[relation.targetId] || relation.targetId,
      entityId: relation.entityId ? (idMap[relation.entityId] || relation.entityId) : undefined
    });
  }

  for (const item of timelines) await put('timelines', { ...item, id: crypto.randomUUID(), worldId: newWorldId });
  for (const item of styles) await put('styles', { ...item, id: crypto.randomUUID(), worldId: newWorldId });
  for (const item of imports) await put('imports', { ...item, id: crypto.randomUUID(), worldId: newWorldId });
  for (const item of ai) await put('ai', { ...item, id: crypto.randomUUID(), worldId: newWorldId });
  for (const item of views) await put('views', { ...item, id: crypto.randomUUID(), worldId: newWorldId });

  return await getAll('world');
}

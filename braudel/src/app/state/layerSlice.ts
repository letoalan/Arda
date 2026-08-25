// app/state/layerSlice.ts

import { createLayer } from '../../core/schema/layers';
import { put, deleteRecord, deleteItem } from '../../services/persistence/indexeddb';

export function handleAddLayer(state: any, name: string, type: 'physical' | 'political' | 'economic' | 'social' | 'cultural' | 'historical') {
  const worldId = state.world.world[0]?.id || crypto.randomUUID();
  const layerType = (type === 'physical' || type === 'political' || type === 'historical') ? type : 'historical';
  const newLayer = createLayer(worldId, layerType as any, name, state.world.layers.length);
  put('layers', newLayer);
  return {
    world: {
      ...state.world,
      layers: [...state.world.layers, newLayer],
    },
  };
}

export function handleToggleLayerVisibility(state: any, layerId: string) {
  const updatedLayers = state.world.layers.map((l: any) => {
    if (l.id === layerId) {
      const updated = { ...l, visible: !l.visible };
      put('layers', updated);
      return updated;
    }
    return l;
  });
  return { world: { ...state.world, layers: updatedLayers } };
}

export function handleRemoveLayer(state: any, layerId: string) {
  const del = deleteRecord || deleteItem;
  if (del) del('layers', layerId);
  const remainingEntities = state.world.entities.filter((e: any) => e.layerId !== layerId);
  const removedEntityIds = new Set(state.world.entities.filter((e: any) => e.layerId === layerId).map((e: any) => e.id));
  const remainingRelations = state.world.relations.filter(
    (r: any) => !removedEntityIds.has(r.sourceId) && !removedEntityIds.has(r.targetId)
  );
  return {
    world: {
      ...state.world,
      layers: state.world.layers.filter((l: any) => l.id !== layerId),
      entities: remainingEntities,
      relations: remainingRelations,
    },
  };
}

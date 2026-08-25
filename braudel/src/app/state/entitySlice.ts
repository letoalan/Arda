// app/state/entitySlice.ts

import { createEntity } from '../../core/schema/entities';
import { put, deleteRecord, deleteItem } from '../../services/persistence/indexeddb';

export function handleAddEntity(
  state: any,
  layerId: string,
  name: string,
  type: 'place' | 'event' | 'actor' | 'concept' = 'place',
  validFrom?: number,
  validTo?: number
) {
  const worldId = state.world.world[0]?.id || crypto.randomUUID();
  const vFrom = validFrom !== undefined ? validFrom : (state.startYear || -3000);
  const vTo = validTo !== undefined ? validTo : (state.endYear || 2100);

  const newEntity = createEntity(worldId, layerId, type, name, undefined, vFrom, vTo);
  put('entities', newEntity);

  return {
    world: {
      ...state.world,
      entities: [...state.world.entities, newEntity],
    },
    selectedEntityId: newEntity.id,
  };
}

export function handleUpdateEntityGeometry(state: any, entityId: string, geometry: any) {
  const updatedEntities = state.world.entities.map((e: any) => {
    if (e.id === entityId) {
      const updated = {
        ...e,
        geometry,
        updatedAt: new Date().toISOString(),
      };
      put('entities', updated);
      return updated;
    }
    return e;
  });

  return {
    world: {
      ...state.world,
      entities: updatedEntities,
    },
  };
}

export function handleUpdateEntityTemporalRange(state: any, entityId: string, validFrom?: number, validTo?: number) {
  const updatedEntities = state.world.entities.map((e: any) => {
    if (e.id === entityId) {
      const updated = {
        ...e,
        temporalRange: (validFrom !== undefined && validTo !== undefined) ? { validFrom, validTo } : undefined,
        updatedAt: new Date().toISOString(),
      };
      put('entities', updated);
      return updated;
    }
    return e;
  });

  return {
    world: {
      ...state.world,
      entities: updatedEntities,
    },
  };
}

export function handleUpdateEntityWikiContent(state: any, entityId: string, wikiContent: string) {
  const updatedEntities = state.world.entities.map((e: any) => {
    if (e.id === entityId) {
      const updated = {
        ...e,
        wikiContent,
        updatedAt: new Date().toISOString(),
      };
      put('entities', updated);
      return updated;
    }
    return e;
  });

  return {
    world: {
      ...state.world,
      entities: updatedEntities,
    },
  };
}

export function handleRemoveEntity(state: any, entityId: string) {
  const del = deleteRecord || deleteItem;
  if (del) del('entities', entityId);

  const remainingRelations = state.world.relations.filter(
    (r: any) => r.sourceId !== entityId && r.targetId !== entityId
  );

  return {
    world: {
      ...state.world,
      entities: state.world.entities.filter((e: any) => e.id !== entityId),
      relations: remainingRelations,
    },
    selectedEntityId: state.selectedEntityId === entityId ? null : state.selectedEntityId,
  };
}


// app/state/relationSlice.ts

import { createRelation } from '../../core/schema/relations';
import { put, deleteItem } from '../../services/persistence/indexeddb';

export function handleAddRelation(
  state: any,
  sourceId: string,
  targetId: string,
  type: string,
  direction: 'directed' | 'undirected' | 'bidirectional' = 'directed',
  weight: number = 1.0,
  isSpatial: boolean = false,
  entityId?: string,
  validFrom?: number,
  validTo?: number
) {
  const worldId = state.world.world[0]?.id || crypto.randomUUID();
  const temporalRange = (validFrom !== undefined && validTo !== undefined) ? { validFrom, validTo } : undefined;

  const newRelation = createRelation(worldId, sourceId, targetId, type, direction, weight, isSpatial, entityId, temporalRange);
  put('relations', newRelation);

  return {
    world: {
      ...state.world,
      relations: [...state.world.relations, newRelation],
    },
  };
}

export function handleRemoveRelation(state: any, relationId: string) {
  deleteItem('relations', relationId);
  return {
    world: {
      ...state.world,
      relations: state.world.relations.filter((r: any) => r.id !== relationId),
    },
  };
}

// store/actions.ts

import { useStore, emptyWorld } from '../app/state/store';
import { put, queryByWorldId } from '../services/persistence/indexeddb';
import { createWorld as createWorldRecord } from '../core/schema/world';
import { createMeta } from '../core/schema/meta';

export const loadWorld = async (worldId: string): Promise<void> => {
  try {
    const worlds = await queryByWorldId('world', worldId);
    if (!worlds || worlds.length === 0) {
      throw new Error('Monde non trouvé');
    }
    const worldRecord = worlds[0] as any;
    
    const loadedWorld = {
      ...emptyWorld,
      world: [worldRecord],
    };
    useStore.setState({ world: loadedWorld });
  } catch (error) {
    console.error('Erreur chargement monde:', error);
  }
};

export const saveWorld = async (): Promise<void> => {
  const { world } = useStore.getState();
  if (!world || !world.world || world.world.length === 0) return;
  await put('world', world.world[0]);
};

export const createWorld = async (name: string): Promise<void> => {
  const meta = createMeta(1);
  const worldRecord = createWorldRecord(name, meta);
  await put('world', worldRecord);
  await put('meta', meta);
  
  const loadedWorld = {
    ...emptyWorld,
    meta: [meta],
    world: [worldRecord as any],
  };
  useStore.setState({ world: loadedWorld });
};

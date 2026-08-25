import { World, Layer, Entity, Relation, Timeline } from '../core/schema/types';

export interface StoreState {
  meta: unknown;
  world: World | null;
  layers: Layer[];
  entities: Entity[];
  relations: Relation[];
  timelines: Timeline[];
}

const initialState: StoreState = {
  meta: {},
  world: null,
  layers: [],
  entities: [],
  relations: [],
  timelines: []
};

export const store = {
  state: { ...initialState },

  getWorld(): World | null {
    return this.state.world;
  },

  getLayers(): Layer[] {
    return this.state.layers;
  },

  getEntities(): Entity[] {
    return this.state.entities;
  },

  getRelations(): Relation[] {
    return this.state.relations;
  },

  getTimelines(): Timeline[] {
    return this.state.timelines;
  }
};

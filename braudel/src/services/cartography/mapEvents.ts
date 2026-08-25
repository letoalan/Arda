// services/cartography/mapEvents.ts

export type EntityClickCallback = (entityId: string) => void;
export type EditEntityCallback = (entityId: string) => void;
export type DrawCompleteCallback = (entityId: string, geometry: any) => void;

export class MapEventEmitter {
  private entityClickCallbacks: EntityClickCallback[] = [];
  private editEntityCallbacks: EditEntityCallback[] = [];
  private drawCompleteCallbacks: DrawCompleteCallback[] = [];

  onEntityClick(callback: EntityClickCallback) {
    this.entityClickCallbacks.push(callback);
  }

  onEditEntity(callback: EditEntityCallback) {
    this.editEntityCallbacks.push(callback);
  }

  onDrawComplete(callback: DrawCompleteCallback) {
    this.drawCompleteCallbacks.push(callback);
  }

  emitEntityClick(entityId: string) {
    this.entityClickCallbacks.forEach((cb) => cb(entityId));
  }

  emitEditEntity(entityId: string) {
    this.editEntityCallbacks.forEach((cb) => cb(entityId));
  }

  emitDrawComplete(entityId: string, geometry: any) {
    this.drawCompleteCallbacks.forEach((cb) => cb(entityId, geometry));
  }

  clearAll() {
    this.entityClickCallbacks = [];
    this.editEntityCallbacks = [];
    this.drawCompleteCallbacks = [];
  }
}

import { DatabaseSchema } from '../../core/schema';

class AppStore {
  private data: DatabaseSchema | null = null;

  getData(): DatabaseSchema | null {
    return this.data;
  }

  setData(newData: DatabaseSchema): void {
    this.data = newData;
  }

  clearData(): void {
    this.data = null;
  }
}

export const appStore = new AppStore();

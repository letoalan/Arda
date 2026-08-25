import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadWorld, saveWorld, createWorld } from './actions';
import * as persistenceService from '../services/persistence/indexeddb';
import { useStore, emptyWorld } from '../app/state/store';

vi.mock('../services/persistence/indexeddb');

describe('Store actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('loadWorld', () => {
    it('charge un monde existant depuis IndexedDB', async () => {
      const mockWorld = { id: '123', name: 'Test World' };
      (persistenceService.queryByWorldId as any).mockResolvedValue([mockWorld]);

      await loadWorld('123');

      expect(persistenceService.queryByWorldId).toHaveBeenCalledWith('world', '123');
    });

    it('gère les erreurs de chargement', async () => {
      (persistenceService.queryByWorldId as any).mockRejectedValue(new Error('DB error'));

      await loadWorld('invalid');

      expect(console.error).toHaveBeenCalledWith('Erreur chargement monde:', expect.any(Error));
    });
  });

  describe('saveWorld', () => {
    it('sauvegarde le monde courant dans IndexedDB', async () => {

      
      const meta = { id: "meta" as const, schemaVersion: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  const mockWorld = { id: "123", name: "Test World", worldType: "real" as const, meta };

 useStore.setState({
   world: { ...emptyWorld, world: [mockWorld], layers: [], entities: [], relations: [], timelines: [] }
 });

  await saveWorld();

  expect(persistenceService.put).toHaveBeenCalledWith('world', mockWorld);
    });

    it('ne fait rien si aucun monde courant', async () => {
      (useStore as any).setState({ ...emptyWorld, world: null });

      await saveWorld();

      expect(persistenceService.put).not.toHaveBeenCalled();
    });
  });

  describe('createWorld', () => {
    it('crée un nouveau monde avec méta et le sauvegarde', async () => {

      (persistenceService.put as any).mockResolvedValue(undefined);

      await createWorld('Nouveau Monde');

      expect(persistenceService.put).toHaveBeenCalledWith('world', expect.objectContaining({ name: 'Nouveau Monde' }));
    });
  });
});

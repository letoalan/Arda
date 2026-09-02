// app/state/store.ts

import { create } from 'zustand';
import { AppState, ViewMode } from './storeTypes';
import { initialAppState } from './appStateDefaults';
import { createEntity } from '../../core/schema/entities';
import * as db from '../../services/persistence/indexeddb';

import { emptyWorld, handleInitFromDB, handleDuplicateWorld } from './worldSlice';
import { handleAddLayer, handleToggleLayerVisibility, handleRemoveLayer } from './layerSlice';
import {
  handleAddEntity,
  handleUpdateEntityGeometry,
  handleUpdateEntityTemporalRange,
  handleUpdateEntityWikiContent,
  handleRemoveEntity,
} from './entitySlice';
import { handleAddRelation, handleRemoveRelation } from './relationSlice';
import { handleAcceptAiProposal, handleRejectAiProposal, handleToggleProposalSubEntity } from './aiSlice';
import { handleAddSubEntityToProposal, handleUpdateSubEntityInProposal, handleRemoveSubEntityFromProposal } from './slices/proposalSlice';
import { executeCreateRealWorld, executeCreateFictionalWorld, executeExportWorld, executeImportWorldFile } from './storeActions';
import { executeImportBatchEntities, executeRollbackImportBatch } from './storeBatchImport';
import { createUiSlice } from './storeUiActions';

export type { AppState, ViewMode };
export { emptyWorld };

export const useStore = create<AppState>((set, get) => ({
  ...initialAppState,
  ...createUiSlice(set),

  initFromDB: async (worldId?: string) => {
    set({ isLoading: true });
    const res = await handleInitFromDB(worldId);
    set({ ...res, isLoading: false });
  },

  saveToDB: async () => {},

  createRealWorld: async (name, description, basemapStyle, startYear = -3000, endYear = 2100) => {
    const res = await executeCreateRealWorld(name, description, basemapStyle, startYear, endYear);
    set(res.stateUpdate as any);
    return res.id;
  },

  createFictionalWorld: async (name, description, startYear = -3000, endYear = 2100) => {
    const res = await executeCreateFictionalWorld(name, description, startYear, endYear);
    set(res.stateUpdate as any);
    return res.id;
  },

  createNewWorld: async (name, description, type = 'real', basemapStyle, startYear = -3000, endYear = 2100) => {
    if (type === 'fictional') return get().createFictionalWorld(name, description, startYear, endYear);
    return get().createRealWorld(name, description, basemapStyle, startYear, endYear);
  },

  deleteWorld: async (worldId: string) => {
    await db.deleteWorldCascade(worldId);
    await get().initFromDB();
  },

  duplicateWorld: async (worldId: string, newName: string) => {
    const list = await handleDuplicateWorld(worldId, newName);
    if (list) set({ worldsList: list });
  },

  saveContinents: async (geojson: any) => {
    const { world } = get();
    const wRecord = world.world[0];
    if (wRecord) {
      wRecord.continents = geojson;
      if (wRecord.meta) wRecord.meta.updatedAt = new Date().toISOString();
      await db.put('world', wRecord);
      set((state) => ({ world: { ...state.world, world: [wRecord] } }));
    }
  },
  setSelectedEntity: (id) => set({ selectedEntityId: id }),
  setWikiModalEntityId: (id) => set({ wikiModalEntityId: id }),
  addLayer: (name, type) => set(handleAddLayer(get(), name, type)),
  toggleLayerVisibility: (layerId) => set(handleToggleLayerVisibility(get(), layerId)),
  removeLayer: (layerId) => set(handleRemoveLayer(get(), layerId)),
  addEntity: (layerId, name, type = 'place', validFrom, validTo) => {
    const res = handleAddEntity(get(), layerId, name, type, validFrom, validTo);
    set(res);
    return res.selectedEntityId!;
  },
  updateEntity: (entityId, updates) => {
    set((state) => {
      const updatedEntities = state.world.entities.map((e) => {
        if (e.id === entityId) {
          const updated = {
            ...e,
            ...updates,
            properties: {
              ...e.properties,
              ...(updates.properties || {}),
              ...(updates.color ? { color: updates.color } : {}),
            },
            updatedAt: new Date().toISOString(),
          };
          db.put('entities', updated);
          return updated;
        }
        return e;
      });
      return { world: { ...state.world, entities: updatedEntities } };
    });
  },
  updateEntityGeometry: (entityId, geometry) => set(handleUpdateEntityGeometry(get(), entityId, geometry)),
  updateEntityTemporalRange: (entityId, validFrom, validTo) => set(handleUpdateEntityTemporalRange(get(), entityId, validFrom, validTo)),
  updateEntityWikiContent: (entityId, wikiContent) => set(handleUpdateEntityWikiContent(get(), entityId, wikiContent)),

  updateEntityProperties: (entityId, properties) => {
    set((state) => {
      const updatedEntities = state.world.entities.map((e) => {
        if (e.id === entityId) {
          const updated = { ...e, properties: { ...e.properties, ...properties }, updatedAt: new Date().toISOString() };
          db.put('entities', updated);
          return updated;
        }
        return e;
      });
      return { world: { ...state.world, entities: updatedEntities } };
    });
  },

  clearEntityGeometry: (entityId) => {
    set((state) => {
      const updatedEntities = state.world.entities.map((e) => {
        if (e.id === entityId) {
          const updated = { ...e, geometry: undefined, updatedAt: new Date().toISOString() };
          db.put('entities', updated);
          return updated;
        }
        return e;
      });
      return { world: { ...state.world, entities: updatedEntities } };
    });
  },

  removeEntity: (entityId) => set(handleRemoveEntity(get(), entityId)),
  addRelation: (sourceId, targetId, type, direction, weight, isSpatial, entityId, validFrom, validTo) => set(handleAddRelation(get(), sourceId, targetId, type, direction, weight, isSpatial, entityId, validFrom, validTo)),
  removeRelation: (relationId) => set(handleRemoveRelation(get(), relationId)),
  updateReliefStyle: (exaggeration, shadowColor, highlightColor) => {
    const clampedExaggeration = Math.min(1.0, Math.max(0, Number(exaggeration) || 0));
    set((state) => {
      const reliefStyle = state.world.styles.find((s) => s.type === 'relief');
      let updatedStyles;
      if (reliefStyle) {
        updatedStyles = state.world.styles.map((s) => {
          if (s.id === reliefStyle.id) {
            const updated = { ...s, properties: { exaggeration: clampedExaggeration, shadowColor, highlightColor } };
            db.put('styles', updated);
            return updated;
          }
          return s;
        });
      } else {
        const newStyle: any = {
          id: crypto.randomUUID(),
          worldId: state.world.world[0]?.id || crypto.randomUUID(),
          type: 'relief',
          name: 'Style Relief',
          properties: { exaggeration: clampedExaggeration, shadowColor, highlightColor }
        };
        db.put('styles', newStyle);
        updatedStyles = [...state.world.styles, newStyle];
      }
      return { world: { ...state.world, styles: updatedStyles } };
    });
  },
  setClimateSeaLevelVisible: (visible) => set({ climateSeaLevelVisible: visible }),
  setClimateIceCapVisible: (visible) => set({ climateIceCapVisible: visible }),
  setClimateMedianTarget: (target) => set({ climateMedianTarget: target }),
  setClimateRcpVariability: (enabled) => set({ climateRcpVariability: enabled }),
  setClimateSelectedRcp: (rcp) => set({ climateSelectedRcp: rcp }),
  setTolkienClimateParams: (params) => set((s) => ({ tolkienClimateParams: { ...s.tolkienClimateParams, ...params } })),

  addAiProposal: (proposal) => set((state) => ({ aiProposals: [...state.aiProposals, proposal] })),
  acceptAiProposal: async (proposalId) => {
    const state = get();
    const proposal = state.aiProposals.find((p) => p.id === proposalId);
    if (!proposal) return;

    if (proposal.type === 'addEntity' && proposal.data) {
      const data = proposal.data as any;
      let layerId = data.layerId;
      if (!layerId || !state.world.layers.some((l) => l.id === layerId)) {
        const existingLayer = state.world.layers.find((l) => l.type === 'physical') || state.world.layers[0];
        if (existingLayer) {
          layerId = existingLayer.id;
        } else {
          if (typeof window !== 'undefined' && typeof window.alert === 'function') {
            window.alert("Erreur : Aucune couche disponible.");
          }
          return;
        }
      }

      const entityName = data.name || 'Entité historique';
      const validFrom = data.temporalRange?.validFrom ?? data.validFrom ?? state.startYear;
      const validTo = data.temporalRange?.validTo ?? data.validTo ?? state.endYear;
      const newEntity = createEntity(state.world.world[0]?.id || crypto.randomUUID(), layerId, 'place', entityName, data.geometry, validFrom, validTo);
      await db.put('entities', newEntity);
      set((s) => ({ world: { ...s.world, entities: [...s.world.entities, newEntity] } }));
    }
    set(handleAcceptAiProposal(get(), proposalId));
  },

  rejectAiProposal: (proposalId, reason) => set(handleRejectAiProposal(get(), proposalId, reason)),
  toggleProposalSubEntity: (proposalId, subId) => set(handleToggleProposalSubEntity(get(), proposalId, subId)),
  addSubEntityToProposal: (proposalId, name, type, geometry) => set(handleAddSubEntityToProposal(get(), proposalId, name, type, geometry)),
  updateSubEntityInProposal: (proposalId, subId, updates) => set(handleUpdateSubEntityInProposal(get(), proposalId, subId, updates)),
  removeSubEntityFromProposal: (proposalId, subId) => set(handleRemoveSubEntityFromProposal(get(), proposalId, subId)),

  selectProposal: (proposal) => set({ selectedProposal: proposal }),
  addAiSession: (session) => set((state) => ({ aiSessions: [...state.aiSessions, session] })),

  exportWorld: async () => {
    set({ exportLoading: true, exportError: null });
    try { await executeExportWorld(get().world); }
    catch (err) { set({ exportError: err instanceof Error ? err.message : "Erreur lors de l'export" }); }
    finally { set({ exportLoading: false }); }
  },

  importWorldFile: async (file) => {
    set({ importLoading: true, importError: null });
    try {
      const id = await executeImportWorldFile(file);
      await get().initFromDB(id);
      return id!;
    } catch (err) {
      set({ importError: err instanceof Error ? err.message : "Erreur d'importation" });
      throw err;
    } finally { set({ importLoading: false }); }
  },

  importBatchEntities: async (entities, batchTitle = 'Batch GeoJSON') => executeImportBatchEntities(set, get, entities, batchTitle),
  rollbackImportBatch: async (importBatchId) => executeRollbackImportBatch(get, importBatchId),
}));

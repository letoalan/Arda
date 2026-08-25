// app/state/storeUiActions.ts

import { BasemapStyleId } from '../../core/styles.config';
import { ViewMode } from './storeTypes';

export function createUiSlice(set: any) {
  return {
    setBasemapStyle: (style: BasemapStyleId) => set({ basemapStyle: style }),
    setBasemapLabelsVisible: (visible: boolean) => set({ basemapLabelsVisible: visible }),
    setBasemapBordersVisible: (visible: boolean) => set({ basemapBordersVisible: visible }),
    setBasemapRoadsVisible: (visible: boolean) => set({ basemapRoadsVisible: visible }),
    setBasemapRiversVisible: (visible: boolean) => set({ basemapRiversVisible: visible }),
    setGeoReferenceLinesVisible: (visible: boolean) => set({ geoReferenceLinesVisible: visible }),
    setPortulanRhumbVisible: (visible: boolean) => set({ portulanRhumbVisible: visible }),
    setMapProjection: (proj: any) => set({ mapProjection: proj }),
    setActiveEmpire: (empire: 'all' | 'british' | 'french' | 'portuguese' | 'neutral') => set({ activeEmpire: empire }),
    setCurrentTime: (time: number) => set({ currentTime: time }),
    setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
    togglePlayback: () => set((state: any) => ({ isPlaying: !state.isPlaying })),
    setPlaybackSpeed: (speed: number) => set({ playbackSpeed: speed }),
    togglePrometheanMode: () => set((state: any) => ({ prometheanMode: !state.prometheanMode })),
    setMapLoading: (loading: boolean, durationMs = 55000) => set({ mapLoading: loading, mapLoadingDuration: durationMs }),
    setMapLoadingProgress: (progress: number) => set({ mapLoadingProgress: progress }),
    setFirstLoadDone: (done: boolean) => set({ isFirstLoadDone: done }),
    setNetworkFilters: (filters: any) => set({ networkFilters: filters }),
    clearErrors: () => set({ importError: null, exportError: null }),
  };
}

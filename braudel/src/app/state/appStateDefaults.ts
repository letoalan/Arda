// app/state/appStateDefaults.ts

import { emptyWorld } from './slices/worldSlice';
import { getBasemapFeatureDefaults } from '../../core/styles/styleFeatureDefaults';

const defaultBasemapStyle = 'contemporary_current' as const;
const defaultFeatures = getBasemapFeatureDefaults(defaultBasemapStyle);

export const initialAppState = {
  world: emptyWorld,
  worldsList: [],
  isLoading: true,
  isFirstLoadDone: false,
  selectedEntityId: null,
  wikiModalEntityId: null,
  basemapStyle: defaultBasemapStyle,
  basemapLabelsVisible: true,
  basemapBordersVisible: defaultFeatures.bordersVisible,
  basemapRoadsVisible: true,
  basemapRiversVisible: true,
  geoReferenceLinesVisible: true,
  portulanRhumbVisible: defaultFeatures.portulanRhumbVisible,
  graticuleVisible: defaultFeatures.graticuleVisible,
  mapProjection: 'mercator' as const,
  activeEmpire: 'all' as const,
  currentTime: -3000,
  startYear: -3000,
  endYear: 2100,
  viewMode: '2D' as const,
  isPlaying: false,
  playbackSpeed: 1,
  prometheanMode: false,
  mapLoading: false,
  mapLoadingProgress: 0,
  mapLoadingDuration: 55000,
  networkFilters: {},
  aiProposals: [],
  aiSessions: [],
  selectedProposal: null,
  importLoading: false,
  exportLoading: false,
  importError: null,
  exportError: null,
  importProgress: null,
  climateSeaLevelVisible: false,
  climateIceCapVisible: false,
  climateMedianTarget: 2.5,
  climateRcpVariability: false,
  climateSelectedRcp: null as 'RCP2.6' | 'RCP4.5' | 'RCP6.0' | 'RCP8.5' | null,
  tolkienClimateParams: {
    startingPoint: 'temperate' as const,
    trend: 'warming' as const,
    intensity: 2,
    speed: 2,
    dominantCause: 'astronomical' as const
  },
  isStudioMode: false,
  studioLayoutMode: 'dual' as const
};

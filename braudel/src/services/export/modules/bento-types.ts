import { StyleConfig, getEffectiveStyleBearing } from '../../../core/styles.config';
import { StoryProject } from '../../../core/schema/story';

export const CURRENT_ARDA_SCHEMA_VERSION = '1.1.0';

export interface ArdaTerrainConfig {
  mode: 'remote' | 'none';
  terrainTilesUrl?: string;
  encoding?: 'mapbox' | 'terrarium';
  exaggeration?: number;
  hillshadeEnabled?: boolean;
}

export interface ArdaCameraState {
  center: [number, number];
  zoom: number;
  pitch?: number;
  bearing?: number;
}

export interface ArdaExAction {
  triggerText: string;
  viewpoint?: ArdaCameraState;
  highlightEntityId?: string;
  popupInfo?: {
    title: string;
    dates?: string;
    description: string;
  };
}

export interface ArdaWaypoint {
  id: string;
  year: number;
  label?: string;
  cameraState: ArdaCameraState;
  narrationText: string;
  slideRefs: string[];
  partOfArgument?: string;
  recommendedDocumentId?: string;
  actions?: ArdaExAction[];
  mapLayers?: string[];
}

export interface ArdaSlideElement {
  id: string;
  type: 'text' | 'image' | 'video' | 'diagram' | 'callout' | 'table' | 'chart' | 'shape';
  title?: string;
  content?: string;
  url?: string;
  src?: string;
  videoUrl?: string;
  caption?: string;
  diagramType?: string;
  diagramData?: any;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  zIndex?: number;
  rotation?: number;
  opacity?: number;
  fontSize?: number;
  fontWeight?: number | string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  align?: 'left' | 'center' | 'right' | 'justify';
  shapeType?: 'rectangle' | 'circle' | 'pill' | 'arrow' | 'star';
  objectFit?: 'contain' | 'cover' | 'fill';
  style?: Record<string, any>;
}

export interface ArdaSlideBackground {
  type: 'color' | 'image';
  value: string;
}

export interface ArdaSlide {
  id: string;
  title: string;
  attachedToWaypoint: string;
  returnBehavior: 'same-waypoint';
  background?: ArdaSlideBackground;
  elements: ArdaSlideElement[];
  speakerNotes?: string;
  aspectRatio?: '16:9' | '9:16';
}

export interface ArdaMapConfig {
  styleUrl: string;
  styleId: string;
  center: [number, number];
  zoom: number;
  bearing?: number;
  pitch?: number;
  projection?: 'mercator' | 'globe' | 'eckert4';
  terrain?: ArdaTerrainConfig;
  geoReferenceLinesVisible?: boolean;
  portulanRhumbVisible?: boolean;
  graticuleVisible?: boolean;
  basemapLabelsVisible?: boolean;
  basemapBordersVisible?: boolean;
  basemapRoadsVisible?: boolean;
  basemapRiversVisible?: boolean;
}

export interface ArdaDoc {
  schemaVersion?: string;
  format: 'arda/map-story';
  title: string;
  map: ArdaMapConfig;
  timeline: {
    start: number;
    end: number;
    unit: 'year' | 'decade' | 'century';
  };
  waypoints: ArdaWaypoint[];
  slides: ArdaSlide[];
  entitiesGeoJSON: any;
  relationsGeoJSON: any;
}

/**
 * Convertit un StoryProject ou extrait automatiquement les époques temporelles des entités
 * pour produire un document ArdaDoc standardisé.
 */
export function convertStoryProjectToArdaDoc(
  worldName: string,
  styleConfig: StyleConfig,
  entitiesGeoJSON: any,
  relationsGeoJSON: any,
  storyProject?: StoryProject,
  mapOptions?: {
    geoReferenceLinesVisible?: boolean;
    portulanRhumbVisible?: boolean;
    graticuleVisible?: boolean;
    basemapLabelsVisible?: boolean;
    basemapBordersVisible?: boolean;
    basemapRoadsVisible?: boolean;
    basemapRiversVisible?: boolean;
    pitch?: number;
    projection?: 'mercator' | 'globe' | 'eckert4';
  }
): ArdaDoc {
  const waypoints: ArdaWaypoint[] = [];
  const slides: ArdaSlide[] = [];

  let minYear = Infinity;
  let maxYear = -Infinity;

  // 1. Extraire les bornes temporelles réelles des entités GeoJSON
  const temporalEntities = (entitiesGeoJSON?.features || []).filter((f: any) => {
    const vf = f.properties?.validFrom ?? f.temporalRange?.validFrom;
    const vt = f.properties?.validTo ?? f.temporalRange?.validTo;
    return typeof vf === 'number' || typeof vt === 'number';
  });

  const hasCustomStory = Boolean(storyProject && storyProject.scenes && storyProject.scenes.length > 1);

  if (hasCustomStory && storyProject && storyProject.scenes) {
    const years = storyProject.scenes.map((s) => s.mapState?.timelineYear ?? (s as any).year ?? 0);
    minYear = Math.min(...years);
    maxYear = Math.max(...years);
    if (minYear === maxYear) {
      minYear -= 50;
      maxYear += 50;
    }
  } else {
    temporalEntities.forEach((f: any) => {
      const vf = f.properties?.validFrom ?? f.temporalRange?.validFrom;
      const vt = f.properties?.validTo ?? f.temporalRange?.validTo;
      if (typeof vf === 'number') {
        minYear = Math.min(minYear, vf);
        maxYear = Math.max(maxYear, vf);
      }
      if (typeof vt === 'number') {
        minYear = Math.min(minYear, vt);
        maxYear = Math.max(maxYear, vt);
      }
    });

    // Si une scène par défaut a une date différente, l'inclure également
    if (storyProject && storyProject.scenes && storyProject.scenes.length > 0) {
      const y = storyProject.scenes[0].mapState?.timelineYear ?? (storyProject.scenes[0] as any).year;
      if (typeof y === 'number' && minYear !== Infinity && maxYear !== -Infinity) {
        minYear = Math.min(minYear, y);
        maxYear = Math.max(maxYear, y);
      }
    }

    if (minYear === Infinity || maxYear === -Infinity) {
      minYear = 0;
      maxYear = 2000;
    } else if (minYear === maxYear) {
      minYear -= 50;
      maxYear += 50;
    }
  }

  if (hasCustomStory && storyProject) {
    storyProject.scenes.forEach((scene, idx) => {
      const wpId = `wp-${scene.id || idx + 1}`;
      const year = scene.mapState?.timelineYear ?? (scene as any).year ?? minYear;
      const cameraState: ArdaCameraState = {
        center: scene.mapState?.center || [12.5, 42.0],
        zoom: scene.mapState?.zoom ?? 4,
        pitch: scene.mapState?.pitch || 0,
        bearing: getEffectiveStyleBearing(scene.mapState?.basemapStyle || styleConfig.id, scene.mapState?.bearing),
      };

      const slideRefs: string[] = [];

      if ((scene as any).blocks && (scene as any).blocks.length > 0) {
        const slideId = `slide-${scene.id || idx + 1}`;
        slideRefs.push(slideId);

        const elements: ArdaSlideElement[] = (scene as any).blocks.map((block: any, bIdx: number) => ({
          id: `elem-${bIdx}`,
          type: (block.type as any) || 'text',
          title: block.title,
          content: block.content || block.text,
          url: block.url || block.src,
          caption: block.caption,
          style: block.style,
        }));

        slides.push({
          id: slideId,
          title: scene.title || `Diapositive d'appui (${year})`,
          attachedToWaypoint: wpId,
          returnBehavior: 'same-waypoint',
          elements,
          speakerNotes: (scene as any).narrationText,
        });
      }

      waypoints.push({
        id: wpId,
        year,
        label: scene.title || `Étape ${idx + 1}`,
        cameraState,
        narrationText: scene.body || (scene as any).narrationText || '',
        slideRefs,
        partOfArgument: (scene as any).partOfArgument,
        recommendedDocumentId: (scene as any).recommendedDocumentId,
        actions: (scene as any).actions,
        mapLayers: scene.mapState?.visibleLayerIds,
      });
    });
  } else {
    // Mode repli enrichi : détection automatique des époques temporelles
    if (temporalEntities.length > 0) {
      const yearPoints = new Set<number>();
      temporalEntities.forEach((f: any) => {
        const vf = f.properties?.validFrom ?? f.temporalRange?.validFrom;
        const vt = f.properties?.validTo ?? f.temporalRange?.validTo;
        if (typeof vf === 'number') yearPoints.add(vf);
        if (typeof vt === 'number') yearPoints.add(vt);
        if (typeof vf === 'number' && typeof vt === 'number') {
          const mid = Math.round((vf + vt) / 2);
          yearPoints.add(mid);
        }
      });
      const sortedYears = Array.from(yearPoints).sort((a, b) => a - b);
      const defaultPitch = mapOptions?.pitch ?? ((styleConfig as any).demEnabled ? 45 : 0);

      sortedYears.forEach((yr, idx) => {
        const activeCount = temporalEntities.filter((f: any) => {
          const vf = f.properties?.validFrom ?? f.temporalRange?.validFrom ?? -Infinity;
          const vt = f.properties?.validTo ?? f.temporalRange?.validTo ?? Infinity;
          if (vf === vt) return vf === yr;
          return vf <= yr && yr < vt;
        }).length;
        const formattedYear = yr >= 0 ? `An ${yr}` : `${Math.abs(yr)} av. J.-C.`;
        waypoints.push({
          id: `wp-auto-${idx + 1}`,
          year: yr,
          label: `${worldName} — ${formattedYear}`,
          cameraState: { center: [12.5, 42.0], zoom: 4, pitch: defaultPitch, bearing: getEffectiveStyleBearing(styleConfig.id, styleConfig.bearing) },
          narrationText: `Situation géopolitique en ${formattedYear} (${activeCount} entités actives identifiées).`,
          slideRefs: [],
        });
      });
    } else {
      const defaultPitch = mapOptions?.pitch ?? ((styleConfig as any).demEnabled ? 45 : 0);
      waypoints.push({
        id: 'wp-default',
        year: minYear,
        label: worldName,
        cameraState: { center: [12.5, 42.0], zoom: 4, pitch: defaultPitch, bearing: getEffectiveStyleBearing(styleConfig.id, 0) },
        narrationText: `Exploration cartographique interactive de ${worldName}.`,
        slideRefs: [],
      });
    }
  }

  return {
    schemaVersion: CURRENT_ARDA_SCHEMA_VERSION,
    format: 'arda/map-story',
    title: storyProject?.title || worldName || 'Carte-Récit Braudel',
    map: {
      styleUrl: styleConfig.mapStyleUrl,
      styleId: styleConfig.id,
      center: [12.5, 42.0],
      zoom: 4,
      bearing: getEffectiveStyleBearing(styleConfig.id, styleConfig.bearing),
      pitch: mapOptions?.pitch ?? ((styleConfig as any).demEnabled ? 45 : 0),
      projection: mapOptions?.projection || 'mercator',
      terrain: {
        mode: (styleConfig as any).terrainEnabled === false ? 'none' : 'remote',
        terrainTilesUrl: (styleConfig as any).demUrl || 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
        encoding: ((styleConfig as any).demUrl?.includes('terrarium') || !(styleConfig as any).demUrl) ? 'terrarium' : 'mapbox',
        exaggeration: (styleConfig as any).demExaggeration || 1.2,
        hillshadeEnabled: true,
      },
      geoReferenceLinesVisible: mapOptions?.geoReferenceLinesVisible,
      portulanRhumbVisible: mapOptions?.portulanRhumbVisible !== undefined ? mapOptions.portulanRhumbVisible : true,
      graticuleVisible: mapOptions?.graticuleVisible !== undefined ? mapOptions.graticuleVisible : true,
      basemapLabelsVisible: mapOptions?.basemapLabelsVisible,
      basemapBordersVisible: mapOptions?.basemapBordersVisible,
      basemapRoadsVisible: mapOptions?.basemapRoadsVisible,
      basemapRiversVisible: mapOptions?.basemapRiversVisible,
    },
    timeline: {
      start: minYear,
      end: maxYear,
      unit: 'year',
    },
    waypoints,
    slides,
    entitiesGeoJSON,
    relationsGeoJSON,
  };
}

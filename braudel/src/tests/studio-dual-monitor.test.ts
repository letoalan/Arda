// tests/studio-dual-monitor.test.ts

import { describe, it, expect, vi } from 'vitest';
import { getVideoClipAtTime } from '../services/export/TimelineScheduler';
import { EditTimeline } from '../services/export/studio-types';
import { Entity } from '../core/schema/types';

describe('Mode Studio — Architecture Régie Bi-Écran (Workspace & Programme)', () => {
  const sampleTimeline: EditTimeline = {
    id: 'test-timeline',
    videoTracks: [
      {
        id: 'clip-1',
        sceneId: 'scene-1',
        trackIndex: 0,
        startMs: 0,
        durationMs: 3000,
        title: 'Bassin Méditerranéen Ancien',
        periodNumber: 1,
        totalPeriods: 3,
        timelineYear: -500,
        mediaType: 'map',
        mapState: {
          center: [15.0, 37.0],
          zoom: 4.5,
          bearing: 0,
          pitch: 15,
          visibleLayerIds: ['layer-1']
        }
      },
      {
        id: 'clip-2',
        trackIndex: 0,
        startMs: 3000,
        durationMs: 4000,
        title: 'Gravure Portulan Al-Idrisi',
        periodNumber: 2,
        totalPeriods: 3,
        timelineYear: 1154,
        mediaType: 'image',
        mediaUrl: 'data:image/png;base64,sample'
      },
      {
        id: 'clip-3',
        trackIndex: 0,
        startMs: 7000,
        durationMs: 5000,
        title: 'Animation Flotte Commerciale',
        periodNumber: 3,
        totalPeriods: 3,
        timelineYear: 1500,
        mediaType: 'video',
        mediaUrl: 'blob:http://localhost/video.mp4',
        trimStartMs: 1200
      }
    ],
    audioTracks: [],
    totalDurationMs: 12000,
    zoomScale: 60,
    playheadMs: 0
  };

  const sampleEntities: Entity[] = [
    {
      id: 'ent-1',
      worldId: 'world-1',
      layerId: 'layer-1',
      name: 'Athènes Classique',
      type: 'place',
      temporalRange: { validFrom: -800, validTo: -146 }
    },
    {
      id: 'ent-2',
      worldId: 'world-1',
      layerId: 'layer-1',
      name: 'Palerme Normande',
      type: 'place',
      temporalRange: { validFrom: 1060, validTo: 1194 }
    },
    {
      id: 'ent-3',
      worldId: 'world-1',
      layerId: 'layer-1',
      name: 'Venise Renaissance',
      type: 'place',
      temporalRange: { validFrom: 1400, validTo: 1797 }
    }
  ];

  it('1. Résout fidèlement le clip actif dans le moniteur programme selon le playhead', () => {
    // Dans le premier clip (Carte)
    const clipAt1s = getVideoClipAtTime(sampleTimeline, 1000);
    expect(clipAt1s).toBeDefined();
    expect(clipAt1s?.id).toBe('clip-1');
    expect(clipAt1s?.mediaType).toBe('map');
    expect(clipAt1s?.timelineYear).toBe(-500);

    // Dans le deuxième clip (Image)
    const clipAt4s = getVideoClipAtTime(sampleTimeline, 4000);
    expect(clipAt4s).toBeDefined();
    expect(clipAt4s?.id).toBe('clip-2');
    expect(clipAt4s?.mediaType).toBe('image');
    expect(clipAt4s?.timelineYear).toBe(1154);

    // Dans le troisième clip (Vidéo)
    const clipAt9s = getVideoClipAtTime(sampleTimeline, 9000);
    expect(clipAt9s).toBeDefined();
    expect(clipAt9s?.id).toBe('clip-3');
    expect(clipAt9s?.mediaType).toBe('video');

    // Dans un gap (au-delà de la durée totale) avec mode strict
    const clipAt20s = getVideoClipAtTime(sampleTimeline, 20000, true);
    expect(clipAt20s).toBeUndefined();
  });

  it('2. Calcule avec exactitude le timecode relatif d\'une vidéo externe avec trim In', () => {
    const videoClip = sampleTimeline.videoTracks[2];
    const playheadMs = 8500; // 1.5s après le début du clip (7000ms)

    // Offset effectif dans le fichier vidéo source : (playhead - start + trimStart) / 1000
    const targetTimeSec = Math.max(
      0,
      (playheadMs - (videoClip.startMs ?? 0) + (videoClip.trimStartMs ?? 0)) / 1000
    );

    // 8500 - 7000 = 1500ms écoulées + 1200ms de trim = 2700ms -> 2.7s
    expect(targetTimeSec).toBe(2.7);
  });

  it('3. Filtre les entités actives pour le cartouche cinématique selon l\'année historique', () => {
    const filterEntitiesForYear = (year: number) => {
      return sampleEntities.filter(e => {
        if (!e.temporalRange) return true;
        return e.temporalRange.validFrom <= year && e.temporalRange.validTo >= year;
      });
    };

    // Année -500 (Grèce antique) -> Seule Athènes est visible
    const entsYearMinus500 = filterEntitiesForYear(-500);
    expect(entsYearMinus500.map(e => e.name)).toEqual(['Athènes Classique']);

    // Année 1154 (Al-Idrisi) -> Seule Palerme est visible
    const entsYear1154 = filterEntitiesForYear(1154);
    expect(entsYear1154.map(e => e.name)).toEqual(['Palerme Normande']);

    // Année 1500 (Renaissance) -> Seule Venise est visible
    const entsYear1500 = filterEntitiesForYear(1500);
    expect(entsYear1500.map(e => e.name)).toEqual(['Venise Renaissance']);

    // Année 2000 -> Aucune entité historique n'est active
    const entsYear2000 = filterEntitiesForYear(2000);
    expect(entsYear2000).toHaveLength(0);
  });

  it('4. Formate élégamment les dates historiques pour le cartouche (av. J.-C. vs An X)', () => {
    const formatYear = (year: number) => {
      return year < 0 ? `${Math.abs(year)} av. J.-C.` : `An ${year}`;
    };

    expect(formatYear(-500)).toBe('500 av. J.-C.');
    expect(formatYear(1154)).toBe('An 1154');
    expect(formatYear(1500)).toBe('An 1500');
  });

  it('5. Valide la mise à jour du cadrage de caméra pour un clip spécifique (onSaveCamera)', () => {
    const onSaveCameraMock = vi.fn((clipId: string, newMapState: any) => {
      const updatedClips = sampleTimeline.videoTracks.map(c => 
        c.id === clipId ? { ...c, mapState: newMapState } : c
      );
      return updatedClips;
    });

    const newCapturedCamera = {
      center: [2.35, 48.85] as [number, number],
      zoom: 6.8,
      bearing: 45,
      pitch: 30,
      timelineYear: -500
    };

    const updated = onSaveCameraMock('clip-1', newCapturedCamera);
    expect(onSaveCameraMock).toHaveBeenCalledWith('clip-1', newCapturedCamera);
    expect(updated[0].mapState).toEqual(newCapturedCamera);
    expect(updated[1].mapState).toBeUndefined(); // Les autres clips restent intacts
  });

  it('6. Isole strictement les codecs audio (CODEC_CASCADE_AUDIO) pour prévenir le rejet DOMException par MediaRecorder', async () => {
    const { CODEC_CASCADE_AUDIO, CODEC_CASCADE_VIDEO_ONLY } = await import('../services/export/video-export');

    // Les codecs composites (audio) doivent obligatoirement déclarer un codec audio (opus, mp4a) ou un conteneur générique
    expect(CODEC_CASCADE_AUDIO.some(c => c.includes('opus'))).toBe(true);
    expect(CODEC_CASCADE_AUDIO.includes('video/webm')).toBe(true);
    expect(CODEC_CASCADE_AUDIO.includes('video/webm;codecs=vp8')).toBe(false); // Doit être exclu pour éviter l'erreur unsupported codec
    expect(CODEC_CASCADE_AUDIO.includes('video/webm;codecs=vp9')).toBe(false);

    // Les codecs vidéo pure ne doivent pas forcer opus
    expect(CODEC_CASCADE_VIDEO_ONLY.includes('video/webm;codecs=vp8')).toBe(true);
    expect(CODEC_CASCADE_VIDEO_ONLY.some(c => c.includes('opus'))).toBe(false);
  });

  it('7. Sauvegarde, restaure et exporte un projet vidéo complet avec sa timeline', async () => {
    const { saveStoryToStorage, loadStoryFromStorage, createDefaultStory } = await import('../services/export/story-export');

    const storageMap = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storageMap.get(key) || null,
      setItem: (key: string, val: string) => storageMap.set(key, String(val)),
      removeItem: (key: string) => storageMap.delete(key),
      clear: () => storageMap.clear(),
    });

    const baseStory = createDefaultStory('Arda Studio Test');
    const storyWithTimeline = {
      ...baseStory,
      editTimeline: sampleTimeline
    };

    saveStoryToStorage(storyWithTimeline);
    const loaded = loadStoryFromStorage('Arda Studio Test');

    expect((loaded as any).editTimeline).toBeDefined();
    expect((loaded as any).editTimeline.videoTracks).toHaveLength(3);
    expect((loaded as any).editTimeline.videoTracks[0].id).toBe('clip-1');

    vi.unstubAllGlobals();
  });

  it('8. getEffectiveStyleBearing garantit le cap 180° (Sud en haut) pour Al-Idrisi et respecte les autres styles', async () => {
    const { getEffectiveStyleBearing } = await import('../core/styles.config');

    // Style Al-Idrisi sans bearing spécifié ou avec 0 -> 180°
    expect(getEffectiveStyleBearing('al_idrisi')).toBe(180);
    expect(getEffectiveStyleBearing('al_idrisi', 0)).toBe(180);
    expect(getEffectiveStyleBearing('al_idrisi', undefined)).toBe(180);

    // Style Al-Idrisi avec cap personnalisé spécifique (ex: 185° ou -175°)
    expect(getEffectiveStyleBearing('al_idrisi', 185)).toBe(185);

    // Autres styles cartographiques -> conserve 0 ou le cap spécifié
    expect(getEffectiveStyleBearing('renaissance')).toBe(0);
    expect(getEffectiveStyleBearing('renaissance', 0)).toBe(0);
    expect(getEffectiveStyleBearing('medieval', 45)).toBe(45);
    expect(getEffectiveStyleBearing('contemporary_current', 0)).toBe(0);
  });

  it('9. createDefaultEditTimeline assigne automatiquement le cap 180° aux plans Al-Idrisi', async () => {
    const { createDefaultEditTimeline } = await import('../services/export/studio-types');
    const { createDefaultStory } = await import('../services/export/story-export');

    const baseStory = createDefaultStory('Al-Idrisi Test World');
    // Forcer le style de la scène à al_idrisi
    baseStory.scenes[0].mapState = {
      center: [14.0, 37.5],
      zoom: 5,
      pitch: 0,
      basemapStyle: 'al_idrisi',
      visibleLayerIds: []
    };

    const timeline = createDefaultEditTimeline(baseStory);
    expect(timeline.videoTracks).toHaveLength(1);
    expect(timeline.videoTracks[0].mapState?.bearing).toBe(180);
  });

  it('10. La synchronisation du playhead et la réinitialisation de caméra appliquent 180° pour Al-Idrisi', async () => {
    const { getEffectiveStyleBearing } = await import('../core/styles.config');

    const mapMock = {
      jumpTo: vi.fn(),
      getBearing: vi.fn(() => 0),
    };

    const idrisiClip = {
      id: 'idrisi-clip',
      startMs: 0,
      durationMs: 4000,
      mediaType: 'map' as const,
      mapState: {
        center: [14.0, 37.5] as [number, number],
        zoom: 5,
        bearing: undefined, // Non spécifié
        basemapStyle: 'al_idrisi' as const,
        pitch: 0
      }
    };

    // Simulation de la logique de syncMapToPlayhead
    const targetBearing = getEffectiveStyleBearing(idrisiClip.mapState.basemapStyle, idrisiClip.mapState.bearing);
    mapMock.jumpTo({
      center: idrisiClip.mapState.center,
      zoom: idrisiClip.mapState.zoom,
      bearing: targetBearing,
      pitch: idrisiClip.mapState.pitch
    });

    expect(targetBearing).toBe(180);
    expect(mapMock.jumpTo).toHaveBeenCalledWith(expect.objectContaining({
      bearing: 180
    }));
  });

  it('11. getEffectiveStyleBearing gère les variantes d\'identifiants et URL contenant idrisi de manière insensible à la casse', async () => {
    const { getEffectiveStyleBearing } = await import('../core/styles.config');

    expect(getEffectiveStyleBearing('Al_Idrisi')).toBe(180);
    expect(getEffectiveStyleBearing('al_idrisi_medieval')).toBe(180);
    expect(getEffectiveStyleBearing('style-idrisi-historical', 0)).toBe(180);
    expect(getEffectiveStyleBearing('IDRISI_ISLAMIC', undefined)).toBe(180);
    expect(getEffectiveStyleBearing('idrisi_custom', 190)).toBe(190);
  });

  it('12. playSceneTransition garantit le cap 180° pour Al-Idrisi sur toutes les scènes même sans basemapStyle unitaire', async () => {
    const { playSceneTransition } = await import('../services/cartography/camera-orchestrator');
    const { mapService } = await import('../services/cartography/map-service');

    // On mocke le style actif dans mapService
    vi.spyOn(mapService, 'getCurrentStyleId').mockReturnValue('al_idrisi' as any);

    const jumpToMock = vi.fn();
    const mapMock = {
      jumpTo: jumpToMock,
      flyTo: vi.fn(),
      getBearing: vi.fn(() => 0),
      getPitch: vi.fn(() => 0),
      once: vi.fn((_event, cb) => cb()),
      isStyleLoaded: vi.fn(() => true),
      areTilesLoaded: vi.fn(() => true),
    };

    // Scène sans basemapStyle explicite et avec bearing par défaut (0)
    const sceneToState = {
      center: [12.0, 43.0] as [number, number],
      zoom: 4,
      pitch: 0,
      bearing: 0,
      visibleLayerIds: []
    };

    await playSceneTransition(
      mapMock,
      { profile: 'cut', durationMode: 'auto', pauseAfterMs: 500, reduceMotionPolicy: 'respect' },
      undefined,
      sceneToState,
      false
    );

    expect(jumpToMock).toHaveBeenCalledWith(expect.objectContaining({
      bearing: 180
    }));

    vi.restoreAllMocks();
  });

  it('13. createDefaultEditTimeline avec fallbackAlIdrisi garantit le cap 180° sur 100% des diapositives sans exception', async () => {
    const { createDefaultEditTimeline } = await import('../services/export/studio-types');

    const multiSlideStory = {
      id: 'story-multi-idrisi',
      title: 'Voyage Al-Idrisi',
      defaultFps: 30,
      scenes: [
        {
          id: 'slide-1',
          title: 'Diapositive 1 : Sicile Normande',
          mapState: { center: [14.0, 37.5] as [number, number], zoom: 6, bearing: 0, pitch: 0, visibleLayerIds: [] }
        },
        {
          id: 'slide-2',
          title: 'Diapositive 2 : Maghreb et Méditerranée',
          mapState: { center: [3.0, 36.7] as [number, number], zoom: 5, bearing: undefined, pitch: 0, visibleLayerIds: [] }
        },
        {
          id: 'slide-3',
          title: 'Diapositive 3 : Mer Rouge et Océan Indien',
          mapState: { center: [45.0, 15.0] as [number, number], zoom: 4, bearing: 0, pitch: 0, visibleLayerIds: [] }
        }
      ]
    };

    const timeline = createDefaultEditTimeline(multiSlideStory as any, 'al_idrisi');
    expect(timeline.videoTracks).toHaveLength(3);
    expect(timeline.videoTracks[0].mapState?.bearing).toBe(180);
    expect(timeline.videoTracks[1].mapState?.bearing).toBe(180);
    expect(timeline.videoTracks[2].mapState?.bearing).toBe(180);
    expect(timeline.videoTracks[0].mapState?.basemapStyle).toBe('al_idrisi');
    expect(timeline.videoTracks[1].mapState?.basemapStyle).toBe('al_idrisi');
    expect(timeline.videoTracks[2].mapState?.basemapStyle).toBe('al_idrisi');
  });

  it('14. resolveTargetVideoDimensions standardise la production en 16:9 Full HD et supporte les ratios vidéo', async () => {
    const { resolveTargetVideoDimensions } = await import('../services/export/video-export');

    // Résolution standard (1080p 16:9)
    const resDefault = resolveTargetVideoDimensions();
    expect(resDefault.width).toBe(1920);
    expect(resDefault.height).toBe(1080);
    expect(resDefault.aspectRatio).toBeCloseTo(16 / 9, 3);

    // Résolution 9:16 Verticale
    const resVert = resolveTargetVideoDimensions({ videoResolution: 'vertical_1080p' });
    expect(resVert.width).toBe(1080);
    expect(resVert.height).toBe(1920);
    expect(resVert.aspectRatio).toBeCloseTo(9 / 16, 3);

    // Résolution 1:1 Carrée
    const resSquare = resolveTargetVideoDimensions({ videoResolution: 'square_1080p' });
    expect(resSquare.width).toBe(1080);
    expect(resSquare.height).toBe(1080);
    expect(resSquare.aspectRatio).toBe(1);

    // Dimensions personnalisées
    const resCustom = resolveTargetVideoDimensions({ customWidth: 2560, customHeight: 1440 });
    expect(resCustom.width).toBe(2560);
    expect(resCustom.height).toBe(1440);
  });

  it('15. buildScheduledVideoSteps garantit la propagation du bearing 180° Al-Idrisi à chaque étape programmée', async () => {
    const { buildScheduledVideoSteps } = await import('../services/export/TimelineScheduler');

    const timeline = {
      videoTracks: [
        {
          id: 'clip-1',
          startMs: 0,
          durationMs: 3000,
          mapState: { center: [10, 30] as [number, number], zoom: 4, bearing: 0, basemapStyle: 'al_idrisi' as const }
        },
        {
          id: 'clip-2',
          startMs: 3000,
          durationMs: 4000,
          mapState: { center: [20, 35] as [number, number], zoom: 5, bearing: undefined, basemapStyle: 'al_idrisi' as const }
        }
      ],
      audioTracks: []
    };

    const story = {
      id: 'story-test',
      title: 'Story Test',
      defaultFps: 30,
      scenes: []
    };

    const steps = buildScheduledVideoSteps(timeline as any, story as any);
    expect(steps).toHaveLength(2);
    expect(steps[0].mapState.bearing).toBe(180);
    expect(steps[1].mapState.bearing).toBe(180);
  });
});

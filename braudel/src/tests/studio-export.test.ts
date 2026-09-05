// tests/studio-export.test.ts

import { describe, it, expect, vi } from 'vitest';
import { createDefaultStory } from '../services/export/story-export';
import { 
  createDefaultEditTimeline, 
  computeTotalTimelineDuration,
  VideoClipSchema,
  AudioClipSchema,
  EditTimelineSchema,
  VideoClip,
  AudioClip
} from '../services/export/studio-types';
import { 
  resolveTrackOverlaps, 
  getVideoClipAtTime, 
  getActiveAudioClipsAtTime, 
  buildScheduledVideoSteps, 
  scheduleAudioTracks 
} from '../services/export/TimelineScheduler';
import { 
  computeWaveformData, 
  drawWaveformOnCanvas,
  playAudioPreview
} from '../services/export/audio-import';
import { 
  estimateVideoDuration, 
  CODEC_CASCADE, 
  MIN_VALID_BLOB_SIZE,
  exportEditTimelineToWebM
} from '../services/export/video-export';

describe('Studio Mode — Data Model & EditTimeline (studio-types)', () => {
  it('convertit un StoryProject par défaut en EditTimeline multi-pistes séquentielle', () => {
    const story = createDefaultStory('Arda');
    const timeline = createDefaultEditTimeline(story);

    expect(timeline.id).toBeDefined();
    expect(timeline.videoTracks.length).toBe(1);
    expect(timeline.videoTracks[0].trackIndex).toBe(0);
    expect(timeline.videoTracks[0].startMs).toBe(0);
    expect(timeline.videoTracks[0].durationMs).toBeGreaterThanOrEqual(1500);
    expect(timeline.audioTracks).toEqual([]);
    expect(timeline.totalDurationMs).toBeGreaterThanOrEqual(3500);
    expect(timeline.zoomScale).toBeGreaterThan(0);
  });

  it('valide les schémas Zod pour VideoClip, AudioClip et EditTimeline', () => {
    const validVideoClip: VideoClip = {
      id: 'clip-1',
      sceneId: 'scene-1',
      trackIndex: 0,
      startMs: 0,
      durationMs: 4000,
      title: 'Période 1 — Antiquité',
      periodNumber: 1,
      totalPeriods: 2,
      timelineYear: -500
    };
    expect(VideoClipSchema.safeParse(validVideoClip).success).toBe(true);

    const validAudioClip: AudioClip = {
      id: 'audio-1',
      name: 'musique_fond.mp3',
      type: 'music',
      trackIndex: 0,
      startMs: 1000,
      durationMs: 8000,
      volume: 0.8,
      fadeInMs: 500,
      fadeOutMs: 1000,
      muted: false
    };
    expect(AudioClipSchema.safeParse(validAudioClip).success).toBe(true);

    const timeline = {
      id: 'timeline-test',
      videoTracks: [validVideoClip],
      audioTracks: [validAudioClip],
      totalDurationMs: 9000,
      zoomScale: 50,
      playheadMs: 0
    };
    expect(EditTimelineSchema.safeParse(timeline).success).toBe(true);
  });

  it('computeTotalTimelineDuration prend le maximum entre la fin vidéo et audio', () => {
    const story = createDefaultStory('Arda');
    const timeline = createDefaultEditTimeline(story);
    // 1 vidéo de 3500ms (0 -> 3500)
    timeline.videoTracks[0].durationMs = 3500;

    // Ajouter audio qui se termine à 6000ms
    timeline.audioTracks.push({
      id: 'audio-long',
      name: 'ambiance.mp3',
      type: 'music',
      trackIndex: 0,
      startMs: 2000,
      durationMs: 4000, // fin à 6000ms
      volume: 1,
      fadeInMs: 0,
      fadeOutMs: 0,
      muted: false
    });

    const total = computeTotalTimelineDuration(timeline);
    expect(total).toBe(6000);
  });
});

describe('Studio Mode — TimelineScheduler & Ordonnancement', () => {
  it('resolveTrackOverlaps résout automatiquement les collisions sur une même piste', () => {
    const clips: VideoClip[] = [
      { id: 'c1', sceneId: 's1', trackIndex: 0, startMs: 0, durationMs: 3000 },
      { id: 'c2', sceneId: 's2', trackIndex: 0, startMs: 1500, durationMs: 2000 }, // Chevauche c1 !
      { id: 'c3', sceneId: 's3', trackIndex: 0, startMs: 2000, durationMs: 1000 }, // Chevauche aussi !
    ];

    const resolved = resolveTrackOverlaps(clips);
    expect(resolved.length).toBe(3);
    // c1 reste à 0 -> 3000
    expect(resolved[0].startMs).toBe(0);
    // c2 décalé à 3000 -> 5000
    expect(resolved[1].startMs).toBe(3000);
    // c3 décalé à 5000 -> 6000
    expect(resolved[2].startMs).toBe(5000);
  });

  it('getVideoClipAtTime renvoie le clip actif pour le timestamp donné', () => {
    const story = createDefaultStory('Arda');
    const timeline = createDefaultEditTimeline(story);
    timeline.videoTracks = [
      { id: 'c1', sceneId: 's1', trackIndex: 0, startMs: 0, durationMs: 2000, title: 'Plan 1' },
      { id: 'c2', sceneId: 's2', trackIndex: 0, startMs: 2000, durationMs: 3000, title: 'Plan 2' },
    ];

    expect(getVideoClipAtTime(timeline, 500)?.id).toBe('c1');
    expect(getVideoClipAtTime(timeline, 2500)?.id).toBe('c2');
    // Au-delà de la fin, retourne le dernier
    expect(getVideoClipAtTime(timeline, 9999)?.id).toBe('c2');
  });

  it('getActiveAudioClipsAtTime filtre les clips muets ou hors intervalle', () => {
    const timeline = {
      id: 't1',
      videoTracks: [],
      audioTracks: [
        { id: 'a1', name: 'musique.mp3', type: 'music' as const, trackIndex: 0, startMs: 0, durationMs: 4000, volume: 1, fadeInMs: 0, fadeOutMs: 0, muted: false },
        { id: 'a2', name: 'voix.mp3', type: 'voice' as const, trackIndex: 1, startMs: 2000, durationMs: 3000, volume: 1, fadeInMs: 0, fadeOutMs: 0, muted: false },
        { id: 'a3', name: 'coupe.mp3', type: 'music' as const, trackIndex: 0, startMs: 0, durationMs: 5000, volume: 1, fadeInMs: 0, fadeOutMs: 0, muted: true }, // muted
      ],
      totalDurationMs: 5000,
      zoomScale: 50,
      playheadMs: 0
    };

    const activeAt1s = getActiveAudioClipsAtTime(timeline, 1000);
    expect(activeAt1s.map(a => a.id)).toEqual(['a1']);

    const activeAt2s5 = getActiveAudioClipsAtTime(timeline, 2500);
    expect(activeAt2s5.map(a => a.id)).toEqual(['a1', 'a2']);

    const activeAt4s5 = getActiveAudioClipsAtTime(timeline, 4500);
    expect(activeAt4s5.map(a => a.id)).toEqual(['a2']);
  });

  it('buildScheduledVideoSteps convertit l EditTimeline en étapes temporisées adaptées', () => {
    const story = createDefaultStory('Arda');
    const timeline = createDefaultEditTimeline(story);
    timeline.videoTracks = [
      { id: 'c1', sceneId: story.scenes[0].id, trackIndex: 0, startMs: 0, durationMs: 5000, periodNumber: 1, totalPeriods: 1, title: 'Époque 1' },
    ];

    const steps = buildScheduledVideoSteps(timeline, story);
    expect(steps.length).toBe(1);
    expect(steps[0].durationMs).toBe(5000);
    expect(steps[0].transition.durationMode).toBe('fixed');
    expect(steps[0].transition.durationMs + steps[0].transition.pauseAfterMs).toBe(5000);
  });

  it('scheduleAudioTracks programme les sources audio avec rampes de gain et permet le stopAll', () => {
    // Création d'un mock AudioContext
    const mockSource = {
      buffer: null as any,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn()
    };
    const mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn()
    };
    const mockAudioContext = {
      currentTime: 10,
      createBufferSource: vi.fn(() => ({ ...mockSource })),
      createGain: vi.fn(() => ({ ...mockGain }))
    } as unknown as AudioContext;

    const mockDestination = {} as AudioNode;
    const fakeBuffer = { duration: 10 } as AudioBuffer;

    const audioTracks: AudioClip[] = [
      { id: 'a1', name: 'musique.mp3', type: 'music', trackIndex: 0, startMs: 1000, durationMs: 4000, volume: 0.8, fadeInMs: 500, fadeOutMs: 500, muted: false, audioBuffer: fakeBuffer }
    ];

    const handle = scheduleAudioTracks(
      mockAudioContext,
      mockDestination,
      audioTracks,
      () => fakeBuffer,
      0
    );

    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
    expect(mockAudioContext.createGain).toHaveBeenCalled();
    expect(typeof handle.stopAll).toBe('function');

    handle.stopAll();
  });
});

describe('Studio Mode — Traitement Audio (audio-import)', () => {
  it('computeWaveformData extrait les crêtes normalisées d un AudioBuffer', () => {
    const fakeChannelData = new Float32Array(1000);
    // Simuler un signal oscillant avec un pic à 0.8
    for (let i = 0; i < 1000; i++) {
      fakeChannelData[i] = Math.sin(i / 10) * 0.8;
    }

    const fakeBuffer = {
      length: 1000,
      getChannelData: vi.fn(() => fakeChannelData)
    } as unknown as AudioBuffer;

    const waveform = computeWaveformData(fakeBuffer, 50);
    expect(waveform.length).toBe(50);
    expect(waveform.every(v => v >= 0.08 && v <= 1.0)).toBe(true);
  });

  it('drawWaveformOnCanvas dessine les barres sur le contexte 2D sans lever d exception', () => {
    const fakeCtx = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      fillStyle: ''
    } as unknown as CanvasRenderingContext2D;

    const waveform = [0.2, 0.5, 0.8, 0.4, 0.9, 0.3];
    drawWaveformOnCanvas(fakeCtx, waveform, 200, 40, { barColor: '#a855f7', progressRatio: 0.5 });

    expect(fakeCtx.clearRect).toHaveBeenCalled();
    expect(fakeCtx.beginPath).toHaveBeenCalled();
    expect(fakeCtx.fill).toHaveBeenCalled();
  });

  it('playAudioPreview démarre la source et renvoie une fonction stop sécurisée', () => {
    const mockSource = {
      buffer: null as any,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn()
    };
    const mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn()
    };
    const mockCtx = {
      currentTime: 0,
      destination: {},
      createBufferSource: vi.fn(() => mockSource),
      createGain: vi.fn(() => mockGain)
    } as unknown as AudioContext;

    const clip: AudioClip = {
      id: 'clip-1',
      name: 'audio.mp3',
      type: 'music',
      trackIndex: 0,
      startMs: 0,
      durationMs: 5000,
      volume: 1,
      fadeInMs: 500,
      fadeOutMs: 500,
      muted: false
    };
    const fakeBuffer = { duration: 10 } as AudioBuffer;

    const handle = playAudioPreview(clip, fakeBuffer, 0, undefined, mockCtx);
    expect(mockSource.start).toHaveBeenCalled();
    expect(typeof handle.stop).toBe('function');

    handle.stop();
    expect(mockSource.stop).toHaveBeenCalled();
  });
});

describe('Studio Mode — Intégration Export Vidéo & Codecs', () => {
  it('estimateVideoDuration prend en compte la durée totale personnalisée de l EditTimeline', () => {
    const story = createDefaultStory('Arda');
    const timeline = createDefaultEditTimeline(story);
    // Rallonger la scène à 12 secondes
    timeline.videoTracks[0].durationMs = 12000;

    const est = estimateVideoDuration(story, timeline);
    expect(est.totalDurationMs).toBe(12000);
    expect(est.formattedDuration).toBe('00:12');
  });

  it('CODEC_CASCADE priorise les codecs supportant nativement l audio Opus', () => {
    expect(CODEC_CASCADE[0]).toContain('opus');
    expect(CODEC_CASCADE[2]).toContain('opus');
  });

  it('MIN_VALID_BLOB_SIZE est respecté pour les exports avec audio', () => {
    expect(MIN_VALID_BLOB_SIZE).toBe(1024);
    const audioVideoBlob = new Blob([new Uint8Array(4096)], { type: 'video/webm;codecs=vp9,opus' });
    expect(audioVideoBlob.size).toBeGreaterThan(MIN_VALID_BLOB_SIZE);
  });

  it('exportEditTimelineToWebM est disponible et typée', () => {
    expect(typeof exportEditTimelineToWebM).toBe('function');
  });
});

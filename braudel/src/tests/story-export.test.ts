import { describe, it, expect, vi } from 'vitest';
import { createDefaultStory } from '../services/export/story-export';
import { generateStandaloneHtml } from '../services/export/standalone-template';
import { STYLE_CONFIGS } from '../core/styles.config';
import { computeDistanceKm, selectOptimalTransitionType, getProfileSettings } from '../services/cartography/camera-orchestrator';
import { StoryCameraTransitionSchema } from '../core/schema/story';

describe('Story Export & Camera Transition Grammaire Suite', () => {
  it('crée un projet Story par défaut avec profil de transition standard', () => {
    const story = createDefaultStory('Arda');
    expect(story.id).toBeDefined();
    expect(story.scenes[0].transition.profile).toBe('standard');
    expect(story.scenes[0].transition.durationMode).toBe('auto');
  });

  it('valide le schéma Zod de StoryCameraTransition avec valeur par défaut', () => {
    const parsed = StoryCameraTransitionSchema.parse({});
    expect(parsed.profile).toBe('standard');
    expect(parsed.durationMode).toBe('auto');
    expect(parsed.pauseAfterMs).toBe(800);
  });

  it('calcule la distance Haversine entre deux coordonnées', () => {
    const distParisLondon = computeDistanceKm([2.3522, 48.8566], [-0.1276, 51.5074]);
    expect(distParisLondon).toBeGreaterThan(300);
    expect(distParisLondon).toBeLessThan(400);
  });

  it('sélectionne le mouvement optimal selon la distance et le delta de zoom', () => {
    const stateA = { center: [2.35, 48.85] as [number, number], zoom: 10, visibleLayerIds: [] };
    const stateB = { center: [2.36, 48.86] as [number, number], zoom: 10.1, visibleLayerIds: [] };
    const stateC = { center: [139.69, 35.68] as [number, number], zoom: 2, visibleLayerIds: [] };

    expect(selectOptimalTransitionType(stateA, stateB)).toBe('easeTo');
    expect(selectOptimalTransitionType(stateA, stateC)).toBe('jumpTo');
  });

  it('fournit les paramètres de profil de transition (documentary, dynamic, cut)', () => {
    const doc = getProfileSettings('documentary');
    const dyn = getProfileSettings('dynamic');
    const cut = getProfileSettings('cut');

    expect(doc.speed).toBe(0.6);
    expect(doc.pauseAfterMs).toBe(1500);
    expect(dyn.speed).toBe(2.2);
    expect(cut.speed).toBe(0);
  });

  it('génère un HTML autonome Bento valide', () => {
    const story = createDefaultStory('Arda');
    const config = STYLE_CONFIGS[0];
    const html = generateStandaloneHtml('Arda', config, { type: 'FeatureCollection', features: [] }, { type: 'FeatureCollection', features: [] }, 'story', story);

    expect(html).toContain('Carte-Récit Interactive Braudel');
    expect(html).toContain('bento-container');
    expect(html).toContain('goToWaypoint');
  });

  it('évalue préalablement la tâche vidéo et sa durée estimée avec estimateVideoDuration', async () => {
    const { estimateVideoDuration, getSupportedVideoMimeType } = await import('../services/export/video-export');
    const story = createDefaultStory('Arda');
    const est = estimateVideoDuration(story);

    expect(est.totalScenes).toBe(1);
    expect(est.totalDurationMs).toBeGreaterThan(2000);
    expect(est.formattedDuration).toBeDefined();
    expect(typeof getSupportedVideoMimeType).toBe('function');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Étape 6 — Tests de régression ciblés pour la robustesse de l'export vidéo
// Couvre les scénarios à risque identifiés dans implementation-video.md
// ═══════════════════════════════════════════════════════════════════════════════
describe('Video Export Robustness — Régression ciblée (implementation-video.md)', () => {

  it('estimateVideoDuration retourne une durée positive pour un récit à 1 seule scène très courte', async () => {
    const { estimateVideoDuration } = await import('../services/export/video-export');
    const story = createDefaultStory('Arda');
    // Forcer une durée de transition très courte
    story.scenes[0].transition = {
      profile: 'cut' as any,
      durationMode: 'fixed',
      durationMs: 100,
      pauseAfterMs: 100,
      reduceMotionPolicy: 'essential-for-export',
    };
    const est = estimateVideoDuration(story);

    expect(est.totalDurationMs).toBeGreaterThan(0);
    expect(est.totalScenes).toBe(1);
    expect(est.formattedDuration).toBeDefined();
    expect(est.formattedDuration.length).toBeGreaterThanOrEqual(5); // "00:XX"
  });

  it('estimateVideoDuration gère un récit sans scènes (défaut 3.5s)', async () => {
    const { estimateVideoDuration } = await import('../services/export/video-export');
    const story = createDefaultStory('Arda');
    story.scenes = [];
    const est = estimateVideoDuration(story);

    expect(est.totalDurationMs).toBe(3500);
    expect(est.totalScenes).toBe(1);
    expect(est.formattedDuration).toBe('00:03');
  });

  it('CODEC_CASCADE contient au moins 6 codecs ordonnés du meilleur au plus universel', async () => {
    const { CODEC_CASCADE } = await import('../services/export/video-export');

    expect(CODEC_CASCADE.length).toBeGreaterThanOrEqual(6);
    expect(CODEC_CASCADE[0]).toContain('vp9');
    expect(CODEC_CASCADE[CODEC_CASCADE.length - 1]).toContain('mp4');
  });

  it('MIN_VALID_BLOB_SIZE est défini à 1024 octets minimum', async () => {
    const { MIN_VALID_BLOB_SIZE } = await import('../services/export/video-export');

    expect(MIN_VALID_BLOB_SIZE).toBe(1024);
    expect(MIN_VALID_BLOB_SIZE).toBeGreaterThan(0);
  });

  it('getSupportedVideoMimeType retourne undefined dans un environnement sans MediaRecorder (JSDOM)', async () => {
    const { getSupportedVideoMimeType } = await import('../services/export/video-export');
    // En environnement JSDOM/Vitest, MediaRecorder n'existe pas nativement
    const originalMR = (globalThis as any).MediaRecorder;
    try {
      (globalThis as any).MediaRecorder = undefined;
      const result = getSupportedVideoMimeType();
      expect(result).toBeUndefined();
    } finally {
      (globalThis as any).MediaRecorder = originalMR;
    }
  });

  it('verifyCodecSupport retourne false pour un MIME type invalide', async () => {
    const { verifyCodecSupport } = await import('../services/export/video-export');
    // En JSDOM sans MediaRecorder natif, cela doit retourner false
    const result = await verifyCodecSupport('video/nonexistent;codecs=fake');
    expect(result).toBe(false);
  });

  it('getVerifiedMimeType retourne undefined en environnement JSDOM (sans MediaRecorder)', async () => {
    const { getVerifiedMimeType } = await import('../services/export/video-export');
    const result = await getVerifiedMimeType();
    // En JSDOM, getSupportedVideoMimeType() → undefined → getVerifiedMimeType() → undefined
    expect(result).toBeUndefined();
  });

  it('la logique de seuil minimal du Blob empêche le téléchargement de fichiers vides', async () => {
    // Test de la logique de décision sans MediaRecorder
    const { MIN_VALID_BLOB_SIZE } = await import('../services/export/video-export');

    // Un Blob de 0 octets doit être rejeté
    const emptyBlob = new Blob([], { type: 'video/webm' });
    expect(emptyBlob.size).toBeLessThan(MIN_VALID_BLOB_SIZE);

    // Un Blob de 500 octets doit être rejeté (en dessous du seuil)
    const tinyBlob = new Blob([new Uint8Array(500)], { type: 'video/webm' });
    expect(tinyBlob.size).toBeLessThan(MIN_VALID_BLOB_SIZE);

    // Un Blob de 2 Ko doit être accepté
    const validBlob = new Blob([new Uint8Array(2048)], { type: 'video/webm' });
    expect(validBlob.size).toBeGreaterThanOrEqual(MIN_VALID_BLOB_SIZE);
  });

  it('StorySceneSchema valide les champs periodNumber et totalPeriods', async () => {
    const { StorySceneSchema } = await import('../core/schema/story');
    const validScene = {
      id: 'scene-period-1',
      title: 'Période 1/3 — An -500 (Période Archaïque)',
      periodNumber: 1,
      totalPeriods: 3,
      mapState: {
        center: [10, 35] as [number, number],
        zoom: 4,
        timelineYear: -500,
        visibleLayerIds: []
      }
    };
    const parsed = StorySceneSchema.safeParse(validScene);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.periodNumber).toBe(1);
      expect(parsed.data.totalPeriods).toBe(3);
    }
  });

  it('verifyAndCapturePeriodEntities exécute la vérification et appelle updateEntities', async () => {
    const { verifyAndCapturePeriodEntities } = await import('../services/export/video-export');
    let updatedYear: number | null = null;
    const fakeMap = {
      triggerRepaint: vi.fn(),
      queryRenderedFeatures: vi.fn().mockReturnValue([{ id: 'entity-1' }, { id: 'entity-2' }]),
      getSource: vi.fn().mockReturnValue(null),
    };

    const result = await verifyAndCapturePeriodEntities(
      fakeMap,
      100,
      1,
      3,
      {
        updateEntities: (yr) => { updatedYear = yr; },
        minFramesPerPeriod: 0
      }
    );

    expect(updatedYear).toBe(100);
    expect(fakeMap.triggerRepaint).toHaveBeenCalled();
    expect(result.verified).toBe(true);
    expect(result.detectedCount).toBe(2);
  });

  it('drawRoundedRect trace correctement les courbes du rectangle arrondi', async () => {
    const { drawRoundedRect } = await import('../services/export/video-export');
    const fakeCtx = {
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn()
    } as unknown as CanvasRenderingContext2D;

    drawRoundedRect(fakeCtx, 10, 20, 100, 50, 8);
    expect(fakeCtx.beginPath).toHaveBeenCalled();
    expect(fakeCtx.moveTo).toHaveBeenCalledWith(18, 20);
    expect(fakeCtx.quadraticCurveTo).toHaveBeenCalledTimes(4);
    expect(fakeCtx.closePath).toHaveBeenCalled();
  });

  it('drawVideoLegend dessine le cartouche cinématique complet (badge, période, entités)', async () => {
    const { drawVideoLegend } = await import('../services/export/video-export');
    const fillTextCalls: string[] = [];

    const fakeCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn()
      })),
      measureText: vi.fn((text: string) => ({ width: text.length * 8 })),
      fillText: vi.fn((text: string) => {
        fillTextCalls.push(text);
      }),
      shadowColor: '',
      shadowBlur: 0,
      shadowOffsetY: 0,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: ''
    } as unknown as CanvasRenderingContext2D;

    drawVideoLegend(
      fakeCtx,
      {
        periodNumber: 2,
        totalPeriods: 5,
        year: 1154,
        title: 'Période 2/5 — Tabula Rogeriana (Al-Idrisi)',
        items: [
          { name: 'Palerme', color: '#ef4444', type: 'point' },
          { name: 'Royaume de Sicile', color: '#3b82f6', type: 'polygon' },
          { name: 'Méditerranée Centrale', color: '#10b981', type: 'line' },
        ]
      },
      1920,
      1080,
      'bottom-left'
    );

    expect(fakeCtx.save).toHaveBeenCalled();
    expect(fakeCtx.restore).toHaveBeenCalled();

    // Vérification de la présence des textes clés
    expect(fillTextCalls.some(t => t.includes('PÉRIODE 2/5') && t.includes('AN 1154'))).toBe(true);
    expect(fillTextCalls.some(t => t.includes('Tabula Rogeriana'))).toBe(true);
    expect(fillTextCalls.some(t => t.includes('Palerme'))).toBe(true);
    expect(fillTextCalls.some(t => t.includes('Royaume de Sicile'))).toBe(true);
  });

  it('drawVideoLegend gère les dates avant J.-C. et le débordement > 6 entités', async () => {
    const { drawVideoLegend } = await import('../services/export/video-export');
    const fillTextCalls: string[] = [];

    const fakeCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn()
      })),
      measureText: vi.fn((text: string) => ({ width: text.length * 8 })),
      fillText: vi.fn((text: string) => {
        fillTextCalls.push(text);
      }),
      shadowColor: '',
      shadowBlur: 0,
      shadowOffsetY: 0,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: ''
    } as unknown as CanvasRenderingContext2D;

    drawVideoLegend(
      fakeCtx,
      {
        periodNumber: 1,
        totalPeriods: 3,
        year: -500,
        title: 'Période 1/3 — Antiquité classique',
        items: [
          { name: 'Athènes', color: '#ef4444' },
          { name: 'Sparte', color: '#ef4444' },
          { name: 'Thèbes', color: '#ef4444' },
          { name: 'Corinthe', color: '#ef4444' },
          { name: 'Ligue de Délos', color: '#3b82f6' },
          { name: 'Empire Perse', color: '#f59e0b' },
          { name: 'Sardes', color: '#10b981' },
          { name: 'Éphèse', color: '#10b981' },
        ]
      },
      1920,
      1080,
      'top-left'
    );

    expect(fillTextCalls.some(t => t.includes('500 AV. J.-C.'))).toBe(true);
    expect(fillTextCalls.some(t => t.includes('+ 2 autre(s) entité(s) active(s)...'))).toBe(true);
  });
});


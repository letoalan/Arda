import { describe, it, expect } from 'vitest';
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

    expect(html).toContain('Récit Cartographique Bento');
    expect(html).toContain('bento-container');
    expect(html).toContain('prevScene');
  });
});

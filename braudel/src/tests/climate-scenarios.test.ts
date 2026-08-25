import { describe, it, expect } from 'vitest';
import { generateTolkienClimateScenario, DEFAULT_TOLKIEN_CLIMATE } from '../core/climate/tolkienClimateGenerator';
import { buildBraudelClimateScenario, getHistoricalClimatePoints, getRcpScenarios } from '../core/climate/braudelClimateService';

describe('Épopée C & D — Scénarios Climatiques (Tolkien & Braudel)', () => {
  describe('Épopée C : Climat Tolkien paramétrique', () => {
    it('doit générer une série temporelle cohérente pour les 5 paramètres par défaut', () => {
      const scenario = generateTolkienClimateScenario(DEFAULT_TOLKIEN_CLIMATE, 0, 1000, 10);
      expect(scenario.points).toHaveLength(10);
      expect(scenario.points[0].year).toBe(0);
      expect(scenario.points[9].year).toBe(1000);
      // Mode warming -> la température de fin doit être supérieure à la température de début
      expect(scenario.points[9].deltaTemp).toBeGreaterThan(scenario.points[0].deltaTemp);
    });

    it('doit gérer un scénario de refroidissement (cooling) depuis une période chaude', () => {
      const scenario = generateTolkienClimateScenario({
        startingPoint: 'warm',
        trend: 'cooling',
        intensity: 3,
        speed: 2,
        dominantCause: 'volcanic'
      }, 0, 500, 5);

      expect(scenario.points[0].deltaTemp).toBe(2.0);
      expect(scenario.points[4].deltaTemp).toBeLessThan(2.0);
    });

    it('doit supporter un comportement erratique oscillant', () => {
      const scenario = generateTolkienClimateScenario({
        startingPoint: 'temperate',
        trend: 'erratic',
        intensity: 2,
        speed: 2,
        dominantCause: 'astronomical'
      }, 0, 1000, 20);

      const temps = scenario.points.map((p) => p.deltaTemp);
      const max = Math.max(...temps);
      const min = Math.min(...temps);
      expect(max).toBeGreaterThan(0);
      expect(min).toBeLessThan(0);
    });
  });

  describe('Épopée D : Climat Braudel (Paléoclimat & RCP)', () => {
    it('doit charger les données historiques paléoclimatiques', () => {
      const history = getHistoricalClimatePoints();
      expect(history.length).toBeGreaterThan(10);
      expect(history[0].year).toBe(-3000);
    });

    it('doit fournir les 4 scénarios RCP du GIEC', () => {
      const rcps = getRcpScenarios();
      expect(rcps['RCP2.6']).toBeDefined();
      expect(rcps['RCP4.5']).toBeDefined();
      expect(rcps['RCP6.0']).toBeDefined();
      expect(rcps['RCP8.5']).toBeDefined();
      expect(rcps['RCP8.5'].points.find((p) => p.year === 2100)?.deltaTemp).toBe(4.5);
    });

    it('doit construire un scénario Braudel avec cible médiane personnalisée', () => {
      const scenario = buildBraudelClimateScenario(3.0, undefined, false);
      const point2100 = scenario.points.find((p) => p.year === 2100);
      expect(point2100?.deltaTemp).toBe(3.0);
    });

    it('doit construire un scénario Braudel avec trajectoire RCP spécifique', () => {
      const scenario = buildBraudelClimateScenario(2.5, 'RCP8.5', false);
      const point2100 = scenario.points.find((p) => p.year === 2100);
      expect(point2100?.deltaTemp).toBe(4.5);
    });

    it('doit appliquer les anomalies de refroidissement volcaniques', () => {
      const scenarioWithVolcanoes = buildBraudelClimateScenario(2.5, undefined, true);
      const pt536 = scenarioWithVolcanoes.points.find((p) => p.year === 536);
      expect(pt536?.deltaTemp).toBeLessThan(-1.0);
    });

    it('doit construire un scénario pour une trajectoire RCP spécifique sélectionnée', () => {
      const rcp26 = buildBraudelClimateScenario(2.5, 'RCP2.6', false);
      const pt2100_rcp26 = rcp26.points.find((p) => p.year === 2100);
      expect(pt2100_rcp26?.deltaTemp).toBe(1.4);

      const rcp85 = buildBraudelClimateScenario(2.5, 'RCP8.5', false);
      const pt2100_rcp85 = rcp85.points.find((p) => p.year === 2100);
      expect(pt2100_rcp85?.deltaTemp).toBe(4.5);
    });
  });
});

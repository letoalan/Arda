import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../app/state/store';
import { interpolateClimateAtYear, tempToSeaLevel, tempToIceCapLatitude } from '../core/climate/climatePhysics';
import { generateTolkienClimateScenario } from '../core/climate/tolkienClimateGenerator';
import { buildBraudelClimateScenario } from '../core/climate/braudelClimateService';

describe('Épopée E — Intégration Climat & Synchronisation', () => {
  beforeEach(() => {
    useStore.setState({
      climateSeaLevelVisible: false,
      climateIceCapVisible: false,
      climateMedianTarget: 2.5,
      climateRcpVariability: false,
      currentTime: 2026,
      startYear: -3000,
      endYear: 2100
    });
  });

  it('doit mettre à jour les toggles de rendu climatique dans le store', () => {
    const { setClimateSeaLevelVisible, setClimateIceCapVisible, setClimateMedianTarget } = useStore.getState();

    setClimateSeaLevelVisible(true);
    expect(useStore.getState().climateSeaLevelVisible).toBe(true);

    setClimateIceCapVisible(true);
    expect(useStore.getState().climateIceCapVisible).toBe(true);

    setClimateMedianTarget(3.5);
    expect(useStore.getState().climateMedianTarget).toBe(3.5);
  });

  it('doit synchroniser le niveau marin et les calottes selon l’année courante en mode Braudel', () => {
    const scenario = buildBraudelClimateScenario(2.5, undefined, true);

    // Année 1850 (référence 0°C)
    const delta1850 = interpolateClimateAtYear(scenario.points, 1850);
    expect(delta1850).toBe(0);
    expect(tempToSeaLevel(delta1850)).toBe(0);
    expect(tempToIceCapLatitude(delta1850)).toBe(66.5);

    // Année 2100 (+2.5°C)
    const delta2100 = interpolateClimateAtYear(scenario.points, 2100);
    expect(delta2100).toBe(2.5);
    expect(tempToSeaLevel(delta2100)).toBe(5.8);
    expect(tempToIceCapLatitude(delta2100)).toBe(79.0);
  });

  it('doit synchroniser les paramètres paramétriques en mode Tolkien', () => {
    const { setTolkienClimateParams } = useStore.getState();

    setTolkienClimateParams({
      startingPoint: 'ice_age',
      trend: 'warming',
      intensity: 3,
      speed: 1,
      dominantCause: 'volcanic'
    });

    const params = useStore.getState().tolkienClimateParams;
    expect(params.startingPoint).toBe('ice_age');
    expect(params.intensity).toBe(3);

    const scenario = generateTolkienClimateScenario(params, 0, 1000, 10);
    expect(scenario.points[0].deltaTemp).toBe(-4.0);
    expect(scenario.points[9].deltaTemp).toBeGreaterThan(-4.0);
  });
});

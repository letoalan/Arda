import PALEOCLIMATE_RAW from '../../data/climate/paleoclimate_history.json';
import RCP_SCENARIOS_RAW from '../../data/climate/rcp_scenarios.json';
import { ClimatePoint, ClimateScenario } from '../schema/climate';

export interface VolcanicAnomaly {
  year: number;
  name: string;
  coolingDrop: number; // ex: -0.6°C
  durationYears: number; // ex: 3 ans
}

export const KNOWN_VOLCANIC_ANOMALIES: VolcanicAnomaly[] = [
  { year: 536, name: 'Événement climatique de 536 (Mystère volcanique)', coolingDrop: -0.9, durationYears: 5 },
  { year: 1257, name: 'Éruption du Samalas', coolingDrop: -0.7, durationYears: 3 },
  { year: 1815, name: 'Éruption du Tambora (Année sans été)', coolingDrop: -0.8, durationYears: 3 },
  { year: 1883, name: 'Éruption du Krakatoa', coolingDrop: -0.4, durationYears: 2 }
];

export function getHistoricalClimatePoints(): ClimatePoint[] {
  return PALEOCLIMATE_RAW as ClimatePoint[];
}

export function getRcpScenarios(): Record<string, { name: string; color: string; points: ClimatePoint[] }> {
  return RCP_SCENARIOS_RAW as any;
}

/**
 * Construit le scénario Braudel complet (Historique + Médian ou RCP spécifique)
 */
export function buildBraudelClimateScenario(
  medianTarget2100 = 2.5,
  rcpKey?: 'RCP2.6' | 'RCP4.5' | 'RCP6.0' | 'RCP8.5',
  applyVolcanoes = true
): ClimateScenario {
  const history = getHistoricalClimatePoints().filter((p) => p.year <= 2026);
  let future: ClimatePoint[] = [];

  const rcpData = getRcpScenarios();
  if (rcpKey && rcpData[rcpKey]) {
    future = rcpData[rcpKey].points.filter((p) => p.year > 2026);
  } else {
    // Courbe médiane paramétrique entre 2026 (1.3°C) et 2100 (medianTarget2100)
    const years = [2040, 2060, 2080, 2100];
    future = years.map((yr) => {
      const progress = (yr - 2026) / (2100 - 2026);
      const temp = 1.3 + progress * (medianTarget2100 - 1.3);
      return { year: yr, deltaTemp: Math.round(temp * 10) / 10 };
    });
  }

  let mergedPoints = [...history, ...future].sort((a, b) => a.year - b.year);

  if (applyVolcanoes) {
    mergedPoints = mergedPoints.map((pt) => {
      const anomaly = KNOWN_VOLCANIC_ANOMALIES.find(
        (v) => pt.year >= v.year && pt.year < v.year + v.durationYears
      );
      if (anomaly) {
        return {
          ...pt,
          deltaTemp: Math.round((pt.deltaTemp + anomaly.coolingDrop) * 10) / 10
        };
      }
      return pt;
    });
  }

  return {
    id: 'braudel-climate-scenario',
    name: rcpKey ? `Climat Braudel (${rcpKey})` : `Climat Braudel (Médian +${medianTarget2100}°C)`,
    type: rcpKey ? 'rcp' : 'historical',
    points: mergedPoints
  };
}

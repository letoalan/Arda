import { ClimatePoint, ClimateScenario } from '../schema/climate';

export interface TolkienClimateQuestions {
  startingPoint: 'ice_age' | 'temperate' | 'warm' | 'hyperthermal';
  trend: 'cooling' | 'stable' | 'warming' | 'erratic';
  intensity: number; // 1 à 4
  speed: number; // 1 à 4
  dominantCause: 'astronomical' | 'volcanic' | 'magical_industrial' | 'oceanic_cycle';
}

export const DEFAULT_TOLKIEN_CLIMATE: TolkienClimateQuestions = {
  startingPoint: 'temperate',
  trend: 'warming',
  intensity: 2,
  speed: 2,
  dominantCause: 'astronomical'
};

const START_TEMP_MAP: Record<TolkienClimateQuestions['startingPoint'], number> = {
  ice_age: -4.0,
  temperate: 0.0,
  warm: 2.0,
  hyperthermal: 4.0
};

/**
 * Génère une série temporelle paramétrique basée sur les 5 questions Tolkien.
 */
export function generateTolkienClimateScenario(
  params: TolkienClimateQuestions,
  startYear = 0,
  endYear = 3000,
  numSteps = 30
): ClimateScenario {
  const baseT = START_TEMP_MAP[params.startingPoint] ?? 0.0;
  const intensityScale = (params.intensity || 2) * 0.75; // 0.75x à 3.0x
  const speedPower = 0.5 + (params.speed || 2) * 0.5; // 1.0 à 2.5

  const points: ClimatePoint[] = [];
  const stepYears = (endYear - startYear) / (numSteps - 1);

  for (let i = 0; i < numSteps; i++) {
    const year = Math.round(startYear + i * stepYears);
    const progress = i / (numSteps - 1); // 0.0 à 1.0
    const nonLinearProgress = Math.pow(progress, speedPower);

    let delta = 0;
    if (params.trend === 'warming') {
      delta = nonLinearProgress * 2.5 * intensityScale;
    } else if (params.trend === 'cooling') {
      delta = -nonLinearProgress * 2.5 * intensityScale;
    } else if (params.trend === 'erratic') {
      delta = Math.sin(progress * Math.PI * 4) * 1.5 * intensityScale;
    } else {
      delta = Math.sin(progress * Math.PI * 2) * 0.2 * intensityScale;
    }

    const finalTemp = Math.round((baseT + delta) * 10) / 10;
    points.push({ year, deltaTemp: finalTemp });
  }

  return {
    id: 'tolkien-parametric-scenario',
    name: `Climat Fantasy (${params.startingPoint} → ${params.trend})`,
    description: `Généré procéduralement. Cause dominante : ${params.dominantCause}`,
    type: 'tolkien_parametric',
    points
  };
}

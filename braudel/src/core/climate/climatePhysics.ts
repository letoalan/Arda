import { ClimatePoint } from '../schema/climate';

/**
 * Convertit une anomalie de température moyenne globale (°C) en variation de niveau marin (mètres).
 * Discrétisation physique au dixième de mètre (0.1 m).
 */
export function tempToSeaLevel(deltaTemp: number): number {
  let meters: number;
  if (deltaTemp >= 0) {
    // Réchauffement : dilatation thermique + fonte des glaces (~2.3m par °C)
    meters = deltaTemp * 2.3;
  } else {
    // Glaciation : stockage massif dans les calottes continentales (~30m par °C de refroidissement)
    meters = deltaTemp * 30.0;
  }
  return Math.round(meters * 10) / 10;
}

/**
 * Convertit une anomalie de température (°C) en latitude limite de calotte polaire (degrés).
 * Référence : 66.5° (Cercle polaire arctique/antarctique).
 */
export function tempToIceCapLatitude(deltaTemp: number): number {
  // +1°C repousse la calotte de ~5° vers les pôles ; un refroidissement l'étend vers l'équateur
  const lat = 66.5 + deltaTemp * 5.0;
  const clamped = Math.max(30.0, Math.min(90.0, lat));
  return Math.round(clamped * 10) / 10;
}

/**
 * Associe une couleur thermique continue à une anomalie de température (°C).
 * Échelle scientifique :
 * - <= -3.0°C : Bleu nuit polaire profond (Grand Âge Glaciaire)
 * - -1.5°C à -0.5°C : Bleu acier / Cyan glacial (Petit Âge Glaciaire, anomalies volcaniques)
 * - -0.2°C à +0.2°C : Vert d'eau / Sarcelle neutre (Climat pré-industriel stable)
 * - +0.3°C à +0.8°C : Ambre doré (Optimum Médiéval, Optimum Romain)
 * - +1.0°C à +2.0°C : Orange vif (Réchauffement contemporain)
 * - >= +3.0°C : Rouge écarlate à bordeaux (Réchauffement extrême)
 */
export function tempToClimateColor(deltaTemp: number): string {
  if (deltaTemp <= -3.0) return '#1e3a8a';
  if (deltaTemp <= -1.5) return '#0284c7';
  if (deltaTemp <= -0.4) return '#38bdf8';
  if (deltaTemp <= 0.2) return '#10b981';
  if (deltaTemp <= 0.8) return '#fbbf24';
  if (deltaTemp <= 1.8) return '#f97316';
  if (deltaTemp <= 3.0) return '#ef4444';
  return '#991b1b';
}

/**
 * Interpole l'anomalie de température pour une année donnée à partir d'une série temporelle.
 */
export function interpolateClimateAtYear(points: ClimatePoint[], year: number): number {
  if (!points || points.length === 0) return 0;
  const sorted = [...points].sort((a, b) => a.year - b.year);

  if (year <= sorted[0].year) return sorted[0].deltaTemp;
  if (year >= sorted[sorted.length - 1].year) return sorted[sorted.length - 1].deltaTemp;

  for (let i = 0; i < sorted.length - 1; i++) {
    const p1 = sorted[i];
    const p2 = sorted[i + 1];
    if (year >= p1.year && year <= p2.year) {
      const span = p2.year - p1.year;
      if (span === 0) return p1.deltaTemp;
      const t = (year - p1.year) / span;
      const interpolated = p1.deltaTemp + t * (p2.deltaTemp - p1.deltaTemp);
      return Math.round(interpolated * 100) / 100;
    }
  }

  return 0;
}

/**
 * Génère une règle CSS linear-gradient réaliste représentant les variations thermiques
 * (Petits Âges Glaciaires, Optima Médiéval/Romain, forçages volcaniques et réchauffement contemporain).
 */
export function generateClimateGradient(
  points: ClimatePoint[],
  minYear: number,
  maxYear: number,
  samples: number = 50
): string {
  if (!points || points.length === 0 || minYear >= maxYear) {
    return 'linear-gradient(90deg, #10b981 0%, #fbbf24 50%, #ef4444 100%)';
  }

  const stops: string[] = [];
  const span = maxYear - minYear;

  for (let i = 0; i <= samples; i++) {
    const pct = Math.round((i / samples) * 100);
    const yr = minYear + (i / samples) * span;
    const temp = interpolateClimateAtYear(points, yr);
    const color = tempToClimateColor(temp);
    stops.push(`${color} ${pct}%`);
  }

  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

/**
 * Calcule la courbe d'élévation du niveau marin pour tous les points d'un scénario.
 */
export function climateToSeaLevel(points: ClimatePoint[]): Array<{ year: number; seaLevel: number }> {
  return points.map((p) => ({
    year: p.year,
    seaLevel: tempToSeaLevel(p.deltaTemp)
  }));
}

/**
 * Calcule la courbe de latitude limite des calottes pour tous les points d'un scénario.
 */
export function climateToIceCap(points: ClimatePoint[]): Array<{ year: number; iceCapLatitude: number }> {
  return points.map((p) => ({
    year: p.year,
    iceCapLatitude: tempToIceCapLatitude(p.deltaTemp)
  }));
}

/**
 * Filtre de connectivité océanique (clumping) :
 * Seules les zones d'altitude <= seaLevel connectées aux bords de la carte sont classées "océan".
 * Les dépressions continentales isolées sont exclues pour éviter les inondations artificielles.
 */
export function filterOceanConnectivity(
  grid: number[][],
  seaLevel: number,
  width: number,
  height: number
): boolean[][] {
  const isOcean: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));
  const queue: Array<[number, number]> = [];

  // Ensemencement depuis les bords
  for (let x = 0; x < width; x++) {
    if (grid[0]?.[x] !== undefined && grid[0][x] <= seaLevel) {
      isOcean[0][x] = true;
      queue.push([x, 0]);
    }
    if (grid[height - 1]?.[x] !== undefined && grid[height - 1][x] <= seaLevel) {
      isOcean[height - 1][x] = true;
      queue.push([x, height - 1]);
    }
  }

  for (let y = 0; y < height; y++) {
    if (grid[y]?.[0] !== undefined && grid[y][0] <= seaLevel && !isOcean[y][0]) {
      isOcean[y][0] = true;
      queue.push([0, y]);
    }
    if (grid[y]?.[width - 1] !== undefined && grid[y][width - 1] <= seaLevel && !isOcean[y][width - 1]) {
      isOcean[y][width - 1] = true;
      queue.push([width - 1, y]);
    }
  }

  // Propagation BFS 4-voisins
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let head = 0;

  while (head < queue.length) {
    const [cx, cy] = queue[head++];
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (!isOcean[ny][nx] && grid[ny][nx] <= seaLevel) {
          isOcean[ny][nx] = true;
          queue.push([nx, ny]);
        }
      }
    }
  }

  return isOcean;
}

import simplify from 'simplify-js';

export function simplifyFreehandStroke(
  rawPoints: { x: number; y: number }[],
  tolerance: number = 3
): { x: number; y: number }[] {
  // simplify-js takes an array of {x, y} objects, tolerance, and highQuality flag
  return simplify(rawPoints, tolerance, true);
}

/**
 * Encode an elevation (in meters) into a Terrain-RGB array [R, G, B].
 * Formula: height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)
 *
 * @param elevation Altitude in meters
 * @returns [R, G, B] array where each component is 0-255
 */
export function encodeElevationToTerrainRGB(elevation: number): [number, number, number] {
  // Mapbox Terrain-RGB encoding
  let val = Math.round((elevation + 10000) * 10);
  
  // Clamp to valid 24-bit range
  if (val < 0) val = 0;
  if (val > 16777215) val = 16777215; // 256^3 - 1
  
  const r = (val >> 16) & 255;
  const g = (val >> 8) & 255;
  const b = val & 255;
  
  return [r, g, b];
}

/**
 * Terrarium encoding (used by Mapzen, AWS Open Data, etc.)
 * Formula: height = (R * 256 + G + B / 256) - 32768
 * 
 * @param elevation Altitude in meters
 * @returns [R, G, B] array
 */
export function encodeElevationToTerrarium(elevation: number): [number, number, number] {
  let val = elevation + 32768;
  if (val < 0) val = 0;
  
  const r = Math.floor(val / 256) & 255;
  const g = Math.floor(val) & 255;
  const b = Math.floor((val - Math.floor(val)) * 256) & 255;
  
  return [r, g, b];
}

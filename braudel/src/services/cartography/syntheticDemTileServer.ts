// services/cartography/syntheticDemTileServer.ts
//
// Generates an in-browser raster-DEM tile server from a synthetic elevation grid.
// MapLibre loads tiles via a custom protocol 'synth-dem://' that renders the
// requested tile from the pre-computed Float32Array DEM using Terrarium encoding.

import { generateSyntheticDEM } from '../../utils/generateSyntheticDEM';
import type { FeatureCollection, Geometry } from 'geojson';

// DEM grid resolution — 1024×512 covers the full [-180,180]×[-90,90] world
const DEM_WIDTH = 1024;
const DEM_HEIGHT = 512;

let cachedGrid: Float32Array | null = null;
let cachedGeojsonHash: string | null = null;

/**
 * Simple hash for cache invalidation
 */
function hashGeojson(geojson: FeatureCollection<Geometry>): string {
  return JSON.stringify(geojson).slice(0, 200) + geojson.features.length;
}

/**
 * Build or retrieve the cached DEM grid for the given continents.
 */
export function buildDEMGrid(
  geojson: FeatureCollection<Geometry>,
  styleId?: string
): Float32Array {
  const hash = hashGeojson(geojson);
  if (cachedGrid && cachedGeojsonHash === hash) return cachedGrid;

  cachedGrid = generateSyntheticDEM(geojson, DEM_WIDTH, DEM_HEIGHT, 'braudel-fictional', styleId);
  cachedGeojsonHash = hash;
  return cachedGrid;
}

/**
 * Encode an elevation value (in meters) into Terrarium RGB encoding.
 * Terrarium: elevation = (R * 256 + G + B / 256) - 32768
 * So: encoded = elevation + 32768
 *     R = floor(encoded / 256)
 *     G = floor(encoded) mod 256
 *     B = floor((encoded - floor(encoded)) * 256)
 */
function terrariumEncode(elevation: number): [number, number, number] {
  const encoded = elevation + 32768;
  const r = Math.floor(encoded / 256);
  const g = Math.floor(encoded) % 256;
  const b = Math.floor((encoded - Math.floor(encoded)) * 256);
  return [
    Math.max(0, Math.min(255, r)),
    Math.max(0, Math.min(255, g)),
    Math.max(0, Math.min(255, b))
  ];
}

/**
 * Render a single 256×256 Terrarium-encoded tile from the DEM grid.
 * Returns the tile as a Blob (image/png).
 */
export function renderDEMTile(
  grid: Float32Array,
  z: number,
  x: number,
  y: number
): Blob | null {
  const tileSize = 256;
  const numTiles = Math.pow(2, z);

  // Canvas for tile
  const canvas = new OffscreenCanvas(tileSize, tileSize);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imageData = ctx.createImageData(tileSize, tileSize);
  const pixels = imageData.data;

  for (let py = 0; py < tileSize; py++) {
    for (let px = 0; px < tileSize; px++) {
      // Tile pixel → world coordinates
      const worldX = (x + px / tileSize) / numTiles;   // 0..1
      const worldY = (y + py / tileSize) / numTiles;   // 0..1

      // Convert Web Mercator worldY (0..1) to Geographic Latitude (-85.05..85.05)
      const mercY = Math.PI * (1 - 2 * worldY);
      const latRad = 2 * Math.atan(Math.exp(mercY)) - Math.PI / 2;
      const lat = (latRad * 180) / Math.PI;

      // Map lat (-90..90) & lon (-180..180) to DEM grid indices
      const lon = worldX * 360 - 180;
      const gridX = Math.floor(((lon + 180) / 360) * DEM_WIDTH) % DEM_WIDTH;
      const gridY = Math.floor(((90 - lat) / 180) * DEM_HEIGHT) % DEM_HEIGHT;

      const safeGridX = Math.max(0, Math.min(DEM_WIDTH - 1, gridX));
      const safeGridY = Math.max(0, Math.min(DEM_HEIGHT - 1, gridY));
      const gridIdx = safeGridY * DEM_WIDTH + safeGridX;

      const elevation = grid[gridIdx] || 0;
      const [r, g, b] = terrariumEncode(elevation);

      const pixelIdx = (py * tileSize + px) * 4;
      pixels[pixelIdx] = r;
      pixels[pixelIdx + 1] = g;
      pixels[pixelIdx + 2] = b;
      pixels[pixelIdx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Convert to Blob synchronously via transferToImageBitmap → we'll use a data URL approach
  // Since OffscreenCanvas.convertToBlob is async, we return null and use the callback pattern
  return null; // See renderDEMTileAsync
}

/**
 * Render a DEM tile asynchronously and return as an ArrayBuffer.
 */
export async function renderDEMTileAsync(
  grid: Float32Array,
  z: number,
  x: number,
  y: number
): Promise<ArrayBuffer> {
  const tileSize = 256;
  const numTiles = Math.pow(2, z);

  const canvas = new OffscreenCanvas(tileSize, tileSize);
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(tileSize, tileSize);
  const pixels = imageData.data;

  for (let py = 0; py < tileSize; py++) {
    for (let px = 0; px < tileSize; px++) {
      const worldX = (x + px / tileSize) / numTiles;
      const worldY = (y + py / tileSize) / numTiles;

      // Convert Web Mercator worldY (0..1) to Geographic Latitude (-85.05..85.05)
      // mercY in radians from center:
      const mercY = Math.PI * (1 - 2 * worldY);
      const latRad = 2 * Math.atan(Math.exp(mercY)) - Math.PI / 2;
      const lat = (latRad * 180) / Math.PI;

      // Map lat (-90..90) & lon (-180..180) to DEM grid indices
      const lon = worldX * 360 - 180;
      const gridX = Math.floor(((lon + 180) / 360) * DEM_WIDTH) % DEM_WIDTH;
      const gridY = Math.floor(((90 - lat) / 180) * DEM_HEIGHT) % DEM_HEIGHT;

      const safeGridX = Math.max(0, Math.min(DEM_WIDTH - 1, gridX));
      const safeGridY = Math.max(0, Math.min(DEM_HEIGHT - 1, gridY));
      const gridIdx = safeGridY * DEM_WIDTH + safeGridX;

      const elevation = grid[gridIdx] || 0;
      const [r, g, b] = terrariumEncode(elevation);

      const pixelIdx = (py * tileSize + px) * 4;
      pixels[pixelIdx] = r;
      pixels[pixelIdx + 1] = g;
      pixels[pixelIdx + 2] = b;
      pixels[pixelIdx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return await blob.arrayBuffer();
}

/**
 * Cleanup cached DEM data.
 */
export function clearDEMCache() {
  cachedGrid = null;
  cachedGeojsonHash = null;
}

// utils/generateDEMTiles.ts

import { encodeElevationToTerrainRGB, encodeElevationToTerrarium } from './encodeTerrainRGB';
import { getColorForElevation } from './demColors';

export function generateDEMTilesFromElevationGrid(
  grid: Float32Array,
  gridWidth: number,
  gridHeight: number,
  z: number,
  x: number,
  y: number,
  format: 'png-terrain-rgb' | 'png-terrarium' | 'raw-raster' = 'png-terrain-rgb',
  styleId: string = 'realistic_satellite'
): Uint8Array | ImageData | string {
  const tileSize = 256;
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  
  if (canvas) {
    canvas.width = tileSize;
    canvas.height = tileSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Impossible de créer le contexte 2D Canvas');
    
    const imgData = ctx.createImageData(tileSize, tileSize);
    const data = imgData.data;

    const numTiles = 1 << z;
    const minLon = (x / numTiles) * 360 - 180;
    const maxLon = ((x + 1) / numTiles) * 360 - 180;
    const nMin = Math.PI - (2 * Math.PI * y) / numTiles;
    const maxLat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(nMin) - Math.exp(-nMin)));
    const nMax = Math.PI - (2 * Math.PI * (y + 1)) / numTiles;
    const minLat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(nMax) - Math.exp(-nMax)));

    for (let py = 0; py < tileSize; py++) {
      const lat = maxLat - (py / tileSize) * (maxLat - minLat);
      const gridY = Math.floor(((90 - lat) / 180) * gridHeight);
      const clampedY = Math.max(0, Math.min(gridHeight - 1, gridY));

      for (let px = 0; px < tileSize; px++) {
        const lon = minLon + (px / tileSize) * (maxLon - minLon);
        const gridX = Math.floor(((lon + 180) / 360) * gridWidth);
        const clampedX = Math.max(0, Math.min(gridWidth - 1, gridX));

        const elevation = grid[clampedY * gridWidth + clampedX];
        const pixelIdx = (py * tileSize + px) * 4;

        if (format === 'png-terrain-rgb') {
          const [r, g, b] = encodeElevationToTerrainRGB(elevation);
          data[pixelIdx] = r;
          data[pixelIdx + 1] = g;
          data[pixelIdx + 2] = b;
          data[pixelIdx + 3] = 255;
        } else if (format === 'png-terrarium') {
          const [r, g, b] = encodeElevationToTerrarium(elevation);
          data[pixelIdx] = r;
          data[pixelIdx + 1] = g;
          data[pixelIdx + 2] = b;
          data[pixelIdx + 3] = 255;
        } else {
          const [r, g, b] = getColorForElevation(elevation, styleId, lat);
          data[pixelIdx] = r;
          data[pixelIdx + 1] = g;
          data[pixelIdx + 2] = b;
          data[pixelIdx + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  }

  const numTiles = 1 << z;
  const minLon = (x / numTiles) * 360 - 180;
  const maxLon = ((x + 1) / numTiles) * 360 - 180;
  const nMin = Math.PI - (2 * Math.PI * y) / numTiles;
  const maxLat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(nMin) - Math.exp(-nMin)));
  const nMax = Math.PI - (2 * Math.PI * (y + 1)) / numTiles;
  const minLat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(nMax) - Math.exp(-nMax)));

  const rawBuffer = new Uint8Array(tileSize * tileSize * 4);

  for (let py = 0; py < tileSize; py++) {
    const lat = maxLat - (py / tileSize) * (maxLat - minLat);
    const gridY = Math.floor(((90 - lat) / 180) * gridHeight);
    const clampedY = Math.max(0, Math.min(gridHeight - 1, gridY));

    for (let px = 0; px < tileSize; px++) {
      const lon = minLon + (px / tileSize) * (maxLon - minLon);
      const gridX = Math.floor(((lon + 180) / 360) * gridWidth);
      const clampedX = Math.max(0, Math.min(gridWidth - 1, gridX));

      const elevation = grid[clampedY * gridWidth + clampedX];
      const pixelIdx = (py * tileSize + px) * 4;

      if (format === 'png-terrain-rgb') {
        const [r, g, b] = encodeElevationToTerrainRGB(elevation);
        rawBuffer[pixelIdx] = r;
        rawBuffer[pixelIdx + 1] = g;
        rawBuffer[pixelIdx + 2] = b;
        rawBuffer[pixelIdx + 3] = 255;
      } else if (format === 'png-terrarium') {
        const [r, g, b] = encodeElevationToTerrarium(elevation);
        rawBuffer[pixelIdx] = r;
        rawBuffer[pixelIdx + 1] = g;
        rawBuffer[pixelIdx + 2] = b;
        rawBuffer[pixelIdx + 3] = 255;
      } else {
        const [r, g, b] = getColorForElevation(elevation, styleId, lat);
        rawBuffer[pixelIdx] = r;
        rawBuffer[pixelIdx + 1] = g;
        rawBuffer[pixelIdx + 2] = b;
        rawBuffer[pixelIdx + 3] = 255;
      }
    }
  }

  return rawBuffer;
}

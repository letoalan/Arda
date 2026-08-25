import { describe, it, expect } from 'vitest';
import {
  detectProjectionFromDimensions,
  geoToEquirectangularPixel,
  equirectangularPixelToGeo,
  geoToMercatorPixel,
  mercatorPixelToGeo,
  reprojectPixel
} from '../acquisition/projection';

describe('Image Projection Recognition & Conversion Tests', () => {
  describe('detectProjectionFromDimensions', () => {
    it('should detect Equirectangular projection for 2:1 aspect ratio', () => {
      const res = detectProjectionFromDimensions({ width: 2048, height: 1024 });
      expect(res.projection).toBe('equirectangular');
      expect(res.confidence).toBeGreaterThan(0.9);
    });

    it('should detect Web Mercator projection for 1:1 aspect ratio', () => {
      const res = detectProjectionFromDimensions({ width: 1024, height: 1024 });
      expect(res.projection).toBe('web-mercator');
      expect(res.confidence).toBeGreaterThan(0.85);
    });

    it('should return unknown for unaligned aspect ratios', () => {
      const res = detectProjectionFromDimensions({ width: 1200, height: 800 });
      expect(res.projection).toBe('unknown');
    });
  });

  describe('Equirectangular Coordinate Transforms', () => {
    const dims = { width: 1024, height: 512 };

    it('should project (0,0) geo to exact center pixel', () => {
      const pixel = geoToEquirectangularPixel({ lon: 0, lat: 0 }, dims);
      expect(pixel.x).toBe(512);
      expect(pixel.y).toBe(256);
    });

    it('should roundtrip geo coordinates accurately', () => {
      const initialGeo = { lon: 45, lat: -30 };
      const pixel = geoToEquirectangularPixel(initialGeo, dims);
      const roundtripGeo = equirectangularPixelToGeo(pixel, dims);

      expect(roundtripGeo.lon).toBeCloseTo(initialGeo.lon, 4);
      expect(roundtripGeo.lat).toBeCloseTo(initialGeo.lat, 4);
    });
  });

  describe('Web Mercator Coordinate Transforms', () => {
    const dims = { width: 1024, height: 1024 };

    it('should project (0,0) geo to center pixel', () => {
      const pixel = geoToMercatorPixel({ lon: 0, lat: 0 }, dims);
      expect(pixel.x).toBe(512);
      expect(pixel.y).toBe(512);
    });

    it('should roundtrip geo coordinates accurately', () => {
      const initialGeo = { lon: 12.5, lat: 41.9 };
      const pixel = geoToMercatorPixel(initialGeo, dims);
      const roundtripGeo = mercatorPixelToGeo(pixel, dims);

      expect(roundtripGeo.lon).toBeCloseTo(initialGeo.lon, 4);
      expect(roundtripGeo.lat).toBeCloseTo(initialGeo.lat, 4);
    });
  });

  describe('Reprojection between projections', () => {
    it('should reproject equirectangular center pixel to mercator center pixel', () => {
      const eqDims = { width: 1024, height: 512 };
      const mercDims = { width: 1024, height: 1024 };

      const mercPixel = reprojectPixel(
        { x: 512, y: 256 }, // Equirectangular center
        eqDims,
        'equirectangular',
        mercDims,
        'web-mercator'
      );

      expect(mercPixel.x).toBeCloseTo(512, 1);
      expect(mercPixel.y).toBeCloseTo(512, 1);
    });
  });
});

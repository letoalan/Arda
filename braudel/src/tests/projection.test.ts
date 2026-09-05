import { describe, it, expect } from 'vitest';
import {
  detectProjectionFromDimensions,
  geoToEquirectangularPixel,
  equirectangularPixelToGeo,
  geoToMercatorPixel,
  mercatorPixelToGeo,
  geoToEckertIVPixel,
  eckertIVPixelToGeo,
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

  describe('Eckert IV Coordinate Transforms', () => {
    const dims = { width: 2048, height: 1024 }; // Ratio 2:1 canonique

    it('should project (0,0) geo to exact center pixel', () => {
      const pixel = geoToEckertIVPixel({ lon: 0, lat: 0 }, dims);
      expect(pixel.x).toBeCloseTo(1024, 2);
      expect(pixel.y).toBeCloseTo(512, 2);
    });

    it('should roundtrip geo coordinates across multiple continents accurately', () => {
      const testPoints = [
        { lon: 0, lat: 0 },         // Golfe de Guinée
        { lon: 2.35, lat: 48.85 },   // Paris
        { lon: 139.69, lat: 35.68 }, // Tokyo
        { lon: -73.98, lat: 40.75 }, // New York
        { lon: -43.17, lat: -22.90 },// Rio de Janeiro
        { lon: 18.42, lat: -33.92 }, // Le Cap
        { lon: 151.20, lat: -33.86 } // Sydney
      ];

      for (const geo of testPoints) {
        const pixel = geoToEckertIVPixel(geo, dims);
        const roundtripGeo = eckertIVPixelToGeo(pixel, dims);

        expect(roundtripGeo.lon).toBeCloseTo(geo.lon, 2);
        expect(roundtripGeo.lat).toBeCloseTo(geo.lat, 2);
      }
    });

    it('should respect the fundamental Eckert IV pole-to-equator ratio (L_pole = 0.5 * L_equator)', () => {
      // Largeur de l'équateur (de lon -180 à +180 à lat 0)
      const eqWest = geoToEckertIVPixel({ lon: -180, lat: 0 }, dims);
      const eqEast = geoToEckertIVPixel({ lon: 180, lat: 0 }, dims);
      const equatorWidth = eqEast.x - eqWest.x;

      // Largeur de la ligne polaire Nord (de lon -180 à +180 à lat 90)
      const poleNorthWest = geoToEckertIVPixel({ lon: -180, lat: 90 }, dims);
      const poleNorthEast = geoToEckertIVPixel({ lon: 180, lat: 90 }, dims);
      const poleWidth = poleNorthEast.x - poleNorthWest.x;

      // L_pole doit valoir exactement la moitié de L_equator (tolérance < 0.1%)
      expect(poleWidth / equatorWidth).toBeCloseTo(0.5, 3);
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

    it('should reproject mercator center pixel to eckert4 center pixel', () => {
      const mercDims = { width: 1024, height: 1024 };
      const eckertDims = { width: 2048, height: 1024 };

      const eckertPixel = reprojectPixel(
        { x: 512, y: 512 }, // Mercator center (0, 0)
        mercDims,
        'web-mercator',
        eckertDims,
        'eckert4'
      );

      expect(eckertPixel.x).toBeCloseTo(1024, 1);
      expect(eckertPixel.y).toBeCloseTo(512, 1);
    });
  });
});


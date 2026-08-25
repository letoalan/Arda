// utils/generateSyntheticDEM.ts

import { createNoise2D } from 'simplex-noise';
import { FeatureCollection, Geometry } from 'geojson';
import { isPointInPolygon, distanceToPolygonEdges, smoothFalloff } from './demGeometry';

/**
 * Generates a synthetic Digital Elevation Model (DEM) for the given features GeoJSON.
 */
export function generateSyntheticDEM(
  geojson: FeatureCollection<Geometry>,
  width: number,
  height: number,
  seed: string = 'braudel',
  styleId?: string
): Float32Array {
  const grid = new Float32Array(width * height);
  
  let seedNum = 0;
  for (let i = 0; i < seed.length; i++) seedNum += seed.charCodeAt(i);
  
  const customRandom = () => {
    const x = Math.sin(seedNum++) * 10000;
    return x - Math.floor(x);
  };
  
  const noise2D = createNoise2D(customRandom);
  
  const continentPolygons: [number, number][][][] = [];
  const valleyPolygons: [number, number][][][] = [];
  const hillPolygons: [number, number][][][] = [];
  const mountainLines: { coords: [number, number][]; peak?: number }[] = [];
  const peakPoints: { coords: [number, number]; elevation: number }[] = [];

  for (const feature of geojson.features) {
    const props = feature.properties || {};
    const featType = props.type || 'continent';
    const geom = feature.geometry;
    
    if (geom.type === 'Polygon') {
      if (featType === 'valley') {
        valleyPolygons.push(geom.coordinates as [number, number][][]);
      } else if (featType === 'hills') {
        hillPolygons.push(geom.coordinates as [number, number][][]);
      } else {
        continentPolygons.push(geom.coordinates as [number, number][][]);
      }
    } else if (geom.type === 'MultiPolygon') {
      for (const poly of geom.coordinates) {
        if (featType === 'valley') {
          valleyPolygons.push(poly as [number, number][][]);
        } else if (featType === 'hills') {
          hillPolygons.push(poly as [number, number][][]);
        } else {
          continentPolygons.push(poly as [number, number][][]);
        }
      }
    } else if (geom.type === 'LineString') {
      mountainLines.push({
        coords: geom.coordinates as [number, number][],
        peak: props.elevation || props.peak || (featType === 'mountain' ? 3200 : 2200)
      });
    } else if (geom.type === 'Point') {
      peakPoints.push({
        coords: geom.coordinates as [number, number],
        elevation: props.elevation || props.peak || 3800
      });
    }
  }

  const isFantasyStyle = styleId?.includes('tolkien');

  for (let y = 0; y < height; y++) {
    const lat = 90 - (y / height) * 180;
    for (let x = 0; x < width; x++) {
      const lon = (x / width) * 360 - 180;
      const idx = y * width + x;
      const pt: [number, number] = [lon, lat];

      let isInsideLand = false;
      let distToShore = Infinity;

      // 1. Détection de terre (continents, collines et vallées font partie de la terre)
      const allLandPolygons = [...continentPolygons, ...hillPolygons, ...valleyPolygons];
      for (const poly of allLandPolygons) {
        if (isPointInPolygon(pt, poly)) {
          isInsideLand = true;
          const dist = distanceToPolygonEdges(pt, poly);
          if (dist < distToShore) distToShore = dist;
        } else {
          const dist = distanceToPolygonEdges(pt, poly);
          if (dist < distToShore) distToShore = dist;
        }
      }

      // 2. Bathymétrie océanique
      if (!isInsideLand) {
        const oceanNoise = (noise2D(lon * 0.08, lat * 0.08) + 1) * 0.5;
        const bathy = Math.max(-4000, -80 - distToShore * 150 - oceanNoise * 300);
        grid[idx] = bathy;
        continue;
      }

      // 3. Relief continental complet (Fractal Brownian Motion / multi-octaves)
      const o1 = noise2D(lon * 0.04, lat * 0.04);
      const o2 = noise2D(lon * 0.12, lat * 0.12) * 0.6;
      const o3 = noise2D(lon * 0.35, lat * 0.35) * 0.35;
      const o4 = noise2D(lon * 0.9, lat * 0.9) * 0.18;

      const fbm = (o1 + o2 + o3 + o4) / 2.13; // -1 .. 1

      // Transition côtière
      const coastalTransition = Math.min(1, Math.pow(distToShore / 4.0, 0.7));

      // Altitude de base du continent (plaines et collines accentuées)
      let baseElev = 180 + (fbm + 1.0) * 650; 
      baseElev *= coastalTransition;
      baseElev = Math.max(20, baseElev);

      // 4. Accentuation des zones de collines dessinées
      for (const hPoly of hillPolygons) {
        if (isPointInPolygon(pt, hPoly)) {
          const hillNoise = (noise2D(lon * 0.5, lat * 0.5) + 1) * 0.5;
          baseElev += 400 + hillNoise * 500;
        }
      }

      // 5. Creusement 3D des vallées dessinées (depression géologique)
      for (const vPoly of valleyPolygons) {
        if (isPointInPolygon(pt, vPoly)) {
          const distToValleyEdge = distanceToPolygonEdges(pt, vPoly);
          const valleyFactor = Math.min(1, distToValleyEdge / 2.0);
          // Creuse l'altitude vers une cuvette fluviale douce
          baseElev = Math.max(15, baseElev * (0.35 + 0.3 * (1 - valleyFactor)));
        }
      }

      // 6. Chaînes de montagnes dessinées (accentuées)
      for (const ridge of mountainLines) {
        let minSegDistSq = Infinity;
        for (let i = 0; i < ridge.coords.length - 1; i++) {
          const v = ridge.coords[i];
          const w = ridge.coords[i+1];
          const l2 = (w[0] - v[0])**2 + (w[1] - v[1])**2;
          let t = l2 === 0 ? 0 : ((lon - v[0]) * (w[0] - v[0]) + (lat - v[1]) * (w[1] - v[1])) / l2;
          t = Math.max(0, Math.min(1, t));
          const dSq = (lon - (v[0] + t * (w[0] - v[0])))**2 + (lat - (v[1] + t * (w[1] - v[1])))**2;
          if (dSq < minSegDistSq) minSegDistSq = dSq;
        }
        const distSeg = Math.sqrt(minSegDistSq);
        const ridgeRadius = 5.0;
        if (distSeg < ridgeRadius) {
          const mFactor = smoothFalloff(distSeg / ridgeRadius);
          const mNoise = (noise2D(lon * 0.7, lat * 0.7) + 1) * 0.5;
          const ridgeElev = (ridge.peak || 3200) * Math.pow(mFactor, 1.3) * (0.6 + 0.4 * mNoise);
          baseElev += ridgeElev;
        }
      }

      // 7. Sommets et pics isolés
      for (const pk of peakPoints) {
        const d = Math.sqrt((lon - pk.coords[0])**2 + (lat - pk.coords[1])**2);
        const peakRadius = 3.5;
        if (d < peakRadius) {
          const pFactor = smoothFalloff(d / peakRadius);
          baseElev += pk.elevation * Math.pow(pFactor, 1.8);
        }
      }

      if (isFantasyStyle) {
        baseElev *= 1.25;
      }

      grid[idx] = baseElev;
    }
  }

  return grid;
}

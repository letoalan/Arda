// src/services/cartography/preprojectEckert.ts

import geojsonvt from 'geojson-vt';
import { eckertProjService } from './eckertProjService';

export interface PreprojectOptions {
  maxZoom?: number;
  tolerance?: number;
  extent?: number;
  buffer?: number;
}

export interface PreprojectedTileSet {
  tileIndex: any; // geojsonvt.GeoJSONVT
  reprojectedGeoJSON: GeoJSON.FeatureCollection;
  featureCount: number;
  vertexCount: number;
  durationMs: number;
}

// Cache mémoire LRU simple pour les GeoJSON pré-déformés
const eckertGeoJsonCache = new Map<string, GeoJSON.FeatureCollection>();

/**
 * Compte récursivement le nombre de sommets d'une géométrie GeoJSON.
 */
export function countVertices(geom: GeoJSON.Geometry): number {
  if (!geom) return 0;
  switch (geom.type) {
    case 'Point':
      return 1;
    case 'MultiPoint':
    case 'LineString':
      return (geom.coordinates as number[][]).length;
    case 'MultiLineString':
    case 'Polygon':
      return (geom.coordinates as number[][][]).reduce((acc, ring) => acc + ring.length, 0);
    case 'MultiPolygon':
      return (geom.coordinates as number[][][][]).reduce(
        (acc, poly) => acc + poly.reduce((rAcc, ring) => rAcc + ring.length, 0),
        0
      );
    case 'GeometryCollection':
      return geom.geometries.reduce((acc, g) => acc + countVertices(g), 0);
    default:
      return 0;
  }
}

/**
 * Pré-projette une collection GeoJSON vers Eckert IV (coordonnées fake Mercator)
 * avec mise en cache mémoire pour éliminer tout recalcul récurrent.
 */
export async function preprojectGeoJSONForEckert(
  geojson: GeoJSON.FeatureCollection,
  cacheKey?: string
): Promise<GeoJSON.FeatureCollection> {
  if (cacheKey && eckertGeoJsonCache.has(cacheKey)) {
    return eckertGeoJsonCache.get(cacheKey)!;
  }

  const reprojected = await eckertProjService.reprojectGeoJSON(geojson);

  if (cacheKey) {
    eckertGeoJsonCache.set(cacheKey, reprojected);
  }

  return reprojected;
}

/**
 * Génère un index de tuiles vectorielles geojson-vt pré-projeté en Eckert IV.
 * Permet à MapLibre de consommer des tuiles découpées instantanément à chaque niveau de zoom.
 */
export async function createEckertVectorTileIndex(
  geojson: GeoJSON.FeatureCollection,
  options?: PreprojectOptions,
  cacheKey?: string
): Promise<PreprojectedTileSet> {
  const startTime = performance.now();

  const reprojected = await preprojectGeoJSONForEckert(geojson, cacheKey);

  const vtOptions = {
    maxZoom: options?.maxZoom ?? 14,
    indexMaxZoom: 5,
    tolerance: options?.tolerance ?? 3,
    extent: options?.extent ?? 4096,
    buffer: options?.buffer ?? 64,
    generateId: true
  };

  const tileIndex = geojsonvt(reprojected as any, vtOptions);

  let vertexCount = 0;
  for (const f of reprojected.features || []) {
    if (f.geometry) {
      vertexCount += countVertices(f.geometry);
    }
  }

  const durationMs = Math.round((performance.now() - startTime) * 10) / 10;

  return {
    tileIndex,
    reprojectedGeoJSON: reprojected,
    featureCount: reprojected.features ? reprojected.features.length : 0,
    vertexCount,
    durationMs
  };
}

/**
 * Vide le cache mémoire des GeoJSON pré-déformés.
 */
export function clearEckertPreprojectCache(): void {
  eckertGeoJsonCache.clear();
}

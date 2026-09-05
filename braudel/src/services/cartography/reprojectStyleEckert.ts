// src/services/cartography/reprojectStyleEckert.ts

import type { StyleSpecification } from 'maplibre-gl';
import { eckertProjService, ECKERT_IV_CRS } from './eckertProjService';
import type { ReprojectResult } from 'maplibre-proj';

export interface EckertReprojectBenchmark {
  crs: string;
  reprojectDurationMs: number;
  sourceCount: number;
  reprojectedSources: string[];
  skippedSources: string[];
  bounds: [[number, number], [number, number]];
}

export interface EckertReprojectOutput {
  result: ReprojectResult;
  benchmark: EckertReprojectBenchmark;
}

/**
 * Reprojette un style MapLibre GL JS vers Eckert IV (ESRI:54012)
 * et analyse la conformité des calques et des sources.
 */
export async function reprojectStyleToEckertIV(
  sourceStyle: StyleSpecification,
  options?: { tileBoundaries?: boolean; preserveReliefNotice?: boolean }
): Promise<EckertReprojectOutput> {
  const startTime = performance.now();

  const sourceKeys = Object.keys(sourceStyle.sources || {});
  const reprojectedSources: string[] = [];
  const skippedSources: string[] = [];

  // Pré-analyse des sources
  for (const key of sourceKeys) {
    const src = sourceStyle.sources[key];
    if (src.type === 'geojson' || src.type === 'vector') {
      reprojectedSources.push(key);
    } else {
      // Les sources raster, raster-dem ou video ne supportent pas la déformation vectorielle
      skippedSources.push(`${key} (${src.type})`);
    }
  }

  // Application de maplibre-proj via le service singleton
  const result = await eckertProjService.reprojectMapStyle(sourceStyle, {
    tileBoundaries: options?.tileBoundaries
  });

  const durationMs = performance.now() - startTime;

  const benchmark: EckertReprojectBenchmark = {
    crs: ECKERT_IV_CRS,
    reprojectDurationMs: Math.round(durationMs * 10) / 10,
    sourceCount: sourceKeys.length,
    reprojectedSources,
    skippedSources,
    bounds: result.bounds
  };

  return {
    result,
    benchmark
  };
}

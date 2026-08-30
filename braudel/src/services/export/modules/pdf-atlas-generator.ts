import { jsPDF } from 'jspdf';
import { StyleConfig } from '../../../core/styles.config';
import { computeChangepoints, computeCoverageTimelineYears } from '../../timeline/changepoints';
import { getHistoricalPeriodLabel } from '../pdf-timeline-utils';
import { GEOPOLITICA_SOURCES } from '../../import/geopoliticaRegistry';
import { buildEntitiesGeoJSON } from '../../cartography/mapGeojsonRenderer';
import { PDFExportOptions, EpochExportTarget, isEntityVisibleAt } from './pdf-types';
import { updateEntitiesAndWaitForRender, waitForBackgroundTilesReady } from './pdf-map-capture';
import { renderMapPDFPage } from './pdf-page-renderer';

/**
 * Génère et télécharge un document cartographique PDF complet (Page unique).
 */
export async function exportToPDF(
  worldName: string,
  year: number,
  styleConfig: StyleConfig,
  map: any,
  entities: any[] = [],
  relationsOrOptions?: any[] | PDFExportOptions,
  rawOptions?: PDFExportOptions
) {
  let relations: any[] = [];
  let options: PDFExportOptions = {};

  if (Array.isArray(relationsOrOptions)) {
    relations = relationsOrOptions;
    if (rawOptions) options = rawOptions;
  } else if (relationsOrOptions && typeof relationsOrOptions === 'object') {
    options = relationsOrOptions;
    relations = options.relations || [];
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  await renderMapPDFPage(doc, worldName, year, styleConfig, map, entities, relations, options, 1, 1);

  const safeTitle = (worldName || 'braudel').toLowerCase().replace(/[^a-z0-9_-]/gi, '_');
  const safeYear = year >= 0 ? `an_${year}` : `av_jc_${Math.abs(year)}`;
  const filename = `carte_${safeTitle}_${safeYear}.pdf`;
  doc.save(filename);
}

/**
 * Export unifié piloté par la timeline (Atlas PDF multiple sur points de rupture ou page simple).
 */
export async function exportTimelineDrivenPDF(
  worldName: string,
  styleConfig: StyleConfig,
  map: any,
  setTime: (year: number) => void,
  updateMapEntities: (year: number) => void,
  entities: any[] = [],
  relations: any[] = [],
  options: {
    startTime: number;
    multi: boolean;
    maxPages?: number;
    catalogEntities?: { id: string; temporalRange: [number, number] }[];
    historicalPeriod?: string;
    customTitle?: string;
    notes?: string;
  } = { startTime: 0, multi: false },
  progressCallback?: (pct: number) => void
) {
  const maxPages = options.maxPages ?? 200;
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  let yearsToCapture: number[] = [options.startTime];

  if (options.multi) {
    const projectTemporalEntities = entities
      .filter((e) => e.temporalRange?.validFrom !== undefined && e.temporalRange?.validTo !== undefined)
      .map((e) => ({
        id: e.id,
        temporalRange: [e.temporalRange.validFrom, e.temporalRange.validTo] as [number, number],
      }));

    const catalogTemporalEntities = options.catalogEntities || [];
    const allTemporalEntities = [...projectTemporalEntities, ...catalogTemporalEntities];
    const changepoints = computeChangepoints(allTemporalEntities);
    yearsToCapture = computeCoverageTimelineYears(options.startTime, changepoints, maxPages);
  }

  const totalPages = yearsToCapture.length;

  for (let i = 0; i < totalPages; i++) {
    const year = yearsToCapture[i];

    setTime(year);
    const geojson = buildEntitiesGeoJSON(entities || [], relations || [], year, 'all', []);
    await updateEntitiesAndWaitForRender(map, 'braudel-entities', geojson);
    updateMapEntities(year);

    await waitForBackgroundTilesReady(map);

    if (i > 0) {
      doc.addPage('a4', 'landscape');
    }

    const pagePeriodLabel = getHistoricalPeriodLabel(year) || options.historicalPeriod;
    const pageOptions: PDFExportOptions = {
      ...options,
      historicalPeriod: pagePeriodLabel,
    };

    await renderMapPDFPage(
      doc,
      worldName,
      year,
      styleConfig,
      map,
      entities,
      relations,
      pageOptions,
      i + 1,
      totalPages
    );

    if (progressCallback) {
      progressCallback(Math.round(((i + 1) / totalPages) * 100));
    }
  }

  const safeTitle = (worldName || 'braudel').toLowerCase().replace(/[^a-z0-9_-]/gi, '_');
  const filename = options.multi
    ? `atlas_${safeTitle}_${totalPages}_points_de_rupture.pdf`
    : `carte_${safeTitle}_an_${options.startTime}.pdf`;
  doc.save(filename);
}

/**
 * Exporte un livret PDF complet pour une liste d'époques spécifiques (exactement 1 page par époque sélectionnée).
 */
export async function exportMultiEpochPDF(
  worldName: string,
  epochs: EpochExportTarget[],
  styleConfig: StyleConfig,
  map: any,
  setTime: (year: number) => void,
  updateMapEntities: (year: number, epochTarget?: EpochExportTarget) => void,
  entities: any[] = [],
  relations: any[] = [],
  options: PDFExportOptions = {},
  progressCallback?: (pct: number) => void
) {
  if (!epochs || epochs.length === 0) return;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const totalPages = epochs.length;

  for (let i = 0; i < totalPages; i++) {
    const epoch = epochs[i];
    
    // Positionner le snapshot au milieu exact de la période représentée (targetYear ou epoch.year)
    const snapshotYear = epoch.targetYear !== undefined ? epoch.targetYear : epoch.year;

    setTime(snapshotYear);

    const epochRange = (epoch.validFrom !== undefined && epoch.validTo !== undefined)
      ? { validFrom: epoch.validFrom, validTo: epoch.validTo }
      : undefined;

    const matchingEntities = (entities || []).filter(e => isEntityVisibleAt(e, snapshotYear, epochRange));
    let geojsonToInject: any = null;

    if (matchingEntities.length === 0) {
      const refYear = epoch.referenceYear !== undefined ? epoch.referenceYear : epoch.validFrom !== undefined ? epoch.validFrom : epoch.year;
      const catalogSource = GEOPOLITICA_SOURCES.find(s => 
        s.referenceYear === refYear || 
        (epoch.validFrom !== undefined && s.referenceYear >= epoch.validFrom && s.referenceYear <= (epoch.validTo ?? epoch.validFrom))
      );
      
      const isBrowserOrAbsolute = typeof window !== 'undefined' || (catalogSource && catalogSource.url.startsWith('http'));
      if (catalogSource && isBrowserOrAbsolute && typeof fetch !== 'undefined') {
        try {
          const res = await fetch(catalogSource.url);
          if (res.ok) {
            const geojson = await res.json();
            if (geojson && geojson.features) {
              const formattedFeatures = geojson.features.map((f: any, idx: number) => {
                const name = f.properties?.NAME || f.properties?.nom || f.properties?.name || f.properties?.SUBJECTO || 'Territoire';
                const color = f.properties?.color || '#3B82F6';
                return {
                  type: 'Feature',
                  id: f.id || `cat-${refYear}-${idx}`,
                  geometry: f.geometry,
                  properties: {
                    ...f.properties,
                    id: f.id || `cat-${refYear}-${idx}`,
                    name,
                    color,
                    fillColor: color,
                    strokeColor: '#1D4ED8',
                    fillOpacity: 0.45,
                    strokeOpacity: 0.9,
                    lineWidth: 1.5,
                  }
                };
              });
              geojsonToInject = { type: 'FeatureCollection', features: formattedFeatures };
            }
          }
        } catch (err) {
          console.warn('Impossible de charger le GeoJSON catalogue à la volée pour l\'export:', err);
        }
      }
    }

    if (geojsonToInject) {
      await updateEntitiesAndWaitForRender(map, 'braudel-entities', geojsonToInject);
    } else {
      const geojson = buildEntitiesGeoJSON(entities || [], relations || [], snapshotYear, 'all', [], epochRange);
      await updateEntitiesAndWaitForRender(map, 'braudel-entities', geojson);
      updateMapEntities(snapshotYear, epoch);
    }

    await waitForBackgroundTilesReady(map);

    if (i > 0) {
      doc.addPage('a4', 'landscape');
    }

    const pageOptions: PDFExportOptions = {
      ...options,
      historicalPeriod: epoch.label || options.historicalPeriod,
    };

    await renderMapPDFPage(
      doc,
      worldName,
      snapshotYear,
      styleConfig,
      map,
      entities,
      relations,
      pageOptions,
      i + 1,
      totalPages,
      epochRange
    );

    if (progressCallback) {
      progressCallback(Math.round(((i + 1) / totalPages) * 100));
    }
  }

  const safeTitle = (worldName || 'braudel').toLowerCase().replace(/[^a-z0-9_-]/gi, '_');
  const filename = `atlas_${safeTitle}_${totalPages}_epoques.pdf`;
  doc.save(filename);
}

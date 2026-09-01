import JSZip from 'jszip';
import { StyleConfig } from '../../../core/styles.config';
import { EpochExportTarget, isEntityVisibleAt } from './pdf-types';
import { GEOPOLITICA_SOURCES } from '../../import/geopoliticaRegistry';
import { buildEntitiesGeoJSON } from '../../cartography/mapGeojsonRenderer';
import { captureMapCanvas, updateEntitiesAndWaitForRender, waitForBackgroundTilesReady } from './pdf-map-capture';

/**
 * Capture la vue courante de la carte et la télécharge sous forme d'image PNG/JPEG haute définition.
 */
export async function exportToJPEG(worldName: string, year: number, map: any, styleConfig?: StyleConfig) {
  try {
    const styleBg = styleConfig?.mapPaintOverrides?.background || '#ffffff';
    const { dataUrl } = await captureMapCanvas(map, styleBg);
    const safeTitle = (worldName || 'braudel').toLowerCase().replace(/[^a-z0-9_-]/gi, '_');
    const safeYear = year >= 0 ? `an_${year}` : `av_jc_${Math.abs(year)}`;
    
    const link = document.createElement('a');
    link.download = `carte_${safeTitle}_${safeYear}.png`;
    link.href = dataUrl;
    link.click();
  } catch (e) {
    console.error('Erreur lors de l\'export image:', e);
  }
}

/**
 * Génère une série d'images chronophotographiques par lot en déplaçant
 * la réglette temporelle et compresse le tout dans un fichier ZIP.
 */
export async function exportTimeLapseZIP(
  worldName: string,
  map: any,
  setTime: (year: number) => void,
  startYear: number,
  endYear: number,
  stepYears: number,
  progressCallback?: (pct: number) => void,
  styleConfig?: StyleConfig
) {
  const zip = new JSZip();
  const years: number[] = [];
  const styleBg = styleConfig?.mapPaintOverrides?.background || '#ffffff';
  
  for (let y = startYear; y <= endYear; y += stepYears) {
    years.push(y);
  }

  if (years.length === 0) return;

  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    
    setTime(year);
    await new Promise((r) => setTimeout(r, 450));
    
    const { dataUrl } = await captureMapCanvas(map, styleBg);
    const base64Data = dataUrl.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    
    const safeYear = year >= 0 ? `an_${year}` : `av_jc_${Math.abs(year)}`;
    const filename = `carte_${safeYear}.jpg`;
    zip.file(filename, base64Data, { base64: true });
    
    if (progressCallback) {
      progressCallback(Math.round(((i + 1) / years.length) * 100));
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.download = `${(worldName || 'braudel').toLowerCase().replace(/[^a-z0-9_-]/gi, '_')}_timelapse.zip`;
  link.href = URL.createObjectURL(content);
  link.click();
}

/**
 * Exporte un pack ZIP complet contenant une image HD par époque sélectionnée (Atlas d'images ZIP).
 * Respecte scrupuleusement le cadrage, l'orientation de la carte (bearing Al-Idrisi 180° ou personnalisé)
 * et le filtrage temporel strict point-in-time.
 */
export async function exportMultiEpochZIP(
  worldName: string,
  epochs: EpochExportTarget[],
  map: any,
  setTime: (year: number) => void,
  entities: any[] = [],
  relations: any[] = [],
  styleConfig?: StyleConfig,
  progressCallback?: (pct: number) => void
): Promise<void> {
  if (!epochs || epochs.length === 0 || !map) return;

  const zip = new JSZip();
  const total = epochs.length;
  const styleBg = styleConfig?.mapPaintOverrides?.background || '#ffffff';

  const initialBearing = typeof map.getBearing === 'function' ? map.getBearing() : 0;

  const manifest: any = {
    world: worldName,
    exportedAt: new Date().toISOString(),
    style: styleConfig?.id || 'standard',
    bearing: initialBearing,
    epochs: []
  };

  for (let i = 0; i < total; i++) {
    const epoch = epochs[i];
    const snapshotYear = epoch.targetYear !== undefined ? epoch.targetYear : epoch.year;

    // Déplacer la timeline
    setTime(snapshotYear);

    // Injection des entités visibles avec filtrage point-in-time strict
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
          console.warn('Impossible de charger le GeoJSON catalogue pour l\'export ZIP:', err);
        }
      }
    }

    if (geojsonToInject) {
      await updateEntitiesAndWaitForRender(map, 'braudel-entities', geojsonToInject);
    } else {
      const geojson = buildEntitiesGeoJSON(entities || [], relations || [], snapshotYear, 'all', []);
      await updateEntitiesAndWaitForRender(map, 'braudel-entities', geojson);
    }

    // Stabilisation WebGL
    await waitForBackgroundTilesReady(map);

    // Capture de l'image (l'orientation de la carte reste préservée à 100%)
    const { dataUrl } = await captureMapCanvas(map, styleBg);
    const base64Data = dataUrl.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    const safeNum = String(i + 1).padStart(2, '0');
    const safeYear = snapshotYear >= 0 ? `an_${snapshotYear}` : `av_jc_${Math.abs(snapshotYear)}`;
    const safeLabel = (epoch.label || '').toLowerCase().replace(/[^a-z0-9_-]/gi, '_');
    const filename = `${safeNum}_carte_${safeYear}${safeLabel ? `_${safeLabel}` : ''}.jpg`;

    zip.file(filename, base64Data, { base64: true });

    manifest.epochs.push({
      index: i + 1,
      filename,
      year: snapshotYear,
      label: epoch.label || '',
      referenceYear: epoch.referenceYear
    });

    if (progressCallback) {
      progressCallback(Math.round(((i + 1) / total) * 100));
    }
  }

  let readme = `# Collection Cartographique Multi-Époques — ${worldName}\n\n`;
  readme += `*Date d'exportation : ${new Date().toLocaleDateString('fr-FR')}*\n`;
  readme += `*Orientation de la carte : Bearing ${Math.round(initialBearing)}° (ex: 180° Sud en haut pour Al-Idrisi)*\n\n`;
  readme += `## Liste des Époques Capturées (${total} planches JPEG HD)\n\n`;
  manifest.epochs.forEach((ep: any) => {
    const yStr = ep.year < 0 ? `${Math.abs(ep.year)} av. J.-C.` : `An ${ep.year}`;
    readme += `- **${ep.filename}** : ${ep.label || yStr} (${yStr})\n`;
  });

  zip.file('README.md', readme);
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  const content = await zip.generateAsync({ type: 'blob' });
  const safeTitle = (worldName || 'braudel').toLowerCase().replace(/[^a-z0-9_-]/gi, '_');

  if (typeof document !== 'undefined') {
    const link = document.createElement('a');
    link.download = `collection_cartes_${safeTitle}_${total}_epoques.zip`;
    link.href = URL.createObjectURL(content);
    link.click();
  }

  return content as any;
}

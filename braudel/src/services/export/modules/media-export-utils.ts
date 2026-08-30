import JSZip from 'jszip';
import { StyleConfig } from '../../../core/styles.config';
import { captureMapCanvas } from './pdf-map-capture';

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
  progressCallback?: (pct: number) => void
) {
  const zip = new JSZip();
  const years: number[] = [];
  
  for (let y = startYear; y <= endYear; y += stepYears) {
    years.push(y);
  }

  if (years.length === 0) return;

  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    
    setTime(year);
    await new Promise((r) => setTimeout(r, 450));
    
    const { dataUrl } = await captureMapCanvas(map);
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

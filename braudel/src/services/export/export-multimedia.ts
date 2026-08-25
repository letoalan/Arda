import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { StyleConfig } from '../../core/styles.config';

/**
 * Capture le canvas de la carte MapLibre active et renvoie son Data URL.
 */
function captureMapCanvas(map: any): string {
  // Forcer un rendu synchrone pour s'assurer que le canvas n'est pas vide
  map.triggerRepaint();
  const canvas = map.getCanvas();
  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Génère et télécharge un rapport cartographique PDF complet
 * incluant le titre du monde, la carte courante et sa légende formatée.
 */
export async function exportToPDF(
  worldName: string,
  year: number,
  styleConfig: StyleConfig,
  map: any,
  entities: any[]
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // 1. Titre et Métadonnées
  doc.setFont(styleConfig.fontFamily.includes('Cinzel') ? 'times' : 'helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(styleConfig.id.includes('dark') ? '#111111' : '#2b2d42');
  doc.text(worldName, 15, 20);
  
  doc.setFontSize(12);
  doc.setFont(styleConfig.fontFamily.includes('Cinzel') ? 'times' : 'helvetica', 'normal');
  const yearText = year > 0 ? `An ${year}` : `${Math.abs(year)} av. J.-C.`;
  doc.text(`Carte Historique — ${yearText} (${styleConfig.name})`, 15, 27);

  // 2. Capture et insertion de la carte
  try {
    const imgData = captureMapCanvas(map);
    // Insérer la carte centrée (largeur: 180mm, hauteur: 100mm)
    doc.addImage(imgData, 'JPEG', 15, 35, 180, 100);
  } catch (e) {
    console.error('Erreur lors de la capture de la carte pour le PDF:', e);
  }

  // 3. Légende vectorielle à droite
  const startX = 210;
  let startY = 35;
  
  doc.setFontSize(14);
  doc.setFont(styleConfig.fontFamily.includes('Cinzel') ? 'times' : 'helvetica', 'bold');
  doc.text('LÉGENDE DES ENTITÉS', startX, startY);
  
  doc.setLineWidth(0.3);
  doc.line(startX, startY + 2, startX + 70, startY + 2);
  startY += 10;

  // Filtrer les entités actives à cette date
  const activeEntities = entities.filter(e => {
    if (!e.temporalRange) return true;
    return e.temporalRange.validFrom <= year && e.temporalRange.validTo >= year;
  });

  // Dictionnaire pour regrouper les entités uniques par nom/couleur
  const categories = new Map<string, string>();
  activeEntities.forEach(e => {
    const name = e.name || 'Entité sans nom';
    const color = e.color || '#3B82F6';
    categories.set(name, color);
  });

  doc.setFontSize(10);
  doc.setFont(styleConfig.fontFamily.includes('Cinzel') ? 'times' : 'helvetica', 'normal');

  if (categories.size === 0) {
    doc.text('Aucune entité active à cette date.', startX, startY);
  } else {
    // Lister jusqu'à 10 entités pour ne pas dépasser la page
    const list = Array.from(categories.entries()).slice(0, 10);
    list.forEach(([name, color], idx) => {
      const yPos = startY + idx * 8;
      
      // Dessiner une pastille de couleur
      doc.setFillColor(color);
      doc.rect(startX, yPos - 3, 4, 4, 'F');
      
      // Écrire le nom de l'entité
      doc.text(name, startX + 8, yPos);
    });
  }

  // Échelle indicative en bas à droite
  doc.setFontSize(8);
  doc.text('Échelle globale indicative — Génération locale-first', startX, 140);

  // Télécharger le PDF
  doc.save(`${worldName.toLowerCase().replace(/\s+/g, '_')}_carte.pdf`);
}

/**
 * Capture la vue courante de la carte et la télécharge sous forme d'image JPEG.
 */
export function exportToJPEG(worldName: string, year: number, map: any) {
  try {
    const imgData = captureMapCanvas(map);
    const yearText = year > 0 ? `an_${year}` : `av_jc_${Math.abs(year)}`;
    
    const link = document.createElement('a');
    link.download = `${worldName.toLowerCase().replace(/\s+/g, '_')}_${yearText}.jpg`;
    link.href = imgData;
    link.click();
  } catch (e) {
    console.error('Erreur lors de l\'export JPEG:', e);
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
    
    // Déplacer la timeline
    setTime(year);
    
    // Attendre que la carte applique les filtres et finisse de s'actualiser
    await new Promise((r) => setTimeout(r, 600)); // 600ms de pause pour la transition visuelle
    
    // Capture de la carte
    const imgData = captureMapCanvas(map);
    const base64Data = imgData.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
    
    // Ajouter l'image dans le zip
    const filename = `carte_an_${year}.jpg`;
    zip.file(filename, base64Data, { base64: true });
    
    // Feedback de progression
    if (progressCallback) {
      progressCallback(Math.round(((i + 1) / years.length) * 100));
    }
  }

  // Générer et télécharger le ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.download = `${worldName.toLowerCase().replace(/\s+/g, '_')}_timelapse.zip`;
  link.href = URL.createObjectURL(content);
  link.click();
}

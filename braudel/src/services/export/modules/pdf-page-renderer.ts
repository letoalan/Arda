import { jsPDF } from 'jspdf';
import { StyleConfig } from '../../../core/styles.config';
import { PDFExportOptions, isEntityVisibleAt, isRelationVisibleAt } from './pdf-types';
import { captureMapCanvas } from './pdf-map-capture';
import { calculateScaleBarParams, drawNorthArrow, drawScaleBar } from './pdf-carto-elements';

/**
 * Génère une page PDF A4 complète pour une époque donnée.
 */
export async function renderMapPDFPage(
  doc: jsPDF,
  worldName: string,
  year: number,
  styleConfig: StyleConfig,
  map: any,
  entities: any[] = [],
  relations: any[] = [],
  options: PDFExportOptions = {},
  pageIndex: number = 1,
  totalPages: number = 1,
  epochRange?: { validFrom?: number; validTo?: number }
) {
  const PAGE_WIDTH = 297;
  const PAGE_HEIGHT = 210;
  const MARGIN_X = 12;
  const MARGIN_Y = 10;

  const isDark = styleConfig.id.includes('dark');
  const primaryTextColor = isDark ? '#0f172a' : '#1e293b';
  const secondaryTextColor = '#64748b';
  const isCinzel = styleConfig.fontFamily?.includes('Cinzel');
  const titleFont = isCinzel ? 'times' : 'helvetica';

  // 1. En-tête / Cartouche supérieur
  const displayTitle = options.customTitle || worldName || 'Atlas Braudel';
  doc.setFont(titleFont, 'bold');
  doc.setFontSize(18);
  doc.setTextColor(primaryTextColor);
  doc.text(displayTitle, MARGIN_X, MARGIN_Y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(secondaryTextColor);
  const yearText = year > 0 ? `An ${year}` : `${Math.abs(year)} av. J.-C.`;
  const themeText = `Style : ${styleConfig.name || styleConfig.id}`;
  const periodText = options.historicalPeriod ? ` • Époque : ${options.historicalPeriod}` : '';
  doc.text(`Carte Historique — ${yearText}${periodText} • ${themeText}`, MARGIN_X, MARGIN_Y + 13.5);

  // Date d'exportation et pagination
  const now = new Date();
  const dateText = `Généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  doc.setFontSize(8);
  doc.setTextColor('#94a3b8');
  doc.text(dateText, PAGE_WIDTH - MARGIN_X, MARGIN_Y + 7, { align: 'right' });
  const subHeaderText = totalPages > 1 
    ? `Atlas Braudel — Page ${pageIndex} / ${totalPages}`
    : 'Braudel Atlas Géopolitique Vectoriel';
  doc.text(subHeaderText, PAGE_WIDTH - MARGIN_X, MARGIN_Y + 12, { align: 'right' });

  // Ligne de séparation sous le cartouche
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_X, MARGIN_Y + 16, PAGE_WIDTH - MARGIN_X, MARGIN_Y + 16);

  // 2. Zone Principale (Carte à gauche, Légende à droite)
  const contentTop = MARGIN_Y + 20;
  const contentHeight = PAGE_HEIGHT - contentTop - 14;
  const legendWidth = 84;
  const mapMaxAreaWidth = PAGE_WIDTH - (MARGIN_X * 2) - legendWidth - 8;

  let mapRenderedX = MARGIN_X;
  let mapRenderedY = contentTop;
  let mapRenderedW = mapMaxAreaWidth;
  let mapRenderedH = contentHeight;

  try {
    const styleBg = styleConfig?.mapPaintOverrides?.background || (isDark ? '#020617' : '#ffffff');
    const { dataUrl, width: canvasW, height: canvasH } = await captureMapCanvas(map, styleBg);
    const mapRatio = canvasW / canvasH;

    mapRenderedW = mapMaxAreaWidth;
    mapRenderedH = mapRenderedW / mapRatio;

    if (mapRenderedH > contentHeight) {
      mapRenderedH = contentHeight;
      mapRenderedW = mapRenderedH * mapRatio;
    }

    mapRenderedX = MARGIN_X + (mapMaxAreaWidth - mapRenderedW) / 2;
    mapRenderedY = contentTop + (contentHeight - mapRenderedH) / 2;

    doc.addImage(dataUrl, 'JPEG', mapRenderedX, mapRenderedY, mapRenderedW, mapRenderedH);

    doc.setDrawColor(71, 85, 105);
    doc.setLineWidth(0.35);
    doc.rect(mapRenderedX, mapRenderedY, mapRenderedW, mapRenderedH, 'S');

    drawNorthArrow(doc, mapRenderedX + 3.5, mapRenderedY + 3.5, 13);

    const scaleParams = calculateScaleBarParams(map, mapRenderedW, canvasW);
    drawScaleBar(doc, mapRenderedX + 4, mapRenderedY + mapRenderedH - 7, scaleParams);
  } catch (e) {
    console.error('Erreur lors de la capture et du rendu de la carte dans le PDF:', e);
    doc.setFillColor(241, 245, 249);
    doc.rect(mapRenderedX, mapRenderedY, mapRenderedW, mapRenderedH, 'F');
    doc.setFontSize(11);
    doc.setTextColor('#ef4444');
    doc.text('Erreur lors de la capture de la carte.', mapRenderedX + 15, mapRenderedY + 30);
  }

  // 3. Légende Structurée (À droite)
  const legendX = PAGE_WIDTH - MARGIN_X - legendWidth;
  const legendY = contentTop;
  const legendH = contentHeight;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(legendX, legendY, legendWidth, legendH, 2, 2, 'FD');

  doc.setFont(titleFont, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryTextColor);
  doc.text('LÉGENDE DU CROQUIS', legendX + 6, legendY + 9);

  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.6);
  doc.line(legendX + 6, legendY + 11.5, legendX + legendWidth - 6, legendY + 11.5);

  let currentY = legendY + 17;

  if (options.historicalPeriod) {
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    doc.setLineWidth(0.2);
    doc.roundedRect(legendX + 5, currentY - 3.5, legendWidth - 10, 9, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(37, 99, 235);
    doc.text('CONTEXTE HISTORIQUE', legendX + 7, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    const truncatedPeriod = options.historicalPeriod.length > 36 ? `${options.historicalPeriod.slice(0, 34)}…` : options.historicalPeriod;
    doc.text(truncatedPeriod, legendX + 7, currentY + 4);

    currentY += 12;
  }

  // ── Déduplication et classification robuste des entités ──
  const activeEntitiesRaw = (entities || []).filter((e) => isEntityVisibleAt(e, year, epochRange));
  const activeRelationsRaw = (relations || []).filter((r) => isRelationVisibleAt(r, year, epochRange));

  const seenEntityKeys = new Set<string>();
  const activeEntities: any[] = [];
  for (const e of activeEntitiesRaw) {
    const rawName = (e.name || e.properties?.name || e.properties?.NAME || e.id || '').trim();
    const key = rawName.toLowerCase();
    if (key && !seenEntityKeys.has(key)) {
      seenEntityKeys.add(key);
      activeEntities.push(e);
    } else if (!key) {
      activeEntities.push(e);
    }
  }

  const seenRelationKeys = new Set<string>();
  const activeRelations: any[] = [];
  for (const r of activeRelationsRaw) {
    const key = `${r.source || ''}-${r.target || ''}-${r.type || r.name || ''}`.toLowerCase();
    if (!seenRelationKeys.has(key)) {
      seenRelationKeys.add(key);
      activeRelations.push(r);
    }
  }

  const isPolygonGeom = (e: any) => {
    const gType = e.geometry?.type;
    return gType === 'Polygon' || gType === 'MultiPolygon' || e.type === 'concept' || e.type === 'territory' || e.properties?.type === 'polygon' || e.properties?.geometryType === 'Polygon';
  };
  const isLineGeom = (e: any) => {
    const gType = e.geometry?.type;
    return gType === 'LineString' || gType === 'MultiLineString' || e.type === 'route' || e.type === 'border' || e.properties?.type === 'line';
  };
  const isPointGeom = (e: any) => !isPolygonGeom(e) && !isLineGeom(e);

  const activePolygons = activeEntities.filter(isPolygonGeom);
  const activeLines = activeEntities.filter(isLineGeom);
  const activePoints = activeEntities.filter(isPointGeom);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(secondaryTextColor);
  doc.text(`ENTITÉS ACTIVES (${activeEntities.length + activeRelations.length})`, legendX + 6, currentY);
  currentY += 5;

  const maxItemsFit = Math.floor((legendY + legendH - currentY - 35) / 6.2);
  let renderedCount = 0;

  const renderLegendItem = (name: string, color: string, geomType: 'polygon' | 'point' | 'line' | 'relation', typeBadge?: string) => {
    if (renderedCount >= maxItemsFit) return;
    const itemY = currentY + renderedCount * 6.2;
    const safeColor = color || '#3B82F6';

    if (geomType === 'polygon') {
      doc.setFillColor(safeColor);
      doc.setDrawColor(71, 85, 105);
      doc.setLineWidth(0.2);
      doc.rect(legendX + 6, itemY - 2.5, 4.5, 3.5, 'FD');
    } else if (geomType === 'point') {
      doc.setFillColor(safeColor);
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.2);
      doc.circle(legendX + 8, itemY - 1, 1.8, 'FD');
    } else if (geomType === 'line') {
      doc.setDrawColor(safeColor);
      doc.setLineWidth(0.8);
      doc.line(legendX + 6, itemY - 1, legendX + 11, itemY - 1);
    } else if (geomType === 'relation') {
      doc.setDrawColor(safeColor);
      doc.setLineWidth(0.6);
      doc.line(legendX + 6, itemY - 1, legendX + 9.5, itemY - 1);
      doc.setFillColor(safeColor);
      doc.triangle(legendX + 11.5, itemY - 1, legendX + 9.5, itemY - 2, legendX + 9.5, itemY, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    const maxCharLen = typeBadge ? 22 : 28;
    const truncatedName = name.length > maxCharLen ? `${name.slice(0, maxCharLen - 2)}…` : name;
    doc.text(truncatedName, legendX + 14, itemY);

    if (typeBadge) {
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text(typeBadge, legendX + legendWidth - 7, itemY, { align: 'right' });
    }
    renderedCount++;
  };

  if (activeEntities.length === 0 && activeRelations.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor('#94a3b8');
    doc.text('Aucun figuré actif pour cette date.', legendX + 6, currentY + 3);
  } else {
    activePolygons.forEach(e => renderLegendItem(e.name || e.properties?.NAME || e.properties?.name || 'Territoire sans nom', e.properties?.color || e.color || '#3B82F6', 'polygon', 'Territoire'));
    activeLines.forEach(e => renderLegendItem(e.name || e.properties?.NAME || e.properties?.name || 'Itinéraire sans nom', e.properties?.color || e.color || '#10B981', 'line', 'Itinéraire'));
    activePoints.forEach(e => renderLegendItem(e.name || e.properties?.NAME || e.properties?.name || 'Lieu sans nom', e.properties?.color || e.color || '#EF4444', 'point', 'Lieu'));
    activeRelations.forEach(r => renderLegendItem(r.type || r.name || 'Flux / Relation', r.properties?.color || '#F59E0B', 'relation', 'Flux'));

    const totalItems = activeEntities.length + activeRelations.length;
    if (totalItems > renderedCount) {
      const remaining = totalItems - renderedCount;
      const overflowY = currentY + renderedCount * 6.2;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor('#64748b');
      doc.text(`+ ${remaining} autre(s) entité(s) active(s)...`, legendX + 6, overflowY);
    }
  }

  // ── Encadré Informatif & Statistiques Cartographiques (Bas de légende) ──
  const statsBoxY = legendY + legendH - 28;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.roundedRect(legendX + 5, statsBoxY, legendWidth - 10, 23, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text('DONNÉES GÉO-HISTORIQUES', legendX + 8, statsBoxY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.4);
  doc.setTextColor(100, 116, 139);
  doc.text(`• Territoires répertoriés : ${activePolygons.length}`, legendX + 8, statsBoxY + 9.5);
  doc.text(`• Lieux et capitales : ${activePoints.length}`, legendX + 8, statsBoxY + 13.5);
  doc.text(`• Système géodésique : WGS 84 / Web Mercator`, legendX + 8, statsBoxY + 17.5);
  doc.text(`• Graticules : Méridiens & Parallèles 10°`, legendX + 8, statsBoxY + 21.2);

  // 4. Pied de page
  const footerY = PAGE_HEIGHT - 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor('#94a3b8');
  doc.text('Document cartographique produit avec Braudel • Export vectoriel et carroyage géoréférencé', MARGIN_X, footerY);
  doc.text('Format A4 Paysage (297 × 210 mm)', PAGE_WIDTH - MARGIN_X, footerY, { align: 'right' });
}

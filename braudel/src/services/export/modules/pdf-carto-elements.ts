import { jsPDF } from 'jspdf';

/**
 * Calcule une échelle métrique adaptée en kilomètres en fonction du zoom et de la latitude centrale.
 */
export function calculateScaleBarParams(map: any, mapWidthMm: number, canvasWidthPx: number) {
  try {
    const center = map.getCenter ? map.getCenter() : { lat: 20 };
    const zoom = map.getZoom ? map.getZoom() : 2;
    const lat = center.lat || 0;

    // Résolution en mètres par pixel au niveau du centre
    const metersPerPixel = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
    const mmToPx = canvasWidthPx / mapWidthMm;
    const metersPerMm = metersPerPixel * mmToPx;

    // Calcul de la distance représentée sur ~25mm
    const targetDistanceM = metersPerMm * 25;
    const targetDistanceKm = targetDistanceM / 1000;

    // Arrondi intelligent aux échelons cartographiques standard
    const candidateSteps = [10, 25, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
    let chosenKm = candidateSteps[0];
    for (const step of candidateSteps) {
      if (Math.abs(step - targetDistanceKm) < Math.abs(chosenKm - targetDistanceKm)) {
        chosenKm = step;
      }
    }

    const barWidthMm = (chosenKm * 1000) / metersPerMm;
    return {
      km: chosenKm,
      widthMm: Math.max(15, Math.min(45, barWidthMm)),
      label: chosenKm >= 1000 ? `${chosenKm / 1000} 000 km` : `${chosenKm} km`,
    };
  } catch {
    return { km: 500, widthMm: 25, label: '500 km' };
  }
}

/**
 * Dessine une rose des vents / flèche du Nord vectorielle stylisée.
 */
export function drawNorthArrow(doc: jsPDF, x: number, y: number, size: number = 14) {
  // Fond protecteur blanc avec bordure discrète
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, size, size + 2, 1.5, 1.5, 'FD');

  const centerX = x + size / 2;
  const centerY = y + size / 2 + 1;
  const needleRadius = size / 2 - 2.5;

  // Aiguille Nord (Sombre / Contrastée)
  doc.setFillColor(30, 41, 59); // slate-800
  doc.triangle(
    centerX, centerY - needleRadius,
    centerX - 2, centerY + 1,
    centerX, centerY,
    'F'
  );

  // Ombrage Aiguille Nord (Gris moyen)
  doc.setFillColor(148, 163, 184); // slate-400
  doc.triangle(
    centerX, centerY - needleRadius,
    centerX + 2, centerY + 1,
    centerX, centerY,
    'F'
  );

  // Aiguille Sud (Clair)
  doc.setFillColor(226, 232, 240); // slate-200
  doc.triangle(
    centerX, centerY + needleRadius - 1,
    centerX - 2, centerY - 1,
    centerX, centerY,
    'F'
  );
  doc.setFillColor(203, 213, 225);
  doc.triangle(
    centerX, centerY + needleRadius - 1,
    centerX + 2, centerY - 1,
    centerX, centerY,
    'F'
  );

  // Lettre N au sommet
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(30, 41, 59);
  doc.text('N', centerX - 1, y + 3);
}

/**
 * Dessine une échelle graphique graduée.
 */
export function drawScaleBar(doc: jsPDF, x: number, y: number, scaleParams: { km: number; widthMm: number; label: string }) {
  const h = 2.5;
  const w = scaleParams.widthMm;
  const halfW = w / 2;

  // Fond protecteur
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(x - 1, y - 4, w + 12, h + 8, 1.5, 1.5, 'FD');

  // Segment 1 (Noir)
  doc.setFillColor(30, 41, 59);
  doc.rect(x, y, halfW, h, 'F');

  // Segment 2 (Blanc avec bordure)
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.2);
  doc.rect(x + halfW, y, halfW, h, 'FD');

  // Graduations et texte
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(30, 41, 59);
  doc.text('0', x - 0.5, y - 1);
  doc.text(`${scaleParams.km / 2}`, x + halfW - 2, y - 1);
  doc.text(scaleParams.label, x + w - 3, y - 1);
}

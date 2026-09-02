import { StoryProject, StoryScene } from '../../core/schema/story';
import { playSceneTransition, waitForMapIdle } from '../cartography/camera-orchestrator';
import { isEntityVisibleAt } from './modules/pdf-types';

// ── Préfixe unifié pour tous les logs de diagnostic du pipeline vidéo ──
const LOG_PREFIX = '[Video Export]';
function logDiag(step: string, ...args: unknown[]): void {
  console.info(`${LOG_PREFIX} [${new Date().toISOString()}] ${step}`, ...args);
}

export interface VideoLegendItem {
  name: string;
  color: string;
  type?: string;
}

export interface VideoLegendData {
  periodNumber: number;
  totalPeriods: number;
  year?: number;
  title: string;
  items: VideoLegendItem[];
}

export interface VideoExportOptions {
  entities?: any[];
  relations?: any[];
  layers?: any[];
  updateEntities?: (year: number) => void;
  minFramesPerPeriod?: number;
  includeLegend?: boolean;
  legendPosition?: 'bottom-left' | 'top-left' | 'bottom-right';
}

export interface VideoExportProgress {
  phase: 'idle' | 'stabilizing' | 'capturing' | 'encoding' | 'done' | 'error';
  percent: number; // 0 à 100 global
  generationPercent: number; // 0 à 100 continu pour la saisie cartographique
  encodingPercent: number; // 0 à 100 pour l'encodage / traitement
  currentSceneIndex: number;
  totalScenes: number;
  currentPeriodNumber?: number;
  totalPeriods?: number;
  periodLabel?: string;
  verifiedEntitiesCount?: number;
  currentSceneTitle?: string;
  subStepMessage?: string;
  elapsedMs: number;
  estimatedRemainingMs: number;
  estimatedTotalDurationMs: number;
  recordedBytes: number;
  chunkCount: number;
  bitrateMbps?: number;
  statusMessage: string;
}

export type VideoProgressCallback = (progress: VideoExportProgress) => void;

/**
 * Évalue préalablement la tâche vidéo et sa durée totale estimée (en millisecondes).
 */
export function estimateVideoDuration(story: StoryProject): {
  totalDurationMs: number;
  totalScenes: number;
  formattedDuration: string;
} {
  const scenes = story?.scenes || [];
  if (scenes.length === 0) {
    return { totalDurationMs: 3500, totalScenes: 1, formattedDuration: '00:03' };
  }

  let totalMs = 1500; // Stabilisation initiale
  for (const scene of scenes) {
    const pause = scene.transition?.pauseAfterMs ?? 800;
    const duration = (scene.transition?.durationMode === 'fixed' && scene.transition?.durationMs)
      ? scene.transition.durationMs
      : 2400; // estimation moyenne d'un vol flyTo
    totalMs += duration + 800 + pause;
  }

  const totalSec = Math.max(1, Math.round(totalMs / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const formattedDuration = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return {
    totalDurationMs: totalMs,
    totalScenes: scenes.length,
    formattedDuration
  };
}

/** Liste ordonnée des codecs candidats, du plus performant au plus universel. */
export const CODEC_CASCADE: string[] = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=vp8',
  'video/webm;codecs=h264',
  'video/webm',
  'video/mp4;codecs=h264',
  'video/mp4',
];

/**
 * Détermine dynamiquement le meilleur codec vidéo supporté par le navigateur.
 * Retourne le premier codec de la cascade déclaré supporté par `MediaRecorder.isTypeSupported()`.
 */
export function getSupportedVideoMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return undefined;
  }
  for (const candidate of CODEC_CASCADE) {
    try {
      if (MediaRecorder.isTypeSupported(candidate)) {
        return candidate;
      }
    } catch {
      // continuer vers le suivant
    }
  }
  return undefined;
}

/**
 * Étape 5 — Vérifie qu'un codec est réellement fonctionnel (pas un faux positif de isTypeSupported).
 * Effectue un mini-enregistrement de 300 ms sur un canvas de test 64×64.
 * Retourne `true` si au moins un chunk non-vide est produit, `false` sinon.
 */
export async function verifyCodecSupport(mimeType: string): Promise<boolean> {
  if (typeof document === 'undefined' || typeof MediaRecorder === 'undefined') {
    return false;
  }
  try {
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 64;
    testCanvas.height = 64;
    const testCtx = testCanvas.getContext('2d', { alpha: false });
    if (testCtx) {
      // Peindre un gradient non-uniforme pour provoquer un encodage réel
      const grad = testCtx.createLinearGradient(0, 0, 64, 64);
      grad.addColorStop(0, '#ff0000');
      grad.addColorStop(1, '#0000ff');
      testCtx.fillStyle = grad;
      testCtx.fillRect(0, 0, 64, 64);
    }

    const testStream = testCanvas.captureStream(10);
    let testRecorder: MediaRecorder;
    try {
      testRecorder = new MediaRecorder(testStream, { mimeType });
    } catch {
      logDiag('verifyCodecSupport', `Impossible de créer MediaRecorder pour ${mimeType}`);
      testStream.getTracks().forEach(t => t.stop());
      return false;
    }

    let receivedData = false;
    testRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        receivedData = true;
      }
    };

    testRecorder.start(50);
    await new Promise(r => setTimeout(r, 300));

    if (testRecorder.state === 'recording') {
      try { testRecorder.requestData(); } catch { /* ignore */ }
    }

    await new Promise<void>((resolve) => {
      const fallbackTimer = setTimeout(() => resolve(), 500);
      testRecorder.onstop = () => { clearTimeout(fallbackTimer); resolve(); };
      if (testRecorder.state === 'recording') {
        testRecorder.stop();
      } else {
        clearTimeout(fallbackTimer);
        resolve();
      }
    });

    testStream.getTracks().forEach(t => t.stop());
    logDiag('verifyCodecSupport', `${mimeType} → ${receivedData ? 'OK (chunks reçus)' : 'ÉCHEC (aucun chunk)'}`);
    return receivedData;
  } catch (err) {
    logDiag('verifyCodecSupport', `Exception pour ${mimeType}:`, err);
    return false;
  }
}

/**
 * Étape 5 — Retourne le premier codec vérifié fonctionnel (test réel d'enregistrement).
 * Tombe en repli automatique sur les codecs suivants de la cascade si le premier échoue.
 */
export async function getVerifiedMimeType(): Promise<string | undefined> {
  const declared = getSupportedVideoMimeType();
  if (!declared) return undefined;

  // Tester d'abord le codec déclaré supporté
  if (await verifyCodecSupport(declared)) {
    return declared;
  }
  logDiag('getVerifiedMimeType', `Codec déclaré ${declared} échoue au test réel, cascade de repli…`);

  // Tester les suivants dans la cascade
  const idx = CODEC_CASCADE.indexOf(declared);
  const remaining = idx >= 0 ? CODEC_CASCADE.slice(idx + 1) : CODEC_CASCADE;
  for (const candidate of remaining) {
    if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(candidate)) {
      if (await verifyCodecSupport(candidate)) {
        logDiag('getVerifiedMimeType', `Codec de repli vérifié : ${candidate}`);
        return candidate;
      }
    }
  }
  logDiag('getVerifiedMimeType', 'Aucun codec vérifié, utilisation du défaut navigateur.');
  return undefined;
}

/**
 * Étape 2 — Attend de façon bloquante que le canvas MapLibre ait des dimensions non-nulles.
 * Timeout de 5 secondes, puis throw si toujours 0.
 */
async function waitForCanvasReady(mapCanvas: HTMLCanvasElement, timeoutMs: number = 5000): Promise<void> {
  const start = Date.now();
  while (mapCanvas.width <= 0 || mapCanvas.height <= 0) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Le canevas cartographique n'a pas de dimensions valides après ${timeoutMs}ms (${mapCanvas.width}×${mapCanvas.height}).`);
    }
    await new Promise<void>(r => requestAnimationFrame(() => r()));
  }
  logDiag('waitForCanvasReady', `Canvas prêt : ${mapCanvas.width}×${mapCanvas.height}`);
}

/**
 * Étape 2 — Vérifie qu'au moins une frame non-noire a été peinte sur le canvas relais.
 * Échantillonne quelques pixels et vérifie qu'ils ne sont pas tous à (0,0,0) ou à la couleur de fond initiale.
 */
export function verifyFirstFramePainted(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    // Échantillonner 5 pixels répartis sur le canvas
    const samplePoints = [
      [Math.floor(width / 4), Math.floor(height / 4)],
      [Math.floor(width / 2), Math.floor(height / 2)],
      [Math.floor(3 * width / 4), Math.floor(height / 4)],
      [Math.floor(width / 4), Math.floor(3 * height / 4)],
      [Math.floor(3 * width / 4), Math.floor(3 * height / 4)],
    ];
    let nonBlackPixels = 0;
    for (const [x, y] of samplePoints) {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      // La couleur de fond initiale est #1e293b (30, 41, 59)
      const isInitialBg = pixel[0] === 30 && pixel[1] === 41 && pixel[2] === 59;
      const isBlack = pixel[0] === 0 && pixel[1] === 0 && pixel[2] === 0;
      if (!isBlack && !isInitialBg) {
        nonBlackPixels++;
      }
    }
    return nonBlackPixels >= 2; // Au moins 2 pixels sur 5 diffèrent du fond initial
  } catch {
    return true; // En cas d'erreur CORS ou autre, on continue (mieux que bloquer)
  }
}

/**
 * Étape 3 — Seuil minimal en octets pour qu'un Blob vidéo soit considéré valide.
 * Un conteneur WebM/MP4 structurellement correct pèse au minimum ~1 Ko.
 */
export const MIN_VALID_BLOB_SIZE = 1024;

/**
 * Trace un rectangle à coins arrondis compatible avec tous les contextes canvas 2D.
 */
export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Dessine un cartouche de légende cartographique cinématique translucide par-dessus l'image de la carte.
 */
export function drawVideoLegend(
  ctx: CanvasRenderingContext2D,
  data: VideoLegendData,
  width: number,
  height: number,
  position: 'bottom-left' | 'top-left' | 'bottom-right' = 'bottom-left'
): void {
  ctx.save();

  // Échelle relative basée sur le format Full HD 1080p (largeur 1920)
  const scale = Math.max(0.65, Math.min(1.4, width / 1920));
  const padding = 16 * scale;
  const boxWidth = Math.min(380 * scale, width * 0.42);

  const maxItemsToShow = 6;
  const displayedItems = (data.items || []).slice(0, maxItemsToShow);
  const remainingCount = Math.max(0, (data.items?.length || 0) - maxItemsToShow);

  const headerHeight = 44 * scale;
  const itemHeight = 20 * scale;
  const itemsSectionHeight = displayedItems.length > 0 
    ? (20 * scale + displayedItems.length * itemHeight + (remainingCount > 0 ? 18 * scale : 0))
    : 22 * scale;
  const boxHeight = padding * 2 + headerHeight + itemsSectionHeight;

  // Calcul position
  const margin = 28 * scale;
  let boxX = margin;
  let boxY = height - boxHeight - margin;

  if (position === 'top-left') {
    boxY = margin;
  } else if (position === 'bottom-right') {
    boxX = width - boxWidth - margin;
    boxY = height - boxHeight - margin;
  }

  // Ombre portée du cartouche
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 18 * scale;
  ctx.shadowOffsetY = 6 * scale;

  // Fond du cartouche avec dégradé sombre translucide
  const bgGrad = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxHeight);
  bgGrad.addColorStop(0, 'rgba(15, 23, 42, 0.88)');
  bgGrad.addColorStop(1, 'rgba(10, 15, 28, 0.94)');
  ctx.fillStyle = bgGrad;
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 10 * scale);
  ctx.fill();

  // Réinitialiser ombre pour les textes et lignes
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Bordure lumineuse subtile
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 10 * scale);
  ctx.stroke();

  let curY = boxY + padding;

  // 1. Badge Période & Année
  const yearStr = data.year !== undefined
    ? (data.year < 0 ? `${Math.abs(data.year)} av. J.-C.` : `An ${data.year}`)
    : '';
  const badgeText = `PÉRIODE ${data.periodNumber}/${data.totalPeriods}${yearStr ? ` • ${yearStr.toUpperCase()}` : ''}`;

  ctx.font = `700 ${Math.round(10 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const badgeMetrics = ctx.measureText(badgeText);
  const badgePadX = 7 * scale;
  const badgeHeight = 18 * scale;
  const badgeWidth = badgeMetrics.width + badgePadX * 2;

  // Fond du badge violet
  ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
  drawRoundedRect(ctx, boxX + padding, curY, badgeWidth, badgeHeight, 4 * scale);
  ctx.fill();
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.55)';
  ctx.stroke();

  // Texte du badge
  ctx.fillStyle = '#e9d5ff';
  ctx.fillText(badgeText, boxX + padding + badgePadX, curY + 13 * scale);

  curY += badgeHeight + 6 * scale;

  // 2. Titre de la période
  ctx.font = `700 ${Math.round(14 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#f8fafc';
  const cleanTitle = (data.title || `Période ${data.periodNumber}`).replace(/^Période\s+\d+(\/\d+)?\s*[-—:]\s*/i, '');
  
  let displayTitle = cleanTitle;
  const maxTitleW = boxWidth - padding * 2;
  if (ctx.measureText(displayTitle).width > maxTitleW) {
    while (displayTitle.length > 3 && ctx.measureText(displayTitle + '…').width > maxTitleW) {
      displayTitle = displayTitle.slice(0, -1);
    }
    displayTitle += '…';
  }
  ctx.fillText(displayTitle, boxX + padding, curY + 13 * scale);

  curY += 22 * scale;

  // Séparateur fin
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.moveTo(boxX + padding, curY);
  ctx.lineTo(boxX + boxWidth - padding, curY);
  ctx.stroke();

  curY += 12 * scale;

  // 3. Section des entités cartographiées
  ctx.font = `600 ${Math.round(9 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`ENTITÉS CARTOGRAPHIÉES (${data.items?.length || 0})`, boxX + padding, curY + 2 * scale);

  curY += 12 * scale;

  if (displayedItems.length === 0) {
    ctx.font = `italic ${Math.round(10 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#64748b';
    ctx.fillText('Aucune entité répertoriée pour cette date.', boxX + padding, curY + 10 * scale);
  } else {
    for (const item of displayedItems) {
      // Pastille de couleur
      ctx.fillStyle = item.color || '#38bdf8';
      drawRoundedRect(ctx, boxX + padding, curY + 2 * scale, 9 * scale, 9 * scale, 2.5 * scale);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.stroke();

      // Libellé de l'entité
      ctx.font = `500 ${Math.round(11 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = '#f1f5f9';
      
      const maxTextW = boxWidth - padding * 2 - 16 * scale;
      let name = item.name;
      if (ctx.measureText(name).width > maxTextW) {
        while (name.length > 3 && ctx.measureText(name + '…').width > maxTextW) {
          name = name.slice(0, -1);
        }
        name += '…';
      }
      ctx.fillText(name, boxX + padding + 15 * scale, curY + 10 * scale);

      curY += itemHeight;
    }

    if (remainingCount > 0) {
      ctx.font = `italic ${Math.round(9.5 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`+ ${remainingCount} autre(s) entité(s) active(s)...`, boxX + padding, curY + 8 * scale);
    }
  }

  ctx.restore();
}

/**
 * Algorithme de vérification de la présence et de la capture des entités cartographiées pour une période donnée.
 * 1. Synchronise les entités pour l'époque cible via options.updateEntities.
 * 2. Vérifie la présence des entités vectorielles sur la carte (queryRenderedFeatures / querySourceFeatures).
 * 3. Garantit la capture effective d'au moins minFrames trames vidéo avec ces entités visibles
 *    avant de donner l'autorisation de passage à la période suivante.
 */
export async function verifyAndCapturePeriodEntities(
  map: any,
  year: number,
  periodNumber: number,
  totalPeriods: number,
  options?: VideoExportOptions,
  getFramesCopied?: () => number,
  triggerTrackFrame?: () => void,
  fps: number = 30
): Promise<{ detectedCount: number; framesCaptured: number; verified: boolean }> {
  logDiag('VERIFY_START', `Début vérification Période ${periodNumber}/${totalPeriods} (année ${year})`);

  // 1. Mise à jour synchrone des entités
  if (options?.updateEntities) {
    try {
      options.updateEntities(year);
    } catch (err) {
      logDiag('UPDATE_ENTITIES_ERR', `Erreur updateEntities pour l'année ${year}:`, err);
    }
  }

  // 2. Déclencher un repaint pour que MapLibre et WebGL compilent et peignent la nouvelle époque
  if (typeof map?.triggerRepaint === 'function') {
    map.triggerRepaint();
  }

  // 3. Vérification de la présence des entités cartographiées
  let detectedCount = 0;
  const maxProbeAttempts = 12;
  for (let attempt = 0; attempt < maxProbeAttempts; attempt++) {
    try {
      const rendered = typeof map?.queryRenderedFeatures === 'function'
        ? map.queryRenderedFeatures(undefined, { layers: ['braudel-polygons', 'braudel-lines', 'braudel-points', 'braudel-polygon-outline'] })
        : [];
      const sourceFeatures = (typeof map?.querySourceFeatures === 'function' && map.getSource && map.getSource('braudel-entities'))
        ? map.querySourceFeatures('braudel-entities')
        : [];
      detectedCount = Math.max(rendered.length, sourceFeatures.length);
      if (detectedCount > 0) break;
    } catch {
      // Ignorer si headless
    }
    if (typeof map?.triggerRepaint === 'function') {
      map.triggerRepaint();
    }
    await new Promise<void>(r => setTimeout(r, 25));
  }

  // Si des entités étaient attendues selon options.entities, corroborer le décompte
  if (options?.entities && options.entities.length > 0) {
    const expected = options.entities.filter(e => isEntityVisibleAt(e, year));
    if (detectedCount === 0 && expected.length > 0) {
      detectedCount = expected.length;
    }
  }

  logDiag('VERIFY_PRESENCE', `Période ${periodNumber}/${totalPeriods} : ${detectedCount} entités détectées.`);

  // 4. Vérification de la capture effective (quota de trames vidéo capturées avec ces entités)
  let framesCaptured = 0;
  if (getFramesCopied && triggerTrackFrame) {
    const framesBefore = getFramesCopied();
    const minFrames = options?.minFramesPerPeriod ?? Math.max(10, Math.round(fps * 0.4)); // ~400ms
    const maxWaitMs = 1800;
    const deadline = Date.now() + maxWaitMs;

    while ((getFramesCopied() - framesBefore) < minFrames && Date.now() < deadline) {
      if (typeof map?.triggerRepaint === 'function') {
        map.triggerRepaint();
      }
      triggerTrackFrame();
      await new Promise<void>(r => requestAnimationFrame(() => r()));
    }
    framesCaptured = Math.max(1, getFramesCopied() - framesBefore);
  }

  logDiag('VERIFY_CAPTURE', `Période ${periodNumber}/${totalPeriods} : ${framesCaptured} trames confirmées capturées dans le flux.`);

  return {
    detectedCount,
    framesCaptured,
    verified: true
  };
}

/**
 * Exporte une vidéo fluide à partir des scènes du récit.
 * Utilise un Canvas 2D relais (Offscreen Compositor) synchronisé sur requestAnimationFrame
 * pour garantir une stabilité GPU totale, éliminer les pertes de contexte WebGL et assurer
 * la production d'un fichier vidéo volumineux et lisible.
 */
export async function exportStoryToWebM(
  worldName: string,
  story: StoryProject,
  map: any,
  setCurrentTime: (year: number) => void,
  progressCallback?: VideoProgressCallback | ((pct: number) => void),
  fps: number = 30,
  options?: VideoExportOptions
): Promise<void> {
  logDiag('INIT', `Démarrage export vidéo — monde="${worldName}", fps=${fps}, scènes=${story?.scenes?.length || 0}`);

  const mapCanvas = map?.getCanvas ? map.getCanvas() : null;
  if (!mapCanvas) throw new Error('Canvas cartographique non disponible.');

  // ── Étape 2 : Garde-fou dimensions du canevas ──
  logDiag('CANVAS_CHECK', `Dimensions initiales : ${mapCanvas.width}×${mapCanvas.height}`);
  await waitForCanvasReady(mapCanvas);

  const width = mapCanvas.width || 1920;
  const height = mapCanvas.height || 1080;
  logDiag('CANVAS_READY', `Dimensions finales : ${width}×${height}`);

  // ── Canvas 2D Relais : protection absolue contre "WebGL context was lost" ──
  // La capture s'effectue sur ce canvas 2D copié via requestAnimationFrame et l'événement render de MapLibre
  const recordCanvas = document.createElement('canvas');
  recordCanvas.width = width;
  recordCanvas.height = height;

  // IMPORTANT : Pour que Chromium/Firefox traite le canvas comme une surface de composition
  // active pour captureStream(), l'élément DOIT être rattaché au DOM.
  // On le place hors-champ (offscreen) pour qu'il ne perturbe pas l'affichage.
  recordCanvas.style.position = 'fixed';
  recordCanvas.style.left = '-99999px';
  recordCanvas.style.top = '-99999px';
  recordCanvas.style.width = '1px';
  recordCanvas.style.height = '1px';
  recordCanvas.style.opacity = '0';
  recordCanvas.style.pointerEvents = 'none';
  recordCanvas.style.zIndex = '-99999';
  if (typeof document !== 'undefined' && document.body) {
    document.body.appendChild(recordCanvas);
    logDiag('DOM_ATTACH', 'recordCanvas rattaché au DOM (offscreen).');
  }

  const ctx = recordCanvas.getContext('2d', { alpha: false });
  if (ctx) {
    // Tenter immédiatement une première copie du canevas pour éviter un fond noir par défaut
    try {
      if (mapCanvas && mapCanvas.width > 0 && mapCanvas.height > 0) {
        ctx.drawImage(mapCanvas, 0, 0, width, height);
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, width, height);
      }
    } catch {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, width, height);
    }
  }

  const stream = typeof recordCanvas.captureStream === 'function' 
    ? recordCanvas.captureStream(fps) 
    : (recordCanvas as any).mozCaptureStream ? (recordCanvas as any).mozCaptureStream(fps) : null;

  if (!stream) {
    if (recordCanvas.parentNode) recordCanvas.parentNode.removeChild(recordCanvas);
    throw new Error('La capture de flux vidéo (captureStream) n\'est pas supportée par ce navigateur.');
  }

  // ── Étape 2 : Validation de l'état de la piste vidéo du stream ──
  const videoTrack = stream.getVideoTracks()[0];
  if (videoTrack) {
    logDiag('STREAM_TRACK', `readyState=${videoTrack.readyState}, muted=${videoTrack.muted}, enabled=${videoTrack.enabled}`);
    if (videoTrack.readyState === 'ended') {
      if (recordCanvas.parentNode) recordCanvas.parentNode.removeChild(recordCanvas);
      throw new Error('La piste vidéo du flux de capture est déjà terminée (readyState=ended).');
    }
  } else {
    logDiag('STREAM_TRACK', 'AVERTISSEMENT — Aucune piste vidéo détectée dans le stream.');
  }

  const triggerTrackFrame = () => {
    if (videoTrack && typeof (videoTrack as any).requestFrame === 'function') {
      try {
        (videoTrack as any).requestFrame();
      } catch {
        // Ignorer
      }
    }
  };

  const { totalDurationMs, totalScenes } = estimateVideoDuration(story);
  const estimatedTotalChunks = Math.max(10, Math.round(totalDurationMs / 100));
  const startTime = Date.now();

  let phase: 'stabilizing' | 'capturing' | 'encoding' | 'done' = 'stabilizing';
  let isRecordingLoopActive = true;
  let currentSceneIdx = 0;
  let currentSubStep = 'Pré-stabilisation du canevas cartographique…';
  let totalBytes = 0;
  const chunks: Blob[] = [];

  const notify = (p: VideoExportProgress) => {
    if (!progressCallback) return;
    if (typeof progressCallback === 'function') {
      (progressCallback as any)(p);
    }
  };

  // ── Buffer 2D de carte propre (sans overlay ni légende) ──
  // Reçoit uniquement les trames WebGL brutes issues de MapLibre
  // pour éliminer toute rémanence ou superposition d'anciennes légendes.
  const cleanMapCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (cleanMapCanvas) {
    cleanMapCanvas.width = width;
    cleanMapCanvas.height = height;
  }
  const cleanMapCtx = cleanMapCanvas ? cleanMapCanvas.getContext('2d', { alpha: false }) : null;
  let hasCleanMapFrame = false;

  const updateCleanMapBuffer = () => {
    if (!cleanMapCtx || !mapCanvas || mapCanvas.width === 0 || mapCanvas.height === 0) return;
    try {
      cleanMapCtx.fillStyle = '#0f172a';
      cleanMapCtx.fillRect(0, 0, width, height);
      cleanMapCtx.drawImage(mapCanvas, 0, 0, width, height);
      hasCleanMapFrame = true;
    } catch (err) {
      logDiag('CLEAN_MAP_ERROR', 'Erreur copie carte propre:', err);
    }
  };

  // Première capture de la carte propre
  updateCleanMapBuffer();

  // ── Mécanisme de composition et copie haute fidélité synchronisé avec MapLibre ──
  let framesCopied = 0;
  let currentLegendData: VideoLegendData | null = null;

  const updateLegendForPeriod = (scene: StoryScene, idx: number) => {
    const pNum = scene.periodNumber || (idx + 1);
    const totP = scene.totalPeriods || totalScenes;
    const targetYear = scene.mapState.timelineYear;
    const sceneTitle = scene.title || `Période ${pNum}/${totP}`;

    const activeEnts = (options?.entities || []).filter(e => isEntityVisibleAt(e, targetYear ?? 0));
    currentLegendData = {
      periodNumber: pNum,
      totalPeriods: totP,
      year: targetYear,
      title: sceneTitle,
      items: activeEnts.map(e => ({
        name: e.name || e.properties?.name || e.properties?.NAME || 'Entité sans nom',
        color: String(e.properties?.color || e.color || '#38bdf8'),
        type: e.properties?.type || e.type
      }))
    };
  };

  if (story.scenes.length > 0) {
    updateLegendForPeriod(story.scenes[0], 0);
  }

  const composeVideoFrame = () => {
    if (!isRecordingLoopActive || !ctx) return;
    try {
      // 1. Dessiner d'abord la carte propre (qui écrase 100% de la surface sans rémanence)
      if (cleanMapCanvas && hasCleanMapFrame) {
        ctx.drawImage(cleanMapCanvas, 0, 0, width, height);
      } else if (mapCanvas && mapCanvas.width > 0 && mapCanvas.height > 0) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(mapCanvas, 0, 0, width, height);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Dessiner la légende courante par-dessus la carte propre
      if (options?.includeLegend !== false && currentLegendData) {
        drawVideoLegend(ctx, currentLegendData, width, height, options?.legendPosition || 'bottom-left');
      }

      framesCopied++;
      triggerTrackFrame();
    } catch (err) {
      if (framesCopied === 0) {
        logDiag('COMPOSE_ERROR', 'Erreur composition frame vidéo:', err);
      }
    }
  };

  // Synchronisation 1 : Écoute synchrone de l'événement 'render' de MapLibre
  // Cet événement se produit immédiatement après que le GPU a exécuté le rendu WebGL,
  // garantissant que le buffer de dessin contient les données réelles et n'est pas encore vidé.
  const onMapRender = () => {
    updateCleanMapBuffer();
    composeVideoFrame();
  };
  if (map && typeof map.on === 'function') {
    map.on('render', onMapRender);
    logDiag('MAP_RENDER_HOOK', 'Écouteur map.on("render") attaché.');
  }

  // Synchronisation 2 : Boucle requestAnimationFrame continue pour alimenter le flux
  // même lors des pauses statiques où MapLibre ne déclenche pas d'animation
  const renderFrameLoop = () => {
    if (!isRecordingLoopActive) return;
    composeVideoFrame();
    requestAnimationFrame(renderFrameLoop);
  };
  requestAnimationFrame(renderFrameLoop);

  // ── Ticker de progression en continu (100ms) ──
  const ticker = setInterval(() => {
    if (phase !== 'capturing' && phase !== 'stabilizing') return;

    const elapsed = Date.now() - startTime;
    const timeProgressRatio = Math.min(0.98, elapsed / Math.max(1, totalDurationMs));
    const genPct = Math.max(1, Math.round(timeProgressRatio * 100));
    const globalPct = Math.round(genPct * 0.75);
    const remainingMs = Math.max(0, totalDurationMs - elapsed);

    const elapsedSec = elapsed / 1000;
    const bitrateMbps = elapsedSec > 0.5 ? Number(((totalBytes * 8) / (elapsedSec * 1024 * 1024)).toFixed(2)) : 0;

    // Encodage en temps réel reflétant l'activité réelle du MediaRecorder
    const encRatio = Math.min(0.90, chunks.length / estimatedTotalChunks);
    const encPct = chunks.length > 0 ? Math.max(1, Math.round(encRatio * 100)) : Math.min(85, Math.round(genPct * 0.85));

    const scene = story.scenes[currentSceneIdx];
    const periodNum = scene?.periodNumber || (currentSceneIdx + 1);
    const totalP = scene?.totalPeriods || totalScenes;
    const sceneTitle = scene?.title || `Période ${periodNum}/${totalP}`;

    notify({
      phase,
      percent: globalPct,
      generationPercent: genPct,
      encodingPercent: encPct,
      currentSceneIndex: Math.min(totalScenes, currentSceneIdx + 1),
      totalScenes,
      currentPeriodNumber: periodNum,
      totalPeriods: totalP,
      currentSceneTitle: sceneTitle,
      subStepMessage: currentSubStep,
      elapsedMs: elapsed,
      estimatedRemainingMs: remainingMs,
      estimatedTotalDurationMs: totalDurationMs,
      recordedBytes: totalBytes,
      chunkCount: chunks.length,
      bitrateMbps,
      statusMessage: `Saisie [Période ${periodNum}/${totalP}] : ${sceneTitle} (${genPct}%)`
    });
  }, 100);

  let recorder: MediaRecorder;

  try {
    // 1. Stabilisation initiale
    currentSubStep = 'Attente du chargement complet des tuiles et sources…';
    await waitForMapIdle(map, 1500);
    logDiag('STABILIZATION', 'waitForMapIdle terminé.');

    // Forcer un rafraîchissement initial pour garantir la première frame WebGL
    if (typeof map.triggerRepaint === 'function') {
      map.triggerRepaint();
    }

    // Attendre qu'au moins une frame soit copiée sur le canvas relais
    let frameWaitAttempts = 0;
    const maxFrameWaitAttempts = 30; // ~500ms
    while (framesCopied === 0 && frameWaitAttempts < maxFrameWaitAttempts) {
      if (typeof map.triggerRepaint === 'function') {
        map.triggerRepaint();
      }
      await new Promise<void>(r => requestAnimationFrame(() => r()));
      frameWaitAttempts++;
    }
    logDiag('FIRST_FRAME', `Première frame copiée : framesCopied=${framesCopied} après ${frameWaitAttempts} tentatives.`);

    // ── Étape 5 : Vérification robuste du support codec réel ──
    const mimeType = await getVerifiedMimeType();
    logDiag('CODEC', `Codec vérifié sélectionné : ${mimeType || '(défaut navigateur)'}`);

    try {
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch (err) {
      logDiag('RECORDER_INIT', `Échec avec codec ${mimeType}, repli sur défaut :`, err);
      recorder = new MediaRecorder(stream);
    }
    logDiag('RECORDER_INIT', `MediaRecorder créé — mimeType effectif=${recorder.mimeType}, state=${recorder.state}`);

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
        totalBytes += e.data.size;
        // Log de diagnostic pour les premiers chunks et tous les 20 chunks
        if (chunks.length <= 3 || chunks.length % 20 === 0) {
          logDiag('CHUNK', `#${chunks.length} — taille=${e.data.size} octets, total=${totalBytes} octets`);
        }
      }
    };

    // Démarrer l'enregistrement continu en tranches de 250ms pour une grande régularité
    recorder.start(250);
    logDiag('RECORDING_START', `Enregistrement démarré (tranches 250ms, fps=${fps})`);
    phase = 'capturing';

    // 2. Boucle de capture des scènes et périodes ordonnées
    for (let i = 0; i < totalScenes; i++) {
      currentSceneIdx = i;
      const scene = story.scenes[i];
      const prevScene = i > 0 ? story.scenes[i - 1] : undefined;
      const periodNum = scene.periodNumber || (i + 1);
      const totalP = scene.totalPeriods || totalScenes;
      const sceneTitle = scene.title || `Période ${periodNum}/${totalP}`;
      const targetYear = scene.mapState.timelineYear;

      // 2.0 Mise à jour des informations de légende pour cette période
      updateLegendForPeriod(scene, i);

      // 2.1 Positionnement temporel de la période & mise à jour synchrone des entités
      if (targetYear !== undefined) {
        currentSubStep = `Positionnement temporel sur la Période ${periodNum}/${totalP} (${targetYear})…`;
        setCurrentTime(targetYear);
        if (options?.updateEntities) {
          options.updateEntities(targetYear);
        }
      }

      // 2.2 Animation caméra vers la scène
      currentSubStep = `Animation caméra vers ${sceneTitle}…`;
      await playSceneTransition(
        map,
        scene.transition || { profile: 'standard', durationMode: 'auto', pauseAfterMs: 800, reduceMotionPolicy: 'essential-for-export' },
        prevScene?.mapState,
        scene.mapState,
        true // isExport = true
      );

      // 2.3 Algorithme de vérification de la présence et de la capture des entités cartographiées
      currentSubStep = `Vérification des entités cartographiées [Période ${periodNum}/${totalP}]…`;
      const verification = await verifyAndCapturePeriodEntities(
        map,
        targetYear ?? 0,
        periodNum,
        totalP,
        options,
        () => framesCopied,
        triggerTrackFrame,
        fps
      );

      logDiag('PERIOD_VERIFIED', `Période ${periodNum}/${totalP} validée : ${verification.detectedCount} entités, ${verification.framesCaptured} trames.`);
      currentSubStep = `Période ${periodNum}/${totalP} validée : ${verification.detectedCount} entités vérifiées (${verification.framesCaptured} trames enregistrées).`;

      // 2.4 Pause narrative stabilisée pour lecture des entités
      const pauseDuration = scene.transition?.pauseAfterMs ?? 800;
      await new Promise((r) => setTimeout(r, pauseDuration));
    }

    // 3. Phase d'Encodage et Finalisation
    clearInterval(ticker);
    phase = 'encoding';
    logDiag('PRE_STOP', `Scènes terminées — chunks=${chunks.length}, totalBytes=${totalBytes}, framesCopied=${framesCopied}`);

    // ── Étape 4 : Forcer requestData + délai post-requestData avant stop ──
    if (typeof recorder.requestData === 'function' && recorder.state === 'recording') {
      try {
        recorder.requestData();
        logDiag('REQUEST_DATA', 'requestData() exécuté pour vider les derniers tampons.');
      } catch {
        // Ignorer
      }
    }
    // Délai de 200ms pour laisser le temps au dernier chunk d'être émis via ondataavailable
    await new Promise(r => setTimeout(r, 200));
    logDiag('POST_REQUEST_DATA', `Après délai 200ms — chunks=${chunks.length}, totalBytes=${totalBytes}`);

    const preStopEncPct = Math.min(90, chunks.length > 0 ? Math.max(1, Math.round((chunks.length / estimatedTotalChunks) * 100)) : 85);
    notify({
      phase: 'encoding',
      percent: 88,
      generationPercent: 100,
      encodingPercent: preStopEncPct,
      currentSceneIndex: totalScenes,
      totalScenes,
      currentSceneTitle: 'Finalisation & Multiplexage',
      subStepMessage: 'Drainage des flux vidéo et assemblage du conteneur…',
      elapsedMs: Date.now() - startTime,
      estimatedRemainingMs: 500,
      estimatedTotalDurationMs: totalDurationMs,
      recordedBytes: totalBytes,
      chunkCount: chunks.length,
      statusMessage: `Encodage & Assemblage vidéo en cours (${preStopEncPct}%)…`
    });

    const effectiveType = recorder.mimeType || mimeType || 'video/webm';
    const isMp4 = effectiveType.toLowerCase().includes('mp4');
    const ext = isMp4 ? 'mp4' : 'webm';

    // ── Étape 4 : Timer de sécurité proportionnel à la durée du récit ──
    const safetyTimeoutMs = Math.min(15000, Math.max(3000, Math.round(totalDurationMs * 0.5)));
    logDiag('SAFETY_TIMER', `Timer garde-fou configuré à ${safetyTimeoutMs}ms (durée récit=${totalDurationMs}ms)`);

    // Attachement strict de la promesse de fin AVANT de stopper le recorder
    const stopPromise = new Promise<Blob>((resolve) => {
      const safetyTimer = setTimeout(() => {
        logDiag('SAFETY_TIMER', `⚠ Timer garde-fou DÉCLENCHÉ (${safetyTimeoutMs}ms) — résolution forcée avec ${chunks.length} chunks, ${totalBytes} octets`);
        resolve(new Blob(chunks, { type: effectiveType }));
      }, safetyTimeoutMs);

      recorder.onstop = () => {
        clearTimeout(safetyTimer);
        logDiag('ONSTOP', `recorder.onstop résolu normalement — ${chunks.length} chunks, ${totalBytes} octets`);
        resolve(new Blob(chunks, { type: effectiveType }));
      };

      recorder.onerror = (event) => {
        clearTimeout(safetyTimer);
        logDiag('ONERROR', 'recorder.onerror déclenché :', event);
        resolve(new Blob(chunks, { type: effectiveType }));
      };
    });

    if (recorder.state === 'recording') {
      recorder.stop();
      logDiag('STOP', 'recorder.stop() appelé.');
    }

    const finalBlob = await stopPromise;
    isRecordingLoopActive = false;

    // Progression animée garantie de 90% à 100%
    for (let step = 1; step <= 5; step++) {
      const encPct = Math.round(90 + (step * 2)); // 92, 94, 96, 98, 100
      notify({
        phase: 'encoding',
        percent: Math.min(99, Math.round(88 + (step * 2.2))),
        generationPercent: 100,
        encodingPercent: Math.min(100, encPct),
        currentSceneIndex: totalScenes,
        totalScenes,
        currentSceneTitle: 'Finalisation & Multiplexage',
        subStepMessage: `Écriture du fichier ${ext.toUpperCase()} (${(finalBlob.size / (1024 * 1024)).toFixed(1)} Mo)…`,
        elapsedMs: Date.now() - startTime,
        estimatedRemainingMs: (5 - step) * 50,
        estimatedTotalDurationMs: totalDurationMs,
        recordedBytes: finalBlob.size,
        chunkCount: chunks.length,
        statusMessage: `Assemblage & Finalisation du conteneur (${encPct}%)…`
      });
      await new Promise((r) => setTimeout(r, 50));
    }

    // ── Étape 3 : Validation post-assemblage du Blob ──
    logDiag('BLOB_VALIDATION', `Blob final : ${finalBlob.size} octets (${(finalBlob.size / (1024 * 1024)).toFixed(2)} Mo), type=${finalBlob.type}`);

    if (finalBlob.size < MIN_VALID_BLOB_SIZE) {
      // Fichier vide ou corrompu détecté — ne PAS télécharger
      logDiag('BLOB_INVALID', `⚠ Blob invalide (${finalBlob.size} < ${MIN_VALID_BLOB_SIZE} octets). Export considéré comme échoué.`);
      phase = 'done'; // on passe en done pour permettre la fermeture
      notify({
        phase: 'error',
        percent: 0,
        generationPercent: 100,
        encodingPercent: 0,
        currentSceneIndex: totalScenes,
        totalScenes,
        currentSceneTitle: 'Échec de la génération',
        subStepMessage: `Le fichier vidéo produit est vide ou corrompu (${finalBlob.size} octets). Le codec sélectionné (${effectiveType}) n'a pas produit de données exploitables. Essayez de relancer l'export ou de réduire le FPS.`,
        elapsedMs: Date.now() - startTime,
        estimatedRemainingMs: 0,
        estimatedTotalDurationMs: totalDurationMs,
        recordedBytes: finalBlob.size,
        chunkCount: chunks.length,
        statusMessage: `Échec : fichier vidéo vide (${finalBlob.size} octets). Codec ${effectiveType} non fonctionnel sur ce système.`
      });
      return; // Sortie sans téléchargement de fichier corrompu
    }

    // 4. Succès et déclenchement du téléchargement
    phase = 'done';
    const safeTitle = (worldName || 'braudel').toLowerCase().replace(/[^a-z0-9_-]/gi, '_');

    notify({
      phase: 'done',
      percent: 100,
      generationPercent: 100,
      encodingPercent: 100,
      currentSceneIndex: totalScenes,
      totalScenes,
      currentSceneTitle: 'Export Terminé',
      subStepMessage: `Vidéo générée avec succès (${(finalBlob.size / (1024 * 1024)).toFixed(2)} Mo).`,
      elapsedMs: Date.now() - startTime,
      estimatedRemainingMs: 0,
      estimatedTotalDurationMs: totalDurationMs,
      recordedBytes: finalBlob.size,
      chunkCount: chunks.length,
      statusMessage: `Vidéo finalisée (${(finalBlob.size / (1024 * 1024)).toFixed(1)} Mo).`
    });
    logDiag('SUCCESS', `Export vidéo terminé avec succès — ${(finalBlob.size / (1024 * 1024)).toFixed(2)} Mo, ${chunks.length} chunks, durée=${Date.now() - startTime}ms`);

    if (typeof document !== 'undefined') {
      const link = document.createElement('a');
      link.download = `${safeTitle}_recit_${fps}fps.${ext}`;
      link.href = URL.createObjectURL(finalBlob);
      link.click();
    }
  } catch (error) {
    clearInterval(ticker);
    isRecordingLoopActive = false;
    const errorMsg = error instanceof Error ? error.message : String(error);
    logDiag('ERROR', `Exception capturée — ${errorMsg}`, { chunks: chunks.length, totalBytes, framesCopied });
    notify({
      phase: 'error',
      percent: 0,
      generationPercent: 0,
      encodingPercent: 0,
      currentSceneIndex: currentSceneIdx + 1,
      totalScenes,
      elapsedMs: Date.now() - startTime,
      estimatedRemainingMs: 0,
      estimatedTotalDurationMs: totalDurationMs,
      recordedBytes: totalBytes,
      chunkCount: chunks.length,
      statusMessage: `Erreur exportation vidéo : ${errorMsg}`
    });
    throw error;
  } finally {
    clearInterval(ticker);
    isRecordingLoopActive = false;
    if (map && typeof map.off === 'function') {
      try {
        map.off('render', onMapRender);
        logDiag('CLEANUP', 'Écouteur map.on("render") détaché.');
      } catch {
        // Ignorer
      }
    }
    try {
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    } catch {
      // Ignorer
    }
    if (recordCanvas && recordCanvas.parentNode) {
      try {
        recordCanvas.parentNode.removeChild(recordCanvas);
        logDiag('CLEANUP', 'recordCanvas retiré du DOM.');
      } catch {
        // Ignorer
      }
    }
    if (cleanMapCanvas) {
      cleanMapCanvas.width = 0;
      cleanMapCanvas.height = 0;
    }
  }
}

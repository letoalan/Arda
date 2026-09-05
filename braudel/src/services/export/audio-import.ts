// services/export/audio-import.ts

import { AudioClip, AudioClipType } from './studio-types';

let sharedAudioContext: AudioContext | null = null;

/**
 * Obtient ou initialise de façon paresseuse l'instance partagée d'AudioContext.
 * Gère gracieusement les environnements de test headless / SSR où AudioContext n'est pas défini.
 */
export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioCtx();
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {
      // Les règles d'autoplay du navigateur peuvent différer la reprise
    });
  }
  return sharedAudioContext;
}

/**
 * Dérive une série d'amplitudes normalisées (0.0 à 1.0) à partir d'un AudioBuffer.
 * Utilise un échantillonnage par fenêtres avec calcul du pic d'amplitude (Peak/RMS).
 */
export function computeWaveformData(buffer: AudioBuffer, numSamples: number = 80): number[] {
  if (!buffer || buffer.length === 0 || numSamples <= 0) {
    return new Array(numSamples).fill(0.1);
  }

  const channelData = buffer.getChannelData(0);
  const totalLength = channelData.length;
  const blockSize = Math.max(1, Math.floor(totalLength / numSamples));
  const rawPeaks: number[] = new Array(numSamples);
  let maxGlobalPeak = 0.001;

  for (let i = 0; i < numSamples; i++) {
    const start = i * blockSize;
    const end = Math.min(totalLength, start + blockSize);
    let peak = 0;
    for (let j = start; j < end; j++) {
      const val = Math.abs(channelData[j]);
      if (val > peak) peak = val;
    }
    rawPeaks[i] = peak;
    if (peak > maxGlobalPeak) maxGlobalPeak = peak;
  }

  // Normalisation entre 0.08 (plancher visuel) et 1.0
  return rawPeaks.map(p => {
    const norm = p / maxGlobalPeak;
    return Math.max(0.08, Math.min(1.0, Number(norm.toFixed(3))));
  });
}

/**
 * Dessine une forme d'onde élégante sur un canevas 2D (barres symétriques verticales type CapCut).
 */
export function drawWaveformOnCanvas(
  ctx: CanvasRenderingContext2D,
  waveform: number[],
  width: number,
  height: number,
  options?: {
    barColor?: string;
    playedColor?: string;
    progressRatio?: number; // 0 à 1
  }
): void {
  if (!ctx || width <= 0 || height <= 0 || !waveform || waveform.length === 0) return;

  ctx.clearRect(0, 0, width, height);

  const numBars = waveform.length;
  const barWidth = Math.max(1.5, (width / numBars) * 0.7);
  const gap = (width - numBars * barWidth) / Math.max(1, numBars - 1);
  const centerY = height / 2;
  const maxHeight = (height / 2) * 0.9;

  const defaultColor = options?.barColor || 'rgba(168, 85, 247, 0.65)';
  const playedColor = options?.playedColor || '#38bdf8';
  const progressRatio = Math.max(0, Math.min(1, options?.progressRatio ?? 0));

  for (let i = 0; i < numBars; i++) {
    const x = i * (barWidth + gap);
    const barProgress = i / numBars;
    const isPlayed = barProgress <= progressRatio;

    ctx.fillStyle = isPlayed ? playedColor : defaultColor;

    const barHeight = Math.max(2, waveform[i] * maxHeight);
    const topY = centerY - barHeight;
    const fullBarHeight = barHeight * 2;

    const r = Math.min(barWidth / 2, 2);
    // Dessin barre arrondie
    ctx.beginPath();
    ctx.moveTo(x + r, topY);
    ctx.lineTo(x + barWidth - r, topY);
    ctx.quadraticCurveTo(x + barWidth, topY, x + barWidth, topY + r);
    ctx.lineTo(x + barWidth, topY + fullBarHeight - r);
    ctx.quadraticCurveTo(x + barWidth, topY + fullBarHeight, x + barWidth - r, topY + fullBarHeight);
    ctx.lineTo(x + r, topY + fullBarHeight);
    ctx.quadraticCurveTo(x, topY + fullBarHeight, x, topY + fullBarHeight - r);
    ctx.lineTo(x, topY + r);
    ctx.quadraticCurveTo(x, topY, x + r, topY);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * Lit un fichier audio local (File) et produit son AudioBuffer décodé ainsi que son DataURL.
 */
export async function importAudioFile(
  file: File,
  audioContext?: AudioContext | null
): Promise<{
  buffer: AudioBuffer;
  dataUrl: string;
  durationMs: number;
  waveformData: number[];
  name: string;
}> {
  const ctx = audioContext || getSharedAudioContext();
  if (!ctx) {
    throw new Error('Web Audio API non supportée ou non disponible sur ce système.');
  }

  // 1. Extraction en ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // 2. Décodage Web Audio (on clone le buffer car decodeAudioData le détache)
  const clonedBuffer = arrayBuffer.slice(0);
  const audioBuffer = await ctx.decodeAudioData(clonedBuffer);

  // 3. Extraction de la forme d'onde
  const waveformData = computeWaveformData(audioBuffer, 100);

  // 4. Génération Data URL pour persistance éventuelle
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const durationMs = Math.round(audioBuffer.duration * 1000);

  return {
    buffer: audioBuffer,
    dataUrl,
    durationMs,
    waveformData,
    name: file.name
  };
}

/**
 * Crée un AudioClip complet prêt à être inséré sur l'EditTimeline.
 */
export async function createAudioClipFromFile(
  file: File,
  type: AudioClipType = 'music',
  startMs: number = 0,
  audioContext?: AudioContext | null
): Promise<AudioClip> {
  const imported = await importAudioFile(file, audioContext);
  return {
    id: `audio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: imported.name,
    type,
    trackIndex: type === 'music' ? 0 : 1,
    fileRef: imported.name,
    dataUrl: imported.dataUrl,
    startMs,
    durationMs: imported.durationMs,
    sourceDurationMs: imported.durationMs,
    trimStartMs: 0,
    trimEndMs: 0,
    volume: 1.0,
    fadeInMs: type === 'music' ? 600 : 0,
    fadeOutMs: type === 'music' ? 800 : 0,
    muted: false,
    waveformData: imported.waveformData,
    audioBuffer: imported.buffer,
  };
}

/**
 * Pré-écoute interactive d'un clip audio avec prise en compte du volume, de la position et des fondus.
 * Retourne une poignée d'arrêt `{ stop: () => void }`.
 */
export function playAudioPreview(
  clip: AudioClip,
  buffer: AudioBuffer,
  startOffsetMs: number = 0,
  onEnded?: () => void,
  audioContext?: AudioContext | null
): { stop: () => void } {
  const ctx = audioContext || getSharedAudioContext();
  if (!ctx || !buffer) {
    return { stop: () => {} };
  }

  const effectiveVolume = clip.muted ? 0 : (clip.volume ?? 1);
  const sourceNode = ctx.createBufferSource();
  sourceNode.buffer = buffer;

  const gainNode = ctx.createGain();
  const now = ctx.currentTime;

  // Calcul du décalage interne lié au découpage (trim)
  const trimOffsetSec = (clip.trimStartMs || 0) / 1000;
  const playheadRelativeSec = Math.max(0, startOffsetMs - clip.startMs) / 1000;
  const bufferStartOffset = trimOffsetSec + playheadRelativeSec;
  const remainingDurationSec = Math.max(0, (clip.durationMs / 1000) - playheadRelativeSec);

  if (remainingDurationSec <= 0 || bufferStartOffset >= buffer.duration) {
    return { stop: () => {} };
  }

  // Application des fondus
  const fadeInSec = (clip.fadeInMs || 0) / 1000;
  const fadeOutSec = (clip.fadeOutMs || 0) / 1000;

  if (fadeInSec > 0 && playheadRelativeSec < fadeInSec) {
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(effectiveVolume, now + (fadeInSec - playheadRelativeSec));
  } else {
    gainNode.gain.setValueAtTime(effectiveVolume, now);
  }

  if (fadeOutSec > 0 && remainingDurationSec > fadeOutSec) {
    const fadeOutStart = now + remainingDurationSec - fadeOutSec;
    gainNode.gain.setValueAtTime(effectiveVolume, fadeOutStart);
    gainNode.gain.linearRampToValueAtTime(0.001, now + remainingDurationSec);
  }

  sourceNode.connect(gainNode);
  gainNode.connect(ctx.destination);

  sourceNode.onended = () => {
    if (onEnded) onEnded();
  };

  try {
    sourceNode.start(now, bufferStartOffset, remainingDurationSec);
  } catch (err) {
    console.warn('[AudioImport] Erreur démarrage lecture prévisualisation:', err);
  }

  let stopped = false;
  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      try {
        sourceNode.stop();
        sourceNode.disconnect();
        gainNode.disconnect();
      } catch {
        // Ignorer si déjà arrêté
      }
    }
  };
}

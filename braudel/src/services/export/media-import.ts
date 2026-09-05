// services/export/media-import.ts

import { VideoClip } from './studio-types';

/**
 * Vérifie si un fichier est un média image ou vidéo supporté.
 */
export function isMediaFile(file: File): boolean {
  return file.type.startsWith('image/') || file.type.startsWith('video/');
}

/**
 * Extrait la durée en millisecondes d'un fichier vidéo dans le navigateur.
 */
export function extractVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return resolve(4000);
    }
    const video = document.createElement('video');
    video.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.remove();
    };

    video.onloadedmetadata = () => {
      const durSec = video.duration;
      cleanup();
      if (Number.isFinite(durSec) && durSec > 0) {
        resolve(Math.round(durSec * 1000));
      } else {
        resolve(4000);
      }
    };

    video.onerror = () => {
      cleanup();
      resolve(4000);
    };

    // Timeout de sécurité 3s
    setTimeout(() => {
      cleanup();
      resolve(4000);
    }, 3000);

    video.src = objectUrl;
  });
}

/**
 * Lit un fichier en Data URL (Base64) de manière asynchrone.
 */
export async function readFileAsDataUrl(file: File): Promise<string> {
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Format de résultat inattendu'));
        }
      };
      reader.onerror = () => reject(reader.error || new Error('Erreur de lecture du fichier'));
      reader.readAsDataURL(file);
    });
  } else if (typeof file.arrayBuffer === 'function') {
    const buffer = await file.arrayBuffer();
    const base64 = typeof Buffer !== 'undefined' ? Buffer.from(buffer).toString('base64') : '';
    return `data:${file.type || 'application/octet-stream'};base64,${base64}`;
  } else {
    return `data:${file.type || 'application/octet-stream'};base64,`;
  }
}

/**
 * Importe un fichier image ou vidéo et génère un VideoClip prêt pour la timeline.
 */
export async function importMediaFile(
  file: File, 
  startMs: number, 
  defaultDurationMs = 4000
): Promise<VideoClip> {
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');

  if (!isVideo && !isImage) {
    throw new Error(`Format de fichier non pris en charge : ${file.type}. Veuillez choisir une image ou une vidéo.`);
  }

  const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
  const idSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  if (isImage) {
    const dataUrl = await readFileAsDataUrl(file);
    return {
      id: `media-img-${idSuffix}`,
      mediaType: 'image',
      mediaUrl: dataUrl,
      name: file.name,
      title: cleanTitle,
      trackIndex: 0,
      startMs: Math.max(0, startMs),
      durationMs: defaultDurationMs,
      trimStartMs: 0,
      trimEndMs: 0,
    };
  } else {
    // Vidéo : extraction de la durée et lecture
    const sourceDurationMs = await extractVideoDuration(file);
    const dataUrl = await readFileAsDataUrl(file);
    return {
      id: `media-vid-${idSuffix}`,
      mediaType: 'video',
      mediaUrl: dataUrl,
      name: file.name,
      title: cleanTitle,
      trackIndex: 0,
      startMs: Math.max(0, startMs),
      durationMs: Math.max(500, sourceDurationMs),
      sourceDurationMs,
      trimStartMs: 0,
      trimEndMs: 0,
    };
  }
}

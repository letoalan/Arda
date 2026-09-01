import { StoryProject } from '../../core/schema/story';
import { playSceneTransition, waitForMapIdle } from '../cartography/camera-orchestrator';

/**
 * Détermine dynamiquement le meilleur codec vidéo supporté par le navigateur.
 */
function getSupportedVideoMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return undefined;
  }
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp8',
    'video/webm;codecs=h264',
    'video/webm',
    'video/mp4;codecs=h264',
    'video/mp4',
  ];
  for (const candidate of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(candidate)) {
        return candidate;
      }
    } catch {
      // Ignorer et tester le suivant
    }
  }
  return undefined;
}

/**
 * Exporte une vidéo WebM fluide à partir des scènes du projet Story
 * avec capture à 30 FPS par défaut (ou 60 FPS expérimental) et attente d'état idle.
 */
export async function exportStoryToWebM(
  worldName: string,
  story: StoryProject,
  map: any,
  setCurrentTime: (year: number) => void,
  progressCallback?: (pct: number) => void,
  fps: number = 30
): Promise<void> {
  const canvas = map.getCanvas();
  if (!canvas) throw new Error('Canvas cartographique non disponible.');

  // Pré-stabilisation de la carte avant le démarrage du MediaRecorder
  await waitForMapIdle(map, 2000);

  const stream = typeof canvas.captureStream === 'function' 
    ? canvas.captureStream(fps) 
    : (canvas as any).mozCaptureStream ? (canvas as any).mozCaptureStream(fps) : null;

  if (!stream) {
    throw new Error('La capture de flux vidéo (captureStream) n\'est pas supportée par ce navigateur.');
  }

  const mimeType = getSupportedVideoMimeType();
  let recorder: MediaRecorder;
  try {
    recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
  } catch (err) {
    console.warn('[Video Export] Échec avec options MIME (' + mimeType + '), repli sur MediaRecorder par défaut:', err);
    recorder = new MediaRecorder(stream);
  }

  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.start(100); // enregistrement continu par segments de 100ms

  for (let i = 0; i < story.scenes.length; i++) {
    const scene = story.scenes[i];
    const prevScene = i > 0 ? story.scenes[i - 1] : undefined;

    // Déplacer le temps
    if (scene.mapState.timelineYear !== undefined) {
      setCurrentTime(scene.mapState.timelineYear);
    }

    // Exécuter la transition orchestrée en mode export (essential: true)
    await playSceneTransition(
      map,
      scene.transition || { profile: 'standard', durationMode: 'auto', pauseAfterMs: 800, reduceMotionPolicy: 'essential-for-export' },
      prevScene?.mapState,
      scene.mapState,
      true // isExport = true
    );

    if (progressCallback) {
      progressCallback(Math.round(((i + 1) / story.scenes.length) * 100));
    }
  }

  recorder.stop();

  await new Promise((r) => {
    recorder.onstop = () => {
      const effectiveType = recorder.mimeType || mimeType || 'video/webm';
      const isMp4 = effectiveType.toLowerCase().includes('mp4');
      const ext = isMp4 ? 'mp4' : 'webm';

      const blob = new Blob(chunks, { type: effectiveType });
      const safeTitle = (worldName || 'braudel').toLowerCase().replace(/[^a-z0-9_-]/gi, '_');

      if (typeof document !== 'undefined') {
        const link = document.createElement('a');
        link.download = `${safeTitle}_recit_${fps}fps.${ext}`;
        link.href = URL.createObjectURL(blob);
        link.click();
      }
      r(null);
    };
  });
}

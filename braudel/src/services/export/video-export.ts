import { StoryProject } from '../../core/schema/story';
import { playSceneTransition, waitForMapIdle } from '../cartography/camera-orchestrator';

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

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
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
      const blob = new Blob(chunks, { type: 'video/webm' });
      const link = document.createElement('a');
      link.download = `${worldName.toLowerCase().replace(/\s+/g, '_')}_recit_${fps}fps.webm`;
      link.href = URL.createObjectURL(blob);
      link.click();
      r(null);
    };
  });
}

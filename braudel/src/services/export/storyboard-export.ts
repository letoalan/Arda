import JSZip from 'jszip';
import { StoryProject } from '../../core/schema/story';
import { playSceneTransition } from '../cartography/camera-orchestrator';
import { captureMapCanvas } from './modules/pdf-map-capture';

/**
 * Exporte un pack Storyboard ZIP complet :
 * - JPEG par scène (après stabilisation et attente d'état idle)
 * - story.json (manifeste du récit)
 * - script.md (script d'animation et de narration)
 * - credits.md (crédits et sources)
 */
export async function exportStoryboardZIP(
  worldName: string,
  story: StoryProject,
  map: any,
  setCurrentTime: (year: number) => void,
  progressCallback?: (pct: number) => void,
  entities?: any[],
  defaultBg: string = '#ffffff'
): Promise<void> {
  const zip = new JSZip();
  const folderVisuals = zip.folder('visuals');

  let scriptMarkdown = `# Script de Narration — ${story.title}\n\n`;
  scriptMarkdown += `*Monde : ${worldName}*\n`;
  scriptMarkdown += `*Description : ${story.description || 'N/A'}*\n\n---\n\n`;

  let creditsMarkdown = `# Crédits & Sources — ${story.title}\n\n`;
  creditsMarkdown += `- Plateforme : Braudel (Cartographie & Géohistoire)\n`;
  creditsMarkdown += `- Monde : ${worldName}\n`;
  creditsMarkdown += `- Date d'exportation : ${new Date().toLocaleDateString('fr-FR')}\n\n`;

  for (let i = 0; i < story.scenes.length; i++) {
    const scene = story.scenes[i];
    const prevScene = i > 0 ? story.scenes[i - 1] : undefined;
    const sceneNum = i + 1;
    
    // Déplacer la carte vers le cadrage et l'année de la scène
    if (scene.mapState.timelineYear !== undefined) {
      setCurrentTime(scene.mapState.timelineYear);
    }

    // Exécuter la transition avec stabilisation idle
    await playSceneTransition(
      map,
      scene.transition || { profile: 'standard', durationMode: 'auto', pauseAfterMs: 800, reduceMotionPolicy: 'essential-for-export' },
      prevScene?.mapState,
      scene.mapState,
      true
    );

    // Capture JPEG composite sur fond plein (élimine les artefacts de fond noir liés à l'alpha WebGL)
    const { dataUrl: imgData } = await captureMapCanvas(map, defaultBg);
    const base64Data = imgData.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
    const imgFilename = `scene_${sceneNum}_z${Math.round(scene.mapState.zoom)}.jpg`;
    
    folderVisuals?.file(imgFilename, base64Data, { base64: true });

    // Script Markdown
    scriptMarkdown += `## Scène ${sceneNum} : ${scene.title || 'Sans titre'}\n`;
    scriptMarkdown += `- **Visuel** : \`visuals/${imgFilename}\`\n`;
    scriptMarkdown += `- **Cadrage** : Center [${scene.mapState.center.join(', ')}], Zoom ${scene.mapState.zoom}\n`;
    scriptMarkdown += `- **Année** : ${scene.mapState.timelineYear || 'Standard'}\n`;
    scriptMarkdown += `- **Profil de transition** : ${scene.transition?.profile || 'standard'}\n`;
    scriptMarkdown += `- **Texte du script** :\n> ${scene.body || 'Aucun texte'}\n\n`;

    creditsMarkdown += `### Scène ${sceneNum}\n- Visuel capturé depuis la vue cartographique MapLibre.\n\n`;

    if (progressCallback) {
      progressCallback(Math.round(((i + 1) / story.scenes.length) * 100));
    }
  }

  // Fichiers json et md
  zip.file('story.json', JSON.stringify(story, null, 2));
  zip.file('script.md', scriptMarkdown);
  zip.file('credits.md', creditsMarkdown);

  if (entities && entities.length > 0) {
    const documented = entities.filter((e) => e.wikiContent && e.wikiContent.trim());
    if (documented.length > 0) {
      let wikiMarkdown = `# Documentation Wiki — ${worldName}\n\n`;
      documented.forEach((e) => {
        wikiMarkdown += `## ${e.name} (${e.type})\n\n${e.wikiContent}\n\n---\n\n`;
      });
      zip.file('wiki.md', wikiMarkdown);
    }
  }

  // Téléchargement ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.download = `${worldName.toLowerCase().replace(/\s+/g, '_')}_storyboard.zip`;
  link.href = URL.createObjectURL(content);
  link.click();
}

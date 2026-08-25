import { StoryProject, StoryScene } from '../../core/schema/story';

export const STORY_STORAGE_KEY = 'braudel_active_story';

/**
 * Crée un projet Story par défaut avec une première scène basée sur le cadrage actuel.
 */
export function createDefaultStory(worldName: string, mapState?: any): StoryProject {
  const initialScene: StoryScene = {
    id: 'scene-1',
    title: `Introduction à ${worldName}`,
    body: `Bienvenue dans l'exploration narrative de ${worldName}. Découvrez les événements majeurs et l'évolution des territoires.`,
    mapState: mapState || {
      center: [2, 45],
      zoom: 3,
      timelineYear: 1800,
      visibleLayerIds: []
    },
    layout: 'split',
    transition: {
      profile: 'standard',
      durationMode: 'auto',
      pauseAfterMs: 800,
      reduceMotionPolicy: 'respect'
    }
  };

  return {
    id: `story-${Date.now()}`,
    title: `Récit Cartographique : ${worldName}`,
    description: `Histoire et chronologie de ${worldName}`,
    defaultFps: 30,
    scenes: [initialScene]
  };
}

/**
 * Sauvegarde le projet Story actif dans le LocalStorage.
 */
export function saveStoryToStorage(story: StoryProject): void {
  try {
    localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(story));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la story :', error);
  }
}

/**
 * Charge le projet Story actif depuis le LocalStorage.
 */
export function loadStoryFromStorage(worldName: string): StoryProject {
  try {
    const raw = localStorage.getItem(STORY_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la story :', error);
  }
  return createDefaultStory(worldName);
}

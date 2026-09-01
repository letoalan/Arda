# Documentation — Export Vidéo WebM (`video-export.ts`)

Pour la spécification complète des fonctionnalités, caractéristiques techniques (VP9, 30 FPS, capture de flux WebGL) et comparatifs d'usage avec les formats d'images, se référer au document de référence :

👉 **[Spécification et Fonctionnalités du Format de Sortie Vidéo (`video.md`)](./video.md)**

## Rôle et Responsabilités
`video-export.ts` implémente la fonction **`exportStoryToWebM`** :
- Capture le flux du canvas MapLibre GL en temps réel via `canvas.captureStream(fps)`.
- Enregistre la vidéo au format standard **WebM avec codec VP9** via l'API `MediaRecorder`.
- Pré-stabilise le rendu cartographique via `waitForMapIdle(map, 2000)`.
- Itère sur chaque scène du récit (`story.scenes`), déplace la timeline (`timelineYear`), et joue la transition orchestrée (`playSceneTransition`) avec priorité absolue sur les animations (`essential-for-export`).
- Déclenche le téléchargement automatique du fichier `.webm` résultant.

## Fil d'Ariane
[services/](../services.md) -> [export/](./export.md) -> **video-export.md**

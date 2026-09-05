# Éditeur de Scène de Récit (`StorySceneEditor.tsx`)

## Rôle
`StorySceneEditor.tsx` fournit les contrôles d'édition détaillés d'une scène ou diapositive de récit : titre, narration, partie du plan argumentatif (mode EX), transition de caméra, et bouton de capture du cadrage actif.

## Fonctionnalités Clés
- **Capture du cadrage (`handleCaptureCamera`)** : Capture les métriques de la caméra MapLibre (`center`, `zoom`, `pitch`, `bearing`).
- **Préservation canonique du cap (`getEffectiveStyleBearing`)** : Résout automatiquement l'angle canonique d'après le style de fond actif (`scene.mapState?.basemapStyle || mapService.getCurrentStyleId()`), garantissant 180° (Sud en haut) pour Al-Idrisi sans écrasement involontaire à 0°.
- **Association de Diapositive 16:9 (`onOpenSlideEditor`)** : Ouvre le concepteur visuel de diapositives d'appui PowerPoint-style.
- **Réglages de transition cinématique** : Profil de vol (`standard`, `cinematic`, `dramatic`, `smooth`, `cut`), durée (`auto` ou `fixed`) et délai de stabilisation post-vol (`pauseAfterMs`).

## Fil d'Ariane
[app/](../../app.md) -> [components/](../components.md) -> [story/](./story.md) -> **StorySceneEditor.md**

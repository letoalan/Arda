# Secteur `src/app/components/story/` (Composants de Récit & Scénarisation)

## Rôle
Ce dossier regroupe les composants dédiés à la création, à l'édition et à la restitution des récits géohistoriques et des scènes temporelles.

## Composants Principaux
- [`StorySceneEditor.tsx`](./StorySceneEditor.md) : Édition détaillée des paramètres d'une scène, capture du cadrage caméra avec maintien 180° Al-Idrisi (`getEffectiveStyleBearing`).
- `StorySceneList.tsx` : Liste ordonnée des scènes du récit avec réorganisation haut/bas et sélection interactive.
- `StoryPreview.tsx` : Lecteur cinématique de test de la narration avec transition orchestrée (`playSceneTransition`).
- `StoryPlayer.tsx` : Lecteur plein écran pour les présentations.
- `NarrationPanel.tsx` : Panneau de saisie vocale et textuelle pour la narration.
- `AudioRecorder.tsx` : Enregistreur microphone Web Audio pour l'accompagnement vocal des scènes.

## Fil d'Ariane
[app/](../../app.md) -> [components/](../components.md) -> **story/**

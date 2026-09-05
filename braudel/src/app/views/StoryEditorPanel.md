# Panneau Éditeur de Récit Bento (`StoryEditorPanel.tsx`)

## Rôle
`StoryEditorPanel.tsx` est le composant d'orchestration et de gestion des récits scénarisés (Storytelling Bento) de Braudel. Il permet de structurer un récit en une suite ordonnée de scènes/diapositives cartographiques, d'ajuster leurs paramètres (titre, narration, temps, cadrage, diapositives 16:9 associées), et d'en assurer la prévisualisation et l'exportation.

## Fonctionnalités Clés
- **Ajout de scènes (`handleAddScene`)** : Initialise une nouvelle scène avec le centre, le zoom, l'époque active et capture le cap effectif via `getEffectiveStyleBearing`, en mémorisant `basemapStyle`.
- **Navigation et synchronisation interactive (`handleSelectScene`)** : Au clic sur une scène dans la liste, déplace automatiquement la caméra (`map.flyTo`) avec le cap effectif normalisé (`180°` pour Al-Idrisi) et positionne le curseur temporel.
- **Importation de fichiers ARDA (`handleImportArdaHtml`)** : Restaure les scènes et diapositives d'un document HTML Bento en garantissant la préservation du cap canonique d'orientation (`getEffectiveStyleBearing`).
- **Export HTML Bento (`handleExportStoryHtml`)** : Génère un document autonome interactif (`generateStandaloneHtml`).
- **Édition de Diapositive (`SlideEditorModal`)** : Ouvre le concepteur de diapositives d'appui 16:9 pour la scène sélectionnée.

## Fil d'Ariane
[app/](../app.md) -> [views/](./views.md) -> **StoryEditorPanel.md**

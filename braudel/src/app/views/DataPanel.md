# Documentation — Panneau d'Import / Export (`DataPanel.tsx`)

## Rôle et Responsabilités
`DataPanel.tsx` gère l'importation et l'exportation des données de mondes Braudel, ainsi que le déclenchement des exports multimédias et cartographiques :
- **Export / Import JSON** : Sauvegarde intégrale du monde et restauration depuis fichier.
- **Export Cartographique PDF Normalisé (A4 Paysage)** : Ouverture de `ExportPdfModal` avec choix ergonomique entre :
  - **Période Courante** : Capture unique de la date active (`currentTime`).
  - **Atlas Multi-Époques** : Capture automatisée et compilation de toutes les dates contenant des apports (Géopolitica, entités et flux spatio-temporels).
- **Export JPEG HD** : Capture instantanée de la vue cartographique active.
- **Export HTML Autonome** : Compilation d'une page web autonome avec MapLibre embarqué.
- **Export Storyboard ZIP & Vidéo WebM** : Exportations narratives et animées avec barre de progression.
- **Mode Studio (CapCut-like)** : Montage multi-pistes, durées personnalisées, pistes audio et prévisualisation live (`StudioTimeline`).
- **Normalisation des Cadrages Caméra (`prepareStoryForExport`)** : Harmonise systématiquement l'orientation canonique des scènes et clips selon le style de fond (`getEffectiveStyleBearing`), garantissant le maintien de l'orientation Sud à 180° pour le fond médiéval islamique Al-Idrisi sur toutes les diapositives.
- **Redimensionnement Asynchrone de la Carte (`handleExportFromStudio`)** : Lors du lancement de l'export depuis le mode Studio, applique une temporisation (120ms) et force `map.resize()` pour restaurer les dimensions 16:9 plein écran avant la première capture, éliminant tout risque d'anamorphose liée à l'ancien affichage 50% split-screen.

## Dépendances Composants
- `ExportPdfModal.tsx` (../components/data/ExportPdfModal.md)
- `ExportZipModal.tsx` (../components/data/ExportZipModal.md)
- `ExportVideoModal.tsx` (../components/data/ExportVideoModal.md)
- `StudioTimeline.tsx` (../components/studio/StudioTimeline.md)
- `ExportMultimediaSection.tsx` (../components/data/ExportMultimediaSection.md)

## Fil d'Ariane
[app/](../app.md) -> [views/](./views.md) -> **DataPanel.md**


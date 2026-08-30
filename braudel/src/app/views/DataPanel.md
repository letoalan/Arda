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

## Dépendances Composants
- `ExportPdfModal.tsx` (../components/data/ExportPdfModal.md)
- `ExportMultimediaSection.tsx` (../components/data/ExportMultimediaSection.md)

## Fil d'Ariane
[app/](../app.md) -> [views/](./views.md) -> **DataPanel.md**


# Documentation — Utilitaires d'Export Image HD & Timelapse (`media-export-utils.ts`)

## Rôle et Responsabilités
`media-export-utils.ts` fournit les fonctions d'exportation de médias bitmap et animés :
- **`exportToJPEG`** : Capture haute définition de la carte active et téléchargement immédiat au format PNG/JPEG.
- **`exportTimeLapseZIP`** : Parcours chronologique avec pas temporel régulier (`stepYears`), capture d'instantanés et compression dans une archive ZIP téléchargeable.
- **`exportMultiEpochZIP`** : Export par lot d'une suite d'images haute résolution pour l'ensemble des époques actives sélectionnées (Atlas d'images ZIP) :
  - Respecte rigoureusement l'orientation active de la carte (notamment le `bearing: 180` du style islamique médiéval Al-Idrisi Sud en haut, ou toute rotation manuelle).
  - Préserve le cadrage (centre, zoom, pitch).
  - Applique le filtrage temporel strict point-in-time (`isEntityVisibleAt`) sans contamination entre époques.
  - Génère un fichier `manifest.json` et télécharge l'archive `atlas_images_[monde]_[N]_epoques.zip`.

## Dépendances
- `jszip`
- `pdf-types.ts` (`EpochExportTarget`, `isEntityVisibleAt`)
- `pdf-map-capture.ts` (`captureMapCanvas`, `updateEntitiesAndWaitForRender`, `waitForBackgroundTilesReady`)
- `../../cartography/mapGeojsonRenderer` (`buildEntitiesGeoJSON`)
- `../../import/geopoliticaRegistry` (`GEOPOLITICA_SOURCES`)

## Fil d'Ariane
[services/](../../services.md) -> [export/](../export.md) -> [modules/](./modules.md) -> **media-export-utils.md**

# Documentation — Utilitaires d'Export Image HD & Timelapse (`media-export-utils.ts`)

## Rôle et Responsabilités
`media-export-utils.ts` fournit les fonctions d'exportation de médias bitmap et animés :
- **`exportToJPEG`** : Capture haute définition de la carte active et téléchargement immédiat au format PNG/JPEG.
- **`exportTimeLapseZIP`** : Parcours chronologique avec pas temporel régulier (`stepYears`), capture d'instantanés et compression dans une archive ZIP téléchargeable.

## Dépendances
- `jszip`
- `pdf-map-capture.ts`

## Fil d'Ariane
[services/](../../services.md) -> [export/](../export.md) -> [modules/](./modules.md) -> **media-export-utils.md**

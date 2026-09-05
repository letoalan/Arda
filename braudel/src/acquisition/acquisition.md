# Secteur `acquisition`

Ce répertoire regroupe les algorithmes et services d'ingestion d'images, de géoréférencement, de reconnaissance de projections et de vectorisation pour Arda.

## Fichiers & Modules

- [`projection.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/acquisition/projection.ts) ([`.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/acquisition/projection.md)) : Transformations géométriques et détections heuristiques de projections (`web-mercator`, `equirectangular`, `orthographic`, `eckert4`).
- [`imageAcquisition.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/acquisition/imageAcquisition.ts) : Pipeline de chargement, d'analyse dimensionnelle et de recalibrage géospatial d'images historiques ou satellitaires.
- [`types.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/acquisition/types.ts) : Types et interfaces d'acquisition de données.
- **`auto-vectorize/`** : Vectorisation automatique de traits de côte et de polygones.
- **`freehand/`** : Outils de tracé à main levée et d'annotation.

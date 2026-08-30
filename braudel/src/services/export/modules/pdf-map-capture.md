# Documentation — Capture WebGL & Synchronisation GPU (`pdf-map-capture.ts`)

## Rôle et Responsabilités
`pdf-map-capture.ts` centralise les opérations bas niveau de capture et de synchronisation des états de la carte MapLibre GL :
- **`updateEntitiesAndWaitForRender`** : Met à jour la source GeoJSON et attend l'événement `sourcedata` (filtré sur `isSourceLoaded === true` pour CE `setData` précis) suivi du cycle `render` et d'un double `requestAnimationFrame`.
- **`waitForBackgroundTilesReady`** : Surveille l'état de chargement des tuiles de fond (hors `braudel-entities`) et la stabilisation de la caméra (`!isMoving()`, `!isZooming()`, `!isRotating()`).
- **`ensureEpochEntitiesLoaded`** : Pré-chargement des entités historiques depuis le catalogue `GEOPOLITICA_SOURCES` si non présentes en mémoire.
- **`captureMapCanvas`** : Capture sécurisée du canvas WebGL avec composition 2D sur fond opaque et compression JPEG 90% réduisant drastiquement le poids du document.
- **`captureSnapshotAt`** : Pipeline complet de capture unitaire synchronisée à une date $T$.

## Dépendances
- `pdf-types.ts`
- `../../import/geopoliticaRegistry.ts`
- `../../cartography/mapGeojsonRenderer.ts`

## Fil d'Ariane
[services/](../../services.md) -> [export/](../export.md) -> [modules/](./modules.md) -> **pdf-map-capture.md**

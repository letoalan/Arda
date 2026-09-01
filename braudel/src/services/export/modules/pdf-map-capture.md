# Documentation — Capture Cartographique PDF (`pdf-map-capture.ts`)

## Rôle et Responsabilités
`pdf-map-capture.ts` orchestre la capture du canvas WebGL MapLibre pour l'export PDF :
- **Synchronisation `idle`** (`updateEntitiesAndWaitForRender`) : injecte un GeoJSON dans la source, puis attend l'événement `idle` de MapLibre qui garantit que TOUTES les sources sont chargées, TOUTES les tuiles rendues, et la caméra stabilisée. C'est le seul signal fiable que le framebuffer WebGL a été mis à jour avec les nouvelles données.
- **`waitForMapIdle`** : helper réutilisable qui attend `map.on('idle')` avec un timeout de sécurité configurable (défaut 5s).
- **Attente du fond de carte** (`waitForBackgroundTilesReady`) : polling des sources raster/vectorielles de fond avec détection et récupération du contexte WebGL perdu (`detectAndRecoverWebGLContext`), et dégradation gracieuse si irrécupérable.
- **Pré-chargement catalogue** (`ensureEpochEntitiesLoaded`) : récupère les données GeoJSON du registre Geopolitica si aucune entité n'est visible pour l'époque cible.
- **Capture composite** (`captureMapCanvas`) : composition canvas 2D avec fond plein anti-artefacts noirs, compression JPEG 90%.
- **Snapshot daté** (`captureSnapshotAt`) : pipeline complet pour une année donnée.

## Stratégie de synchronisation : pourquoi `idle` ?
Les approches précédentes (`sourcedata` + `render` + double `requestAnimationFrame`) souffraient de race conditions :
- `sourcedata` confirme que le worker a traité le `setData`, mais le framebuffer GPU peut encore contenir les anciennes features.
- `render` se déclenche à chaque cycle de peinture, pas nécessairement après le swap complet des données.
- L'événement `idle` est émis uniquement quand le pipeline complet (données → worker → GPU → framebuffer) est terminé.

## Résilience WebGL
Le module détecte la perte de contexte WebGL (`isWebGLContextLost`) à deux niveaux :
1. **Pré-polling** : avant de commencer le polling des tuiles, tente `restoreContext()` et attend jusqu'à 3s.
2. **Intra-polling** : si le contexte est perdu pendant le polling, retourne immédiatement.
3. **Timeout** : dégradation gracieuse (warn) au lieu de throw.

## Dépendances
- `pdf-types.ts` (prédicat `isEntityVisibleAt`)
- `../../import/geopoliticaRegistry` (catalogue des sources)
- `../../cartography/mapGeojsonRenderer` (construction du GeoJSON)

## Fil d'Ariane
[services/](../../services.md) -> [export/](../export.md) -> [modules/](./modules.md) -> **pdf-map-capture.md**

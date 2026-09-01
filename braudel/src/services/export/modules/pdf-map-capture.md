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

## Résilience WebGL & Réseau
Le module gère la stabilité de l'export à plusieurs niveaux :
1. **Perte de contexte WebGL** (`isWebGLContextLost`) :
   - Détection pré-polling et tentative de restauration via `WEBGL_lose_context` (jusqu'à 3s).
   - Détection intra-polling : capture de l'état disponible sans interrompre le document.
2. **Tolérance réseau tuiles de fond (`waitForBackgroundTilesReady`)** :
   - Polling étendu à 50 tentatives (2.5s) pour permettre aux tuiles distantes ou lourdes (ex: Al-Idrisi) de charger.
   - **Dégradation gracieuse** : si la caméra est stabilisée mais que des tuiles de fond tardent ou ont échoué sur le réseau externe, capture de l'état présent au lieu de lever une exception fatale `PdfExportError`.
   - Rejet strict `PdfExportError` réservé uniquement aux mouvements caméra non stabilisés (`!cameraSettled`).

## Dépendances
- `pdf-types.ts` (prédicat `isEntityVisibleAt`)
- `../../import/geopoliticaRegistry` (catalogue des sources)
- `../../cartography/mapGeojsonRenderer` (construction du GeoJSON)

## Fil d'Ariane
[services/](../../services.md) -> [export/](../export.md) -> [modules/](./modules.md) -> **pdf-map-capture.md**

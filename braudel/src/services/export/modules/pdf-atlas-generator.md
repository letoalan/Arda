# Documentation — Générateur d'Atlas PDF (`pdf-atlas-generator.ts`)

## Rôle et Responsabilités
`pdf-atlas-generator.ts` orchestre la génération de documents PDF cartographiques :
- **`exportToPDF`** : Export de page unique pour une année donnée.
- **`exportTimelineDrivenPDF`** : Atlas multi-pages piloté par les points de rupture temporels (changepoints).
- **`exportMultiEpochPDF`** : Livret PDF pour une liste d'époques explicitement sélectionnées, avec chargement à la volée depuis le registre Geopolitica si aucune entité projet ne correspond.

## Isolation Inter-Époques — Filtrage Point-in-Time
Chaque itération de boucle d'export applique un **filtrage point-in-time strict** :
1. **Carte (GeoJSON MapLibre)** : `buildEntitiesGeoJSON(entities, relations, snapshotYear, 'all', [])` — sans `epochRange`. Seules les entités dont `validFrom <= snapshotYear <= validTo` sont incluses dans le GeoJSON injecté dans la carte.
2. **Légende PDF** : `isEntityVisibleAt(e, snapshotYear)` et `isRelationVisibleAt(r, snapshotYear)` — sans `epochRange`. Élimine les entités des époques adjacentes qui chevauchaient via le test d'intersection de plages.
3. **Synchronisation `idle`** : `updateEntitiesAndWaitForRender` attend `map.on('idle')` après `setData`, garantissant que le framebuffer WebGL a été mis à jour avec les nouvelles données AVANT la capture.

Le paramètre `epochRange` est conservé uniquement pour :
- Déterminer si un fallback vers le catalogue Geopolitica est nécessaire (`matchingEntities.length === 0`)
- Trouver la source catalogue correspondante (`GEOPOLITICA_SOURCES.find(...)`)

## Callback `updateMapEntities`
Le callback `_updateMapEntities` (préfixé `_` car non appelé) est conservé dans la signature pour la compatibilité API avec les appelants (`DataPanel.tsx`), mais n'est plus invoqué pendant l'export. Son ancien appel créait un double `setData` non filtré (race condition). Le `finally` dans `DataPanel.tsx` restaure l'état interactif après l'export.

## Dépendances
- `jspdf`
- `pdf-types.ts` (`PDFExportOptions`, `EpochExportTarget`, `isEntityVisibleAt`, `isRelationVisibleAt`)
- `pdf-map-capture.ts` (`updateEntitiesAndWaitForRender`, `waitForBackgroundTilesReady`)
- `pdf-page-renderer.ts` (`renderMapPDFPage`)
- `../../timeline/changepoints`
- `../../import/geopoliticaRegistry`
- `../../cartography/mapGeojsonRenderer`
- `../pdf-timeline-utils`

## Fil d'Ariane
[services/](../../services.md) -> [export/](../export.md) -> [modules/](./modules.md) -> **pdf-atlas-generator.md**

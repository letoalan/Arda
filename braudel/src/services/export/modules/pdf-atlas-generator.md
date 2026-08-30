# Documentation — Générateur d'Atlas & Livrets PDF (`pdf-atlas-generator.ts`)

## Rôle et Responsabilités
`pdf-atlas-generator.ts` orchestre la génération et le téléchargement des documents cartographiques PDF complets :
- **`exportToPDF`** : Génération d'une carte PDF unitaire à la date courante.
- **`exportTimelineDrivenPDF`** : Génération séquentielle automatisée sur les points de rupture chronologiques de la timeline.
- **`exportMultiEpochPDF`** : Génération de l'Atlas PDF multi-époques respectant la règle 1 époque = 1 page au point médian ($T_{\text{snapshot}}$), avec synchronisation d'injection GeoJSON catalogue `updateEntitiesAndWaitForRender` et stabilisation du fond `waitForBackgroundTilesReady`.

## Dépendances
- `jspdf`
- `pdf-types.ts`
- `pdf-map-capture.ts`
- `pdf-page-renderer.ts`
- `../../timeline/changepoints.ts`
- `../../import/geopoliticaRegistry.ts`
- `../../cartography/mapGeojsonRenderer.ts`

## Fil d'Ariane
[services/](../../services.md) -> [export/](../export.md) -> [modules/](./modules.md) -> **pdf-atlas-generator.md**

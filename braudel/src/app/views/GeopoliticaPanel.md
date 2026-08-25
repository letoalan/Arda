# GeopoliticaPanel.tsx

## Rôle
Panneau latéral dédié au catalogue des fonds GeoJSON et à la procédure d'importation de couches géopolitiques (Geopolitica & fonds additionnels).

## Emplacement
`src/app/views/GeopoliticaPanel.tsx`

## Dépendances Entrantes
- `App.tsx` (../App.md)

## Dépendances Sortantes
- `candidateIndexer.ts` (../../services/import/candidateIndexer.md) : Extraction des candidats GeoJSON
- `geopoliticaImporter.ts` (../../services/import/geopoliticaImporter.md) : Normalisation et création d'entités
- `ImportPreviewModal.tsx` (../components/geojson/ImportPreviewModal.md) : Modal de sélection interactive des entités
- `store.ts` (../state/store.md)

## Fonctionnalités Clés
- Parcours des catalogues par thèmes (Historique, Administratif, Maritime).
- Prévisualisation filtrée et paramétrage du calque de destination.
- Importation ciblée par lots (`importBatchId`) avec traçabilité et annulation possible.

## Secteur Parent
[views/](./views.md) -> [app/](../app.md) -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)

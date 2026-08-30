# GeopoliticaPanel.tsx

## Rôle
Panneau latéral dédié au catalogue unifié des fonds GeoJSON (49 époques Géopolitica, subdivisions administratives et fonds maritimes) et à la procédure d'importation interactive.

## Emplacement
`src/app/views/GeopoliticaPanel.tsx`

## Dépendances Entrantes
- `App.tsx` (../App.md)

## Dépendances Sortantes
- `candidateIndexer.ts` (../../services/import/candidateIndexer.md) : Extraction des candidats GeoJSON
- `geopoliticaImporter.ts` (../../services/import/geopoliticaImporter.md) : Normalisation et création d'entités
- `CatalogSection.tsx` (../components/geojson/CatalogSection.md) : Section unifiée du catalogue GeoJSON avec filtres et saut temporel
- `ImportPreviewModal.tsx` (../components/geojson/ImportPreviewModal.md) : Modal de sélection interactive des entités
- `store.ts` (../state/store.md)

## Fonctionnalités Clés
- **Catalogue GeoJSON Unifié & Recherche Intelligente** : Recherche instantanée dans les 49 périodes historiques mondiales, les subdivisions territoriales et les espaces maritimes.
- **Synchronisation Temporelle Automatique** :
  - Détection automatique du fond cartographique correspondant à la position active de la réglette temporelle (`currentTime`).
  - Filtre rapide par portée de projet (fonds compris dans la fenêtre temporelle du monde) ou catalogue complet.
  - Boutons de saut direct sur la timeline (`An X`) pour caler le temps du projet sur l'époque sélectionnée.
- **Prévisualisation interactive & Importation ciblée** : Choix précis des polygones/entités et assignation à un calque cible avec `importBatchId`.

## Secteur Parent
[views/](./views.md) -> [app/](../app.md) -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)


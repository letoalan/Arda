# CatalogSection.tsx

## Rôle
Composant de gestion du catalogue unifié GeoJSON. Il intègre le bandeau de détection temporelle de la timeline active, les filtres par famille et par portée temporelle du projet, la recherche textuelle instantanée et la liste scrollable des fonds cartographiques disponibles.

## Emplacement
`src/app/components/geojson/CatalogSection.tsx`

## Dépendances Entrantes
- `GeopoliticaPanel.tsx` (../../views/GeopoliticaPanel.md)

## Dépendances Sortantes
- `CatalogFilters.tsx` (./CatalogFilters.md)
- `CatalogEntryCard.tsx` (./CatalogEntryCard.md)
- `geojson-catalog-service.ts` (../../../services/import/geojson-catalog-service.md)

## Fonctionnalités
- Détection et mise en avant de la période active sur la réglette temporelle (`currentTime`).
- Filtrage bi-mode : "Tous les fonds" vs "Projet" (borné par `startYear` et `endYear`).
- Rendu des cartes de catalogue avec support d'ajustement temporel, prévisualisation/importation et saut de timeline.

## Secteur Parent
[components/](../components.md) -> [app/](../../app.md) -> [ARCHITECTURE.md](../../../../docs/ARCHITECTURE.md)

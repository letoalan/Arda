# mapLayersManager.ts

## Rôle
Gestionnaire d'initialisation des calques vectoriels MapLibre (`braudel-entities` pour polygones, lignes et points) et des calques de repères spatiaux (Équateur, Tropiques, Cercles polaires, Méridiens et Graticules).

## Emplacement
`src/services/cartography/mapLayersManager.ts`

## Fonctions Déclarées
- `setupVectorLayers(map)` : Instancie les sources et calques pour :
  - Les repères géographiques globaux (`geo-reference-lines`, `geo-reference-labels` : Équateur, Tropique Nord/Sud, Cercles Polaires Arctique/Antarctique).
  - Les grilles et graticules (`grid-layer`, `colonial-graticule-lines`).
  - Les entités vectorielles Braudel (`braudel-polygons`, `braudel-polygons-outline`, `braudel-lines`, `braudel-points`) avec liaisons de styles dynamiques (`fill-color`, `stroke-color`, `line-color`, `circle-color`).

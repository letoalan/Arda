# mapLayersManager.ts

## Rôle
Gestionnaire d'initialisation des calques vectoriels MapLibre (`braudel-entities` pour polygones, lignes et points) et des calques de repères spatiaux (Équateur, Tropiques, Cercles polaires, Méridiens et Graticules).

## Emplacement
`src/services/cartography/mapLayersManager.ts`

## Fonctions Déclarées
- `setupVectorLayers(map, portulanRhumbVisible, graticuleVisible, styleId)` : Instancie les sources et calques pour :
  - Les lignes de rhumb et centres nodaux (`initRhumbNetworkLayer`).
  - Les repères géographiques globaux (`geo-reference-lines`, `geo-reference-labels` : Équateur, Tropique Nord/Sud, Cercles Polaires Arctique/Antarctique).
  - Le graticule vectoriel 10° (`colonial-graticule-lines`, `colonial-graticule-labels`).
  - Les entités vectorielles Braudel (`braudel-polygons`, `braudel-polygons-outline`, `braudel-lines`, `braudel-points`) avec liaisons de styles dynamiques (`fill-color`, `stroke-color`, `line-color`, `circle-color`).
  - Ordre d'empilement : les repères sont insérés avec `beforeId: 'braudel-polygons'` pour ne jamais recouvrir les entités historiques.
  - Émission de logs structurés via `logCarto('SETUP_VECTOR_LAYERS_START', ...)`.

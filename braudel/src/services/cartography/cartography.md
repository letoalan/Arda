# Secteur `src/services/cartography/`

## Rôle
Gestion de la cartographie interactive vectorielle, des styles MapLibre, du mode dessin et du rendu GeoJSON d'entités temporelles.

## Fichiers du Secteur

| Fichier | Rôle Résumé | Doc |
|---|---|---|
| **`map-service.ts`** | Façade globale singleton `MapService` d'accès à la carte | [map-service.md](./map-service.md) |
| **`mapGeojsonRenderer.ts`** | Construction du GeoJSON des entités et mise à jour de la source | [mapGeojsonRenderer.md](./mapGeojsonRenderer.md) |
| **`mapStylesManager.ts`** | Application des styles de fond de carte, visibilité des étiquettes et frontières | [mapStylesManager.md](./mapStylesManager.md) |
| **`mapDrawingService.ts`** | Configuration et contrôle de l'instance MapboxDraw | [mapDrawingService.md](./mapDrawingService.md) |
| **`mapLayersManager.ts`** | Initialisation des calques vectoriels MapLibre (`braudel-polygons`, `braudel-lines`, etc.) | [mapLayersManager.md](./mapLayersManager.md) |
| **`camera-orchestrator.ts`** | Orchestration cinématique de la caméra (flyTo, pan, static, bearing/pitch) | [camera-orchestrator.md](./camera-orchestrator.md) |
| **`eckertProjService.ts`** | Service de reprojection Eckert IV (ESRI:54012) via backproj / maplibre-proj | [eckertProjService.md](./eckertProjService.md) |
| **`reprojectStyleEckert.ts`** | Transformation de style MapLibre vers Eckert IV et benchmarking | [reprojectStyleEckert.md](./reprojectStyleEckert.md) |
| **`preprojectEckert.ts`** | Pré-déformation statique et tuilage vectoriel geojson-vt pour Eckert IV | [preprojectEckert.md](./preprojectEckert.md) |
| **`eckertGeoUtils.ts`** | Fonctions géographiques custom (coordonnées, distances, marqueurs, dé-projection) | [eckertGeoUtils.md](./eckertGeoUtils.md) |
| **`maplibre-shim.ts`** | Pont de compatibilité ESM MapLibre pour Node.js et bundlers | [maplibre-shim.md](./maplibre-shim.md) |

## Fil d'Ariane
[services/](../services.md) -> **cartography/** -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)

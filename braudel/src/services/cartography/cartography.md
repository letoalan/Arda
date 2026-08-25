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

## Fil d'Ariane
[services/](../services.md) -> **cartography/** -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)

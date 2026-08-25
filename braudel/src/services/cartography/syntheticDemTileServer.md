# Documentation — Serveur de Tuiles DEM Synthétique (`syntheticDemTileServer.ts`)

## Rôle
Génère un serveur de tuiles DEM (Digital Elevation Model) in-browser pour les mondes fictifs, permettant un rendu de relief 3D hillshade naturel sans calque de dessin résiduel.

## Correction de l'Alignement Web Mercator
- **Désextrusion Mercator $\leftrightarrow$ Géographique** :
  - Les tuiles raster demandées par MapLibre sont en coordonnées Web Mercator normalisées $(worldX, worldY) \in [0, 1]^2$.
  - La conversion $worldY \to \text{Latitude}$ utilise la formule trigonométrique inverse : $\text{latRad} = 2 \cdot \arctan(\exp(\pi \cdot (1 - 2 \cdot worldY))) - \frac{\pi}{2}$.
  - Cette latitude est ensuite directement alignée sur la grille DEM 2:1 (`DEM_HEIGHT = 512`, `DEM_WIDTH = 1024`), supprimant le décalage/étirement vertical entre le tracé GeoJSON et les tuiles de relief.

## Intégration Visuelle
- Le relief 3D est projeté directement sur le fond de carte avec une opacité fine (`fill-opacity: 0.15`), éliminant l'aplat vert rigide pour laisser apparaître la continuité du relief texturé et naturel.

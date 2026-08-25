# Documentation — Conversion Brouillons → GeoJSON (`draftToGeoJSON.ts`)

## Rôle
Convertit les tracés du `ContinentBuilderView` (pixels canvas) en `FeatureCollection` GeoJSON (coordonnées lon/lat) pour injection dans MapLibre.

## Inférence Automatique du Type de Géométrie
Lorsque `geometryKind` n'est pas explicitement défini (cas des tracés manuels), la fonction `inferGeometryKind` détermine le type à partir du `featureType` terrain :

| `featureType` | Géométrie GeoJSON | Calque de rendu |
|---|---|---|
| `continent` | `Polygon` | `braudel-continents-fill` (sable parcheminé) |
| `hills` | `Polygon` | `braudel-continents-fill` (vert colline) |
| `valley` | `Polygon` | `braudel-continents-fill` (vert vallée) |
| `mountain` | `LineString` | `braudel-continents-lines` (brun épais 4px) |
| `ridge` | `LineString` | `braudel-continents-lines` (brun crête 3px) |
| `rift` | `LineString` | `braudel-continents-lines` (rouge tectonique) |
| `trench` | `LineString` | `braudel-continents-lines` (bleu fosse) |
| `peak` | `Point` (centroïde) | `braudel-continents-points` + étiquette |

## Projection Canvas → Coordonnées
- `lon = (x / canvasWidth) × 360 − 180`
- `lat = 90 − (y / canvasHeight) × 180`, clampé à `[-85, 85]`

# Secteur `src/utils/` (Utilitaires & Algorithmes Géographiques)

## Rôle du Secteur
Le secteur `utils/` regroupe l'ensemble des modules mathématiques, géométriques et algorithmiques de traitement géospatial.

## Fichiers Principaux

| Fichier | Rôle Résumé | Doc |
|---|---|---|
| **`generateSyntheticDEM.ts`** | Générateur procédural de relief synthétique (Raycasting, Bruit Simplex fractal, érosion) | [generateSyntheticDEM.md](./generateSyntheticDEM.md) |
| **`generateDEMTiles.ts`** | Encodage de grille d'élévation en tuiles raster Terrain-RGB / Terrarium pour MapLibre | [generateDEMTiles.md](./generateDEMTiles.md) |
| **`encodeTerrainRGB.ts`** | Conversions mathématiques altitude (mètres) <-> canaux de couleurs R,G,B | [encodeTerrainRGB.md](./encodeTerrainRGB.md) |
| **`demColors.ts`** | Palettes hypsométriques et ombrage du relief selon l'altitude | [demColors.md](./demColors.md) |
| **`draftToGeoJSON.ts`** | Conversion des tracés canvas (`TerrainFeatureDraft`) en GeoJSON | [draftToGeoJSON.md](./draftToGeoJSON.md) |
| **`geometry.ts`** | Calcul de centroïdes, surfaces, distances géodésiques | [geometry.md](./geometry.md) |

## Fil d'Ariane
[src/](../src.md) -> **utils/** -> [ARCHITECTURE.md](../../docs/ARCHITECTURE.md)

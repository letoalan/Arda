# Module de Reprojection de Style — `reprojectStyleEckert.ts`

Ce module orchestre la reprojection complète d'un style cartographique MapLibre GL JS vers **Eckert IV (`ESRI:54012`)** et effectue le diagnostic télémétrique des calques et des sources.

---

## 1. Fonctionnement & Pipeline

La fonction `reprojectStyleToEckertIV` :
1. Analyse les sources du style source (`geojson`, `vector`, `raster`, `raster-dem`).
2. Identifie les sources vectorielles candidates à la reprojection.
3. Applique `maplibre-proj` en injectant le transformateur Wasm compilé d'[`eckertProjService`](./eckertProjService.md).
4. Mesure le temps d'exécution (`reprojectDurationMs`).
5. Renvoie le style transformé (`result.style`), les bornes géodésiques d'affichage (`result.bounds`) et la structure de diagnostic `benchmark`.

---

## 2. Comportement Vis-à-vis du Relief (Analyse Phase 1)

Conformément au constat de départ de [`eckert.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/eckert.md) :
- Les couches vectorielles (`geojson` comme les polygones continentaux et `vector` MVT) sont reprojetées avec succès en coordonnées déformées.
- Les couches de type `raster-dem` (calques `hillshade` MapLibre de Terrarium ou DEM synthétique) conservent leur grille de pixels d'origine et sont classées dans `skippedSources`.
- Cette mesure fournit la base empirique pour l'arbitrage du passage à la Phase 2 ou l'association avec des lignes de crêtes/courbes de niveau vectorielles (`d3-contour`).

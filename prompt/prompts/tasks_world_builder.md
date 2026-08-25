# Tâches — World Builder
*Suivi de l'implémentation du Continent Builder*

- `[ ]` tâches non complétées
- `[/]` tâches en cours
- `[x]` tâches terminées

---

## Lot 0 : Cadrage et squelette ✅
- `[x]` Analyse de l'existant.
- `[x]` Planification des flux.

## Lot 1 : Dessin libre ✅
- `[x]` Interface de dessin de continents avec `<canvas>`.
- `[x]` Gestion des clics et double-clics pour fermer les polygones.
- `[x]` Représentation des brouillons (ContinentDraft).

## Lot 2 : Conversion dessin → GeoJSON ✅
- `[x]` Fonction `draftsToGeoJSON` (conversion pixels vers lat/lon).
- `[x]` Intégration dans `ContinentBuilderView`.
- `[x]` Affichage direct de test via `DebugMapView` (MapLibre).

## Lot 3 : Génération de tuiles vectorielles (MVT) ✅
- `[x]` Installer `geojson-vt` et `vt-pbf`.
- `[x]` Créer `generateMVT.ts` pour découper le GeoJSON.
- `[x]` Gérer le stockage/accès des tuiles en mémoire ou Custom Source MapLibre.

## Lot 4 : Intégration complète & relief (optionnel) ✅
- `[x]` Créer un style `fictional-world-style.json` (ou l'intégrer dans le `map-service`).
- `[x]` Afficher les tuiles MVT sur la carte principale avec le bon style.
- `[x]` (Optionnel) Générer un raster-dem pour du relief 3D (Non priorisé pour le moment).

## Lot 5 : DEM synthétique & Relief
- `[x]` Lot 5.0 : Génération du bruit et de grille d'altitude.
- `[x]` Lot 5.1 : Encodage en Terrain-RGB et tuilage raster.
- `[x]` Lot 5.2 : Intégration dans le style MapLibre.
- `[x]` Lot 5.3 : Labels de continents.
- `[x]` Lot 5.4 : Contrôle utilisateur et régénération.


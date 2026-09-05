# Tests Unitaires de Reprojection Eckert IV — `eckert-proj.test.ts`

Ce fichier teste le service [`eckertProjService.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/cartography/eckertProjService.ts), [`preprojectEckert.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/cartography/preprojectEckert.ts), [`eckertGeoUtils.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/cartography/eckertGeoUtils.ts) et l'intégration MapLibre dans [`map-service.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/cartography/map-service.ts) pour la projection pseudocylindrique équivalente **Eckert IV (`ESRI:54012`)**.

---

## 1. Périmètre des Tests (20 tests validés)

1. **Constante CRS** : Vérification de la déclaration officielle `ESRI:54012`.
2. **Initialisation Wasm & Compilation** : Instanciation du module Wasm PROJ 9 et création du transformateur.
3. **Point Pivot (0, 0)** : Vérification que l'intersection Greenwich / Équateur est invariante $(0, 0) \leftrightarrow (0, 0)$.
4. **Aller-retour (Roundtrip)** : Exactitude de la conversion directe $WGS84 \to \text{fake Mercator}$ et inverse $\text{fake Mercator} \to WGS84$ sur 5 métropoles mondiales réparties sur les 4 hémisphères (précision $< 10^{-4}$ degré).
5. **Comportement aux Pôles** : Absence de singularité, de NaN ou de débordement aux latitudes extrêmes ($\pm 85^\circ$).
6. **Reprojection GeoJSON** : Transformation récursive de `FeatureCollection` contenant des points et des polygones.
7. **Transformation par lot** : Vérification du pipeline vectoriel de coordonnées.
8. **Reprojection de Style MapLibre** : Configuration `projection: { type: 'mercator' }` et calcul des bornes `bounds` pour `map.fitBounds()`.
9. **Télémétrie & Relief** : Classification des sources vectorielles et isolation des sources `raster-dem`.
10. **Débit Wasm** : Validation de la cadence de traitement (> 50 000 sommets/s sur polygones complexes).
11. **Comptage de Sommets** : Rigueur du calcul récursif de sommets par type de géométrie.
12. **Pyramide de Tuiles `geojson-vt`** : Découpage vectoriel multi-échelles d'un jeu pré-déformé sous Eckert IV.
13. **Cache Mémoire LRU** : Préservation des références et élimination des recalculs redondants.
14. **Distance Géodésique Orthodromique** : Précision du calcul de distance réelle indépendamment des anamorphoses cartographiques.
15. **Placement de Marqueurs MapLibre** : Adaptation de la position d'ancrage en coordonnées fake Mercator selon le mode actif.
16. **Dé-projection d'Entités Cliquées** : Restitution des coordonnées géographiques réelles WGS84 d'une entité sélectionnée (`queryRenderedFeatures`).
17. **Gestion de Projection dans `mapService`** : Validation des bascules entre `'mercator'`, `'globe'` et `'eckert4'`, et conformité de `isEckertIV()`.
18. **Aller-retour Utilitaires Géographiques** : Précision géométrique de `geoToEckertMapCoord` et `eckertMapCoordToGeo`.
19. **Dé-projection Multitypes** : Support des géométries `LineString` et `MultiPolygon` par `unprojectRenderedFeatureCoordinates`.
20. **Validation du Fichier Statique Pré-projeté** : Intégrité structurelle des GeoJSON générés par le script de build `preproject:eckert`.

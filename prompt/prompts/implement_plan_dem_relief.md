# Plan d'implémentation - Lot 5 : DEM synthétique & Relief (Braudel World Builder)

## Contexte & objectif

Le World Builder de Braudel permet déjà de dessiner des continents fictifs et de les afficher sous forme de polygones vectoriels plats (vert uni) dans MapLibre. L'objectif de ce Lot 5 est d'obtenir un rendu visuel comparable à une carte du monde réel en hillshade/relief grisé (type carte topographique classique), avec :
- un relief simulé (montagnes, vallées) sur chaque continent fictif,
- un ombrage (hillshade) donnant un effet de volume,
- une palette de couleurs par altitude (color-relief),
- des contours nets par-dessus,
- des labels de noms de continents.

Ce lot correspond à la tâche optionnelle du Lot 4 initial ("Générer un raster-dem pour du relief 3D"), désormais priorisée.

## Périmètre de la tâche

Tu interviens sur :
- Les continents déjà stockés en GeoJSON dans le Store (Zustand / IndexedDB), issus du Lot 2.
- Le service de tuilage MVT existant (Lot 3, `generateMVT.ts`) et le protocole custom MapLibre (`mvt-memory-continents-X://`).
- Le style et le rendu MapLibre (`map-service.ts` / style JSON), actuellement en polygone plat vert.

Tu ne dois pas casser :
- Le flux existant de dessin (ContinentBuilderView) ni la conversion draftsToGeoJSON.
- Le protocole custom déjà en place pour les tuiles vectorielles MVT.

## Contraintes & conventions

- Architecture local-first : pas de serveur externe, tout le calcul du DEM se fait côté client (JS/TS), en mémoire ou IndexedDB.
- Réutiliser le pattern déjà validé du protocole MapLibre custom (comme pour les tuiles MVT), mais pour un flux raster cette fois.
- Code TypeScript, modules courts et testables indépendamment.
- Résultat attendu : rendu proche de l'image de référence (relief en niveaux de gris, ombrage réaliste, frontières nettes, labels).

## Plan par lots

### Lot 5.0 - Génération du bruit et de la grille d'altitude

Objectif : produire une grille d'altitude synthétique cohérente avec les polygones de continents dessinés.

1. Créer `src/utils/generateSyntheticDEM.ts` avec :
   - Une fonction principale :
     ```ts
     export function generateSyntheticDEM(
       geojson: GeoJSON.FeatureCollection<GeoJSON.Polygon>,
       width: number,
       height: number
     ): Float32Array; // grille d'altitude, taille width*height
     ```
   - Algorithme :
     - Pour chaque pixel (x, y) de la grille, convertir en lon/lat (même projection que draftsToGeoJSON, inversée).
     - Tester l'appartenance du point à un polygone continent (point-in-polygon, ex. via `@turf/boolean-point-in-polygon` ou `point-in-polygon`).
     - Si hors de tout polygone : altitude = 0 (mer).
     - Si dans un polygone :
       - Calculer une distance approximative à la côte (ex. distance au bord du polygone, via `@turf/point-to-line-distance` sur le contour).
       - Appliquer un bruit de Simplex/Perlin (ex. librairie `simplex-noise`), avec plusieurs octaves pour un relief naturel.
       - Combiner : altitude = f(distance_cote, bruit), en s'assurant que l'altitude reste ≥ 0 et raisonnable (ex. 0 à 3000).
   - Ajouter un paramètre de "seed" pour permettre de régénérer un relief différent sur demande.

2. Test unitaire simple : vérifier que la grille produit bien 0 en mer et des valeurs > 0 sur les continents, avec une distribution plausible (pas de bruit pur, pas de plateau uniforme).

### Lot 5.1 - Encodage en Terrain-RGB et tuilage raster

Objectif : rendre cette grille consommable par MapLibre comme source `raster-dem`.

1. Créer `src/utils/encodeTerrainRGB.ts` :
   - Fonction :
     ```ts
     export function encodeElevationToTerrainRGB(elevation: number): [number, number, number];
     ```
   - Implémenter la formule standard Mapbox Terrain-RGB :
     - `elevation = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)`
     - Inverser cette formule pour encoder une altitude en R, G, B.

2. Créer `src/utils/generateDEMTiles.ts` :
   - Découper la grille d'altitude en tuiles (même logique de pyramide de zoom que `generateMVT.ts`), mais produire des images raster (PNG) encodées en Terrain-RGB au lieu de buffers MVT.
   - Fonction :
     ```ts
     export function generateDEMTilesFromElevationGrid(
       elevationGrid: Float32Array,
       width: number,
       height: number,
       maxZoom: number
     ): Map<number, Map<string, ArrayBuffer>>; // zoom -> tileKey -> PNG buffer
     ```
   - Réutiliser une lib de génération d'image côté client (ex. canvas offscreen + `toBlob`/`toDataURL`, ou `pngjs` si disponible côté build).

3. Étendre le protocole custom MapLibre existant :
   - Ajouter un nouveau protocole, par exemple `dem-memory-continents-X://`, qui intercepte les requêtes et retourne les tuiles PNG Terrain-RGB générées en mémoire.
   - S'inspirer directement du protocole `mvt-memory-continents-X://` déjà en place pour la cohérence du code.

### Lot 5.2 - Intégration dans le style MapLibre

Objectif : afficher hillshade + color-relief + contours + labels par-dessus les tuiles DEM.

1. Mettre à jour le style MapLibre (`map-service.ts` ou style JSON) :
   - Ajouter une source :
     ```json
     {
       "type": "raster-dem",
       "tiles": ["dem-memory-continents-X://{z}/{x}/{y}"],
       "tileSize": 256,
       "encoding": "terrarium" // ou "mapbox" selon l'encodage choisi
     }
     ```
   - Ajouter un layer `hillshade` :
     - `type: "hillshade"`, source = la source DEM ci-dessus.
     - Ajuster `hillshade-exaggeration`, `hillshade-shadow-color`, `hillshade-highlight-color` pour un rendu proche de l'image de référence (gris doux, ombres marquées).
   - Ajouter un layer `color-relief` si supporté par la version de MapLibre utilisée (sinon, simuler via un dégradé de couleur appliqué directement sur le raster DEM au moment de la génération PNG).
   - Conserver le layer vectoriel `continents-line` par-dessus (contours nets), en ajustant l'opacité/couleur pour rester lisible sur le relief.
   - Supprimer ou rendre transparent le remplissage plein vert (`continents-fill`) qui n'est plus nécessaire une fois le relief actif.

2. Ajuster le fond (style "océan") :
   - Remplacer l'aplat sombre uni par une couleur cohérente avec le rendu grisé de l'image de référence (bleu-gris clair ou gris très clair), tout en gardant un bon contraste avec les continents.

### Lot 5.3 - Labels de continents

Objectif : afficher le nom de chaque continent, comme les noms de pays sur l'image de référence.

1. Générer un point de label par continent :
   - Calculer le centroïde de chaque polygone (via `@turf/centroid` ou calcul manuel).
   - Créer un GeoJSON `FeatureCollection<Point>` avec `properties: { name: continent.name }`.

2. Ajouter une source vectorielle `continent-labels` (GeoJSON direct, pas besoin de MVT pour cette couche, volume faible).

3. Ajouter un layer `symbol` :
   - `text-field: ["get", "name"]`
   - Style cohérent avec la charte Braudel (police, taille, halo blanc léger pour lisibilité sur le relief).

### Lot 5.4 - Contrôle utilisateur et régénération

Objectif : permettre de régénérer/affiner le relief sans tout redessiner.

1. Ajouter un bouton "Régénérer le relief" dans l'interface (ex. dans les paramètres du monde ou à côté de la légende) qui :
   - Relance `generateSyntheticDEM` avec un nouveau seed.
   - Régénère les tuiles DEM en mémoire.
   - Force MapLibre à recharger la source raster-dem (ex. en changeant l'URL du protocole avec un suffixe de version).

2. Optionnel : exposer un ou deux paramètres simples (ex. "Relief doux / Relief marqué") qui ajustent l'amplitude du bruit dans `generateSyntheticDEM`.

## Livrables attendus

1. `src/utils/generateSyntheticDEM.ts` : génération de la grille d'altitude à partir du GeoJSON des continents.
2. `src/utils/encodeTerrainRGB.ts` : encodage altitude → RGB (Terrain-RGB standard).
3. `src/utils/generateDEMTiles.ts` : découpage en tuiles raster PNG Terrain-RGB.
4. Extension du protocole custom MapLibre pour servir les tuiles DEM en mémoire (`dem-memory-continents-X://`).
5. Mise à jour du style MapLibre : sources `raster-dem`, layers `hillshade` (+ `color-relief` si possible), ajustement des layers existants (contours, suppression du fill plein).
6. `src/utils/generateContinentLabels.ts` : génération des points de labels + layer `symbol`.
7. Bouton "Régénérer le relief" dans l'UI, avec au moins un paramètre d'intensité.
8. Mise à jour de `../../docs/continent_builder_spec.md` pour documenter ce nouveau flux (continents → DEM → tuiles raster → hillshade).

## Mode de travail recommandé

- Avancer lot par lot (5.0 à 5.4), en testant visuellement après chaque étape :
  - 5.0 : vérifier la grille d'altitude via un simple export debug (ex. afficher la grille en niveaux de gris dans un canvas de test).
  - 5.1 : vérifier que les tuiles DEM générées donnent un hillshade correct une fois chargées dans MapLibre.
  - 5.2 : comparer visuellement le rendu à l'image de référence, ajuster les paramètres de style.
  - 5.3 : vérifier la lisibilité des labels à différents niveaux de zoom.
  - 5.4 : vérifier que la régénération ne casse pas l'état du monde (continents, entités déjà rattachées).
- Prioriser l'obtention rapide d'un hillshade visible et crédible (Lots 5.0 à 5.2) avant de peaufiner labels et contrôles (5.3, 5.4).

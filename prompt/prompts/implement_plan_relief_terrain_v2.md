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


## LOT 5bis - Lignes de repère géographiques

Objectif : afficher des lignes horizontales fixes (équateur, tropiques, cercles polaires) pour aider au repérage sur le monde fictif. Ce lot est indépendant du DEM et peut être livré avant, en parallèle, ou après les Lots 5.0 à 5.4.

### Étape 1 - Génération des données statiques

Créer `src/data/geoReferenceLines.ts` :
- Générer un GeoJSON FeatureCollection<LineString> statique, indépendant du monde dessiné :
  - Équateur : lat = 0
  - Tropique du Cancer : lat = 23.5
  - Tropique du Capricorne : lat = -23.5
  - Cercle polaire arctique : lat = 66.5
  - Cercle polaire antarctique : lat = -66.5
- Chaque ligne va de lon = -180 à lon = 180 (ou en plusieurs segments si besoin pour éviter les problèmes de dateline).
- Chaque Feature a une propriété `name` (ex. "Équateur", "Tropique du Cancer") et `refType: 'equator' | 'tropic' | 'polar-circle'`.

### Étape 2 - Intégration dans le style MapLibre

Dans map-service.ts (ou équivalent) :
- Ajouter une source GeoJSON `geo-reference-lines` (statique, chargée une fois).
- Ajouter un layer `line` :
  - `line-color`: gris clair ou blanc semi-transparent selon le fond.
  - `line-dasharray`: pointillés fins pour bien les distinguer des contours de continents.
  - `line-width`: fine (1 à 1.5px).
- Ajouter un layer `symbol` pour les labels (`text-field: ["get", "name"]`), positionné le long des lignes ou à une extrémité, avec halo pour la lisibilité.

### Étape 3 - Toggle d'affichage utilisateur

- Ajouter une case à cocher "Afficher les repères géographiques" dans l'UI (panneau de couches ou paramètres du monde).
- Lier cette case à la visibilité des layers `geo-reference-lines` et leurs labels (`setLayoutProperty('visibility', 'visible'|'none')`).
- Valeur par défaut : activée ou désactivée, à définir selon préférence (proposer activée par défaut pour la première utilisation).

### Tests manuels Lot 5bis

- Vérifier que les 5 lignes s'affichent correctement à toutes les échelles de zoom.
- Vérifier que le toggle masque/affiche bien l'ensemble (lignes + labels).
- Vérifier que les lignes ne perturbent pas la lecture des continents/reliefs en dessous.

## LOT 6 - Zones de relief typées

Objectif : permettre de dessiner des zones de relief spécifiques (montagne, pic, collines, vallée, rift, fosse océanique, dorsale) qui modulent le DEM et s'affichent avec une palette hypsométrique cohérente. Ce lot enrichit directement le pipeline DEM des Lots 5.0 à 5.2 et doit donc être développé après validation d'un hillshade de base fonctionnel.

### Étape 1 - Généralisation du modèle de dessin

Dans ContinentBuilderView.tsx et les types associés :
- Remplacer/étendre `ContinentDraft` par un type générique `TerrainFeatureDraft` :
  ```ts
  type TerrainFeatureType =
    | 'continent'
    | 'mountain'
    | 'peak'
    | 'hills'
    | 'valley'
    | 'rift'
    | 'trench'
    | 'ridge';

  type TerrainFeatureDraft = {
    id: string;
    featureType: TerrainFeatureType;
    geometryType: 'polygon' | 'line' | 'point';
    points: { x: number; y: number }[];
    name?: string;
  };
  ```
- Continent reste `geometryType: 'polygon'`.
- Montagne, collines, vallée, fosse océanique : `polygon` (zones).
- Rift, dorsale : `line` (structures linéaires).
- Pic : `point` (position ponctuelle, avec une intensité/rayon d'influence).

### Étape 2 - Interface de sélection du type de zone

Dans ContinentBuilderView.tsx :
- Ajouter un sélecteur (ex. dropdown ou palette de boutons) permettant de choisir le type de zone avant de dessiner : "Continent", "Montagne", "Pic", "Collines", "Vallée", "Rift", "Fosse océanique", "Dorsale".
- Adapter le mode d'interaction selon geometryType :
  - polygon : clic pour ajouter des points, double-clic pour fermer (comportement existant).
  - line : clic pour ajouter des points, double-clic pour terminer la ligne (pas de fermeture en polygone).
  - point : un seul clic pose le point, avec un curseur secondaire pour définir le rayon d'influence (glisser ou second clic).
- Afficher chaque draft avec une couleur distincte selon featureType (couleur de contour/fill de prévisualisation), correspondant à la palette définie plus bas.

### Étape 3 - Conversion GeoJSON généralisée

Étendre draftToGeoJSON.ts (ou créer `draftsToTerrainGeoJSON.ts`) :
- Fonction :
  ```ts
  export function terrainDraftsToGeoJSON(
    drafts: TerrainFeatureDraft[],
    canvasWidth: number,
    canvasHeight: number
  ): GeoJSON.FeatureCollection;
  ```
- Pour chaque draft, produire une Feature avec :
  - `geometry` adapté (Polygon, LineString ou Point) selon geometryType.
  - `properties: { featureType, name }`.
- Conserver la même logique de projection équirectangulaire (lon/lat) déjà en place.

### Étape 4 - Modulation du DEM synthétique

Étendre generateSyntheticDEM.ts (Lot 5.0) :
- Fonction mise à jour :
  ```ts
  export function generateSyntheticDEM(
    terrainFeatures: GeoJSON.FeatureCollection,
    width: number,
    height: number,
    seed: number
  ): Float32Array;
  ```
- Algorithme par pixel :
  1. Déterminer l'altitude de base (mer = valeur négative faible par défaut, continent = valeur positive faible, via appartenance aux polygones `continent`).
  2. Pour chaque feature de relief recouvrant ou proche du pixel, appliquer un modificateur :
     - `mountain` (polygon) : + offset élevé + bruit fort (ex. +2000 à +4000, forte variance).
     - `peak` (point) : + offset très élevé, décroissant avec la distance au point (ex. pic gaussien, rayon paramétrable).
     - `hills` (polygon) : + offset modéré + bruit doux (ex. +300 à +800).
     - `valley` (polygon) : - offset modéré par rapport à l'altitude de base locale (creux, ex. -200 à -500, jamais sous le niveau de la mer sauf cas explicite).
     - `rift` (line) : - offset marqué le long de la ligne, décroissant avec la distance (dépression étroite).
     - `trench` (polygon, généralement en mer) : offset très négatif (ex. -6000 à -10000).
     - `ridge` (line, généralement en mer) : + offset modéré par rapport au plancher océanique local (remontée, reste sous 0 sauf émergence volontaire).
  3. Sommer les contributions (avec pondération/distance) pour obtenir l'altitude finale du pixel.
- Conserver le paramètre de seed pour le bruit, appliqué de façon cohérente à toutes les catégories.

### Étape 5 - Palette hypsométrique (color-relief)

Dans le style MapLibre (Lot 5.2, à enrichir ici) :
- Définir une palette `color-relief-color` par paliers d'altitude couvrant toute la plage utilisée, par exemple :
  - -10000 à -6000 : violet très sombre (fosses)
  - -6000 à -3000 : bleu foncé (grands fonds)
  - -3000 à -500 : bleu moyen (plaine océanique)
  - -500 à 0 : bleu-vert clair (dorsales, hauts-fonds)
  - 0 à 200 : vert clair (plaines, vallées basses)
  - 200 à 800 : vert olive (collines)
  - 800 à 2000 : brun (montagnes)
  - 2000 à 4000 : gris (haute montagne)
  - 4000+ : blanc (pics, neige)
- Cette palette remplace/complète celle prévue au Lot 5.2, en assurant la cohérence visuelle entre relief terrestre et relief sous-marin.
- Conserver le layer `hillshade` par-dessus pour l'effet de volume, avec une opacité ajustée pour ne pas trop assombrir les teintes de la palette.

### Étape 6 - Persistance

- Étendre le Store (Zustand/IndexedDB) pour stocker `terrainFeatures: TerrainFeatureDraft[]` (ou directement le GeoJSON généralisé) au niveau du monde, en plus de `continents` déjà existant.
- Prévoir une migration douce : les mondes existants avec uniquement `continents` doivent continuer à fonctionner (traiter l'absence de `terrainFeatures` comme une liste vide).

### Tests manuels Lot 6

- Dessiner un continent, puis une zone montagneuse à l'intérieur : vérifier que le DEM et le rendu color-relief distinguent bien montagne et plaine.
- Dessiner un pic isolé : vérifier l'effet de pic localisé (gaussien) sur le relief.
- Dessiner une fosse océanique en mer : vérifier la teinte violette/bleu très sombre.
- Dessiner une dorsale (ligne en mer) : vérifier la remontée du plancher océanique visible dans la palette.
- Vérifier que les contours de continents restent lisibles par-dessus le relief typé.
- Vérifier la persistance : recharger l'application et confirmer que les zones typées sont bien restaurées.

## Livrables attendus - Lot 5bis

1. `src/data/geoReferenceLines.ts` : génération des lignes équateur/tropiques/pôles.
2. Mise à jour de map-service.ts : source + layers `line` et `symbol` pour ces repères.
3. Toggle UI "Afficher les repères géographiques".

## Livrables attendus - Lot 6

1. Types `TerrainFeatureType` / `TerrainFeatureDraft` (dans un fichier de types partagé, ex. `src/types/terrain.ts`).
2. Extension de ContinentBuilderView.tsx : sélecteur de type de zone, gestion des modes polygon/line/point.
3. `src/utils/terrainDraftsToGeoJSON.ts` : conversion généralisée.
4. Extension de `generateSyntheticDEM.ts` : prise en compte des types de relief dans le calcul d'altitude.
5. Palette `color-relief-color` enrichie dans le style MapLibre.
6. Extension du Store pour persister `terrainFeatures`.
7. Mise à jour de `../../docs/continent_builder_spec.md` : nouveaux types, nouveau flux de dessin multi-types, palette hypsométrique.

## Mode de travail recommandé - Lot 5bis & Lot 6

- Livrer Lot 5bis en premier ou en parallèle des Lots 5.0-5.2 (rapide, sans dépendance au DEM), pour un gain de lisibilité immédiat.
- Pour Lot 6, avancer dans cet ordre, après validation du hillshade de base (Lots 5.0-5.2) :
  1. Types + généralisation du dessin (Étapes 1-2) : valider que l'on peut dessiner et distinguer visuellement les différents types de zones dans l'éditeur, avant même de toucher au DEM.
  2. Conversion GeoJSON (Étape 3) : valider par un export/inspection que les features sont correctement typées et géoréférencées.
  3. Modulation DEM (Étape 4) : tester sur un seul type à la fois (ex. montagne seule, puis pic seul) avant de combiner plusieurs types sur un même monde.
  4. Palette et rendu (Étape 5) : ajuster les seuils de couleur en comparant au rendu de référence visé.
  5. Persistance (Étape 6) : dernière étape, une fois le rendu validé visuellement.
- Ne pas chercher l'exhaustivité dès la première itération : un sous-ensemble fonctionnel (ex. continent + montagne + pic + fosse) suffit pour valider le concept avant d'ajouter collines, vallée, rift et dorsale.


## LOT 6 - Étape 5bis : Style "shaded relief" minimaliste (alternative à la palette hypsométrique)

Objectif : remplacer la palette hypsométrique multicolore (Étape 5) par un style de rendu épuré à deux tons (terre claire / mer gris-bleu), où tout le relief perçu est porté par le hillshade seul, à la manière d'un atlas éditorial plutôt que d'une carte scientifique. Ce style est jugé plus cohérent avec l'usage de tuile vectorielle support pour Braudel.

Cette étape est une alternative de style au rendu obtenu à l'Étape 5, pas un nouveau calcul : le DEM, la modulation par type de relief (montagne, vallée, fosse, etc.) et le tuilage restent strictement inchangés. Seuls les paramètres de rendu visuel (color-relief, hillshade, line, symbol) sont modifiés.

### Contexte du choix

Le rendu de référence visé (carte topographique type "shaded relief atlas") a les caractéristiques suivantes :
- Une seule teinte "terre" quasi uniforme (blanc cassé/crème) pour toute altitude positive.
- Une seule teinte "mer" gris-bleu désaturée pour toute altitude négative.
- Tout le relief (montagnes, vallées, fosses, dorsales) est perçu uniquement via les ombres/lumières du hillshade, pas via un dégradé de couleurs par altitude.
- Des frontières fines et nettes en gris moyen, sans remplissage distinct par continent/pays.
- Des labels discrets, petite capitale grise avec léger halo blanc.

Ce choix simplifie aussi la gestion des cas de superposition de features (ex. vallée dessinée sur une montagne) : comme la couleur ne varie plus finement selon l'altitude, les incohérences de palette observées à l'Étape 5 (ex. vallée affichant des teintes de haute montagne) deviennent invisibles à l'œil, même si le calcul DEM sous-jacent reste à corriger séparément (cf. Lot 6 Étape 4, gestion de priorité entre features superposées).

### Étape 1 - Simplification de la palette color-relief

Dans le style MapLibre (`map-service.ts` ou style JSON) :
- Remplacer les 8-10 stops `color-relief-color` définis à l'Étape 5 par 2 à 3 stops maximum :
  - altitude < 0 : gris-bleu désaturé, ex. `#93a5ae`
  - altitude >= 0 : blanc cassé/crème, ex. `#f4f2ec`
  - Optionnel : un stop de transition étroit autour de 0 (ex. -50 à +50) pour éviter un bord trop dur entre terre et mer, en restant dans des teintes proches (pas de vert/brun intermédiaire).
- Supprimer les teintes vertes, jaunes, brunes intermédiaires utilisées précédemment pour les paliers d'altitude terrestre.
- Conserver la distinction fosse/dorsale au niveau du calcul DEM (Lot 6 Étape 4), mais ne plus la traduire par une couleur distincte : elle restera visible uniquement via le hillshade (creux/relief sous-marin).

### Étape 2 - Renforcement du hillshade

Objectif : compenser la perte d'information de la couleur en rendant le hillshade seul suffisamment expressif.
- Augmenter `hillshade-exaggeration` (tester des valeurs plus élevées que celles utilisées à l'Étape 5.2, ex. 0.7 à 1.0 selon le rendu obtenu).
- Régler `hillshade-shadow-color` et `hillshade-highlight-color` sur des gris neutres (éviter les teintes bleutées ou brunes qui coloreraient artificiellement le relief), ex. :
  - shadow-color : gris foncé neutre, ex. `#4a4a4a`
  - highlight-color : gris très clair/blanc, ex. `#fafafa`
- Vérifier la résolution du DEM synthétique (Lot 5.0) : ce style met beaucoup plus en évidence les textures fines (veines de dorsales, striations de fosses, granularité du bruit sur les montagnes) que la version colorée. Si le bruit est insuffisamment détaillé, augmenter le nombre d'octaves ou la résolution de la grille d'altitude pour obtenir des textures comparables au rendu de référence.
- Tester plusieurs niveaux d'exaggeration en comparant côte à côte avec l'image de référence, jusqu'à obtenir des chaînes de montagnes et fosses clairement identifiables sans couleur d'appui.

### Étape 3 - Restyle du layer de frontières

Objectif : afficher des frontières fines et nettes façon atlas, sans remplissage distinct par continent.
- Ajuster le layer `continents-line` existant (issu du Lot 4) :
  - `line-color`: gris moyen neutre, ex. `#7d7d7d`
  - `line-width`: fine, ex. 0.5 à 1px selon le zoom (utiliser une expression de zoom si besoin pour affiner à différents niveaux).
  - `line-opacity`: légèrement réduite si le trait paraît trop dur, ex. 0.8.
- S'assurer que le layer `continents-fill` (remplissage plein) reste bien désactivé ou totalement transparent, comme déjà prévu à l'Étape 5.2 : la distinction terre/mer doit venir uniquement du color-relief simplifié (Étape 1), pas d'un fill par continent.
- Appliquer le même traitement de style aux contours des zones de relief typées (montagne, vallée, etc.) si elles sont encore visibles en trait : les rendre discrètes ou les masquer par défaut, puisque dans le rendu de référence on ne voit pas de contours internes aux masses continentales.

### Étape 4 - Restyle des labels

Objectif : rapprocher le rendu des labels de continents/zones de celui du rendu de référence (discret, petite capitale grise, léger halo).
- Ajuster le layer `symbol` des labels (continents et zones de relief typées, issus du Lot 5.3 et Lot 6) :
  - `text-transform`: uppercase (si pas déjà le cas)
  - `text-size`: réduire par rapport au réglage actuel, ex. 10-12px selon le zoom.
  - `text-color`: gris moyen-foncé, ex. `#5a5a5a`
  - `text-halo-color`: blanc, `text-halo-width`: légère (ex. 1px) pour garder la lisibilité sans texte trop épais.
  - Activer `text-allow-overlap: false` et un filtrage par zoom/priorité (cf. problème de collision de labels identifié précédemment) pour éviter l'empilement de libellés proches.

### Tests manuels Lot 6 Étape 5bis

- Comparer visuellement le rendu obtenu à l'image de référence : vérifier que montagnes, vallées, fosses et dorsales restent identifiables uniquement via le hillshade.
- Vérifier qu'aucune teinte verte/brune/jaune ne subsiste par erreur (résidu de l'ancienne palette).
- Vérifier que les frontières restent fines et lisibles à plusieurs niveaux de zoom.
- Vérifier que les labels ne se chevauchent plus de façon excessive.
- Confirmer que le calcul DEM et la logique de modulation par type de relief (Lot 6 Étapes 1-4) n'ont pas été modifiés : seul le rendu visuel a changé.

### Décision à prendre avec l'utilisateur

- Conserver cette étape comme remplacement définitif de l'Étape 5 (palette hypsométrique), ou proposer les deux styles comme options basculables dans l'UI (ex. "Style scientifique" vs "Style atlas"), si les deux usages ont un intérêt pour Braudel (pédagogie vs exploration technique du relief).

## Livrables attendus - Lot 6 Étape 5bis

1. Mise à jour du style MapLibre : palette `color-relief-color` simplifiée à 2-3 stops neutres.
2. Réglages `hillshade-exaggeration`, `hillshade-shadow-color`, `hillshade-highlight-color` ajustés pour un rendu de type shaded relief pur.
3. Restyle du layer `continents-line` (et éventuellement des contours de zones de relief typées) en frontières fines gris neutre.
4. Restyle des labels (taille, couleur, halo, gestion de collision).
5. (Optionnel) Toggle UI permettant de basculer entre le style hypsométrique (Étape 5) et le style shaded relief minimaliste (Étape 5bis).
6. Mise à jour de `../../docs/continent_builder_spec.md` pour documenter ce choix de style et ses paramètres.

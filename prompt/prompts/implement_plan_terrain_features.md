# Plan d'implémentation - Lot 5bis & Lot 6 : Repères géographiques & Zones de relief typées (Braudel World Builder)

## Contexte & objectif

Le World Builder de Braudel dispose déjà :
- d'un outil de dessin de continents (ContinentBuilderView, Lot 1),
- d'une conversion dessin → GeoJSON (Lot 2),
- d'un tuilage vectoriel MVT (Lot 3),
- d'un rendu MapLibre avec continents en polygones plats (Lot 4),
- d'un plan de génération de DEM synthétique et de hillshade (Lot 5, en cours/à venir).

Ce nouveau plan couvre deux extensions complémentaires :
- Lot 5bis : ajout de lignes de repère géographiques fixes (équateur, tropiques, cercles polaires).
- Lot 6 : ajout de zones de relief typées dessinables (montagnes, pics, collines, vallées, rifts, fosses océaniques, dorsales), avec palette de couleurs hypsométriques (color-relief).

Lot 5bis est indépendant du DEM et peut être livré rapidement. Lot 6 vient enrichir le pipeline DEM du Lot 5 et doit donc être développé après ou en parallèle avancé du Lot 5.

## Périmètre de la tâche

Tu interviens sur :
- ContinentBuilderView.tsx (extension du système de dessin).
- draftsToGeoJSON.ts (généralisation du typage des features).
- generateSyntheticDEM.ts (Lot 5, à étendre pour prendre en compte les zones typées).
- Le style MapLibre / map-service.ts (nouveaux layers : repères géographiques, palette color-relief enrichie).
- Le Store (Zustand/IndexedDB) pour persister les nouvelles zones typées.

Tu ne dois pas casser :
- Le flux existant de dessin de continents.
- Le protocole custom MapLibre pour les tuiles MVT et DEM.
- La conversion GeoJSON existante pour les continents simples.

## Contraintes & conventions

- TypeScript strict, architecture local-first, pas de serveur externe.
- Réutiliser au maximum les patterns déjà en place (canvas de dessin, conversion pixel->lon/lat, protocole custom MapLibre).
- Le typage doit être extensible : prévoir d'autres types de zones dans le futur sans tout refactorer.
- Le rendu doit rester lisible : usage d'un dégradé hypsométrique cohérent plutôt que des aplats disparates.

## LOT 5bis - Lignes de repère géographiques

Objectif : afficher des lignes horizontales fixes (équateur, tropiques, cercles polaires) pour aider au repérage sur le monde fictif.

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

Objectif : permettre de dessiner des zones de relief spécifiques (montagne, pic, collines, vallée, rift, fosse océanique, dorsale) qui modulent le DEM et s'affichent avec une palette hypsométrique cohérente.

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

Étendre generateSyntheticDEM.ts (Lot 5) :
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

Dans le style MapLibre (Lot 5.2 déjà prévu, à enrichir ici) :
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

## Livrables attendus

Lot 5bis :
1. `src/data/geoReferenceLines.ts` : génération des lignes équateur/tropiques/pôles.
2. Mise à jour de map-service.ts : source + layers `line` et `symbol` pour ces repères.
3. Toggle UI "Afficher les repères géographiques".

Lot 6 :
1. Types `TerrainFeatureType` / `TerrainFeatureDraft` (dans un fichier de types partagé, ex. `src/types/terrain.ts`).
2. Extension de ContinentBuilderView.tsx : sélecteur de type de zone, gestion des modes polygon/line/point.
3. `src/utils/terrainDraftsToGeoJSON.ts` : conversion généralisée.
4. Extension de `generateSyntheticDEM.ts` : prise en compte des types de relief dans le calcul d'altitude.
5. Palette `color-relief-color` enrichie dans le style MapLibre.
6. Extension du Store pour persister `terrainFeatures`.
7. Mise à jour de `../../docs/continent_builder_spec.md` : nouveaux types, nouveau flux de dessin multi-types, palette hypsométrique.

## Mode de travail recommandé

- Livrer Lot 5bis en premier (rapide, sans dépendance au DEM), pour un gain de lisibilité immédiat.
- Pour Lot 6, avancer dans cet ordre :
  1. Types + généralisation du dessin (Étapes 1-2) : valider que l'on peut dessiner et distinguer visuellement les différents types de zones dans l'éditeur, avant même de toucher au DEM.
  2. Conversion GeoJSON (Étape 3) : valider par un export/inspection que les features sont correctement typées et géoréférencées.
  3. Modulation DEM (Étape 4) : tester sur un seul type à la fois (ex. montagne seule, puis pic seul) avant de combiner plusieurs types sur un même monde.
  4. Palette et rendu (Étape 5) : ajuster les seuils de couleur en comparant au rendu de référence visé.
  5. Persistance (Étape 6) : dernière étape, une fois le rendu validé visuellement.
- Ne pas chercher l'exhaustivité dès la première itération : un sous-ensemble fonctionnel (ex. continent + montagne + pic + fosse) suffit pour valider le concept avant d'ajouter collines, vallée, rift et dorsale.

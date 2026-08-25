# Walkthrough: World Builder (Lot 5 - Topographie & Relief)

## Vue d'ensemble
Le **World Builder** permet désormais de générer de A à Z des continents fictifs interactifs, dotés non seulement de littoraux (MVT), mais d'une topographie procédurale complète avec ombrage (Hillshade) et labels (Noms des continents).

Ce flux s'exécute intégralement **en local dans le navigateur** (zéro appel serveur géographique).

## Modules déployés et Flux de données

1. **Générateur de Grille d'Altitude (`generateSyntheticDEM.ts`)**
   - *Rôle* : Calcule pour le monde entier (ou une large région) un modèle d'élévation mathématique.
   - *Technique* : Utilise le *ray-casting* (point in polygon) pour séparer terre/mer, applique une pente d'adoucissement basée sur la distance aux côtes, et ajoute 3 octaves de `simplex-noise` fractal pour un relief chaotique naturel.
   - *Sortie* : Une grille plate de haute précision (`Float32Array`).

2. **Encodeur Terrain-RGB (`encodeTerrainRGB.ts`)**
   - *Rôle* : Transforme l'altitude métrique brute (Float) en couleur RVB.
   - *Technique* : Implémente le standard *Terrarium* `(R * 256 + G + B / 256) - 32768` et *Mapbox Terrain-RGB*.

3. **Découpeur de Tuiles Raster (`generateDEMTiles.ts`)**
   - *Rôle* : Découpe la grille mondiale en tuiles pyramidales (x/y/z).
   - *Technique* : Utilise `OffscreenCanvas` pour un encodage PNG natif et quasi instantané des tuiles Terrain-RGB (générées jusqu'au zoom 3).

4. **Serveur de Tuiles Mémoire (`map-service.ts`)**
   - *Rôle* : Intercepte les requêtes de MapLibre pour distribuer les données Raster.
   - *Technique* : Le protocole `dem-memory-continents-X://` intercepte l'URL, trouve le PNG en RAM et le renvoie en ArrayBuffer.

5. **Couches MapLibre & Styling (Lot 5.2)**
   - Un fond océanique bleu-gris doux (`#e2e8f0`).
   - La source `raster-dem` alimente une couche de type `hillshade` gérée de manière ultra-performante par le GPU via MapLibre.
   - Maintien de la couche vectorielle `line` pour souligner les côtes.

6. **Étiquetage (Lot 5.3)**
   - *Module* : `generateContinentLabels.ts`.
   - Extrait le centroïde des continents pour générer des étiquettes affichées dynamiquement (couche de type `symbol`).

7. **Régénération du Relief (Lot 5.4)**
   - Dans le `StylePanel`, un bouton **Régénérer la Topographie** crée un nouveau *seed* aléatoire, regénère l'élévation, purge les couches MapLibre et reconstruit la carte sans figer le navigateur.

## Validation Technique
- ✔️ Test unitaire `generateSyntheticDEM.test.ts` (100% succès).
- ✔️ Zero dépendance serveur, génération offline-first pure.
- ✔️ Typage strict, 0 erreur TypeScript.

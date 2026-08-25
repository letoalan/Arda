# Plan d'implémentation - Stratégie d'acquisition multi-sources (Braudel World Builder)

## Contexte & objectif

Le World Builder de Braudel dispose déjà d'un pipeline complet : dessin par clics (ContinentBuilderView), conversion en GeoJSON, modulation DEM par type de relief, tuilage MVT, rendu MapLibre avec style shaded relief. Ce plan introduit une architecture d'acquisition multi-sources permettant d'ajouter progressivement :
- le tracé au crayon (freehand),
- l'import d'image comme calque de traçage,
- la vectorisation automatique assistée (Potrace, contours/marching squares),
- une éventuelle classification multi-couches par couleur.

L'objectif central est d'éviter toute reprise de l'architecture existante à chaque nouvelle méthode d'acquisition, en isolant ces méthodes derrière une interface pivot commune.

## Principe architectural directeur

Trois couches indépendantes doivent être clairement séparées :
1. Couche d'acquisition (variable, évolutive) : dessin manuel, crayon, import image, vectorisation auto.
2. Couche de normalisation (stable) : transforme toute source en une structure unique RawShapeInput.
3. Couche de typage/sémantique (stable) : assigne un featureType et convertit en TerrainFeatureDraft, puis rejoint le pipeline existant (GeoJSON -> DEM -> MVT -> MapLibre).

Aucune méthode d'acquisition future ne doit modifier les couches 2 et 3, ni le pipeline aval déjà en place (terrainDraftsToGeoJSON, generateSyntheticDEM, generateMVT, map-service).

## Contrat central : interface RawShapeInput

Toute méthode d'acquisition, quelle qu'elle soit, doit produire cette structure :

```ts
type RawShapeInput = {
  points: { x: number; y: number }[];
  geometryKind: 'polygon' | 'line' | 'point';
  sourceMethod: 'click' | 'freehand' | 'image-trace' | 'auto-vectorized' | 'external-geojson';
  confidence?: number; // renseigné uniquement pour les méthodes automatiques
};
```

Ce contrat est non négociable : toute nouvelle méthode d'acquisition ajoutée dans le futur doit produire un tableau de RawShapeInput, sans exception. C'est ce qui garantit qu'aucun palier futur ne nécessite de reprendre le pipeline existant.

## Contraintes & conventions

- TypeScript strict, architecture local-first, pas de serveur externe pour le traitement d'image (tout en client, WebAssembly/JS pur).
- Chaque méthode d'acquisition est un module isolé sous `src/acquisition/{method}/`.
- La logique de typage (assignation du featureType) reste centralisée et unique, quelle que soit la source.
- Ne pas implémenter les paliers avancés (3, 4) avant validation d'usage réel des paliers précédents.

## Palier 0 - Existant (rappel, non modifié)

- ContinentBuilderView.tsx : dessin par clics, sourceMethod implicite 'click'.
- terrainDraftsToGeoJSON.ts, generateSyntheticDEM.ts, generateMVT.ts, map-service.ts : pipeline aval inchangé.

Action requise : refactorer légèrement la sortie du mode clic actuel pour qu'elle produise explicitement un RawShapeInput avec sourceMethod: 'click', afin d'unifier l'interface dès maintenant sans attendre les paliers suivants.

## Palier 1 - Tracé au crayon (freehand)

Objectif : ajouter un mode de dessin continu, complémentaire au mode clic.

### Étape 1.1 - Capture du tracé

Dans ContinentBuilderView.tsx :
- Ajouter un toggle "Mode polygone / Mode crayon" dans la barre d'outils.
- En mode crayon :
  - `mousedown` : démarre la capture, initialise un tableau de points bruts.
  - `mousemove` (tant que le bouton est maintenu) : échantillonne la position tous les 4 à 6px de déplacement pour éviter une densité excessive.
  - `mouseup` : termine le tracé, ferme automatiquement la forme (relie le dernier point au premier) si geometryKind = 'polygon'.

### Étape 1.2 - Simplification

- Installer `simplify-js`.
- Créer `src/acquisition/freehand/simplifyFreehandStroke.ts` :
  ```ts
  export function simplifyFreehandStroke(
    rawPoints: { x: number; y: number }[],
    tolerance: number
  ): { x: number; y: number }[];
  ```
- Appliquer simplify-js (mode high-quality) avant de produire le RawShapeInput final.
- Exposer un paramètre de tolérance ajustable (par défaut une valeur raisonnable, ex. 3-5px).

### Étape 1.3 - Lissage optionnel

- Optionnel : appliquer un lissage de Chaikin sur les points simplifiés si le rendu paraît trop anguleux, avant la simplification finale ou après, selon le résultat visuel recherché.
- Fonction isolée `src/acquisition/freehand/smoothChaikin.ts`, activable via un paramètre de style de dessin.

### Étape 1.4 - Production du RawShapeInput

- Envelopper la sortie du mode crayon dans la structure RawShapeInput (sourceMethod: 'freehand').
- Vérifier que le reste du flux (choix du featureType, conversion GeoJSON) fonctionne à l'identique qu'avec le mode clic.

### Tests manuels Palier 1

- Dessiner plusieurs formes en mode crayon, vérifier la fermeture automatique.
- Vérifier que la simplification réduit significativement le nombre de points sans dénaturer la forme.
- Vérifier la cohabitation des deux modes (clic et crayon) sur un même monde.

## Palier 2 - Image comme calque de traçage

Objectif : permettre d'importer une image de référence (scan, croquis) affichée en fond semi-transparent, sur laquelle l'utilisateur trace manuellement (clic ou crayon).

### Étape 2.1 - Import et affichage

- Ajouter un bouton "Importer une image de fond" dans ContinentBuilderView.
- Charger l'image via `<input type='file'>`, l'afficher dans un canvas ou une couche `<img>` positionnée sous le canvas de dessin, avec une opacité réglable (slider, défaut 50%).

### Étape 2.2 - Calage d'échelle

- Proposer deux modes de calage :
  - Mode simple : "cette image représente le monde entier" -> l'image est automatiquement mise à l'échelle du canvas (largeur/hauteur = projection équirectangulaire complète).
  - Mode avancé (optionnel, à ne développer que si besoin confirmé) : l'utilisateur positionne 2 points de référence sur l'image (ex. deux coins connus) pour caler une échelle partielle.
- Stocker les paramètres de calage avec le monde (pour pouvoir réafficher le calque de fond correctement si l'utilisateur revient éditer plus tard).

### Étape 2.3 - Contrôles utilisateur

- Boutons : "Afficher/Masquer le calque", "Supprimer le calque", slider d'opacité.
- Le calque ne doit jamais être exporté ni tuilé : il est un outil d'édition uniquement, pas une donnée du monde.

### Tests manuels Palier 2

- Importer une image, vérifier son affichage correct en fond.
- Tracer par-dessus (mode clic ou crayon) et vérifier que le RawShapeInput produit est correct.
- Vérifier que le calque reste local à la session d'édition et n'apparaît pas dans le rendu final publié.

## Palier 3 - Vectorisation automatique assistée

Objectif : proposer une détection automatique de formes à partir d'une image importée, avec validation humaine obligatoire du typage.

Ce palier ne doit être entamé qu'après confirmation que les Paliers 1 et 2 ne suffisent pas à l'usage réel (dessin trop long, besoin de numériser de nombreux documents).

### Étape 3.0 - Architecture du sous-module

- Créer `src/acquisition/auto-vectorize/` comme module isolé.
- Définir une interface de stratégie commune :
  ```ts
  interface VectorizationStrategy {
    vectorize(imageData: ImageData): Promise<RawShapeInput[]>;
  }
  ```
- Toute nouvelle méthode de vectorisation (actuelle ou future) doit implémenter cette interface, ce qui permet de les proposer comme "moteurs" interchangeables dans un menu.

### Étape 3.1 - Stratégie Potrace (image binaire/monochrome)

- Installer une librairie Potrace compatible navigateur (ex. ts-potrace ou équivalent).
- Créer `src/acquisition/auto-vectorize/potraceStrategy.ts` implémentant VectorizationStrategy :
  - Prétraiter l'image (niveaux de gris, seuillage binaire).
  - Appeler Potrace pour obtenir un tracé SVG.
  - Parser les chemins SVG en tableaux de points, produire les RawShapeInput correspondants (confidence basé sur la netteté du seuillage).
- Adapté aux dessins au trait net, scans propres noir sur blanc.

### Étape 3.2 - Stratégie contours/marching squares (scans complexes)

- Créer `src/acquisition/auto-vectorize/contourStrategy.ts` implémentant VectorizationStrategy :
  - Appliquer un seuillage ajustable (slider de seuil exposé à l'utilisateur).
  - Extraire les isocontours via un algorithme de marching squares (implémentation JS dédiée ou portée depuis une référence existante).
  - Simplifier les contours obtenus (réutiliser simplify-js du Palier 1).
  - Produire les RawShapeInput correspondants.
- Adapté aux scans en niveaux de gris, textures, dessins moins nets que Potrace ne gère bien.

### Étape 3.3 - Interface de validation post-vectorisation

- Après vectorisation (quelle que soit la stratégie), afficher toutes les formes détectées en surbrillance sur le canvas.
- Interaction : l'utilisateur clique sur chaque forme détectée et lui assigne un featureType (menu contextuel), ou la supprime si c'est un artefact de détection.
- Aucune forme détectée automatiquement n'est intégrée au monde sans validation explicite de son type par l'utilisateur.

### Étape 3.4 - Sélection de la stratégie

- Ajouter un sélecteur "Méthode de vectorisation : Potrace (trait net) / Contours (scan complexe)" dans l'UI d'import.
- Prévisualiser le résultat de vectorisation avant validation finale, avec possibilité de réessayer avec l'autre stratégie ou d'ajuster le seuil.

### Tests manuels Palier 3

- Tester Potrace sur un dessin au trait noir net : vérifier la qualité des contours obtenus.
- Tester la stratégie contours sur un scan de moindre qualité : ajuster le seuil et vérifier la robustesse.
- Vérifier qu'aucune forme n'est ajoutée au monde sans assignation manuelle de featureType.
- Vérifier que les deux stratégies produisent des RawShapeInput compatibles avec le pipeline existant (GeoJSON, DEM).

## Palier 4 - Classification multi-couches par couleur (exploratoire, non prioritaire)

Objectif (à ne documenter que comme option future, non implémentée à ce stade) : permettre à l'utilisateur de dessiner ou scanner une image où chaque couleur représente un type de relief différent (ex. bleu = fosse, brun = montagne), et vectoriser automatiquement chaque plage de couleur séparément.

### Principe

- Segmenter l'image par plages de couleur (un masque binaire par couleur détectée).
- Appliquer la stratégie de vectorisation choisie (Potrace ou contours) séparément sur chaque masque.
- Chaque masque produit directement des RawShapeInput déjà pré-typés (featureType déduit de la couleur associée), sous réserve de validation utilisateur comme au Palier 3.

### Prérequis avant implémentation

- Confirmation d'un besoin réel d'importer des cartes multi-types en une seule fois.
- Palier 3 doit être stable et éprouvé en usage avant d'envisager ce palier.

Aucune étape de code n'est à produire pour ce palier tant que ces prérequis ne sont pas réunis. Il est documenté ici uniquement pour garantir que l'architecture des paliers précédents (interface VectorizationStrategy, RawShapeInput) reste compatible avec cette extension future.

## Livrables attendus

Palier 0 (refactor minimal) :
1. Unification de la sortie du mode clic existant vers RawShapeInput.

Palier 1 :
1. Mode crayon dans ContinentBuilderView.tsx.
2. `src/acquisition/freehand/simplifyFreehandStroke.ts`.
3. `src/acquisition/freehand/smoothChaikin.ts` (optionnel).

Palier 2 :
1. Composant d'import et d'affichage du calque image.
2. Logique de calage d'échelle (mode simple, mode avancé optionnel).
3. Contrôles UI (opacité, affichage, suppression).

Palier 3 :
1. `src/acquisition/auto-vectorize/` avec interface VectorizationStrategy.
2. `potraceStrategy.ts`.
3. `contourStrategy.ts`.
4. Interface de validation post-vectorisation (assignation manuelle de featureType).
5. Sélecteur de stratégie dans l'UI.

Palier 4 :
1. Documentation seule (pas de code), à intégrer dans docs/continent_builder_spec.md comme extension future possible.

Documentation transverse :
1. Mise à jour de docs/continent_builder_spec.md avec le contrat RawShapeInput, l'architecture en 3 couches, et l'arbre des paliers.

## Mode de travail recommandé

- Implémenter le Palier 0 (refactor minimal) en tout premier, car il sécurise l'interface pivot sans rien changer visuellement pour l'utilisateur.
- Livrer et valider le Palier 1 avant d'entamer le Palier 2 : ce sont deux gains rapides et à faible risque.
- Ne pas entamer le Palier 3 sans confirmation explicite que les Paliers 1 et 2 sont insuffisants à l'usage réel.
- Le Palier 4 reste à l'état de documentation tant qu'aucun besoin concret ne le justifie.
- À chaque palier, vérifier explicitement que le pipeline aval (terrainDraftsToGeoJSON, generateSyntheticDEM, generateMVT, style MapLibre) n'a pas eu besoin d'être modifié : c'est le critère de succès de cette architecture.

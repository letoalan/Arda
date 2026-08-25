# Audit : Reconnaissance d'images et Interprétation IA dans Braudel

Ce document présente une analyse critique des méthodes actuellement déployées dans le projet pour extraire des tracés à partir d'images (croquis) et les interpréter, ainsi que des propositions de nouvelles pistes techniques plus robustes.

## 1. Méthodes logicielles déployées (État des lieux)

L'application utilise actuellement 3 stratégies distinctes pour extraire des vecteurs depuis une image pixel (Raster → Vecteur) :

### A. Analyse naïve par Pixels (BFS) : `sketch-parser.ts`
- **Fonctionnement** : Un canvas hors-écran parcourt les pixels, applique un seuil de luminance pour détecter les pixels "sombres", puis utilise un parcours en largeur (BFS / 4-connectivité) pour regrouper les pixels contigus en une forme unique.
- **Avantages** : Très léger, aucune dépendance, s'exécute rapidement côté client.
- **Limites** : Extrêmement basique. Il ne gère pas l'épaisseur des traits, ne détecte pas les trous internes (les mers intérieures), et sa simplification géométrique (1 point sur 6) produit des tracés crénelés ou imprécis. Très sensible au "bruit" visuel.

### B. Marching Squares : `contourStrategy.ts`
- **Fonctionnement** : Utilise la librairie `d3-contour` pour générer des isolignes à partir d'un champ de densité de pixels.
- **Avantages** : Algorithme robuste et standard (Marching Squares). Gère nativement les multi-polygones et lisse mathématiquement les contours.
- **Limites** : Mieux adapté à des cartes de chaleur (heatmaps) ou d'élévation (DEM) qu'à des croquis au trait fin, car il interpole la grille de pixels.

### C. Vectorisation Industrielle : `potraceStrategy.ts`
- **Fonctionnement** : Utilise `@cadit-app/potrace-ts` (portage de Potrace), l'algorithme standard utilisé dans des logiciels comme Inkscape pour la vectorisation.
- **Avantages** : Lisse les courbes (Bézier), élimine les petites impuretés (`turdsize`), et gère parfaitement les lignes pleines.
- **Limites** : Restreint aux images purement monochromes / binaires. Sur des croquis brouillons (lignes hachurées, croquis crayonnés), Potrace tente de vectoriser chaque hachure plutôt que d'inférer la forme globale.

## 2. Rôle de l'IA déployée (État des lieux)

Dans le composant `ai-service.ts`, un Large Language Model (LLM) local (ex: Ollama `qwen2.5-coder`) est utilisé pour traiter l'import d'images :

> [!WARNING]
> **Illusion de Multimodalité**
> Actuellement, l'IA **ne voit absolument pas l'image**. Le pipeline est le suivant : l'image est d'abord traitée par le script logiciel (ex: `sketch-parser.ts`) qui extrait aveuglément *X* polygones. Ensuite, une consigne texte est envoyée à l'IA : *"J'ai trouvé 4 formes dans 2 fichiers. L'utilisateur demande 'dessine un archipel'. Donne-leur des noms et des types."* 

- **Avantages** : Permet de qualifier sémantiquement des vecteurs (nommer une forme "Gondwana", lui attribuer le type `continent`).
- **Limites** : Puisque l'IA ne voit pas l'image, elle ne peut pas corriger les erreurs de vectorisation, ne peut pas deviner si une ligne représente un fleuve ou une frontière, et se contente d'habiller textuellement ce que le BFS a trouvé.

---

## 3. Pistes d'exploration & Alternatives

Pour dépasser ces limites et offrir une vraie reconnaissance spatiale et sémantique, voici 3 pistes d'ingénierie majeures à explorer, toujours compatibles avec l'architecture **Local-First** :

### Piste 1 : Computer Vision locale via OpenCV.js (WebAssembly)
Plutôt que d'utiliser des scripts rudimentaires ou Potrace, nous pourrions intégrer `opencv.js` pour traiter l'image de manière avancée avant vectorisation :
- **Détection de contours (Canny Edge Detection)** : Idéal pour les croquis crayonnés, permet de n'extraire que la crête des lignes.
- **Opérations Morphologiques (Dilatation / Érosion)** : Ferme automatiquement les lignes brisées d'un croquis dessiné à la main (bouchage de trous) avant d'extraire le polygone.
- **Transformée de Hough** : Identifierait les lignes droites (routes, frontières artificielles).

### Piste 2 : VLM (Vision-Language Models) Locaux
Au lieu d'utiliser un modèle textuel pur, nous pourrions configurer l'adaptateur Ollama pour interroger un modèle de vision local comme **LLaVA** ou **Moondream**.
- **Méthode** : Envoyer le base64 du croquis à LLaVA avec le prompt : *"Analyse ce croquis de carte imaginaire. Décris-moi la disposition des continents (Nord/Sud) et renvoie-moi des bounding boxes approximatives."*
- **Utilité** : Le modèle IA guide le script logiciel pour isoler les différentes parties du dessin (ex: "Ceci est la légende, on l'ignore", "Ceci est l'île principale").

### Piste 3 : ML In-Browser avec ONNX Runtime Web (Segmentation IA)
C'est la solution la plus moderne pour extraire des éléments complexes (ex: isoler un continent d'une photo satellite ou d'une vieille carte).
- **Segment Anything Model (SAM) Mobile** : Utiliser un petit modèle ONNX tournant dans le navigateur (WebGL / WebGPU).
- **Expérience Utilisateur** : L'utilisateur clique sur une zone de l'image importée. SAM comprend immédiatement les contours de la masse terrestre cliquée avec une précision au pixel, indépendamment des couleurs ou du bruit, et exporte le masque exact en GeoJSON.
- **Intégration** : `onnxruntime-web` + un modèle exporté et quantifié (int8) de ~30Mo, stocké dans IndexedDB.

## Recommandation
Si le but est d'améliorer radicalement **l'extraction de croquis dessinés à la main**, la **Piste 1 (OpenCV.js)** couplée à Potrace est la plus rapide à déployer.
Si le but est d'importer **des cartes texturées ou historiques**, la **Piste 3 (SAM en WebGPU)** représente l'état de l'art technologique.

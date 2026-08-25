# Rapport d'Audit Complet — Mode Braudel (Cartographie Historique Réelle)

Ce rapport d'audit présente la structure, les fonctionnalités et les spécificités du **Mode Braudel** (précédemment appelé « Monde réel ») suite à la réorganisation et au renommage global de l'application sous le nom de **Arda**.

---

## 1. Raisons et Rationale des Renommages

### L'Application : **Arda**
**Arda** désigne, dans le légendaire de J.R.R. Tolkien, la Terre dans son ensemble (physique et mythologique). Ce nom a été choisi comme marque ombrelle pour l'application car elle réunit deux approches de la cartographie : l'une basée sur notre Terre historique et l'autre basée sur la création purement fantastique et imaginaire.

### Le Mode Réel : **Braudel**
Le mode d'exploration historique réelle est nommé **Braudel** en hommage à **Fernand Braudel** (1902–1985), l'un des plus grands historiens français, chef de file de l'École des Annales. 
- **La pertinence** : Braudel a révolutionné l'histoire en théorisant la *« longue durée »* (le temps géographique et social qui s'écoule lentement) et en intégrant l'espace géographique comme acteur majeur de l'histoire (notamment dans son œuvre magistrale *La Méditerranée et le monde méditerranéen à l'époque de Philippe II*).
- **Le lien applicatif** : L'application s'appuie précisément sur cette philosophie : lier les entités historiques (villes, événements, empires) à leur géographie physique à travers une chronologie glissante (les siècles et les époques).

### Le Mode Fictif : **Tolkien**
Le mode de dessin procédural de mondes imaginaires est nommé **Tolkien** en hommage à **J.R.R. Tolkien**, le père fondateur de la fantasy moderne et maître incontesté du *worldbuilding* (création minutieuse de géographies, de langues et de chronologies fictives pour la Terre du Milieu).

---

## 2. Fonctionnalités Clés du Mode Braudel

Le mode **Braudel** s'appuie sur une carte globale du monde réel (projection Mercator / WebMercator standard) et offre des outils d'édition et de stylisation historiques avancés :

1. **Sélecteur de Styles Temporels / Époques** :
   Permet d'appliquer des filtres de rendu et des couches de fond de carte adaptées à l'époque étudiée :
   - *Antiquité (Tabula Peutingeriana)* : Texture de parchemin ocre doré, coloration vert-de-gris de l'eau, ombres en brun chaud.
   - *Moyen Âge (Al-Idrissi)* : Rotation de la carte de 180° (le Sud en haut, fidèle aux cartographes arabes médiévaux).
   - *Renaissance (Portulan)* : Lignes de rhumb radiales d'épaisseurs variables reliant des centres de vents historiques.
   - *Moderne (Gravure sur cuivre)* : Style de hachures et de gravures typiques du XVIIe-XVIIIe siècle.
   - *Colonial (XIXe siècle)* : Graticule dense (méridiens et parallèles tous les 20°) avec affichage sélectif et coloration des empires coloniaux (britannique en rouge, français en bleu, portugais en vert).
   - *Contemporain & Futuriste* : Fonds clairs, sombres, satellites ou cyberpunk néon avec scanlines et effets de pulsation.

2. **Édition Géométrique d'Entités Historiques** :
   - Placement de points (villes, batailles), lignes (itinéraires marchands, routes de campagne) et polygones (frontières d'empires).
   - Liaison dynamique entre entités physiques, acteurs historiques, événements temporels et concepts.

3. **Chronologie Glissante (Timeline)** :
   - Filtrage en temps réel des entités présentes sur la carte selon leur période de validité (`temporalRange`).
   - Animation de lecture temporelle avec vitesse ajustable.

---

## 3. Cartographie du Système de Fichiers & Fonctions Clés

Voici les fichiers principaux impliqués dans le mode **Braudel** :

```
braudel/src/
├── core/
│   ├── schema/
│   │   ├── types.ts          # Définition des types TS (World, Entity, Relation, etc.)
│   │   ├── world.ts          # Schéma de validation Zod et créateurs de mondes
│   │   ├── geopoliticaImport.ts # Configuration d'importations des couches historiques
│   │   └── network/
│   │       └── metrics.ts    # Calculs de centralités de degré, d'intermédiarité et de proximité
│   ├── services/
│   │   ├── cartography/
│   │   │   ├── map-service.ts    # Service principal gérant MapLibre (cœur du mode Braudel)
│   │   │   └── maplibre.ts       # Helpers et adaptateurs MapLibre
│   │   ├── import/
│   │   │   ├── geopoliticaRegistry.ts # Registre des 49 fonds GeoJSON mondiaux
│   │   │   └── geopoliticaImporter.ts # Service d'importation sans simplification de tracés
│   │   └── persistence/
│   │       └── indexeddb.ts      # Base locale IndexedDB avec requêtes indexées par worldId
│   └── app/
│       ├── state/
│       │   └── store.ts          # Store Zustand global (gestion de l'état, basemapStyle, chronology)
│       └── views/
│           ├── App.tsx           # Conteneur principal intégrant le HashRouter
│           ├── MapView.tsx       # Vue React de la carte MapLibre
│           ├── StylePanel.tsx    # Panneau de contrôle des styles, basemaps et reliefs
│           ├── TimelineView.tsx  # Barre chronologique double et interactive (DAW & Compact)
│           ├── GeopoliticaPanel.tsx # Interface d'importation de fonds historiques
│           ├── EntityPanel.tsx   # Éditeur d'entités avec filtrage par période active
│           ├── NetworkPanel.tsx  # Panneau de relations et dashboard des statistiques du réseau
│           ├── LegendPanel.tsx   # Légende cartographique flottante et escamotable
│           └── WelcomeScreen.tsx # Dashboard d'accueil et sélecteur de mondes enregistrés
```

### Fonctions et Méthodes Clés

#### 1. Rendu et Stylisation du Fond de Carte (`map-service.ts`)
- **`updateBasemapStyle(styleKey, labelsVisible, bordersVisible, activeEmpire)`** :
  Applique le style sélectionné sur la carte MapLibre. Gère la rotation de la carte (ex. 180° pour le style médiéval `medieval`), applique les filtres CSS d'époque sur le canvas de la carte (sépia, luminosité, contrastes), affiche/masque les frontières (`bordersVisible`) et gère la visibilité des repères textuels d'origine.
- **`applyMapPaintOverrides(overrides)`** :
  Modifie en temps réel les couleurs des couches géographiques de base (fond, eau, forêts) pour correspondre aux chartes graphiques historiques (ex. vert-de-gris de la Peutinger).
- **`setupRhumbCanvas(canvas, config)` & `drawRhumbLines(config)`** :
  Génère et anime le tracé des lignes de rhumb (roses des vents) sur un canvas superposé pour le style Renaissance.
- **`generateGraticule(step)` & `initColonialGraticuleLayer()`** :
  Calcule et génère à la volée les lignes de latitude et longitude sous forme de GeoJSON pour dessiner la grille géographique du style Colonial.

#### 2. Gestion de l'État Global & Duplication (`store.ts`)
- **`initFromDB(worldId)`** :
  Initialise l'application pour le monde demandé. Charge les enregistrements d'entités, de relations, de calques et d'historique en les filtrant via l'index IndexedDB `worldId`.
- **`deleteWorld(worldId)`** :
  Supprime le monde de la table `world` et effectue une suppression en cascade de tous ses calques, entités et relations associés.
- **`duplicateWorld(worldId, newName)`** :
  Duplique l'intégralité d'un monde. Remappe récursivement les identifiants uniques des calques et des entités pour préserver les liaisons relationnelles d'origine sans conflit d'IDs.

---

## 4. Audit des Avancées Récentes (Fonds Géopolitica & Réseau)

Les travaux récents ont doté le mode **Braudel** d'une infrastructure robuste pour l'importation de fonds mondiaux, doublée de fonctionnalités d'ergonomie avancées :

### A. Chargement Asynchrone Géopolitica
- **Aucune simplification géométrique** : Les polygones des frontières historiques conservent 100% de leur précision d'origine.
- **Chargement progressif** : Le store Zustand fournit l'état d'importation via `importProgress`, ce qui permet d'afficher en temps réel une barre de progression à l'utilisateur lors du traitement asynchrone par lots successifs de 50 entités.
- **Aperçu dynamique** : Les entités sélectionnées sont dessinées en temps réel sur une couche temporaire MapLibre (`geopolitica-preview-layer`) avant validation finale.

### B. Frise DAW Rétractable & Mini-Lecteur
- **DAW Multi-pistes** : Les entités importées sont représentées par des blocs colorés interactifs empilés horizontalement sur des pistes individuelles sans chevauchement.
- **Bandes temporelles de référence** : Des repères verticaux discrets rappellent les années clés des cartes Géopolitica disponibles. Cliquer sur l'une d'elles repositionne la timeline.
- **Double affichage simultané (Haut / Bas)** : La frise DAW du bas est rétractable d'un clic, faisant apparaître un mini-lecteur simplifié en haut de l'écran par glissement synchrone.

### C. Organisation Temporelle de l'Éditeur d'Entités (`EntityPanel`)
- L'éditeur d'entités filtre la liste pour ne présenter que les entités valides à l'instant précis de la frise chrono. La sélection d'une période dans l'éditeur recale le playhead sur son année de référence et vice-versa.

### D. Panneau de Légende Escamotable (`LegendPanel`)
- Un panneau de verre dépoli (glassmorphism) flottant en haut à droite détaille la sémiologie graphique (surfaces, lignes, points) et liste dynamiquement toutes les entités du projet actives à la date sélectionnée.

### E. Analyse de Réseau Avancée (Lot 8)
- **Métriques Complexes de Centralité** :
  - *Degré* : Compte des connexions directes par nœud.
  - *Centralité de Proximité (Closeness)* : BFS calculant la somme des chemins les plus courts (formule de Wasserman-Faust pour graphes non connexes).
  - *Centralité d'Intermédiarité (Betweenness)* : Implémentation complète de l'algorithme de Brandes en $O(|V||E|)$.
- **Exploration Égo-Réseau** : Mode interactif permettant d'isoler un nœud sélectionné (égo) et ses voisins directs du premier degré pour simplifier l'analyse visuelle.
- **Tableau de Bord Réactif** : Affichage dans la barre latérale du décompte des nœuds, des liens et de la densité du réseau à l'instant `currentTime`, ainsi que le Top 3 des nœuds les plus influents.

### F. Routage Multi-Mondes & Persistance Avancée (Lot 9)
- **Indexation dans IndexedDB** : Isolation stricte des données de chaque monde via l'index `worldId`.
- **Routage Dynamique** : Intégration de `react-router-dom` (HashRouter) configurant les routes `/` (écran d'accueil) et `/world/:id` (espace de travail). Un bouton « Accueil » dans la barre latérale facilite la navigation de retour.
- **Opérations de Gestion** : Écran d'accueil listant les mondes avec fonctionnalités d'ouverture directe, de duplication et de suppression en cascade.

---

## 5. Phase de Finalisation, Qualité & Intégration (Lots 4, 5, 6 & 7 Complétés)

L'ensemble des phases d'ingénierie logicielle a été mené à terme avec succès :

### A. Édition Géométrique Strictement Typée (Lot 5)
- **Typage Robuste** : Les géométries sont régies par des schémas Zod stricts (Point, LineString, Polygon) au sein du module `entities.ts`.
- **Placement Graphique & Affichage** : Ajout et déplacement de points sur le canvas de dessin de `map-service.ts` liés réactivement à l'éditeur `EntityPanel.tsx`, avec affichage textuel de coordonnées géographiques précises et masquage automatique des points factices/pseudo-aléatoires.

### B. Intégration de l'Intelligence Artificielle Locale (Lot 6)
- **Adaptateur Ollama** : Création de `ollama-adapter.ts` assurant la communication HTTP structurée, la gestion des pannes et des tentatives multiples.
- **Support de Streaming** : Implémentation du streaming en temps réel avec des indicateurs dynamiques d'état et de configuration de modèle local.

### C. Qualité Logicielle & Automatisation (Lot 7)
- **Tests d'Intégration** : Déploiement d'une suite d'intégration complète simulant tout le cycle de vie du projet (Création → Édition → Persistance → Rechargement) avec 100% de succès.
- **Formatage & Linters** : Intégration des fichiers de configuration `../../.eslintrc.json` et `../../.prettierrc` pour standardiser le code TypeScript/React.
- **Intégration Continue (CI)** : Écriture du workflow GitHub Actions `../../.github/workflows/ci.yml` automatisant les tests et le build à chaque modification.
- **Documentation Centrale** : Production du fichier `../../README.md` résumant l'architecture d'Arda, ses fonctionnalités, l'installation et le développement.


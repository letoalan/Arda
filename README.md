# Arda — Plateforme de Cartographie Historique et Fantastique

**Arda** est une application web interactive et moderne conçue pour relier la géographie physique et l'histoire à travers le temps. Elle propose deux modes distincts et complémentaires : le mode **Braudel** (pour l'histoire réelle) et le mode **Tolkien** (pour la création procédurale d'univers imaginaires).

---

## 🌟 Fonctionnalités Principales

### 🌍 1. Le Mode Braudel (Cartographie Réelle & Histoire longue durée)
Nommé en hommage à l'historien Fernand Braudel, ce mode explore les entités historiques du monde réel sur une chronologie glissante :
- **Sélecteur de Styles Temporels / Époques** : 
  - *Antiquité (Tabula Peutingeriana)* : rendu parchemin ocre doré et vert-de-gris.
  - *Moyen Âge (Al-Idrissi)* : carte orientée avec le Sud en haut, fidèle aux cartographes arabes.
  - *Renaissance (Portulan)* : roses et lignes de rhumb radiales d'épaisseurs variables.
  - *Moderne (Gravure)* : style typique de hachures et de gravures sur cuivre.
  - *Colonial (XIXe siècle)* : graticule dense et mise en surbrillance des empires.
  - *Contemporain & Cyberpunk* : thèmes sombres/clairs et interfaces néons interactives.
- **Timeline Multi-pistes (Style DAW)** : Visualisation chronologique des entités sous forme de blocs de couleur interactifs empilés horizontalement sur des pistes individuelles, avec mini-lecteur rétractable synchrone.
- **Chargement Géopolitica Asynchrone** : Importation progressive sans simplification géométrique de 49 fonds de carte GeoJSON historiques.
- **Analyse de Réseau Historique (Network Analytics)** :
  - Métriques de centralité (Degré, Centralité d'Intermédiarité via Brandes, Centralité de Proximité via BFS).
  - Mode égo-réseau interactif pour filtrer et isoler un nœud et ses relations de premier niveau.
  - Dashboard de statistiques temporelles réactives.

### 🎨 2. Le Mode Tolkien (World Builder Procédural & Relief Synthétique)
Nommé en hommage à J.R.R. Tolkien, ce mode permet de dessiner et de modeler des mondes fantastiques :
- **Dessin libre sur Canvas** : Outil de tracé de côtes, de chaînes de montagnes, de collines, de lignes de failles (rifts) ou de fosses océaniques.
- **Générateur de DEM Synthétique (`generateSyntheticDEM`)** :
  - *Raycasting* précis pour délimiter terre et mer.
  - Pente d'adoucissement basée sur la distance aux côtes.
  - Bruit Simplex fractal multi-octaves pour texturer le relief.
  - Passes géomorphologiques intelligentes : surélévation des montagnes puis creusement réaliste des vallées (profil transversal en U/V et profil longitudinal de l'amont vers l'aval, bridé à 60% de l'altitude environnante).
- **Rendu Raster-DEM & Hillshade** : Tuilage raster dynamique à la volée converti au format standard Terrain-RGB et rendu tridimensionnel (Hillshade GPU) sous MapLibre.
- **Repères Géographiques Statiques** : Affichage d'un graticule de référence (Équateur, Tropiques, Cercles Polaires) avec interrupteur dédié.

### 🤖 3. Connecteur IA Réel (Ollama)
Intégration d'un assistant IA local-first pour enrichir la cartographie :
- Adaptateur `OllamaIAAdapter` pour requêtes structurées (Génération d'entités, suggestion de relations basées sur l'ontologie, et suggestions de noms historiques).
- Support du streaming en direct dans l'interface `IAPanel` avec indicateur de connectivité au serveur local Ollama.

### 💾 4. Architecture Local-First & Routage
- **Persistance IndexedDB** : Isolation stricte des mondes et des entités via l'index `worldId`.
- **Routage Dynamique** : Propulsé par `react-router-dom` (routes `/` pour l'accueil/gestion des mondes et `/world/:id` pour l'espace de travail).
- **Gestion des mondes** : Écran d'accueil avec support pour la création, duplication récursive sans collision d'ID, et suppression en cascade.

---

## 🛠️ Installation & Démarrage

### Prérequis
- [Node.js](https://nodejs.org/) (v20 recommandé)
- Un serveur [Ollama](https://ollama.com/) local actif (optionnel, pour les fonctionnalités IA)

### Guide de démarrage
1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Lancer le serveur de développement local :
   ```bash
   npm run dev
   ```
3. Lancer les tests unitaires et d'intégration :
   ```bash
   npm run test -- --run
   ```
4. Compiler le projet pour la production :
   ```bash
   npm run build
   ```

---

## 📚 Documentation Technique ("Wiki-as-Code")

Le projet est documenté selon une approche **Wiki-as-Code** intégrée directement dans le dépôt :
- 🗺️ **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** : Vue d'ensemble de l'architecture, diagrammes de flux et carte des secteurs.
- 📁 **[src/src.md](braudel/src/src.md)** : Documentation du dossier source et sous-systèmes.
- ⚙️ **[src/app/state/state.md](braudel/src/app/state/state.md)** : Documentation de la gestion d'état centralisée Zustand.
- 🗺️ **[src/services/cartography/cartography.md](braudel/src/services/cartography/cartography.md)** : Documentation du module de cartographie vectorielle MapLibre.
- 💾 **[src/services/persistence/persistence.md](braudel/src/services/persistence/persistence.md)** : Document de la persistance locale IndexedDB.

---

## 🏗️ Structure du Code

- `src/core/schema` : Schémas de validation Zod et définitions de types TS (`types.ts`, `world.ts`, `entities.ts`).
- `src/core/network` : Algorithmes mathématiques d'analyse de graphes (`metrics.ts`).
- `src/services/cartography` : Gestion et configuration de la carte MapLibre, du dessin vectoriel et des protocoles mémoires (`map-service.ts`).
- `src/services/ia` : Adaptateurs IA et clients de streaming (`ollama-adapter.ts`, `ai-service.ts`).
- `src/utils` : Utilitaires de conversion géospatiale et de génération de DEM procédural (`generateSyntheticDEM.ts`, `generateDEMTiles.ts`, `encodeTerrainRGB.ts`).
- `src/app/views` : Composants et vues React (`WelcomeScreen.tsx`, `MapView.tsx`, `TimelineView.tsx`, `EntityPanel.tsx`, `NetworkPanel.tsx`).
- `src/app/state` : Gestion globale de l'état avec Zustand (`store.ts`).


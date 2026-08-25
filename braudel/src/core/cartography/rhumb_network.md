# Module `rhumb_network.ts`

## Rôle
Génération géométrique et export du réseau portulan sous forme de **triangulation de Delaunay clairsemée et hiérarchisée**, éliminant les graphes complets O(n²) et les lignes orphelines.

## Topologie du Réseau (Triangulation de Delaunay)
- Utilisation de la bibliothèque `delaunator` en $O(n \log n)$.
- **Extraction stricte des arêtes uniques des triangles** (`extractDelaunayEdges`) : chaque nœud n'est connecté qu'à ses voisins géométriques immédiats (~2 à 3 arêtes en moyenne par nœud).
- **Suppression intégrale des rayons infinis/orphelins** : toutes les arêtes sont des segments définis reliant une source et une cible identifiées.

## Hiérarchie Level-of-Detail (LOD) & Tiers
- **Tier `major` (10 nœuds fondamentaux, minZoom = 1)** :
  - Crète (nœud 0 d'ancrage), Açores, Sud du Groenland (Cap Farewell), Caraïbes, Magellan, Cap de Bonne-Espérance, Bombay, Mascareignes, Malacca, Macao.
  - Triangulation initiale à grande échelle formant l'ossature mondiale visible dès la vue globale.
- **Tier `secondary` (26 sous-nœuds, minZoom = 3)** :
  - Relais côtiers, détroits et navigation (Djeddah en Mer Rouge, Zanzibar sur la Côte Swahili, Surate au Gujarat, Saint-Pétersbourg dans le Golfe de Finlande, Terre-Neuve, Islande, Îles Féroé, Norvège / Bergen, Caffa en Mer Noire, Mascate dans le Golfe d'Oman, Anvers, Lübeck, Bermudes, Mexico, Lima, Mer d'Arabie, Sumatra, Manille, Tsushima, etc.).
  - Triangulation enrichie révélée dynamiquement au zoom continental/régional (zoom ≥ 3).

## Identité Visuelle & Couleurs des Arêtes
- **`NODE_COLORS`** : Teinte unique attribuée à chaque nœud (sienne, indigo, orange épice, rouge laqué...).
- **Data-Driven Styling** :
  - `circle-color: ['get', 'center_color']` : Remplissage immédiat du nœud et de sa rose.
  - `line-color: ['get', 'source_color']` : Arête teintée selon son nœud d'origine.
  - `line-dasharray` : Trait plein continu pour le réseau majeur, tireté fin pour le sous-réseau secondaire.

## Fonctions Exportées
- `extractDelaunayEdges(nodes)` : Calcule la triangulation et retourne la liste dédoublonnée des arêtes adjacentes.
- `buildTierNetwork(nodes)` : Construit le graphe multi-échelles avec attribution des tiers (`major` vs `secondary`) et seuils de zoom (`minZoom`).
- `generateRhumbGeoJSON(config)` : Produit les FeatureCollections GeoJSON `lines` et `nodes`.
- `resolveNodeColor(node)` : Résout la couleur unique du nœud.
- `exportRhumbNetwork(config)` : Exporte la configuration et le cache GeoJSON.

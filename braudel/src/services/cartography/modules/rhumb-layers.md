# Module `rhumb-layers.ts`

## Rôle
Gestion du rendu cartographique MapLibre pour le réseau maillé de Delaunay portulan.

## Level-of-Detail (LOD) & Styles Graphiques
- **Filtrage par zoom** : `filter: ['<=', ['get', 'min_zoom'], ['zoom']]`.
- **Réseau Majeur (Zoom ≥ 1)** :
  - Trait plein (`line-width: 1.2px`, `line-opacity: 0.55`).
  - Arêtes triangulées reliant les 9 centres planétaires principaux.
- **Sous-Réseau Secondaire (Zoom ≥ 3)** :
  - Trait tireté (`line-dasharray: [3, 2]`, `line-width: 0.7px`, `line-opacity: 0.35`).
  - Densification locale autour des détroits et ports régionaux.

## Couleurs & Rendu des Nœuds
- `rhumb-centers` : Cercles de taille et couleur distinctes (`circle-color: ['get', 'center_color']`), bordure ornée selon le preset historique (`roseBorder`).
- `rhumb-lines` : Arêtes colorées d'après le nœud source (`line-color: ['get', 'source_color']`).

## Fonctions Exportées
- `initRhumbNetworkLayer(map, config)` : Initialise les sources GeoJSON et calques MapLibre.
- `updateRhumbPalette(map, preset)` : Met à jour la bordure des centres selon le preset de style.
- `toggleRhumbLines(map, visible)` : Active/désactive l'affichage du réseau de rhumbs.

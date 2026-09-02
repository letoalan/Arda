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
- `initRhumbNetworkLayer(map, initialVisibility, config, styleId)` : Initialise les sources GeoJSON et calques MapLibre avec la palette appropriée, insérés avant `braudel-polygons`.
- `updateRhumbPalette(map, preset, styleId)` : Met à jour la couleur et l'opacité des arêtes (`rhumb-lines`) ainsi que la bordure des centres (`rhumb-centers`) selon le preset historique et les caractéristiques du fond de carte (sombre, satellite, ornemental).
- `toggleRhumbLines(map, visible, styleId)` : Active ou désactive l'affichage du réseau de rhumbs avec masquage strict. Auto-répare les calques s'ils ont été supprimés par un cycle de style MapLibre.
- Logs de diagnostic horodatés via `logCarto`.

## Résolution des Blocages d'Activation & Palettes Étendues
- **Élimination du blocage `isStyleLoaded()`** : Remplacement par `typeof map.getStyle === 'function' && !map.getStyle()`. Permet l'activation instantanée des lignes de rhumb sans attente d'un événement `style.load` qui n'était jamais émis sur les mondes fictifs ou lors des changements de styles sur Positron.
- **Palettes et Contrastes Historiques & Fantasy** : Prise en charge explicite et rehaussée pour Peutinger (`antiquity`), Idrissi (`al_idrisi`), Portulan (`medieval`), Maior Blaeu (`renaissance`), Cassini (`modern`), Jules Verne (`jules_verne`) et les 3 univers Tolkien (High, Light, Dark).


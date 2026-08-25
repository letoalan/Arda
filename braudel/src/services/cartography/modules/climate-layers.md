# Documentation — Rendu Climatique MapLibre (`climate-layers.ts`)

## Rôle & Responsabilité
`climate-layers.ts` gère la création et l'actualisation dynamique des couches cartographiques climatiques dans MapLibre GL JS :
1. `getWaterColorForBasemapStyle(styleId, map)` : Détermine la teinte exacte de l'eau en fonction du style actif (overrides de style, inspection des couches vectorielles de tuiles ou couleurs canoniques de secours) pour rendre la submersion marine 100% indiscernable du plan d'eau ouvert.
2. `generateIceCapsGeoJSON(iceCapLatitude)` : Génère la géométrie polygonale polaire pour les hémisphères Nord et Sud selon la latitude limite courante.
3. `generateSeaLevelGeoJSON(seaLevelMeters)` : Génère les polygones dynamiques d'inondation côtière (Low Elevation Coastal Zones) lors des transgressions marines ($>0$ m) ou l'émergence des plateaux continentaux lors des glaciations ($<-10$ m).
4. `setupClimateLayers(map)` : Initialise les sources et calques vectoriels `ice-caps-fill`, `ice-caps-border`, et `sea-level-fill` (positionné sous les étiquettes et bordures administratives).
5. `updateIceCapsLayer(map, iceCapLatitude, visible)` : Met à jour dynamiquement les données et la visibilité des calottes polaires.
6. `updateSeaLevelLayer(map, seaLevelMeters, visible, styleId)` : Met à jour dynamiquement la submersion côtière avec la couleur d'eau identique au fond cartographique sélectionné, avec opacité pleine et sans contour artificiel.

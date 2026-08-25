# Documentation — Physique & Dégradés Climatiques (`climatePhysics.ts`)

## Rôle & Responsabilité
`climatePhysics.ts` centralise les calculs physiques, hydrographiques et thermiques du simulateur climatique :
1. `tempToSeaLevel(deltaTemp)` : Convertit une anomalie de température (°C) en variation de niveau marin (mètres, au pas de 0.1 m).
2. `tempToIceCapLatitude(deltaTemp)` : Convertit une anomalie de température en latitude seuil pour les calottes polaires (30° à 90°).
3. `tempToClimateColor(deltaTemp)` : Associe une couleur thermique continue calibrée (bleu polaire `#1e3a8a`, cyan glacial `#38bdf8` pour les Petits Âges Glaciaires / forçages volcaniques, vert d'eau `#10b981` pour le climat pré-industriel stable, ambre `#fbbf24` pour les Optima Romain et Médiéval, orange `#f97316` et rouge écarlate `#ef4444` pour le réchauffement anthropique).
4. `generateClimateGradient(points, minYear, maxYear, samples)` : Génère dynamiquement une règle CSS `linear-gradient` reflétant fidèlement les oscillations climatiques réelles sur toute la période couverte par la timeline.
5. `interpolateClimateAtYear(points, year)` : Interpolation linéaire par morceaux entre points temporels.
6. `filterOceanConnectivity(grid, seaLevel, width, height)` : Inondation BFS garantissant l'exclusion des dépressions continentales isolées.

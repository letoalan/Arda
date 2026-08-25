# Documentation — Traitement Hypsométrique des Vallées et Reliefs (`generateSyntheticDEM.ts` & `map-service.ts`)

## Rôle
Intègre les vallées, collines et montagnes dessinées dans le modèle DEM 3D sans afficher de contour vectoriel parasite.

## Nouveautés
1. **Suppression des contours internes** :
   - Le calque de côte `braudel-continents-outline` filtre désormais strictement `type === 'continent'`, éliminant les traits noirs autour des vallées et des collines intérieures.
2. **Creusement 3D des Vallées dans le DEM** :
   - Les polygones dessinés avec l'outil *Vallée* (`type: 'valley'`) sont traités dans `generateSyntheticDEM` comme des dépressions géologiques douces (`elevation * (0.35 + 0.3 * (1 - valleyFactor))`), créant un encaissement naturel du terrain plutôt qu'un tracé géométrique.
3. **Accentuation des Montagnes et Collines** :
   - Les crêtes montagneuses (`type: 'mountain'`) voient leur pic passer à `3200m` avec rayon élargi (`5.0°`).
   - Les zones de collines (`type: 'hills'`) bénéficient d'un rehaussement de `+400m à +900m` avec bruit Simplex dédié.

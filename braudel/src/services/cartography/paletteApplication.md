# Documentation — Application Intégrale des Palettes Cartographiques (`map-service.ts`)

## Rôle
Assure l'application instantanée et dynamique de l'ensemble des palettes de couleurs (mer, terre, trait de côte, ombres et lumières du relief) quel que soit le style de tuile vectorielle sélectionné (Al-Idrisi, Portulan, Cassini, Tolkien, Dark Fantasy...).

## Synchronisation Globale des Teintes
Lorsqu'un style est choisi dans l'interface :
1. **Océan / Mer** :
   - Mise à jour immédiate de `background-color` sur la couche `bg` avec la teinte `water` du thème (ex: `#1d65a6` pour Al-Idrisi, `#123a5c` pour Tolkien High Fantasy, `#0d0f14` pour Dark Fantasy).
2. **Continents & Terres Émergées** :
   - Mise à jour de `fill-color` sur `braudel-continents-fill` avec la teinte `landcover` (ex: `#f0e2b6` pour Al-Idrisi, `#e8dfcb` pour Blaeu, `#8a9a6e` pour High Fantasy).
3. **Trait de Côte & Estran** :
   - Mise à jour de `line-color` sur `braudel-continents-outline` avec la bordure `borderColor`.
4. **Relief 3D Hillshade** :
   - Mise à jour des teintes `hillshade-shadow-color` (ombres chaudes ou froides) et `hillshade-highlight-color` (hautes lumières accordées à la tonalité du parchemin actif).

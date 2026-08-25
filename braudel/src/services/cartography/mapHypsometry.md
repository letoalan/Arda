# Documentation — Rendu Hypsométrique & Masque Océanique (`map-service.ts`)

## Rôle
Garantit un contraste parfait entre l'océan profond et les terres émergées pour les mondes imaginaires (Tolkien / Arda / Al-Idrisi / Cassini / Cyberpunk).

## Architecture des Calques et Masquage Océanique
1. **Calque de Fond (`bg`)** : Teinte océanique de base issue du style sélectionné.
2. **Relief 3D Hillshade (`braudel-synth-hillshade`)** : Rendu raster-DEM complet Terrarium calculé de façon procédurale (FBM multi-octaves).
3. **Masque Océanique Inversé (`braudel-ocean-mask`)** :
   - Polygone couvrant l'ensemble de la carte mondiale avec des trous découpés au niveau de chaque continent (`buildOceanMaskGeoJSON`).
   - Rempli à **100% d'opacité** avec la couleur exacte de la mer (`overrides.water`, ex: `#123a5c` pour Tolkien High Fantasy, `#1d65a6` pour Al-Idrisi).
   - Masque hermétiquement tout résidu de hillshade ou de blanchiment dans l'océan.
4. **Teinte Continentale Hypsométrique (`braudel-continents-fill`)** :
   - Calque de polygone posé uniquement à l'intérieur des continents avec la couleur de terre (`overrides.landcover`, ex: `#8a9a6e` olive, `#f0e2b6` or antique).
   - Opacité calibrée (`0.65`) pour draper le relief 3D (montagnes, collines, vallées) et lui donner sa texture colorée éclatante.
5. **Trait de Côte Net (`braudel-continents-outline`)** :
   - Ligne franche (`2.0px`, opacité `0.9`) découpant nettement les rivages terrestres sur la mer.

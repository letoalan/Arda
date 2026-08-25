# Documentation — Gestionnaire des Styles et Thèmes Cartographiques (`map-service.ts`)

## Rôle & Dynamique de Style
`setBasemapStyle` applique en temps réel les spécificités de chaque style vectoriel sélectionné :
1. **Orientation Historique (`bearing`)** :
   - Pour les styles avec orientation géographique particulière comme **Al-Idrisi (`bearing: 180`)**, la caméra pivote avec animation fluide pour afficher le **Sud en haut** conformément à la cartographie islamique médiévale.
2. **Couleurs Océaniques & Terrestres Dynamiques** :
   - En monde imaginaire, le changement de style modifie immédiatement :
     - La couleur de l'océan (`background-color` $\to$ `overrides.water`, ex: `#1d65a6` pour Al-Idrisi).
     - La couleur de base des continents (`braudel-continents-fill` $\to$ `overrides.landcover`, ex: `#f0e2b6` pour Al-Idrisi).
     - Le trait de côte (`braudel-continents-outline` $\to$ `overrides.borderColor`, ex: `#B8860B` or antique).
3. **Lignes de Rhumb & Roses des Vents** :
   - Activation automatique des lignes de rhumb et portulans pour `medieval`, `renaissance` et `al_idrisi`.

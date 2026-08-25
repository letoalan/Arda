# Documentation — Gestionnaire des Styles Cartographiques (`mapStylesManager.ts`)

## Rôle & Responsabilité
`mapStylesManager.ts` applique les styles de carte, les surcharges de rendu (couleurs, textures, graticules, hillshade) :
1. **Désactivation du Hillshade Terrestre en Mode Fictif** :
   - `applyReliefStyle` prend en compte `worldType`. En mode monde imaginaire (`worldType === 'fictional'`), le calque d'ombrage raster AWS Terrarium/Mapzen de la Terre réelle (`braudel-hillshade`) est strictement désactivé/masqué pour garantir une tuile vierge.
2. **Surcharges Vectorielles & Rasters** :
   - Prise en charge des imageries satellites Esri et nocturnes NASA GIBS pour les styles contemporains et futuristes.
   - Contrôle granulaire de la visibilité des routes, frontières, cours d'eau et étiquettes.

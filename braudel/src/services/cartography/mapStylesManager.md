# Documentation — Gestionnaire des Styles Cartographiques (`mapStylesManager.ts`)

## Rôle & Responsabilité
`mapStylesManager.ts` applique les styles de carte, les surcharges de rendu (couleurs, textures, graticules, hillshade) :
1. **Désactivation du Hillshade Terrestre en Mode Fictif** :
   - `applyReliefStyle` prend en compte `worldType`. En mode monde imaginaire (`worldType === 'fictional'`), le calque d'ombrage raster AWS Terrarium/Mapzen de la Terre réelle (`braudel-hillshade`) est strictement désactivé/masqué pour garantir une tuile vierge.
2. **Bornage Strict de l'Exagération du Relief (`hillshade-exaggeration` $\le$ 1.0)** :
   - Clamping automatique de `exaggeration` dans l'intervalle strict `[0, 1.0]` conformément à la spécification MapLibre GL v4+. Empêche l'erreur de validation `1.5 is greater than the maximum value 1` et supprime les boucles de recalcule intempestives.
3. **Surcharges Vectorielles & Rasters** :
   - Prise en charge des imageries satellites Esri et nocturnes NASA GIBS pour les styles contemporains et futuristes.
   - Contrôle granulaire de la visibilité des routes, frontières, cours d'eau et étiquettes.
   - **Immunité Totale des Calques de Repères et Décoratifs** : `applyLabelsVisibility`, `applyBordersVisibility` et `applyRoadsVisibility` ignorent scrupuleusement les calques préfixés par `rhumb-`, `colonial-`, `geo-reference-` et `braudel-` pour éviter tout masquage collatéral.
   - **Traçabilité `logCarto`** : Journalisation horodatée de `APPLY_BASEMAP_STYLE` et `APPLY_PAINT_OVERRIDES_START`.
   - **Déduplication de `map.setStyle` (`activeStyleUrl`)** : Si le style demandé possède la même URL que le style actuellement actif (ex: passage de `medieval` à `renaissance`, tous deux sur Positron), `applyBasemapStyle` réutilise le pipeline WebGL sans appeler `map.setStyle()`, évitant toute perte de contexte WebGL.

# Documentation Technique : `src/core/styles.config.ts`

## Rôle du Fichier
Le fichier [`styles.config.ts`](./styles.config.ts) centralise l'ensemble des définitions, types, registres et utilitaires de configuration des fonds de carte thématiques du projet Braudel (styles historiques réels et styles fantasy).

## Types et Définitions Clés
- **`BasemapStyleId`** : Union des identifiants valides de fonds de carte (ex: `'antiquity'`, `'medieval'`, `'renaissance'`, `'al_idrisi'`, `'tolkien_high_fantasy'`, etc.).
- **`StyleConfig`** : Interface détaillant chaque style :
  - `id`: `BasemapStyleId`
  - `name`: Libellé affiché
  - `era`: Époque représentée
  - `bearing`: Orientation par défaut (degrés de rotation, `0` = Nord en haut, `180` = Sud en haut)
  - `bordersVisibleByDefault`: Affichage initial des frontières
  - `mapStyleUrl`: URL du style JSON MapLibre GL
  - `texture`: Options de texturation (vignettage, blendMode, bruit, bordure)
  - `rhumbLines`: Configuration du réseau de rhumbs et roses des vents

## Utilitaires Spécifiques & Résolution d'Orientation
### `getEffectiveStyleBearing(styleId?: string, explicitBearing?: number): number`
Résout l'orientation canonique de la carte selon le style :
- **Al-Idrisi (`al_idrisi`, détection insensible à la casse et motifs `*idrisi*`)** : La carte islamique médiévale de 1154 (*Nuzhat al-Mushtāq*) est traditionnellement orientée **Sud en haut**. Si `explicitBearing` n'est pas spécifié ou vaut `0`, la fonction renvoie automatiquement **`180`**. Si un cap personnalisé explicite différent de 0 est fourni (ex: 185°), celui-ci est respecté.
- **Autres styles** : Renvoie le cap explicite fourni ou `0` (Nord en haut).

## Références
- Parent : [`core.md`](./core.md)
- Consommateurs : [`DataPanel.tsx`](../app/views/DataPanel.tsx), [`StudioTimeline.tsx`](../app/components/studio/StudioTimeline.tsx), [`camera-orchestrator.ts`](../services/cartography/camera-orchestrator.ts), [`map-service.ts`](../services/cartography/map-service.ts), [`studio-types.ts`](../services/export/studio-types.ts).

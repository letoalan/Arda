# Documentation — Typage et Structure ArdaDoc / Bento (`bento-types.ts`)

## Rôle et Responsabilités
`bento-types.ts` implémente le modèle de données du format d'export HTML Carte-Récit interactif :
- **`ArdaDoc`** : Document racine auto-portant contenant la configuration cartographique dynamique (`map.styleUrl`, `map.styleId`), l'axe temporel (`timeline`), les points d'ancrage (`waypoints`), les diapositives d'appui (`slides`) et les données GeoJSON inlinées.
- **`ArdaWaypoint`** : Point temporel ($T$) articulant l'orientation et position de caméra (`cameraState`), le texte narratif et les références vers les diapositives (`slideRefs`).
- **`ArdaSlide`** : Diapositive d'illustration enrichie attachée à un waypoint (`attachedToWaypoint`) avec politique de retour sans perte de position (`returnBehavior: 'same-waypoint'`).
- **`ArdaSlideElement`** : Composants modulaires de mise en page Bento (textes, images, encadrés, tableaux, graphiques, formes).
- **`convertStoryProjectToArdaDoc`** : Convertisseur universel des projets narratifs `StoryProject` en documents `ArdaDoc` avec **extraction temporelle exhaustive** de toutes les étapes et époques des entités (`validFrom`, `validTo`, points médians) si aucun projet narratif multi-scènes n'est fourni.

## Fil d'Ariane
[services/](../../services.md) -> [export/](../export.md) -> [modules/](./modules.md) -> **bento-types.md**


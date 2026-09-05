# Orchestrateur de Caméra Cartographique (`camera-orchestrator.ts`)

## Rôle
`camera-orchestrator.ts` est responsable des transitions fluides et cinématiques de la caméra MapLibre GL entre différentes scènes ou périodes temporelles (interpolations géographiques, zooms, rotations de cap `bearing`, inclinaisons 3D `pitch`).

## Fonctions Clés

### 1. `selectOptimalTransitionType`
Détermine le mode de déplacement optimal entre l'état caméra actuel et la cible :
- `'static'` : La position géographique, le zoom, le bearing et le pitch sont quasi identiques (`distKm < 1`, `deltaZoom < 0.1`, `deltaBearing < 1°`, `deltaPitch < 1°`).
- `'pan'` : Déplacement local à zoom équivalent (`distKm < 150km`).
- `'flyTo'` : Déplacement moyenne ou longue distance nécessitant un arc de vol cinématique (`flyTo`).

### 2. `playSceneTransition`
Exécute la transition sur l'instance MapLibre GL :
- **Prise en charge stricte du mode `static`** : Même si le déplacement est nul, applique immédiatement `map.jumpTo({ center, zoom, bearing, pitch })` afin de garantir que les orientations ou inclinaisons spécifiques (ex: 180° Sud pour Al-Idrisi ou pitch 3D) ne soient jamais ignorées.
- **Résolution Automatique et Universelle du Cap (`getEffectiveStyleBearing`)** : Résout systématiquement l'orientation cible d'après le style de fond (`toState.basemapStyle`), avec repli dynamique vers le style actif courant (`mapService.getCurrentStyleId()`) ou l'état précédent (`fromState.basemapStyle`). Pour la carte médiévale Al-Idrisi, applique automatiquement 180° (Sud en haut) sur 100% des diapositives dès lors que le bearing n'a pas été explicitement personnalisé à une valeur non nulle.
- **Mode Export (`isExport: true`)** : Ignore la pause post-vol interne (`pauseAfterMs = 0`) pour laisser le moteur d'export vidéo (`video-export.ts` / `TimelineScheduler`) contrôler strictement le cadencement et la durée de chaque plan sans dérive temporelle par rapport à la piste audio.
- **Gestion des promesses** : Attend la fin de l'animation MapLibre (`moveend`) avec un délai garde-fou pour éviter tout blocage asynchrone.

## Fil d'Ariane
[services/](../services.md) -> [cartography/](./cartography.md) -> **camera-orchestrator.md**

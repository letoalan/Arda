# Documentation — Points de Rupture Temporels (`changepoints.ts`)

## Rôle et Responsabilités
`changepoints.ts` extrait dynamiquement tous les instants clés (points de rupture) où l'ensemble des entités actives change le long de la chronologie (apparition, disparition ou mise à jour de bornes).

## Fonctions Principales
- `computeChangepoints(entities)` : Calcule et trie l'ensemble dédupliqué des dates de début et de fin (`validFrom`, `validTo`).
- `getNextChangepoint(currentTime, changepoints)` : Retourne le prochain instant de modification chronologique strictement supérieur à l'instant courant, ou `null` si la timeline est achevée.
- `getPreviousChangepoint(currentTime, changepoints)` : Retourne le point de rupture immédiatement antérieur (période -1).
- `computeCoverageTimelineYears(startYearParam, changepoints, maxPages)` : Calcule l'ensemble complet des instants chronologiques à capturer en se calant sur la période antérieure pour garantir une couverture exhaustive.

## Fil d'Ariane
[services/](../services.md) -> [timeline/](./timeline.md) -> **changepoints.md**


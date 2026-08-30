# TimelineView.tsx

## Rôle
Frise chronologique rétractable au bas de l'écran. Affiche les blocs temporels des entités et contrôle l'année courante ainsi que la lecture automatique (playback).

## Fonctionnalités
- Intègre un mode **Lecture Automatique (Play/Pause)** avec cadence temporelle calibrée (intervalles réguliers à $100\text{ms}$ par pas fractionnaires `playbackSpeed / 10`) permettant aux entités historiques de s'activer et de s'afficher instantanément sur la carte sans à-coup ni délai de latence.
- Propose un sélecteur de vitesses enrichi (1, 5, 10, 25, 50, 100, 250 ans/s).
- Fournit la piste paléo-climatique avec dégradé hypsométrique et synchronisation du niveau de la mer.

## Emplacement
`src/app/views/TimelineView.tsx`

## Dépendances Entrantes
- `App.tsx` (../App.md)

## Dépendances Sortantes
- `store.ts` (../state/store.md)

## Secteur Parent
[views/](./views.md) -> [app/](../app.md) -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)

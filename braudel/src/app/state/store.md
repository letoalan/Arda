# store.ts

## Rôle
Point d'entrée du store Zustand (`useStore`). Combine et ré-exporte l'ensemble des actions et sélecteurs de l'état applicatif.

## Emplacement
`src/app/state/store.ts`

## Dépendances Entrantes (qui l'utilise)
- L'ensemble des vues React (`MapView.tsx`, `EntityPanel.tsx`, `GeopoliticaPanel.tsx`, `TimelineView.tsx`, etc.)

## Dépendances Sortantes (ce qu'il utilise)
- `indexeddb.ts` (../../services/persistence/indexeddb.md) : Persistance asynchrone IndexedDB
- `worldSlice.ts` (./worldSlice.md)
- `entitySlice.ts` (./entitySlice.md)
- `layerSlice.ts` (./layerSlice.md)
- `relationSlice.ts` (./relationSlice.md)
- `aiSlice.ts` (./aiSlice.md)

## Fonctions Clés
- `initFromDB(worldId)` : Charge le monde et ses collections depuis la base locale.
- `createRealWorld(...)` / `createFictionalWorld(...)` : Initialise un nouveau monde historique ou imaginaire.
- `updateEntityGeometry(...)` : Met à jour la géométrie d'une entité suite à une édition carte.

## Points d'Attention / Dette Technique
- La taille du fichier a été réduite sous 200 lignes grâce à la modularisation par Slices.

## Secteur Parent
[state/](./state.md) -> [app/](../app.md) -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)

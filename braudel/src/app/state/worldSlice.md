# worldSlice.ts

## Rôle
Gestion du cycle de vie des mondes (initialisation depuis DB, bascule, duplication, création de mondes réels ou fantastiques).

## Emplacement
`src/app/state/worldSlice.ts`

## Dépendances Entrantes
- `store.ts` (./store.md)

## Dépendances Sortantes
- `world.ts` (../../core/schema/world.md)
- `indexeddb.ts` (../../services/persistence/persistence.md)

## Fonctions Clés
- `handleInitFromDB(worldId)`
- `handleDuplicateWorld(worldId, newName)`
- `emptyWorld` : Structure vierge par défaut

## Secteur Parent
[state/](./state.md) -> [app/](../app.md) -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)

# relationSlice.ts

## Rôle
Gestion des relations orientées et pondérées entre entités historiques dans le store Zustand.

## Emplacement
`src/app/state/relationSlice.ts`

## Dépendances Entrantes
- `store.ts` (./store.md)

## Dépendances Sortantes
- `relations.ts` (../../core/schema/relations.md)
- `indexeddb.ts` (../../services/persistence/persistence.md)

## Fonctions Clés
- `handleAddRelation(state, sourceId, targetId, type, weight, startYear, endYear)`
- `handleRemoveRelation(state, relationId)`

## Secteur Parent
[state/](./state.md) -> [app/](../app.md) -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)

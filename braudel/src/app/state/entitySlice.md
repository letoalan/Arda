# entitySlice.ts

## Rôle
Module du store Zustand gérant les opérations CRUD sur les entités temporelles, leur géométrie et leur plage de validité.

## Emplacement
`src/app/state/entitySlice.ts`

## Dépendances Entrantes
- `store.ts` (./store.md)

## Dépendances Sortantes
- `entities.ts` (../../core/schema/entities.md)
- `indexeddb.ts` (../../services/persistence/persistence.md)

## Fonctions Clés
- `handleAddEntity(state, layerId, name, type, validFrom, validTo)`
- `handleUpdateEntityGeometry(state, entityId, geometry)`
- `handleUpdateEntityTemporalRange(state, entityId, validFrom, validTo)`
- `handleRemoveEntity(state, entityId)`

## Secteur Parent
[state/](./state.md) -> [app/](../app.md) -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)

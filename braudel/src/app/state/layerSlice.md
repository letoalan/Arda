# layerSlice.ts

## Rôle
Gestion des calques thématiques (création, visibilité, suppression) au sein du store Zustand.

## Emplacement
`src/app/state/layerSlice.ts`

## Dépendances Entrantes
- `store.ts` (./store.md)

## Dépendances Sortantes
- `layers.ts` (../../core/schema/layers.md)
- `indexeddb.ts` (../../services/persistence/persistence.md)

## Fonctions Clés
- `handleAddLayer(state, name, type)`
- `handleToggleLayerVisibility(state, layerId)`
- `handleRemoveLayer(state, layerId)`

## Secteur Parent
[state/](./state.md) -> [app/](../app.md) -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)

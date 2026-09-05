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
- `handleInitFromDB(worldId)` : Charge le monde depuis IndexedDB, assure l'auto-réparation avec création de la couche Alpha (`Fond Géopolitique (Alpha)` ou `Fond Géographique (Alpha)`) si aucune couche n'existe, et réassigne les entités orphelines vers la couche Alpha.
- `handleDuplicateWorld(worldId, newName)`
- `emptyWorld` : Structure vierge par défaut

## Couche Alpha (Base Layer)
- Tout monde initialisé via `handleInitFromDB` garantit la présence d'une couche de base Alpha (`isBaseLayer: true`).
- Les entités orphelines (dont `layerId` est manquant ou inexistant) sont automatiquement rattachées à la couche Alpha et persistées en IndexedDB.

## Secteur Parent
[state/](./state.md) -> [app/](../app.md) -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)

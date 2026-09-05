# storeActions.ts

## Rôle
Définit les actions de haut niveau du store Zustand pour la gestion des mondes : création de monde réel (`createRealWorld`), création de monde fictif (`createFictionalWorld`), duplication et suppression de mondes.

## Emplacement
`src/app/state/storeActions.ts`

## Dépendances Entrantes
- `store.ts` (./store.md)

## Dépendances Sortantes
- `schema/world.ts` (../../core/schema/world.md)
- `schema/layers.ts` (../../core/schema/layers.md)
- `persistence/indexeddb.ts` (../../services/persistence/persistence.md)

## Couche Alpha (Base Layer Automatique)
Lors de la création de tout nouveau monde (`createRealWorld` ou `createFictionalWorld`) :
- Une couche de base **Alpha** est automatiquement créée au rang 0 (`order: 0`) :
  - Monde réel : `"Fond Géopolitique (Alpha)"` (`type: 'political'`, `isBaseLayer: true`).
  - Monde fictif : `"Fond Géographique (Alpha)"` (`type: 'physical'`, `isBaseLayer: true`).
- Cette couche est immédiatement injectée dans `world.layers` en mémoire et persistée dans la table `'layers'` d'IndexedDB.
- Cela garantit que les imports GeoJSON ou les ajouts d'entités disposent immédiatement d'une couche d'ancrage valide.

## Fonctions Clés
- `createStoreActions(set, get)` : Retourne l'ensemble des actions de manipulation des mondes.

## Secteur Parent
[state/](./state.md) -> [app/](../app.md) -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)

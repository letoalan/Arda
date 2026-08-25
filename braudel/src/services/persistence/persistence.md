# Secteur `src/services/persistence/` & indexeddb.ts

## Rôle
Assure la persistance locale navigateur via IndexedDB pour les entités, mondes, calques, relations, vues et données IA.

## Emplacement
`src/services/persistence/indexeddb.ts`

## Fichiers du Secteur

| Fichier | Rôle Résumé | Doc |
|---|---|---|
| **`indexeddb.ts`** | API d'accès asynchrone aux object stores IndexedDB (`world`, `entities`, `layers`, `ai`, etc.) | [indexeddb.md](./indexeddb.md) |

## Dépendances Entrantes
- `store.ts` (../../app/state/store.md)
- `worldSlice.ts` (../../app/state/slices/worldSlice.md)
- `entitySlice.ts` (../../app/state/slices/entitySlice.md)
- `aiSlice.ts` (../../app/state/slices/aiSlice.md)

## Fonctions Clés
- `openDB()` : Initialise la base avec la version du schéma et crée les magasins requis.
- `put(storeName, data)` : Insère ou met à jour un enregistrement.
- `queryByWorldId(storeName, worldId)` : Récupère les enregistrements rattachés à un monde spécifique.
- `deleteWorldCascade(worldId)` : Supprime un monde et l'ensemble de ses entités rattachées.
- `deleteEntitiesByBatch(worldId, importBatchId)` : Supprime les entités d'un lot d'import GeoJSON spécifique.

## Secteur Parent
[services/](../services.md) -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)

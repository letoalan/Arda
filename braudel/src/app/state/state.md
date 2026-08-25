# Secteur `src/app/state/` (Gestion de l'État Global)

## Rôle du Secteur
Ce secteur centralise la gestion de l'état applicatif Zustand pour l'ensemble du projet. Il gère le chargement depuis IndexedDB, les opérations CRUD sur les entités, couches, relations, et la gestion des sessions IA.

## Fichiers du Secteur

| Fichier | Rôle Résumé | Doc |
|---|---|---|
| **`store.ts`** | Point d'entrée du store Zustand (Orchestrateur) | [store.md](./store.md) |
| **`storeTypes.ts`** | Interfaces TypeScript de l'état applicatif `AppState` | [storeTypes.md](./storeTypes.md) |
| **`worldSlice.ts`** | Logique de création, chargement et duplication de mondes | [worldSlice.md](./worldSlice.md) |
| **`entitySlice.ts`** | Opérations CRUD et modification temporelle/géométrique des entités | [entitySlice.md](./entitySlice.md) |
| **`layerSlice.ts`** | Logique d'ajout, suppression et bascule de visibilité des calques | [layerSlice.md](./layerSlice.md) |
| **`relationSlice.md`** | Gestion du réseau de relations | [relationSlice.md](./relationSlice.md) |
| **`aiSlice.ts`** | Gestion des sessions et propositions IA | [aiSlice.md](./aiSlice.md) |

## Fil d'Ariane
[app/](../app.md) -> **state/** -> [Architecture Globale](../../../docs/ARCHITECTURE.md)

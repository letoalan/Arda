# Secteur `src/core/` (Modèles de Données & Métiers)

## Rôle du Secteur
Le secteur `core/` contient le cœur de domaine applicatif : schémas de validation Zod, définitions de types TypeScript, configurations de styles de cartes et algorithmes mathématiques (analyse de réseau, métriques, filtres).

## Structure du Secteur

| Sous-dossier | Rôle Résumé | Doc |
|---|---|---|
| **`schema/`** | Schémas de validation Zod (`world.ts`, `entities.ts`, `layers.ts`, `relations.ts`, `ai.ts`, `story.ts`) | [schema.md](./schema/schema.md) |
| **`network/`** | Algorithmes d'analyse de graphes (`metrics.ts` : degré, intermédiarité, proximité) | [network.md](./network/network.md) |
| **`cartography/`** | Génération géométrique des lignes de rhumb portulanes, LOD par zoom et rayons adaptatifs | [rhumb_network.md](./cartography/rhumb_network.md) |
| **`styles/`** & **`styles.config.ts`** | Configurations de styles et thèmes cartographiques (historiques & fantasy) | [styles.config.md](./styles.config.md) |

## Fil d'Ariane
[src/](../src.md) -> **core/** -> [ARCHITECTURE.md](../../docs/ARCHITECTURE.md)

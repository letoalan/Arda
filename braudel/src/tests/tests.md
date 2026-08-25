# Secteur `src/tests/`

## Rôle
Tests unitaires et d'intégration Vitest pour le moteur de données, la logique de validation, les flux IA, la cartographie et les projections de Braudel.

## Fichiers de Tests
- `integration.test.ts` : Flux complet du cycle de vie d'un monde (création, entités, IndexedDB, rechargement).
- `rhumb_network.test.ts` : Classification des 32 vents (principaux, demi, quarts), calculs géodésiques sphériques et génération GeoJSON portulane.
- `projection.test.ts` : Projections cartographiques (Mercator vs Globe 3D).
- `relations.test.ts` : Validation Zod et consistance relationnelle ANT.
- `schema.test.ts` : Validation des schémas canoniques.
- `export-import.test.ts` : Sérialisation et import JSON sans perte structurelle.
- `story-export.test.ts` : Export narratif Bento & Story Project.

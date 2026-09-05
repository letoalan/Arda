# Secteur `src/tests/`

## Rôle
Tests unitaires et d'intégration Vitest pour le moteur de données, la logique de validation, les flux IA, la cartographie et les projections de Braudel.

## Fichiers de Tests
- `integration.test.ts` : Flux complet du cycle de vie d'un monde (création, entités, IndexedDB, rechargement).
- `rhumb_network.test.ts` : Classification des 32 vents (principaux, demi, quarts), calculs géodésiques sphériques et génération GeoJSON portulane.
- `projection.test.ts` : Projections cartographiques (Mercator vs Globe 3D vs Eckert IV 2D).
- `relations.test.ts` : Validation Zod et consistance relationnelle ANT.
- `schema.test.ts` : Validation des schémas canoniques.
- `export-import.test.ts` : Sérialisation et import JSON sans perte structurelle.
- `story-export.test.ts` : Export narratif Bento & Story Project.
- `studio-export.test.ts` : Mode Studio (CapCut-like), modèle EditTimeline, TimelineScheduler, audio-import et mixage audio.
- `timeline-editor-actions.test.ts` : Opérations de montage Studio (Split, Copier, Couper, Coller, Crop temporel, Import médias).
- `studio-dual-monitor.test.ts` : Architecture régie bi-écran Studio (Atelier de cadrage et Moniteur Programme 16:9 WYSIWYG).
- `eckert-proj.test.ts` : Reprojection Wasm PROJ (ESRI:54012), dirty reprojector et GeoJSON sous Eckert IV.

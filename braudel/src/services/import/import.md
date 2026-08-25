# Secteur `src/services/import/`

## Rôle
Prise en charge de l'importation de fichiers (JSON, GeoJSON, croquis d'images) et de l'indexation de candidats pour prévisualisation ciblée.

## Fichiers du Secteur

| Fichier | Rôle Résumé | Doc |
|---|---|---|
| **`candidateIndexer.ts`** | Analyse légère de fichiers GeoJSON volumineux et extraction des candidats (`ImportCandidate`) | [candidateIndexer.md](./candidateIndexer.md) |
| **`geopoliticaImporter.ts`** | Normalisation des entités sélectionnées et assignation du `importBatchId` | [geopoliticaImporter.md](./geopoliticaImporter.md) |
| **`geopoliticaRegistry.ts`** | Registre des fonds mondiaux historiques Geopolitica avec URL relatives `import.meta.env.BASE_URL` | - |
| **`geojson-catalog-service.ts`** | Registre unifié des 4 familles de fonds GeoJSON (historique, contemporain, administratif, maritime) | - |
| **`sketch-parser.ts`** | Analyse locale d'images croquis et extraction de contours géométriques | [sketch-parser.md](./sketch-parser.md) |
| **`importValidator.ts`** | Validation de structure JSON lors des imports de monde | [importValidator.md](./importValidator.md) |

## Fil d'Ariane
[services/](../services.md) -> **import/** -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)

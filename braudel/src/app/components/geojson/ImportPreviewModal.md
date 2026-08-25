# ImportPreviewModal.tsx & ImportCandidateTable.tsx

## Rôle
Composants de prévisualisation et de sélection ciblée avant l'importation d'un lot GeoJSON dans le monde actif.

## Emplacement
`src/app/components/geojson/ImportPreviewModal.tsx`
`src/app/components/geojson/ImportCandidateTable.tsx`

## Dépendances Entrantes
- `GeopoliticaPanel.tsx` (../../views/GeopoliticaPanel.md)

## Dépendances Sortantes
- `candidateIndexer.ts` (../../../services/import/candidateIndexer.md)

## Fonctionnalités Clés
- Filtrage interactif par nom, continent, ou type de géométrie.
- Sélection/Désélection globale ou individuelle des candidats.
- Confirmation et transmission de la liste validée à `geopoliticaImporter.ts`.

## Secteur Parent
[components/](../components.md) -> [app/](../../app.md) -> [ARCHITECTURE.md](../../../../docs/ARCHITECTURE.md)

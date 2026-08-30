# pdf-timeline-utils.ts

## Rôle
Module utilitaire chargé de l'analyse et de l'extraction des époques clés et des dates pivot contenant des apports (sources Géopolitica, entités et relations spatio-temporelles).

## Emplacement
`src/services/export/pdf-timeline-utils.ts`

## Dépendances Entrantes
- `export-multimedia.ts` (./export-multimedia.md)
- `ExportPdfModal.tsx` (../../app/components/data/ExportPdfModal.md)

## Dépendances Sortantes
- `geopoliticaRegistry.ts` (../import/geopoliticaRegistry.md)

## Fonctions Exportées
- `extractActiveEpochs(entities, relations, minYear, maxYear)` : Calcule la liste chronologique ordonnée de toutes les époques avec métadonnées, instant médian exact de photographie (`targetYear`), décompte des entités actives et support polymorphe universel des structures temporelles (`{ validFrom, validTo }` et `[start, end]`).
- `getHistoricalPeriodLabel(year)` : Détermine l'époque Géopolitica correspondante à une année.

## Secteur Parent
[export/](./export.md) -> [services/](../services.md) -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)

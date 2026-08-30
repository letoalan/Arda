# Secteur `src/core/schema/`

## Rôle
Dossier centralisant l'ensemble des schémas de validation Zod et fabriques d'objets du domaine.

## Fichiers Principaux

| Fichier | Rôle |
|---|---|
| Fichier | Rôle |
|---|---|
| **`types.ts`** | Types de base (ID, EntityType, LayerType, GeometryType incluant Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon) |
| **`world.ts`** | Schéma et constructeur de mondes (`createRealWorld`, `createFictionalWorld`) |
| **`entities.ts`** | Schéma GeoJSON universel (points, lignes, polygones et multi-polygones) et constructeur d'entités temporelles (`createEntity`) tolérant les identifiants textuels de catalogues d'import |
| **`layers.ts`** | Schéma et constructeur de calques (`createLayer`) |
| **`relations.ts`** | Schéma et constructeur de relations (`createRelation`) |
| **`ai.ts`** | Schémas Zod des sessions, propositions et validations IA |
| **`story.ts`** | Schémas des projets de storyboard et scènes |

## Fil d'Ariane
[core/](../core.md) -> **schema/** -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)


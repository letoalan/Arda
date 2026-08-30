# Documentation — Schéma d'Entités (entities.ts)

## Rôle et Responsabilités
entities.ts définit la structure Zod et les types des entités cartographiques spatio-temporelles.

- **Géométries GeoJSON prises en charge** : Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon.
- **Tolérance d'identifiants** : Supporte à la fois les UUID natifs et les identifiants textuels (layer-1, entity-123, etc.) générés par les catalogues externes et exports Arda.
- **Champs temporels & styles** : 	emporalRange (alidFrom, alidTo), color, wikiContent, properties.

## Fil d'Ariane
[core/](../core.md) -> [schema/](./schema.md) -> **entities.md**

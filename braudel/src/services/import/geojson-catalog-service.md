# Documentation — Registre & Recherche Catalogue GeoJSON (`geojson-catalog-service.ts`)

## Rôle et Responsabilités
`geojson-catalog-service.ts` constitue le catalogue central unifié des fonds cartographiques GeoJSON disponibles dans Braudel :
- **Intégration exhaustive de Géopolitica** : 49 fonds historiques mondiaux complets échelonnés de -123 000 av. J.-C. à 2024 ap. J.-C.
- **Fonds Contemporains & Territoriaux** : Frontières mondiales actuelles (2024), Régions & Départements de France (INSEE/Etalab), États fédérés des USA (US Census Bureau).
- **Fonds Maritimes & Espaces Stratégiques** : Zones Économiques Exclusives mondiales (ZEE - VLIZ Marine Regions).
- **Moteur de Recherche Multi-Critères** : Filtrage par famille (`historical`, `contemporary`, `administrative`, `maritime`) et recherche plein texte par mot-clé, date, label ou aire géographique.

## Fil d'Ariane
[services/](../services.md) -> [import/](./import.md) -> **geojson-catalog-service.md**

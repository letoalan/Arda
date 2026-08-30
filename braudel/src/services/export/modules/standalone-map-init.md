# Documentation — Initialisation Carte Autonome (`standalone-map-init.ts`)

## Rôle et Responsabilités
`standalone-map-init.ts` génère le fragment JavaScript client responsable de :
- L'instanciation de l'objet `maplibregl.Map`.
- L'injection des sources GeoJSON inlinées (`braudel-entities`, `braudel-relations`).
- L'initialisation des calques vectoriels (polygones, lignes, points).
- Le déclenchement des moteurs de timeline, de wiki et de raccourcis clavier au chargement de la carte.

## Fil d'Ariane
[services/](../../services.md) -> [export/](../export.md) -> [modules/](./modules.md) -> **standalone-map-init.md**

# Documentation — Éléments Vectoriels Cartographiques (`pdf-carto-elements.ts`)

## Rôle et Responsabilités
`pdf-carto-elements.ts` gère la génération vectorielle des ornements cartographiques réglementaires directement intégrés sur le document PDF :
- **`calculateScaleBarParams`** : Calcul mathématique de l'échelle métrique locale au centre géographique de la vue (résolution `metersPerPixel` basée sur la latitude et le zoom WebGL).
- **`drawNorthArrow`** : Dessin vectoriel jsPDF d'une rose des vents / flèche du Nord bicolore avec cartouche de fond et repère cardinal "N".
- **`drawScaleBar`** : Tracé vectoriel d'une échelle graphique graduée bicolore avec segments noir/blanc et annotations numériques.

## Dépendances
- `jspdf`

## Fil d'Ariane
[services/](../../services.md) -> [export/](../export.md) -> [modules/](./modules.md) -> **pdf-carto-elements.md**

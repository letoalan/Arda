# standaloneExport

## Description
Le module d'export autonome regroupe les fonctions de génération d'applications HTML interactives autonomes (cartes interactives simples ou récits cartographiques au format Bento).

## Fichiers Associés
- `standalone-template.ts` : Générateur du squelette HTML principal.
- `standaloneScripts.ts` : Injection de la logique JavaScript (MapLibre, contrôle de caméra `scene.mapState`, navigation de scènes).
- `standaloneStyles.ts` : Styles CSS embarqués (thèmes sombres/clairs, conteneurs Bento et animations).

## Modes d'Exportation
| Mode | Description |
| :--- | :--- |
| `map` | Affichage interactif avec sélecteur de temps simple et fond stylisé |
| `story` | Récit cartographique guidé avec volet Bento et vol de caméra animé (`map.flyTo`) entre les scènes |

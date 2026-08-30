# standaloneExport

## Description
Le module d'export autonome regroupe les fonctions de génération d'applications HTML interactives autonomes (cartes interactives simples ou récits cartographiques au format Bento).

## Fichiers Associés
- **`standalone-template.ts`** : Assemblage du squelette HTML5 et injection de `<script id="arda-doc">`.
- **`standaloneScripts.ts`** : Façade d'assemblage des scripts d'initialisation, timeline et diapositives.
- **`standaloneStyles.ts`** : Façade d'assemblage des feuilles de styles CSS Glassmorphism et présentation.
- **`modules/bento-types.ts`** : Schéma de données `ArdaDoc` et convertisseurs de récits.
- **`modules/standalone-map-init.ts`** : Initialisation MapLibre GL JS et calques vectoriels.
- **`modules/standalone-timeline-logic.ts`** : Moteur de timeline, waypoints, filtrage temporel et vols de caméra (`map.flyTo`).
- **`modules/standalone-slide-logic.ts`** : Moteur des diapositives d'appui avec retour garanti (`same-waypoint`), mode présentation (F5), raccourcis et sauvegarde en place (Ctrl+S).
- **`modules/standalone-bento-styles.ts`** : Styles du panneau narratif Bento et barre d'outils.
- **`modules/standalone-slide-styles.ts`** : Styles de la timeline, des slides plein écran et des fiches Wiki.

## Modes d'Exportation
| Mode | Description |
| :--- | :--- |
| `map` | Affichage interactif avec sélecteur de temps simple et fond stylisé |
| `story` | Récit cartographique piloté par la timeline (`waypoints`) avec diapositives d'appui (`slides`) et retour garanti |

## Documentation Détaillée
Pour une présentation fonctionnelle et technique approfondie, consulter :
- [**`html.md` (Présentation Complète du Mode d'Export HTML Autonome)**](../../../../html.md)
- [**`bento.md` (Plan d'Implémentation et Spécifications Métier Carte-Récit)**](../../../../bento.md)

## Fil d'Ariane
[services/](../services.md) -> [export/](./export.md) -> **standaloneExport.md**

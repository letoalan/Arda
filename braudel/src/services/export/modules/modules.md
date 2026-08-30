# Répertoire des Sous-Modules d'Exportation (`export/modules/`)

## Vue d'Ensemble
Ce répertoire regroupe les modules spécialisés et découpés de l'infrastructure d'exportation multimédia et cartographique :

- [`pdf-types.ts`](./pdf-types.md) : Typages, interfaces (`PDFExportOptions`, `EpochExportTarget`), classe `PdfExportError` et prédicats de visibilité spatio-temporelle.
- [`pdf-map-capture.ts`](./pdf-map-capture.md) : Capture WebGL sécurisée, synchronisation GPU ciblée (`updateEntitiesAndWaitForRender`), stabilisation du fond (`waitForBackgroundTilesReady`), et pré-chargement catalogue.
- [`pdf-carto-elements.ts`](./pdf-carto-elements.md) : Éléments vectoriels de cartographie (calcul de l'échelle métrique, tracé de la rose des vents, échelle graduée).
- [`pdf-page-renderer.ts`](./pdf-page-renderer.md) : Rendu et composition d'une planche cartographique A4 paysage (cartouche, carte, légende structurée, pied de page).
- [`pdf-atlas-generator.ts`](./pdf-atlas-generator.md) : Orchestration des exports complets (carte unitaire, timeline driven, atlas multi-époques).
- [`media-export-utils.ts`](./media-export-utils.md) : Utilitaires d'exportation bitmap (JPEG/PNG HD) et compression chronophotographique (Timelapse ZIP).
- [`bento-types.ts`](./bento-types.md) : Schéma du document `ArdaDoc`, `ArdaWaypoint`, `ArdaExAction`, `ArdaSlide` et convertisseur universel de récits.
- [`standalone-bento-styles.ts`](./standalone-bento-styles.md) : Styles de base, Glassmorphism, Toolbar, volet Bento et Sidecar Docké (Mode EX).
- [`standalone-slide-styles.ts`](./standalone-slide-styles.md) : Styles de la timeline, des diapositives d'appui plein écran, du mode présentation et du wiki.
- [`standalone-map-init.ts`](./standalone-map-init.md) : Script d'initialisation de MapLibre GL et des calques vectoriels.
- [`standalone-timeline-logic.ts`](./standalone-timeline-logic.md) : Logique de timeline, waypoints, filtrage temporel, scrollytelling Sidecar (Mode EX), Map Actions et mini-carte de contexte.
- [`standalone-slide-logic.ts`](./standalone-slide-logic.md) : Logique des diapositives d'appui, bascule avec retour garanti, mode présentation, raccourcis et sauvegarde en place.

## Fil d'Ariane
[services/](../../services.md) -> [export/](../export.md) -> **modules/**

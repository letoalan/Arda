# Tâches d'implémentation — Chantiers modifications.md

- [x] **Phase 1 : Socle Rendu Cartographique & Vecteurs**
  - [x] Chantier 3 : Couche `braudel-polygon-outline` et filtres temporels
  - [x] Chantier 1 : Capture dynamique du style actif à l'export
  - [x] Chantier 2 : Relief (DEM) distant, hillshade et garde-fou réseau
  - [x] Documentation technique Wiki-as-Code (fichiers `.md`)
- [x] **Phase 2 : Overlay Diapositive Plein Écran (Chantier 4)**
  - [x] Remplacement bouton retour par croix `#btn-slide-close`
  - [x] Style CSS overlay (semi-transparent, `backdrop-filter: blur()`)
  - [x] Maintien de la carte non masquée et exécution des animations
  - [x] Documentation technique Wiki-as-Code (fichiers `.md`)
- [x] **Phase 3 : Éditeur de Slide V1 & Rendu (Chantier 5)**
  - [x] Extension du schéma `ArdaSlideElement` (coordonnées, dimensions, style)
  - [x] Composant éditeur de slide 16:9 avec outils d'insertion & snapping ([`SlideEditorModal.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/app/views/SlideEditorModal.tsx))
  - [x] Rendu des éléments dans le viewer autonome
  - [x] Documentation technique Wiki-as-Code (fichiers `.md`)
- [x] **Phase 4 : Sauvegarde, Réédition & Migrations (Chantier 6)**
  - [x] `schemaVersion` et fonctions de migration / validation ([`arda-doc-parser.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/arda-doc-parser.ts))
  - [x] Bouton et parsing d'import `.html` dans l'éditeur ([`StoryEditorPanel.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/app/views/StoryEditorPanel.tsx))
  - [x] Documentation technique Wiki-as-Code (fichiers `.md`)
- [x] **Phase 5 : Tests Automatisés & Validation**
  - [x] Exécution et complétion de la suite de tests unitaires/intégration (28 fichiers de tests, 151 tests passants)
  - [x] Synchronisation finale des artéfacts et documentation
- [x] **Hotfix : Correction contamination inter-époques PDF**
  - [x] Détection et récupération WebGL context loss (`pdf-map-capture.ts`)
  - [x] Purge explicite source GeoJSON entre chaque itération (`pdf-atlas-generator.ts`)
  - [x] Suppression double setData / race condition (`updateMapEntities` retiré de la boucle d'export)
  - [x] Filtrage strict des entités/relations passées à la légende (`isEntityVisibleAt` / `isRelationVisibleAt`)
  - [x] Documentation technique Wiki-as-Code (fichiers `.md`)
- [x] **Évolution : Échelle différenciée Minicarte Bento (Macro vs Continentale)**
  - [x] Implémentation du zoom 0.9 (Macro) vs 3.2 (Continentale) avec centrage dynamique (`standalone-timeline-logic.ts`)
  - [x] Styles CSS d'expansion à 220px, badge émeraude et halo dynamique (`standalone-bento-styles.ts`)
  - [x] Suivi continu du marqueur rouge (`context-minimap-indicator`) sur les mouvements et animations
  - [x] Intégration et validation dans les tests unitaires (`bento-html-export.test.ts`)
  - [x] Documentation technique Wiki-as-Code (`standalone-timeline-logic.md`, `standalone-bento-styles.md`)
- [x] **Correctif : Préservation de l'orientation (Al-Idrisi 180°) & Atlas Images ZIP Multi-Époques**
  - [x] Suppression du reset arbitraire du bearing à 0° dans les transitions caméra (`camera-orchestrator.ts`)
  - [x] Capture dynamique du bearing et cadrage réels lors de l'ajout de scènes (`StoryEditorPanel.tsx`, `DataPanel.tsx`)
  - [x] Ciblage algorithmique des époques historiques actives du monde (comme pour le PDF) (`exportMultiEpochZIP`, `extractActiveEpochs`)
  - [x] Génération d'une collection d'images JPEG HD à la racine du ZIP avec nommage chronologique (`01_carte_av_jc_500.jpg`, `02_carte_an_1154.jpg`, etc.)
  - [x] Génération de manifest.json et README.md récapitulatif dans l'archive
  - [x] Intégration du bouton direct `Collection JPEG (ZIP)` dans `ExportMultimediaSection.tsx` et `ExportPdfModal.tsx`
  - [x] Test unitaire dédié dans `multimedia-export.test.ts` (164 tests passants)
  - [x] Documentation technique Wiki-as-Code (`media-export-utils.md`, `ExportMultimediaSection.md`, `ExportPdfModal.md`)
- [x] **Refactoring IHM : Dissociation stricte des interfaces PDF et Collection Images ZIP**
  - [x] Nettoyage de `ExportPdfModal.tsx` pour le consacrer exclusivement à l'Atlas PDF (retrait des contrôles ZIP)
  - [x] Création du composant dédié `ExportZipModal.tsx` spécialisé pour la Collection JPEG ZIP avec thématique ambre distincte
  - [x] Création de la documentation Wiki-as-Code `ExportZipModal.md`
  - [x] Gestion de deux états de modale indépendants dans `DataPanel.tsx` (`isPdfModalOpen` vs `isZipModalOpen`)
  - [x] Validation TypeScript et tests Vitest à 100% (164/164)
- [x] **Correctif Robustesse : Élimination du crash intempestif `PdfExportError`**
  - [x] Extension du polling de 30 à 50 tentatives (2.5s) pour permettre aux tuiles raster lourdes de charger (`pdf-map-capture.ts`)
  - [x] Dégradation gracieuse : capture de l'état présent au lieu d'interrompre l'export si la caméra est immobile mais que des tuiles distantes tardent
  - [x] Maintien du rejet strict `PdfExportError` uniquement si la caméra est en mouvement (`!cameraSettled`)
- [x] **Documentation & Spécification : Format de Sortie Vidéo WebM (`video.md`)**
  - [x] Définition des caractéristiques techniques (conteneur WebM, codec VP9, 30/60 FPS, capture stream GPU)
  - [x] Documentation des fonctionnalités cartographiques (transitions caméras, bearing Al-Idrisi, synchronisation temporelle, pauses)
  - [x] Matrice comparative (Vidéo WebM vs Collection JPEG ZIP vs Atlas PDF) et compatibilité logiciels de montage
  - [x] Mise à jour des index Wiki-as-Code (`export.md`, `video-export.md`)
- [x] **Correctif Vidéo : Négociation dynamique de codec & Fallback MediaRecorder**
  - [x] Fonction `getSupportedVideoMimeType` testant VP9, VP8, H.264, WebM, MP4 pour éviter `DOMException: unsupported codec`
  - [x] Repli automatique sur le constructeur par défaut `new MediaRecorder(stream)` si aucun type spécifique n'est accepté
  - [x] Synchronisation automatique de la caméra et des époques dans `handleWebmExport` (`DataPanel.tsx`)








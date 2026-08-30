# Documentation — Logique des Diapositives, Présentation & Raccourcis (`standalone-slide-logic.ts`)

## Rôle et Responsabilités
`standalone-slide-logic.ts` génère le fragment JavaScript client gérant :
- L'ouverture de la diapositive d'appui et la conservation du contexte d'origine (`openSlide`).
- La fermeture de la diapositive et le **retour garanti** au même waypoint cartographique (`closeSlideAndReturn`).
- Le rendu modulaire des cartes et éléments Bento (`renderSlideContent`).
- Le mode Présentation plein écran (`togglePresentMode`).
- **Le mode Écran Partagé Carte / Slide (`toggleSplitMode`)** :
  - Cycle à trois états : Diapositive seule 100% plein écran → Split vertical 50/50 avec la vraie carte principale en direct et la timeline réduite → Minicarte PIP incrustée en bas à droite ($180 \times 180\text{px}$) avec rendu complet des calques vectoriels et filtrage temporel de l'époque active.
  - Déclenchement via bouton dédié `⬓` ou raccourci clavier **`S`** / **`s`**.
- La gestion des raccourcis clavier : `Échap`/`M` (retour carte), `S` (split screen carte/slide), `L` (légende tiroir), `Espace`/`Flèche Droite`, `Flèche Gauche`, `F5`/`P` (présentation) et `Ctrl+S` (sauvegarde).
- **Le moteur d'édition de diapositives style PowerPoint intégré** :
  - Saisie et édition directe de texte in-place au double-clic sur le canevas avec synchronisation automatique vers l'inspecteur.
  - Parseur de flux de diagrammes connectés `parseDiagramFlowHTML` convertissant la syntaxe Markdown `1. X -> 2. Y -> 3. Z` en cartes visuelles stylisées reliées par des flèches directionnelles (`.diagram-flow-node`, `.diagram-flow-arrow`).
  - Manipulation souris : déplacement avec magnétisme (*snap to grid* $10\text{px}$), **guides magnétiques visuels d'alignement au centre** (`#guide-center-x`, `#guide-center-y`), et redimensionnement par **8 poignées directionnelles** (`isResizingElement`, `resizeHandleDir`).
  - **Formes étendues** : Prise en charge des flèches directionnelles (`arrow`), bannières (`pill`), rectangles et cercles avec couleur de fond et bordure modifiables.
  - **Gestionnaire de calques et réordonnancement** (`changeSelectedElementLayer`, `renderLayersList`) : *Premier plan*, *Arrière-plan*, *Monter*, *Descendre*.
  - Toggles individuels par élément : **🔒 Verrouillage** (anti-déplacement) et **👁️ Visibilité** (`elem.locked`, `elem.hidden`).
  - **Contrôle d'opacité** (`elem.opacity`) avec curseur 0-100% et répercussion dynamique sur le canevas.
  - Persistance en mémoire vive dans l'objet global `doc.slides` (`saveCurrentSlideFromEditor`).
- La ré-écriture du document HTML autonome et la sauvegarde / téléchargement du fichier mis à jour avec balise `<script type="application/arda+json" id="arda-doc">` actualisée (`saveDeck`).
- La consultation interactive des fiches Wiki au clic sur la carte (`openWiki`, `closeWiki`).

## Fil d'Ariane
[services/](../../services.md) -> [export/](../export.md) -> [modules/](./modules.md) -> **standalone-slide-logic.md**



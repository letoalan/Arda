# Plan d'Implémentation — Refonte & Évolutions Braudel (modifications.md)

Ce plan formalise l'exécution technique des 6 chantiers arrêtés dans [`modifications.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/modifications.md) (issus de `tuile.md` et `roadmap-ux.md`).

---

## Vue d'ensemble des 6 Chantiers & Dépendances

```
┌────────────────────────────────────────┐
│ Chantier 3 : Bordures de layers (line) │ (Indépendant - Socle carto)
└──────────────────┬─────────────────────┘
                   │
┌──────────────────▼─────────────────────┐     ┌────────────────────────────────────┐
│ Chantier 1 : Style de tuile dynamique  │     │ Chantier 2 : DEM / Relief distant   │
└──────────────────┬─────────────────────┘     └─────────────────┬──────────────────┘
                   │                                             │
                   └──────────────────────┬──────────────────────┘
                                          │
┌─────────────────────────────────────────▼──────────────────────────────────────────┐
│ Chantier 4 : Slide plein écran superposée (Overlay + Blur + Croix sans unmount)    │
└─────────────────────────────────────────┬──────────────────────────────────────────┘
                                          │
┌─────────────────────────────────────────▼──────────────────────────────────────────┐
│ Chantier 5 : Édition de slide PowerPoint (Socle V1 : Text, Image, Shape, Snapping) │
└─────────────────────────────────────────┬──────────────────────────────────────────┘
                                          │
┌─────────────────────────────────────────▼──────────────────────────────────────────┐
│ Chantier 6 : Sauvegarde & Réédition HTML (Validation, schemaVersion, Migration)    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## User Review Required

> [!IMPORTANT]
> - **Format canonique unique** : Le fichier `.html` généré reste le format de sauvegarde canonique universel (portant à la fois le visualiseur autonome et les données sérialisées dans `<script type="application/arda+json" id="arda-doc">`).
> - **Mode DEM** : Uniquement le mode distant (online via CDN raster-dem `https://tiles.mapterhorn.com/...`) est implémenté, avec dégradation gracieuse immédiate et sans blocage si le réseau est indisponible.
> - **Extensibilité des éléments de slide** : Le schéma d'éléments V1 est basé sur un type discriminé (`type: 'text' | 'image' | 'shape'`), préfigurant sans rupture l'intégration future de graphiques et vidéos.

---

## Proposed Changes

---

### Phase 1 — Socle Rendu Cartographique & Vecteurs (Chantiers 3, 1, 2)

#### 1. Bordures vectorielles dédiées (`braudel-polygon-outline`) [Chantier 3]
- **Objectif** : Dessiner les limites des polygones avec un vrai tracé linéaire (`type: 'line'`) et non un simple contour de points.
- **Fichiers concernés** :
  - [MODIFY] [`src/services/export/modules/standalone-map-init.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/standalone-map-init.ts) : Ajout de la couche `braudel-polygon-outline` avec `line-color`, `line-width`, `line-opacity` interpolés via `coalesce`.
  - [MODIFY] [`src/services/export/modules/standalone-timeline-logic.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/standalone-timeline-logic.ts) : Application systématique du filtre temporel `updateTemporalFilter` sur `braudel-polygon-outline`.
  - [MODIFY] [`src/core/map/layerManager.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/core/map/layerManager.ts) (ou équivalent éditeur) : Synchronisation du calque dans l'éditeur principal.

#### 2. Capture dynamique du style de tuile à l'export [Chantier 1]
- **Objectif** : Refléter fidèlement le style actif dans l'éditeur (`styleUrl`, `styleId`) au moment de l'export sans forcer Voyager.
- **Fichiers concernés** :
  - [MODIFY] [`src/services/export/modules/bento-types.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/bento-types.ts) : Vérification/renforcement du typage `map.styleUrl` et `map.styleId`.
  - [MODIFY] [`src/services/export/standalone-template.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/standalone-template.ts) : Transmission directe de la configuration active `styleConfig` ou lecture depuis l'instance de carte.
  - [MODIFY] [`src/app/views/StoryEditorPanel.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/app/views/StoryEditorPanel.tsx) & [`src/app/views/DataPanel.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/app/views/DataPanel.tsx) : Récupération dynamique du style courant sélectionné.

#### 3. Relief (DEM) distant & Hillshade avec garde-fou réseau [Chantier 2]
- **Objectif** : Intégrer la gestion du terrain `raster-dem` distant et la couche `hillshade` avec fallback résilient si le CDN échoue.
- **Fichiers concernés** :
  - [MODIFY] [`src/services/export/modules/bento-types.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/bento-types.ts) : Ajout du champ optionnel `map.terrain` (`mode: 'remote' | 'none'`, `terrainTilesUrl`, `exaggeration`, `hillshadeEnabled`).
  - [MODIFY] [`src/services/export/modules/standalone-map-init.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/standalone-map-init.ts) : Injection de `addSource('terrain-dem')`, `setTerrain(...)`, couche `hillshade` et listener d'erreur `map.on('error', ...)` avec `map.setTerrain(null)`.

---

### Phase 2 — Expérience Slide Plein Écran & Moteur de Rendu (Chantier 4)

#### 4. Slide Overlay superposée sans démontage de carte
- **Objectif** : Afficher la diapositive en superposition au-dessus de la carte avec flou d'arrière-plan et bouton croix de fermeture.
- **Fichiers concernés** :
  - [MODIFY] [`src/services/export/standalone-template.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/standalone-template.ts) : Remplacement du bouton retour texte par le bouton croix `#btn-slide-close` en haut à droite.
  - [MODIFY] [`src/services/export/modules/standalone-slide-styles.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/standalone-slide-styles.ts) : Mise à jour CSS (`position: absolute`, `backdrop-filter: blur(6px)`, `background: rgba(15, 23, 42, 0.55)`).
  - [MODIFY] [`src/services/export/modules/standalone-slide-logic.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/standalone-slide-logic.ts) : Suppression du masquage `#map.hidden` ; conservation des animations de caméra en arrière-plan.

---

### Phase 3 — Éditeur de Slide V1 type PowerPoint (Chantier 5)

#### 5. Outils d'édition de slide & Canevas de référence (16:9)
- **Objectif** : Fournir une barre d'outils d'édition légère pour positionner textes, images et formes géométriques simples avec snapping magnétique.
- **Fichiers concernés** :
  - [NEW] [`src/app/views/SlideEditorModal.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/app/views/SlideEditorModal.tsx) (ou composant dédié dans l'éditeur) : Canevas 1280x720 (16:9), manipulation drag/resize et snapping.
  - [MODIFY] [`src/services/export/modules/bento-types.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/bento-types.ts) : Extension de `ArdaSlideElement` (coordonnées `x, y, w, h`, typage `fontSize, fontWeight, color, align, background`).
  - [MODIFY] [`src/services/export/modules/standalone-slide-logic.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/standalone-slide-logic.ts) : Moteur de rendu unifié des éléments positionnés en coordonnées relatives/absolues pour l'export.

---

### Phase 4 — Sauvegarde Canonique, Réédition & Migrations (Chantier 6)

#### 6. Importation de fichiers HTML et compatibilité ascendante
- **Objectif** : Permettre la réouverture d'un fichier `.html` exporté dans l'éditeur, valider son intégrité et migrer les schémas plus anciens.
- **Fichiers concernés** :
  - [NEW] [`src/services/export/modules/arda-doc-parser.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/arda-doc-parser.ts) : Fonctions `parseArdaDocFromHtml(htmlContent)`, `validateArdaDocSchema(doc)`, `migrateArdaDoc(doc)`.
  - [MODIFY] [`src/services/export/modules/bento-types.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/bento-types.ts) : Ajout de la constante `CURRENT_ARDA_SCHEMA_VERSION = "1.1.0"` et du champ `schemaVersion`.
  - [MODIFY] [`src/app/views/StoryEditorPanel.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/app/views/StoryEditorPanel.tsx) : Ajout du bouton "Ouvrir un fichier ARDA (.html)" avec chargement de l'état du store.

---

### Phase 5 — Documentation & Synchronisation (Wiki-as-Code)
- **Règles projet strictes** :
  - Mise à jour ou création de tous les fichiers `.md` techniques correspondants aux modules modifiés/créés.
  - Synchronisation du `task.md` à la racine du projet.

---

## Verification Plan

### Automated Tests
- `npm test` :
  - `src/tests/bento-html-export.test.ts` : Vérification de la présence de `braudel-polygon-outline`, de la config terrain, et du style dynamique.
  - `src/tests/arda-doc-migration.test.ts` : Test de validation, migration ascendante et aller-retour export/import HTML.
  - `src/tests/slide-editor-model.test.ts` : Test du positionnement et du schéma `elements[]`.

### Manual Verification
1. **Export avec style personnalisé & relief** : Exporter un projet avec relief actif, vérifier l'affichage 3D dans le navigateur et le bon fonctionnement hors-ligne dégradé sans crash.
2. **Affichage de slide overlay** : Lancer un récit, ouvrir une slide, vérifier que la carte reste visible floutée derrière et que la croix ferme la diapositive.
3. **Édition et réimport** : Éditer une slide, exporter le `.html`, puis le réimporter dans Braudel via le bouton d'import pour vérifier la fidélité de l'état restauré.

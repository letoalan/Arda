# Walkthrough — Échelle Différenciée de la Minicarte Bento (Macro vs Continentale)

## Problématique Résolue
Dans le viewer autonome Bento (`standalone-template.ts`), la mini-carte de contexte (`context-minimap-box`) permettait de basculer le libellé du badge (`Macro` $\leftrightarrow$ `Continentale`), mais **l'échelle cartographique restait statique** (zoom figé à 1.2 sans variation de cadrage ni adaptation du zoom et de la boîte de visualisation).

## Modifications Apportées

### 1. Logique Dynamique d'Échelle & Centrage ([`standalone-timeline-logic.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/standalone-timeline-logic.ts))
- **Vue Macro Générale** :
  - Niveau de zoom planétaire global : `zoom: 0.9` (ou centré sur `doc.map?.center || [12.5, 42.0]`).
  - L'indicateur rouge (`#context-minimap-indicator`) se projette selon les coordonnées sphériques réelles du centre de la caméra principale via `contextMinimapInstance.project(center)`.
  - Format compact 145×145px, badge bleu accentué `Macro`.
- **Vue Continentale Régionale** :
  - Niveau de zoom continental rapproché : `zoom: 3.2`.
  - La minicarte se focalise et suit le déplacement de la caméra principale (`contextMinimapInstance.setCenter(map.getCenter())`), permettant d'observer en permanence le continent et le bassin géographique autour du point d'observation.
  - L'indicateur rouge est maintenu au centre géométrique du canevas de la minicarte.
  - Animation cinématique fluide (`easeTo`, durée 350ms) lors de l'alternance d'échelle.
  - Écoute des événements `move` de la minicarte pour que le curseur reste calé pendant les vols de transition.

### 2. Styles CSS & Rendu Visuel ([`standalone-bento-styles.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/standalone-bento-styles.ts))
- Ajout de la classe `.context-minimap-box.is-continental-view` (et alias `.is-macro-expanded`) :
  - Agrandissement fluide de 145px à **220px × 220px** avec transition cubique (`cubic-bezier(0.16, 1, 0.3, 1)`).
  - Badge vert émeraude `#10B981` pour identifier sans ambiguïté la vue continentale.
  - Halo d'accentuation dynamique sur l'indicateur rouge (`box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.3)`).

### 3. Modèle HTML ([`standalone-template.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/standalone-template.ts))
- Info-bulle clarifiée : `title="Mini-carte de contexte (cliquer pour alterner vue générale macro / continentale)"`.

### 4. Tests Automatisés & Documentation Wiki-as-Code
- Ajout des assertions sur les échelles et classes CSS dans [`bento-html-export.test.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/tests/bento-html-export.test.ts).
- Mise à jour de la documentation technique :
  - [`standalone-timeline-logic.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/standalone-timeline-logic.md)
  - [`standalone-bento-styles.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/standalone-bento-styles.md)

## Validation des Tests
- **Compilation TypeScript** : `npx tsc --noEmit` $\rightarrow$ 0 erreur.
- **Suite de tests Vitest** : 28 fichiers de tests, **163 tests passants sur 163 (100% de réussite)**.

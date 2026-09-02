# Harmonisation de l'affichage par défaut et du débrayage des Graticules et Lignes de Rhumb sur tous les fonds de carte

Ce document détaille le diagnostic des disparités constatées lors de l'activation, de l'affichage et du masquage des graticules (méridiens/parallèles 10°) et des lignes de rhumb (roses des vents et triangulation portulane) à travers les 25 styles cartographiques, ainsi que la solution technique unifiée pour garantir une cohérence parfaite et un contrôle menu absolu.

---

## Diagnostic Approfondi : Pourquoi le comportement était « très inégal »

L'audit complet du code révèle 5 causes fondamentales expliquant les anomalies :

1. **Absence de synchronisation des valeurs par défaut lors du changement de fond de carte** :
   - Dans le store (`storeUiActions.ts`), l'action `setBasemapStyle(style)` ne mettait à jour que l'identifiant du style.
   - Les indicateurs `portulanRhumbVisible` et `graticuleVisible` restaient figés sur l'état précédent ou sur la valeur initiale statique (`true` pour les deux).
   - *Conséquence* : Un utilisateur passant sur un style contemporain (ex : OpenStreetMap ou Satellite) conservait des lignes de rhumb médiévales du XIVe siècle sur sa carte. Inversement, s'il décochait les rhumbs et passait sur le Portulan Catalan ou Al-Idrisi, les rhumbs restaient éteints par défaut au lieu de s'afficher fièrement.

2. **Teinte marron foncé `#5c3a21` codée en dur pour les graticules sur tous les fonds** :
   - Dans [`grid-reference-layers.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/cartography/modules/grid-reference-layers.ts), `colonial-graticule-lines` et `colonial-graticule-labels` imposaient `'line-color': '#5c3a21'` et `'text-color': '#5c3a21'` avec halo blanc.
   - Sur les fonds sombres (`contemporary_positron_lite`, `military_tactical_wargames`, `nasa_night_lights`, `journalism_electro_80s`, `futuristic*`, `tolkien_dark_fantasy`), cette couleur marron foncé sur fond noir/ardoise est **totalement invisible**.
   - Même si `military_tactical_wargames` déclarait `color: '#22c55e'` ou `military_staff_ww1_ww2` déclarait `color: '#991b1b'`, ces configurations étaient purement et simplement ignorées !

3. **Collision de couches et fausse persistance du carroyage au masquage dans le menu** :
   - Il existait un calque historique `grid-layer` (carroyage à 30°) généré par `initGridLayer`, qui était activé par la case `geoReferenceLinesVisible` (« Lignes géographiques »).
   - Quand l'utilisateur décochait « Méridiens & parallèles (Graticule vectoriel 10°) », les lignes à 30° de `grid-layer` **restaient visibles à l'écran**.
   - L'utilisateur avait l'impression très nette que la désactivation dans le menu « ne fonctionnait pas » ou ne retirait qu'une partie des lignes.

4. **Écrasement total sur les mondes imaginaires / Tolkien** :
   - Dans `loadContinentsGeoJSON`, `braudel-ocean-mask` (opacité 100%) et `braudel-continents-fill` étaient injectés sans `beforeId`, se plaçant *par-dessus* les couches de rhumbs et de graticules.
   - Sur les cartes Tolkien, les lignes de rhumb et les graticules étaient physiquement masqués sous le masque océanique opaque.

5. **Palette des rhumbs incomplète** :
   - `updateRhumbPalette` ne modifiait que la bordure des centres (`circle-stroke-color`), sans recalculer les couleurs des segments ni l'opacité pour les fonds sombres ou satellitaires.

---

## Matrice des Comportements par Défaut (25 Fonds de Carte)

| Style Cartographique | Époque | Rhumbs par Défaut | Graticule par Défaut | Palette / Thématique Visuelle Graticule & Rhumb |
| :--- | :--- | :---: | :---: | :--- |
| **`antiquity`** (Peutinger) | IVe s. | ❌ Non | ❌ Non | Sépia parchemin antique (`#8b5a2b`) |
| **`al_idrisi`** (Tabula Rogeriana) | 1154 | ✅ **Oui** | ❌ Non | Or islamique & carmin (`#8b6f2f`), labels Janūb/Shamāl |
| **`medieval`** (Portulan Catalan) | 1375 | ✅ **Oui** | ❌ Non | Encre catalane & ocre (`#5c3a21`), 32 vents |
| **`renaissance`** (Atlas Maior Blaeu) | 1662 | ✅ **Oui** | ❌ Non | Ocre baroque orné (`#7a5a3a`) |
| **`modern`** (Carte de Cassini) | XVIIIe s. | ❌ Non | ✅ **Oui** | Gravure cuivre & acier (`#555555`) |
| **`jules_verne`** (Hetzel 1889) | 1889 | ✅ **Oui** | ✅ **Oui** | Gravure victorienne cuivre/sepia (`#7a5a3a`) |
| **`colonial`** (Grandes Puissances 1914) | 1914 | ❌ Non | ✅ **Oui** | Atlas impérial sepia (`#784421`) |
| **`military_staff_ww1_ww2`** (État-Major) | 1914–1945 | ❌ Non | ✅ **Oui** | Rouge état-major carroyé (`#991b1b`) |
| **`twentieth_century_physical`** (Atlas Hypsométrique) | XXe s. | ❌ Non | ✅ **Oui** | Bleu océanique hypsométrique (`#3b6e8c`) |
| **`journalism_60s_70s`** (Presse) | 1960–1970 | ❌ Non | ❌ Non | Encre de presse ardoise (`#334155`) |
| **`military_tactical_wargames`** (NORAD WOPR) | 1983 | ❌ Non | ✅ **Oui** | Phosphore vert CRT (`#22c55e`), texte ambre (`#f59e0b`) |
| **`journalism_electro_80s`** (Synthwave) | 1980 | ❌ Non | ❌ Non | Néon cyan (`#06b6d4`), texte magenta (`#ec4899`) |
| **`cnn_broadcast_90s_00s`** (TV News 24h) | 1990–2000 | ❌ Non | ❌ Non | Ambre broadcast (`#d97706`) |
| **`contemporary_current`** (Voyager) | 2024 | ❌ Non | ❌ Non | Ardoise moderne discret (`#475569`) |
| **`contemporary_satellite`** (Esri Satellitaire) | 2024 | ❌ Non | ❌ Non | Cyan haute visibilité contrasté (`#38bdf8`) avec halo noir |
| **`nasa_night_lights`** (Black Marble) | 2024 | ❌ Non | ❌ Non | Ambre doré nocturne (`#fbbf24`) avec halo noir |
| **`contemporary_national_geographic`** (Atlas) | 2024 | ❌ Non | ✅ **Oui** | Ambre atlas physique (`#854d0e`) |
| **`contemporary_positron_lite`** (Dark Slate) | 2024 | ❌ Non | ❌ Non | Bleu ciel lumineux (`#38bdf8`) avec halo ardoise sombre |
| **`futuristic`** (Hologramme Cyberpunk) | 2150 | ❌ Non | ✅ **Oui** | Cyan holographique néon (`#00f3ff`) |
| **`futuristic_cyberpunk_neon`** | 2180 | ❌ Non | ✅ **Oui** | Magenta néon éclatant (`#ff007f`) |
| **`futuristic_space_opera`** | 3000 | ❌ Non | ✅ **Oui** | Bleu stellaire (`#93c5fd`) |
| **`tolkien_high_fantasy`** (Troisième Âge) | Fantasy | ✅ **Oui** | ❌ Non | Rose des vents elfique (`#5c3a21` / or) |
| **`tolkien_light_fantasy`** (Valinor & Lórien) | Fantasy | ❌ Non | ❌ Non | Or féerique doux (`#854d0e`) |
| **`tolkien_dark_fantasy`** (Mordor & Angband) | Fantasy | ❌ Non | ❌ Non | Braise ardente (`#dc2626`) avec halo noir |
| **`realistic_satellite`** (Globe Réaliste) | 2024 | ❌ Non | ❌ Non | Cyan azur contrasté (`#38bdf8`) |

> **Règle absolue** : Quel que soit le réglage par défaut du fond de carte, **l'utilisateur conserve 100% de liberté dans le menu** : il peut à tout instant cocher ou décocher le graticule et/ou les rhumbs. Le fond de carte s'adapte instantanément (apparition avec la palette idéale ou disparition totale).

---

## Proposed Changes

### Core & Configuration

#### [NEW] [`styleFeatureDefaults.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/core/styles/styleFeatureDefaults.ts)
- Création de la fonction utilitaire pure `getBasemapFeatureDefaults(styleId: BasemapStyleId)` qui retourne l'état par défaut (`portulanRhumbVisible`, `graticuleVisible`, `bordersVisible`) selon la matrice cartographique ci-dessus.
- Exportation d'une fonction de palette `getGraticuleStyleForBasemap(styleId: BasemapStyleId)` retournant la couleur de ligne, l'opacité, la couleur d'étiquette et la couleur de halo adaptées à chaque fond.

#### [MODIFY] [`appStateDefaults.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/app/state/appStateDefaults.ts)
- Utilisation de `getBasemapFeatureDefaults(initialAppState.basemapStyle)` pour initialiser dynamiquement les booléens au démarrage.

#### [MODIFY] [`storeUiActions.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/app/state/storeUiActions.ts)
- Dans `setBasemapStyle(style)` : appliquer automatiquement les valeurs de `getBasemapFeatureDefaults(style)` pour synchroniser les cases à cocher de l'interface en temps réel (`portulanRhumbVisible`, `graticuleVisible`, `basemapBordersVisible`).

---

### Moteur Cartographique & Calques MapLibre

#### [MODIFY] [`grid-reference-layers.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/cartography/modules/grid-reference-layers.ts)
- **Nouvelle fonction `updateGraticuleStyle(map: Map | null, styleId: BasemapStyleId)`** :
  Met à jour dynamiquement `line-color`, `line-opacity`, `text-color`, `text-halo-color`, `text-halo-width` de `colonial-graticule-lines` et `colonial-graticule-labels` en fonction de la palette du fond sélectionné (lumineux sur fond sombre, sépia sur fond clair, contrasté sur satellite).
- **Suppression du calque parasite `grid-layer` de `toggleGeoReferenceLines`** :
  `toggleGeoReferenceLines` ne contrôle désormais que les lignes nommées astronomiques (Équateur, Tropiques, Cercles polaires, Greenwich), sans laisser traîner un carroyage fantôme à 30°.
- **Nettoyage strict dans `toggleGraticuleGrid(map, visible)`** :
  Garantir que lorsque `visible = false`, tous les éléments du graticule sont rigoureusement masqués (`visibility: 'none'`).

#### [MODIFY] [`rhumb-layers.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/cartography/modules/rhumb-layers.ts)
- Extension de `updateRhumbPalette(map, preset, styleId)` :
  - Met à jour non seulement les centres (`rhumb-centers`), mais aussi la couleur et l'opacité des lignes (`rhumb-lines`) pour préserver leur netteté sur les fonds sombres ou satellitaires.
- Prise en charge des styles fantasy/Tolkien pour que les roses et arêtes soient positionnées harmonieusement sur les terres et mers imaginaires.

#### [MODIFY] [`map-service.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/cartography/map-service.ts)
- Dans `setBasemapStyle` : appeler systématiquement `updateGraticuleStyle` et `updateRhumbPalette`.
- Dans `applyAllCustomLayers` : réappliquer `updateGraticuleStyle` et `updateRhumbPalette` dès que le style WebGL a terminé son chargement.
- Dans `loadContinentsGeoJSON` (mondes Tolkien) :
  Insérer `braudel-ocean-mask`, `braudel-continents-fill` et `braudel-continents-outline` **AVANT** `rhumb-lines` et `colonial-graticule-lines` (au lieu de les empiler au-dessus). Les rhumbs et le graticule apparaissent ainsi fièrement par-dessus la topographie imaginaire et peuvent être masqués/affichés à volonté depuis le menu.

---

## Verification Plan

### Tests Automatisés
- Création d'un fichier de test dédié [`basemap-features.test.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/tests/basemap-features.test.ts) :
  1. Vérifier que `getBasemapFeatureDefaults` renvoie les booléens exacts pour les 25 styles cartographiques.
  2. Vérifier que `getGraticuleStyleForBasemap` génère les contrastes adaptés pour les thèmes clairs, sombres, satellitaires et tactiques.
  3. Vérifier que `setBasemapStyle` dans le store met à jour la sélection ainsi que les états par défaut des graticules et rhumbs.
  4. Vérifier que `toggleGraticuleGrid` et `toggleRhumbLines` modifient sans exception la propriété `visibility` de tous les calques associés.
- Exécution de la suite complète :
  ```bash
  cmd /c "npx vitest run"
  ```
- Vérification TypeScript :
  ```bash
  cmd /c "npx tsc --noEmit"
  ```

### Vérification Manuelle
- Vérifier dans l'interface le basculement entre :
  - *Moyen Âge (Portulan Catalan)* : Rhumbs affichés, Graticule masqué.
  - Décocher "Lignes de rhumb" dans le menu : les rhumbs disparaissent immédiatement.
  - Cocher "Méridiens & parallèles" : le graticule sépia apparaît.
  - Basculer sur *Tactique Guerre Froide (WarGames NORAD)* : le graticule vert phosphoreux CRT s'allume automatiquement avec les labels ambre.
  - Décocher "Méridiens & parallèles" : le carroyage s'éteint totalement (aucun résidu de lignes).
  - Basculer sur *Contemporain (Voyager)* : carte moderne épurée sans rhumbs médiévaux.
  - Basculer sur un monde Tolkien : les rhumbs et graticules s'affichent au-dessus des océans et continents imaginaires et répondent aux toggles du menu.

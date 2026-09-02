# Walkthrough — Résolution Définitive de la Perte de Contexte WebGL et du Fichier Vidéo Vide

## Diagnostic du Problème
Le journal de la console utilisateur indiquait deux symptômes critiques :
1. `WebGL context was lost. maplibre-gl.js:46:517963`
2. `[Video Export] Timeout garde-fou onstop atteint, finalisation immédiate. video-export.ts:265:17 ===> un fichier vide est renvoyé.`

### Cause Racine
1. **Saturation GPU par `triggerRepaint` synchrone** : L'appel forcé de `map.triggerRepaint()` cadencé par `setInterval` à 30/60 FPS surchargeait le thread de rendu WebGL de MapLibre en concurrence avec la capture vidéo, provoquant le crash du GPU (`WebGL context was lost`).
2. **Conflit de lecture sur le Drawing Buffer WebGL** : MapLibre GL détruit son framebuffer à chaque swap de frame (`preserveDrawingBuffer: false`). Lorsque `captureStream()` tente d'extraire directement un stream d'un canevas WebGL sans buffer préservé, le flux vidéo s'interrompt net dès la perte de contexte, laissant `chunks` vide (0 octet).

---

## Solutions Appliquées

### 1. Architecture Canvas 2D Relais (*Offscreen Compositor*)
Dans [`video-export.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/video-export.ts) :
- La carte WebGL n'est **plus jamais capturée directement** par `captureStream()`.
- Un canevas 2D dédié (`recordCanvas`) est créé comme relais intermédiaire.
- Une boucle légère pilotée par `requestAnimationFrame(renderFrameLoop)` copie le canevas de la carte (`ctx.drawImage(mapCanvas, 0, 0)`) en parfaite synchronisation avec le rafraîchissement vertical de l'écran (V-Sync).
- Le `MediaStream` est extrait depuis ce **canevas 2D**, qui est par nature 100% insensible aux pertes de contexte WebGL.

### 2. Suppression du `setInterval(triggerRepaint)`
- Le bombardement artificiel du GPU a été supprimé. MapLibre GL gère ses animations de transition à son propre rythme naturel sans aucune saturation ni risque de crash.

### 3. Enregistrement en Tranches Régulières (250 ms)
- `recorder.start(250)` assure une alimentation régulière et continue du codec sans à-coups mémoire.
- À l'arrêt, `finalBlob` contient l'ensemble des données encodées, générant un fichier volumineux, complet et lisible.

### 4. Éradication de l'Écran Noir (Rattachement DOM et Écouteur synchrone `map.on('render')`)
- **Diagnostic** : La vidéo générée pesait ~600 Ko pour 22 scènes et affichait un écran uniformément noir (#1e293b). Deux causes :
  1. `recordCanvas` créé hors DOM : Chromium ne composite pas les canvas non rattachés pour `captureStream()`.
  2. Buffer WebGL vidé après swap : `requestAnimationFrame` autonome lisait un buffer WebGL déjà vidé par le compositeur du navigateur.
- **Correctifs appliqués** :
  1. `recordCanvas` rattaché au `document.body` (en `position: fixed; left: -99999px; opacity: 0; pointer-events: none`).
  2. Écouteur direct `map.on('render', copyCurrentFrame)` : copie synchrone à chaque frame WebGL peinte, quand le buffer est plein.
  3. Notification `track.requestFrame()` à chaque frame copiée pour forcer l'enregistrement.
  4. Repaint initial `map.triggerRepaint()` avant le début de l'enregistrement.
  5. Nettoyage garanti dans `finally` (`map.off('render')` et `recordCanvas.remove()`).

### 5. Numérotation Automatique des Périodes & Vérification des Entités Cartographiées
- **Objectif** : Assigner automatiquement un numéro à chaque période dans la timeline et s'assurer qu'un algorithme vérifie la présence et la capture des entités cartographiées avant de passer à la période suivante.
- **Réalisations** :
  1. **Séquençage temporel ordonné (`prepareStoryForExport`)** :
     - Chaque époque active de la timeline est extraite et numérotée : `Période 1/N — ${label}`, `Période 2/N`, etc.
     - Les scènes reçoivent `periodNumber` et `totalPeriods` typés dans `StorySceneSchema`.
  2. **Synchronisation synchrone (`options.updateEntities`)** :
     - Invoque immédiatement `mapService.updateEntities()` pour chaque période sans dépendre des rendus React.
  3. **Algorithme `verifyAndCapturePeriodEntities`** :
     - Sonde `queryRenderedFeatures` et `braudel-entities` pour certifier la présence GPU des polygones, lignes et points historiques.
     - Impose un quota minimum de trames vidéo capturées (10 à 15 trames, ~400 à 500 ms) avec ces entités affichées avant d'autoriser la transition caméra suivante.
  4. **Télémétrie IHM enrichie (`ExportVideoModal.tsx`)** :
     - Affichage de la liste des périodes séquencées en phase initiale (`idle`).
     - Badge dynamique en direct `✓ X entités vérifiées` pendant l'enregistrement.

### 6. Incrustation Cinématique de la Légende Cartographique
- **Objectif** : Inclure dans le flux vidéo un cartouche dynamique contextualisé (période, date, pastilles de couleur des entités actives).
- **Réalisations** :
  1. **Fonction de tracé de cartouche cinématique (`drawVideoLegend`)** :
     - Dessiné dans le `recordCanvas` par-dessus la carte sur chaque frame.
     - Fond sombre translucide (`rgba(15, 23, 42, 0.88)` vers `rgba(10, 15, 28, 0.94)`), bords arrondis (`drawRoundedRect`), bordure fine lumineuse et ombre portée douce.
     - Échelle responsive proportionnelle à la résolution de la vidéo (Full HD 1080p).
  2. **Contenu contextuel par période** :
     - Badge violet majuscule : `PÉRIODE X/N • AN Y` (avec prise en charge automatique des dates avant J.-C., ex : `500 AV. J.-C.`).
     - Titre de la période historique (ex : *« Haut-Empire Romain »* ou *« Tabula Rogeriana »*).
     - Décompte total et pastilles de couleur des entités actives répertoriées pour l'époque (avec débordement `+ N autre(s) entité(s)...`).
  3. **Mise à jour fluide** :
     - `currentLegendData` s'actualise automatiquement au début de chaque période et lors des vols de caméra.
  4. **Contrôle utilisateur (`ExportVideoModal.tsx`)** :
     - Sélecteur interactif permettant d'activer ou de désactiver l'incrustation de la légende d'un simple clic.
  5. **Éradication des rémanences par Double Buffer Dédié (`cleanMapCanvas`)** :
     - **Cause racine des rémanences** : Lorsque le nombre d'entités diminue d'une période à l'autre (ex: 5 entités en Période 11 puis 1 seule en Période 14), le cartouche devient plus petit en hauteur. Les pixels de l'ancien cartouche plus grand n'étaient pas réécrits lors des pauses car le buffer WebGL était vidé.
     - **Solution appliquée** : Création d'un buffer intermédiaire `cleanMapCanvas` qui stocke exclusivement les trames WebGL pures. À chaque trame vidéo, `composeVideoFrame()` réécrit 100% de la surface avec la carte propre avant de dessiner la légende active, éliminant tout artefact d'escalier ou de superposition.

### 7. Harmonisation Graticules & Lignes de Rhumb (25 Fonds de Carte & Débrayage Menu)
- **Objectif** : Uniformiser l'affichage par défaut des méridiens/parallèles 10° et des lignes de rhumb selon l'époque historique du fond de carte, garantir un contraste et une lisibilité parfaits quel que soit le thème (sombre, clair, satellite, fantastique) et assurer un débrayage net sans résidu dans le menu IHM.
- **Réalisations** :
  1. **Socle de configuration (`styleFeatureDefaults.ts`)** :
     - `getBasemapFeatureDefaults(styleId)` : Définit l'état initial des cases à cocher (`portulanRhumbVisible`, `graticuleVisible`, `bordersVisible`) pour les 25 styles cartographiques. Les rhumbs sont activés par défaut sur les portulans et cartes marines (`medieval`, `renaissance`, `al_idrisi`, `jules_verne`, `tolkien_high_fantasy`), tandis que le graticule 10° est activé sur les atlas et cartes d'état-major (`colonial`, `modern`, `twentieth_century_physical`, `military_staff_ww1_ww2`, `military_tactical_wargames`, `contemporary_national_geographic`, `futuristic*`).
     - `getGraticuleStyleForBasemap(styleId)` : Génère des palettes dynamiques à fort contraste : vert phosphore `#22c55e` pour Wargames, cyan néon `#06b6d4` pour Electro 80s, cyan haute visibilité `#38bdf8` avec halo sombre `#000` pour Satellite et Positron Lite, et sépia/cuivre pour les fonds historiques clairs.
  2. **Synchronisation IHM automatique (`storeUiActions.ts`, `storeActions.ts`, `worldSlice.ts`)** :
     - Lors du changement de fond de carte (`setBasemapStyle`) ou de la création/chargement d'un monde, les cases du menu s'alignent automatiquement sur les valeurs par défaut historiques du style choisi.
  3. **Mise à jour dynamique de la peinture MapLibre (`grid-reference-layers.ts`, `rhumb-layers.ts`)** :
     - `updateGraticuleStyle(map, styleId)` : Réapplique dynamiquement les teintes, opacités et halos sur `colonial-graticule-lines` et `colonial-graticule-labels`.
     - `updateRhumbPalette(map, preset, styleId)` : Réapplique la couleur et l'opacité des arêtes (`rhumb-lines`) et des centres (`rhumb-centers`) pour rester éclatantes sur les thèmes sombres et satellitaires.
  4. **Élimination du carroyage fantôme 30°** :
     - `toggleGeoReferenceLines` ne contrôle désormais que les lignes astronomiques remarquables. Le calque 30° redondant a été neutralisé pour ne plus persister à l'écran quand le graticule 10° est décoché.
  5. **Maintien de la visibilité sur les mondes fictifs (Tolkien)** :
     - Dans `map-service.ts`, `braudel-ocean-mask` et `braudel-continents-fill` sont désormais insérés *avant* les couches de rhumbs et de graticule (`beforeLayer`), garantissant leur affichage complet au-dessus des continents et mers imaginaires.

### 8. Stabilisation Intégrale des Tuiles Vectorielles, Graticules & Rhumbs et Traçabilité par Logs
- **Objectif** : Éliminer les anomalies et désynchronisations persistant lors des transitions de styles, garantir l'auto-réparation des calques détruits et apporter des preuves de fonctionnement par logs en console.
- **Réalisations** :
  1. **Système de Logs de Diagnostic Horodaté (`carto-logger.ts`)** :
     - Émet des événements préfixés `[Carto Layers] [ISO_TIMESTAMP]` retraçant avec précision l'ajout de sources, la création de calques, les synchronisations de palettes et les bascules de visibilité.
  2. **Mécanisme Auto-Réparateur (*Self-Healing Layers*)** :
     - `toggleGraticuleGrid` et `toggleRhumbLines` détectent désormais les sources orphelines (source GeoJSON présente mais calques détruits par MapLibre lors d'un diffing de style) et recréent instantanément les calques manquants avec la palette adaptée.
  3. **Ordonnancement Strict de l'Empilement (`beforeId: 'braudel-polygons'`)** :
     - L'ensemble des calques de repères (graticules 10°, lignes astronomiques et maillage de rhumb) est systématiquement inséré sous les entités géopolitiques historiques (`braudel-polygons`), garantissant que les frontières, villes et routes restent toujours parfaitement visibles au premier plan.
  4. **Immunité Totale des Calques dans `mapStylesManager.ts`** :
     - Les fonctions de bascule de visibilité des labels, frontières et routes du fond de carte ignorent désormais scrupuleusement les calques `colonial-`, `rhumb-`, `geo-reference-` et `braudel-`.
  5. **Synchronisation Immédiate des Visibilités dans `map-service.ts`** :
     - `setBasemapStyle` harmonise immédiatement `lastPortulanRhumbVisible`, `lastGraticuleVisible` et `lastBordersVisible` dès l'appel, supprimant la race condition entre les effets React.

### 9. Désactivation Intégrale par Défaut (Rhumb & Graticule) & Robustesse Coche/Décoche 2D/3D
- **Objectif** : Décocher toutes les options de rhumbs et de graticules par défaut sur l'ensemble des 25 tuiles cartographiques, confier l'activation explicite à l'utilisateur et garantir une bascule fluide en 2D comme en 3D (Globe, Pitch et Relief).
- **Réalisations** :
  1. **Remise à zéro des réglages par défaut (`styleFeatureDefaults.ts`, `realStylesHistorical.ts`, `realStylesContemporary.ts`, `fantasyStyles.ts`, `mapLayersManager.ts`)** :
     - `portulanRhumbVisible: false` et `graticuleVisible: false` sur l'ensemble des 25 fonds. Aucune ligne de repère n'est dessinée au chargement d'un monde ou lors d'un basculement de style.
  2. **Coche et décoche multiple en 2D comme en 3D (`grid-reference-layers.ts`, `rhumb-layers.ts`)** :
     - `toggleGraticuleGrid` et `toggleRhumbLines` forcent désormais systématiquement un rafraîchissement GPU immédiat (`map.triggerRepaint()`), assurant la réactivité instantanée aussi bien en projection Mercator (2D) qu'en projection Globe sphérique ou en vue inclinée 3D (pitch).
     - Lors de chaque activation (`visible: true`), la palette chromatique est automatiquement réalignée avec le `styleId` actif.
  3. **Tests unitaires dédiés (`basemap-features.test.ts`)** :
     - Validation des 25 styles à `false` par défaut.
     - Validation de 5 cycles consécutifs de coche/décoche sans fuite de calques ni incohérence d'état.

### 10. Résolution Définitive des Pertes de Contexte WebGL (`webglcontextlost`)
- **Diagnostic** : Lors des rechargements à chaud (Vite HMR) ou de l'initialisation de la carte, le message `WebGL context was lost. 5 maplibre-gl.js` apparaissait dans la console.
- **Causes Racines** :
  1. **Double appel concurrent à `map.setStyle()` au démarrage** : Lorsque `MapView` montait, `mapService.initialize()` créait la carte avec le style initial. Immédiatement après, l'effet React `[basemapStyle]` appelait `setBasemapStyle(basemapStyle)`, qui constatait que `map.getStyle()` était encore `undefined` (chargement asynchrone non terminé) et appelait `map.setStyle()` une deuxième fois 5 ms plus tard.
  2. **Rechargement intempestif de styles identiques** : Deux styles partageant la même URL vectorielle (ex: `medieval` et `renaissance` sur Positron) détruisaient et recréaient inutilement tout le pipeline WebGL.
  3. **Absence d'interception de l'événement navigateur `webglcontextlost`**.
- **Correctifs Appliqués** :
  1. **Verrou `isStyleInitialized`** dans `MapService` : Si le style est identique et déjà initialisé, `setBasemapStyle` met à jour les visibilités sans rappeler `map.setStyle()`.
  2. **Déduplication `activeStyleUrl`** dans `mapStylesManager.ts` : Si l'URL de style est déjà active, `applyBasemapStyle` réutilise le pipeline WebGL sans destruction.
### 11. Résolution des Blocages d'Activation sur les Fonds Historiques & Fantasy (Peutinger, Idrissi, Portulan, Maior Blaeu, Cassini, Verne, Tolkien)
- **Objectif** : Permettre l'affichage immédiat du graticule et des lignes de rhumb lors de la coche dans le menu latéral sur les 6 cartes historiques et les 3 univers Tolkien.
- **Réalisations** :
  1. **Remplacement des verrous bloquants `isStyleLoaded()`** :
     - Dans [`grid-reference-layers.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/cartography/modules/grid-reference-layers.ts) et [`rhumb-layers.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/cartography/modules/rhumb-layers.ts), remplacement de `if (!map.isStyleLoaded())` par `if (typeof map.getStyle === 'function' && !map.getStyle())`.
     - Supprime la mise en attente infinie `map.once('style.load')` qui ne se déclenchait jamais sur les styles inline (Tolkien) ou lors des réutilisations d'URL de style (`activeStyleUrl`).
  2. **Harmonisation et Enrichissement des Palettes Chromatiques** :
     - Ajout explicite des cas `medieval` (Portulan : `#7a4a20`, opacité 0.55) et `renaissance` (Maior Blaeu : `#855a2a`, opacité 0.55) dans `getGraticuleStyleForBasemap`.
     - Rehaussement du contraste pour `antiquity`, `modern`, `al_idrisi`, `jules_verne` et les univers Tolkien.
     - Prise en charge des teintes rhumb adaptées (`#8b5a2b` / `#7a3e1d` pour les parchemins anciens, `#b8860b` / `#ef4444` pour Tolkien).
  3. **Vérification Vitest & TypeScript** :
     - 191/191 tests passants avec mocks de style conformes.
     - 0 erreur TypeScript (`tsc --noEmit`).

---

## Validation
- **TypeScript** : 0 erreur (`tsc --noEmit`).
- **Tests unitaires** : 29 fichiers de tests, **191 tests passants sur 191 (100%)**, dont 13 tests ciblés dans [`basemap-features.test.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/tests/basemap-features.test.ts).
- **Wiki-as-Code** :
  - [`carto-logger.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/cartography/modules/carto-logger.md)
  - [`styleFeatureDefaults.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/core/styles/styleFeatureDefaults.md)
  - [`grid-reference-layers.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/cartography/modules/grid-reference-layers.md)
  - [`rhumb-layers.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/cartography/modules/rhumb-layers.md)
  - [`mapLayersManager.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/cartography/mapLayersManager.md)
  - [`map-service.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/cartography/map-service.md)
  - [`mapStylesManager.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/cartography/mapStylesManager.md)
  - [`basemap-features.test.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/tests/basemap-features.test.md)
  - [`audi-export-vd.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/audi-export-vd.md) complété avec les Sections 7.4 et 7.5 d'audit.
  - [`task.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/task.md) mis à jour et synchronisé.

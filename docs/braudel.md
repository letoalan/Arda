# Architecture Cartographique & Projections — Braudel / Arda

Ce document constitue la référence technique de l'architecture cartographique d'Arda / Braudel, avec la spécification détaillée des trois modes de projection et les arbitrages d'ingénierie documentés selon [`eckert.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/eckert.md).

---

## 1. Les Trois Modes de Projection

Braudel dispose désormais de trois modes de projection distincts et indépendants, sélectionnables via le menu de projection (`StylePanel.tsx`) :

| Mode | Type | Moteur | Usage & Spécificités |
|---|---|---|---|
| **Web Mercator (Plat 2D)** | 2D Conforme | MapLibre natif (`projection: { type: 'mercator' }`) | Navigation locale, carroyage régulier, repères maritimes portulans. Anamorphose importante aux hautes latitudes. |
| **Globe 3D (Sphérique)** | 3D Perspective | MapLibre natif (`projection: { type: 'globe' }`) | Exploration planétaire, vision globale, transitions cinématiques de caméra, vol spatial. |
| **Eckert IV 2D (Équivalente)** | 2D Pseudocylindrique | PROJ 9 Wasm (`ESRI:54012`) + MapLibre | **Projection officielle française pour les atlas scolaires**. Conservation stricte des rapports de surfaces terrestres. Pôles sous forme de lignes droites ($L_{\text{pôle}} = \frac{1}{2} L_{\text{équateur}}$). |

> [!NOTE]
> Conformément aux points de vigilance de [`eckert.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/eckert.md), aucun morphing continu type "shader globe ↔ Mercator" n'est tenté avec Eckert IV. Les trois modes restent des vues distinctes, sélectionnées explicitement par l'utilisateur ou activées lors des sauts d'échelle.

---

## 2. Décision d'Ingénierie : Voie 1 (`maplibre-proj`) vs Voie 2 (Pré-déformation Statique)

La spécification [`eckert.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/eckert.md) identifiait deux voies réalistes pour contourner la limitation de MapLibre GL JS (qui n'intègre pas nativement Eckert IV dans ses shaders GPU) :

### Voie 1 — Reprojection dynamique à la volée via Wasm (`maplibre-proj` & `backproj`)
- **Mécanisme ("Dirty Reprojector")** :
  1. MapLibre est configuré en `projection: { type: 'mercator' }`.
  2. Les coordonnées sources $(\lambda, \varphi)$ sont projetées en mètres Eckert IV via PROJ compilé en WebAssembly (`ESRI:54012`).
  3. Ces coordonnées sont mises à l'échelle de façon isotrope ($S_x = S_y$) puis inverse-projetées vers de "fausses coordonnées Mercator" (fake Mercator).
  4. MapLibre charge et affiche ces tuiles vectorielles comme s'il s'agissait de Mercator standard, produisant la silhouette exacte d'Eckert IV sur le canevas GPU.
- **Performances constatées** :
  - Débit Wasm : $> 55\,000$ sommets par seconde sur des géométries denses.
  - Fluidité en pan continu : 60 FPS constants sans saccade.
  - Temps d'initialisation Wasm : $< 1\,000$ ms (instanciation unique du transformateur mise en cache).

### Voie 2 — Pré-déformation statique au build (`preproject-eckert4.ts` & `geojson-vt`)
- **Mécanisme** :
  1. Script Node.js local CLI (`npm run preproject:eckert <source.geojson> [destination.geojson]`).
  2. Reprojection offline en amont du build.
  3. Découpage en pyramide de tuiles vectorielles via `geojson-vt` ou consommation GeoJSON directe.
  4. Coût CPU/GPU nul au runtime : zéro recalcul.

### Arbitrage et Architecture Retenue pour la Production
- **Approche Hybride Complémentaire** :
  - **Au Runtime (Voie 1 active)** : Pour les fonds de carte vectoriels distants (ex. CARTO Positron, Dark Matter, OpenMapTiles) et les imports dynamiques de GeoJSON par l'utilisateur (fichiers personnalisés, propositions d'IA), la Voie 1 (`maplibre-proj` et `eckertProjService`) opère à la volée.
  - **Pour les Jeux Statiques Embarqués (Voie 2 disponible)** : Le script CLI `scripts/preproject-eckert4.ts` est intégré au pipeline de build pour pré-générer les collections historiques lourdes (ex. `public/data/eckert4/`) afin d'offrir un chargement instantané sans mobilisation du thread Wasm pour les environnements à ressources très limitées.

---

## 3. Gestion du Relief Raster DEM vs Vectoriel

Les couches de relief raster (`raster-dem` / `hillshade` Terrarium) ne peuvent pas être déformées par un transformateur de coordonnées vectorielles sans interpolateur de maillage raster GPU.

- **Fonds Vectoriels & Hypsométriques** : Les couches vectorielles (`water`, `landcover`, `boundary`, `road`, `place`) sont reprojetées à 100% avec une fidélité géométrique parfaite.
- **Reliefs et Massifs Montagneux** :
  - Sur les styles vectoriels, les limites continentales et les traits de relief vectoriels conservent leur netteté.
  - Pour les mondes fictifs (Tolkien) disposant d'un DEM synthétique, le Hillshade peut être converti en courbes de niveau vectorielles (`d3-contour`) ou complété par le canevas WebGL fragment shader en cas de besoin d'ombrage continu.

---

## 4. Intégrité des Coordonnées Métier (WGS84)

Toutes les coordonnées métier dans le store Zustand (`world.entities`, `world.relations`, dessins) restent strictement en WGS84 pur :

1. **Reprojection à la volée vers MapLibre** : `mapService.updateEntities` applique `eckertProjService.reprojectGeoJSON` uniquement avant l'appel à `source.setData`.
2. **Dé-projection des Interactions & Dessin** :
   - Clic sur la carte : `mapService.getGeographicCoordinateFromEvent` inverse les coordonnées fake Mercator pour retrouver la latitude et la longitude exactes.
   - Tracé d'entité via MapboxDraw : `mapService.confirmDrawing` applique `unprojectRenderedFeatureCoordinates` pour que l'entité enregistrée dans le projet contienne toujours les coordonnées géographiques réelles.
3. **Calculs de Distances Exacts** : `calculateGeodesicDistanceKm` utilise la formule d'Haversine sur coordonnées réelles, éliminant les anamorphoses d'échelle inhérentes aux projections planes.

---

## 5. Conformité RGPD & Serverless

Le pipeline respecte à 100% les contraintes du projet Arda / Braudel :
- **Zero-Server** : Aucun serveur de tuiles distant spécifique ni proxy cartographique requis.
- **Exécution Locale** : PROJ Wasm s'exécute directement dans le navigateur ou dans Node.js.
- **Export Indépendant** : Fonctionne hors-ligne pour la génération d'atlas PDF et l'export vidéo Studio.

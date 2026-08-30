# Rapport d'Analyse d'Anomalie : Absence des Calques Vectoriels (Layers) lors du Snapshot de l'Atlas PDF

## 1. Contexte Logiciel et Cartographique

L'application **Arda / Braudel** est un système d'information géographique (SIG) et historique permettant d'explorer et d'exporter des atlas spatio-temporels interactifs. 

### Architecture logicielle impliquée :
- **Moteur de rendu cartographique :** [MapLibre GL JS](https://maplibre.org/) exploitant WebGL pour le rendu GPU haute performance des tuiles vectorielles et des couches de géométries (polygones d'empires, frontières, routes, cités).
- **Gestion des données & État applicatif :** 
  - Entités historiques stockées sous forme de `WorldEntity` dans le state central (`useWorldStore`), avec des propriétés géométriques GeoJSON et des plages de validité temporelle (`temporalRange: [start, end]` ou `{ validFrom, validTo }`).
  - Catalogue de fonds historiques mondiaux (`GEOPOLITICA_SOURCES`, `geojson-catalog-service.ts`) indexant les périodes de l'Antiquité aux Temps Modernes.
  - Gestionnaire de couches vectorielles (`mapLayersManager.ts`) déclarant la source `braudel-entities` et les calques WebGL associés (`braudel-polygons`, `braudel-polygons-outline`, `braudel-lines`, `braudel-points`).
- **Moteur d'exportation documentaire :** 
  - `export-multimedia.ts` orchestrant `jsPDF` (génération vectorielle A4 paysage) et la capture d'images raster depuis le buffer WebGL (`HTMLCanvasElement.toDataURL`).
  - `ExportPdfModal.tsx` et `pdf-timeline-utils.ts` assurant la sélection des époques, le calcul du temps de capture médian ($T_{\text{snapshot}} = \text{round}\left(\frac{T_{\text{start}} + T_{\text{end}}}{2}\right)$) et la configuration du livret.

---

## 2. Description Détaillée de l'Anomalie

### Symptôme constaté :
Lors de l'exportation d'un livret multi-époques (ou d'un snapshot de carte unique) au format PDF :
1. Le document PDF est généré avec la pagination attendue (1 page par époque sélectionnée).
2. La mise en page, la rose des vents, les cartouches de texte, la timeline de bas de page et la légende latérale sont correctement remplis.
3. **Cependant, la zone cartographique principale ne montre que le fond de carte vectoriel (océans, masses terrestres, lignes de repère/grille) : AUCUN polygone géopolitique, tracé de frontière, réseau ou point d'entité n'apparaît sur le canevas de la carte dans le PDF.** La carte apparaît vierge de tout calque historique additionnel.

---

## 3. Analyse des Causes Racines dans le Code

L'investigation technique identifie quatre facteurs combinés à l'origine de cette absence de calques sur le snapshot :

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                          FLUX DE RENDU ET POINTS DE RUPTURE                       │
└───────────────────────────────────────────────────────────────────────────────────┘

 [Catalogue Geopolitica / Store]
               │
               ▼  (Rupture 1 : Entités non matérialisées dans le World Store)
 [Filtrage Temporel à mi-période T_mid]
               │
               ▼  (Rupture 2 : Décalage de temporalRange [start, end])
 [mapGeojsonRenderer.buildEntitiesGeoJSON]
               │
               ▼  (FeatureCollection vide ou incomplète)
 [mapService.updateEntities / source.setData]
               │
               ▼  (Rupture 3 : Traitement asynchrone Web Worker MapLibre non terminé)
 [Pipeline WebGL GPU / Shaders]
               │
               ▼  (Rupture 4 : Snapshot canvas prématuré avant le cycle de tirage)
 [PDF export: map.getCanvas().toDataURL]  ──► CARTE VIERGE DE LAYERS DANS LE PDF
```

### Cause 1 : Déconnexion entre les époques du Catalogue et les entités du World Store
- **Localisation :** `src/services/export/pdf-timeline-utils.ts` & `src/app/components/data/ExportPdfModal.tsx`.
- **Mécanisme :** `extractActiveEpochs` génère la liste des époques sélectionnables à partir des entités existantes mais également des sources externes prédéfinies (`GEOPOLITICA_SOURCES` du catalogue historique).
- Si l'utilisateur sélectionne une époque issue du catalogue dont les fichiers GeoJSON n'ont pas encore été préalablement téléchargés et injectés dans `world.entities`, `world.entities` ne contient aucun polygone pour cette époque.
- Lors de l'itération dans `exportMultiEpochPDF`, `updateMapEntities(epoch.year)` filtre un tableau `world.entities` vide pour cette année-là. Le GeoJSON résultant est `{ type: 'FeatureCollection', features: [] }`, ne laissant rien à dessiner sur la carte.

### Cause 2 : Incompatibilité des formats et bornes de `temporalRange` lors du calcul au point médian
- **Localisation :** `src/services/cartography/mapGeojsonRenderer.ts`.
- **Mécanisme :** L'évaluation de visibilité temporelle applique la condition :
  $$\text{validFrom} \le T_{\text{currentTime}} \le \text{validTo}$$
  - Avec le snapshot au point médian ($T_{\text{snapshot}} = -450$ pour $[-500, -400]$), si les entités avaient une structure `temporalRange` hétérogène (objet `{ validFrom, validTo }` vs tableau `[start, end]`, ou bornage ponctuel strict $\text{validTo} = -500$), la condition renvoyait `false`.
  - Bien que le polymorphisme `{ validFrom, validTo }` / `[start, end]` ait été introduit, si les entités importées ne couvrent pas strictement l'année médiane cible $T_{\text{mid}}$, elles sont exclues du GeoJSON transmis à MapLibre.

### Cause 3 : Asynchronisme des Web Workers MapLibre GL et des Buffers GPU
- **Localisation :** `src/services/export/export-multimedia.ts` & `src/services/cartography/map-service.ts`.
- **Mécanisme :**
  1. `updateMapEntities(epoch.year)` exécute `mapService.updateEntities(geojsonData)`, qui appelle `source.setData(geojsonData)`.
  2. MapLibre GL délègue le parsing GeoJSON, le découpage en tuiles vectorielles et la génération des vertex buffers à des **Web Workers en arrière-plan**.
  3. Dans `exportMultiEpochPDF`, l'écouteur `map.once('render', ...)` ou `map.once('idle', ...)` se déclenche parfois sur une frame intermédiaire avant que le worker n'ait fini de recharger la source `braudel-entities` et que les shaders de remplissage (`braudel-polygons`, `braudel-polygons-outline`) n'aient repeint le framebuffer WebGL.
  4. La capture synchrone `map.getCanvas().toDataURL('image/png')` extrait alors le canevas alors que la géométrie n'est pas encore téléversée sur la carte graphique.

### Cause 4 : Priorité d'empilement (Z-Index) et présence des Layers MapLibre
- **Localisation :** `src/services/cartography/mapLayersManager.ts`.
- **Mécanisme :** Lors d'un changement de style ou d'une réinitialisation de canevas lors de l'export, si `setupVectorLayers(map)` n'a pas réattaché `braudel-polygons` au-dessus des couches raster ou tuiles de fond, ou si les filtres `['in', '$type', 'Polygon']` ne correspondent pas au typage normalisé des entités, le moteur WebGL ignore le dessin des polygones.

---

## 4. Plan de Correction Proposé

| N° | Composant | Action Corrective |
|---|---|---|
| **1** | `export-multimedia.ts` | **Chargement Dynamique à la Volée :** Lors de l'itération sur les époques du livret, si les entités d'une époque du catalogue ne sont pas en mémoire, charger immédiatement le GeoJSON correspondant depuis le catalogue (`geojson-catalog-service`) et l'injecter dans la source de la carte. |
| **2** | `export-multimedia.ts` | **Verrouillage Strict `isSourceLoaded` :** Remplacer le `setTimeout` par une attente active et résolue de `map.isSourceLoaded('braudel-entities') && map.areTilesLoaded()` avec `map.triggerRepaint()` pour garantir que le GPU a finalisé le rendu avant toute extraction `toDataURL`. |
| **3** | `mapGeojsonRenderer.ts` | **Tolérance Temporelle d'Époque :** S'assurer que le filtrage à $T_{\text{mid}}$ inclut bien toutes les entités de la tranche $[T_{\text{start}}, T_{\text{end}}]$ associée à l'époque en cours d'export. |
| **4** | `mapLayersManager.ts` | **Garantie d'Empilement :** Forcer l'existence et la visibilité des calques `braudel-polygons`, `braudel-polygons-outline`, `braudel-lines` et `braudel-points` au-dessus du style de fond lors de la capture. |

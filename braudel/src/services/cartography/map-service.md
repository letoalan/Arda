# Documentation — Service Cartographique (`map-service.ts`)

## Rôle & Responsabilité
`map-service.ts` orchestre l'instance MapLibre GL, les calques, les modes d'édition et les interactions cartographiques. Il assure le pont entre l'état applicatif Zustand, le moteur WebGL natif, et les trois projections supportées (`mercator`, `globe`, `eckert4`).

## Orchestration de la Projection Eckert IV 2D
- **Trois Modes Distincts et Indépendants** :
  - `'mercator'` : Web Mercator 2D standard conforme.
  - `'globe'` : Globe 3D sphérique avec perspective orthographique.
  - `'eckert4'` : Planisphère 2D équivalent pseudocylindrique officiel (ESRI:54012).
- **Coordination avec le Canevas Shader GPU (`EckertIVWarpCanvas`)** :
  - Lorsqu'il bascule vers `'eckert4'`, le service configure MapLibre en `projection: { type: 'mercator' }` et cadre l'ensemble du planisphère à `[0, 0]` avec `pitch: 0, bearing: 0, zoom: 1.0`.
  - La carte MapLibre sous-jacente produit un flux de texture 2D net contenant les couches vectorielles, raster, hillshade et entités WGS84 pures.
  - Le composant `EckertIVWarpCanvas` échantillonne cette texture GPU et applique la déformation continue analytique d'Eckert IV à 60 FPS, sans corruption ni double-projection des données métier.
- **Dé-projection des Géométries Dessinées (`confirmDrawing`)** :
  - Lorsqu'un utilisateur trace une entité (Point, LineString, Polygon) en mode Eckert IV, `confirmDrawing` s'assure de la cohérence géographique en coordonnées réelles WGS84 avant émission de `emitDrawComplete`.
- **Restauration Standard (`restoreStandardProjection`)** :
  - Lors du retour à `'mercator'` ou `'globe'`, la caméra et les projections standard sont restaurées instantanément sans rechargement lourd du style cartographique.
- **Interrogation d'État (`isEckertIV()`, `getCurrentProjection()`)** :
  - Méthodes d'accès immédiat pour l'ensemble des modules UI et d'exportation.

## Rendu des Reliefs et Continents Fictifs (Aspect Tuile Réelle)
- **Fond continental subtil & trait de côte fin** : Un aplat de couleur texturée issue du thème Tolkien (`mapPaintOverrides.landcover`) et un trait de côte délicat (`1.2px`) servent de base sous le relief.
- **Hillshade procédural 3D au premier plan** : Le calque `braudel-synth-hillshade` (généré à partir du DEM synthétique Terrarium) est rendu au-dessus du fond continental avec ombrage directionnel (315° NW), ombres et lumières adaptées au thème actif.
- **Exportation et Capture WebGL** : L'option `preserveDrawingBuffer: true` est activée dans la configuration de `maplibregl.Map` afin de garantir la disponibilité continue des tampons graphiques pour la capture instantanée haute définition (PDF, JPEG, Timelapse) sans écran noir.
- **Synchronisation Synchrone des Fonds et Repères (`setBasemapStyle`)** : Dès qu'un style est appliqué, `setBasemapStyle` harmonise immédiatement `lastPortulanRhumbVisible`, `lastGraticuleVisible` et `lastBordersVisible` d'après `getBasemapFeatureDefaults(styleId)` pour éliminer toute race condition entre les effets React.
- **Auto-réparation et Logs de Diagnostic (`logCarto`)** : L'ensemble des transitions de style (`SET_BASEMAP_STYLE`), des initialisations de calques (`APPLY_ALL_CUSTOM_LAYERS_START`) et des basculements de visibilité est horodaté et consigné en console sous le tag `[Carto Layers]`.
- **Résilience WebGL & Prévention des Pertes de Contexte (`webglcontextlost`)** :
  - Déduplication stricte des appels `setBasemapStyle` : si le style est déjà initialisé ou identique, `map.setStyle()` n'est pas réinvoqué, évitant l'écrasement des textures en cours de chargement.
  - Écouteur d'interception sur `canvas.webglcontextlost` appelant `event.preventDefault()` pour empêcher la destruction définitive du canevas par le navigateur.
  - Écouteur sur `canvas.webglcontextrestored` réappliquant automatiquement l'ensemble des calques personnalisés dès rétablissement du GPU.
- **Accès au Style Actif (`getCurrentStyleId`)** : Permet aux composants régie et studio (`StudioTimeline`, `StudioWorkspaceMonitor`, `StudioProgramMonitor`) de consulter l'identifiant du fond de carte actif (`currentStyleId`) pour préserver les orientations spécifiques (ex. 180° Al-Idrisi).

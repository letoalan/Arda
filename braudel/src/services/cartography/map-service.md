# Documentation — Service Cartographique (`map-service.ts`)

## Rôle & Responsabilité
`map-service.ts` orchestre l'instance MapLibre GL, les calques, les modes d'édition et les interactions cartographiques.

## Rendu des Reliefs et Continents Fictifs (Aspect Tuile Réelle)
- **Suppression des calques vectoriels bruts de dessin** : Les anciens polygones verts opaques, les traits de dessin épais, les hachures et les cercles de sommets ont été retirés de la carte finale pour ne plus masquer le relief.
- **Fond continental subtil & trait de côte fin** : Un aplat de couleur texturée issue du thème Tolkien (`mapPaintOverrides.landcover`) et un trait de côte délicat (`1.2px`) servent de base sous le relief.
- **Hillshade procédural 3D au premier plan** : Le calque `braudel-synth-hillshade` (généré à partir du DEM synthétique Terrarium) est rendu au-dessus du fond continental avec ombrage directionnel (315° NW), ombres et lumières adaptées au thème actif.
- **Exportation et Capture WebGL** : L'option `preserveDrawingBuffer: true` est activée dans la configuration de `maplibregl.Map` afin de garantir la disponibilité continue des tampons graphiques pour la capture instantanée haute définition (PDF, JPEG, Timelapse) sans écran noir.
- **Synchronisation Synchrone des Fonds et Repères (`setBasemapStyle`)** : Dès qu'un style est appliqué, `setBasemapStyle` harmonise immédiatement `lastPortulanRhumbVisible`, `lastGraticuleVisible` et `lastBordersVisible` d'après `getBasemapFeatureDefaults(styleId)` pour éliminer toute race condition entre les effets React.
- **Auto-réparation et Logs de Diagnostic (`logCarto`)** : L'ensemble des transitions de style (`SET_BASEMAP_STYLE`), des initialisations de calques (`APPLY_ALL_CUSTOM_LAYERS_START`) et des basculements de visibilité est horodaté et consigné en console sous le tag `[Carto Layers]`.
- **Résilience WebGL & Prévention des Pertes de Contexte (`webglcontextlost`)** :
  - Déduplication stricte des appels `setBasemapStyle` : si le style est déjà initialisé ou identique, `map.setStyle()` n'est pas réinvoqué, évitant l'écrasement des textures en cours de chargement.
  - Écouteur d'interception sur `canvas.webglcontextlost` appelant `event.preventDefault()` pour empêcher la destruction définitive du canevas par le navigateur.
  - Écouteur sur `canvas.webglcontextrestored` réappliquant automatiquement l'ensemble des calques personnalisés dès rétablissement du GPU.

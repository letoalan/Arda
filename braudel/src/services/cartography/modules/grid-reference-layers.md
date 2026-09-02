# Module `grid-reference-layers.ts`

Ce module orchestre le tracé et la gestion des repères géographiques vectoriels :
1. **Lignes astronomiques** (`geo-reference-lines` et `geo-reference-labels`) : Équateur (0°), Tropique du Cancer (23°26'N), Tropique du Capricorne (23°26'S), Cercle polaire arctique (66°33'N), Cercle polaire antarctique (66°33'S) et Méridien de Greenwich (0°).
2. **Graticule vectoriel 10°** (`colonial-graticule-lines` et `colonial-graticule-labels`) : Méridiens et parallèles tous les 10° avec étiquettes de degrés géographiques dynamiques.

---

## Fonctions Principales

### `initColonialGraticuleLayer(map, initialVisibility, styleId)`
- Initialise la source GeoJSON `colonial-graticule` (parallèles de -80° à +80° et méridiens de -180° à +180°).
- Injecte `colonial-graticule-lines` avec traits pointillés (`line-dasharray: [3, 3]`) et renfort de trait sur l'équateur et le premier méridien.
- Injecte `colonial-graticule-labels` avec étiquettes le long du tracé (`symbol-placement: 'line'`).
- Applique immédiatement les couleurs et halos de `getGraticuleStyleForBasemap(styleId)`.

### `updateGraticuleStyle(map, styleId)`
- Met à jour dynamiquement `line-color`, `line-opacity`, `text-color`, `text-halo-color` et `text-halo-width` selon le style actif.
- Assure une visibilité maximale :
  - **Fonds sombres / CRT** : phosphore vert (`#22c55e`) pour Wargames, cyan néon (`#06b6d4`) pour Electro 80s, ciel clair (`#38bdf8`) pour Positron Lite, ambre (`#fbbf24`) pour NASA Night Lights avec halos sombres (`rgba(0, 0, 0, 0.95)`).
  - **Fonds satellitaires** : cyan azur haute visibilité (`#38bdf8`) avec étiquettes blanches et halos sombres.
  - **Fonds historiques / atlas** : teintes sépia, cuivre et ardoise avec halos clairs.

### `toggleGraticuleGrid(map, visible, styleId)`
- Bascule la visibilité (`visible` ou `none`) de `colonial-graticule-lines`, `colonial-graticule-labels`, `graticule-grid-lines`, `graticule-grid-labels` et `grid-layer`.
- **Auto-réparation** : si la visibilité demandée est `true` mais que les calques ou la source sont absents (ex: suite à un cycle de rechargement MapLibre), déclenche automatiquement `initColonialGraticuleLayer` avec le `styleId` spécifié.
- Garantit un débrayage strict sans résidus de lignes.
- Émet des logs de diagnostic horodatés via `logCarto`.

### `toggleGeoReferenceLines(map, visible)`
- Contrôle exclusivement les lignes astronomiques remarquables (`geo-reference-lines`, `geo-reference-labels`).
- N'active aucun carroyage 30° parasite, évitant toute confusion visuelle lors du débrayage du graticule.

### Ordre d'empilement & Protection `beforeId`
- Les calques de repères (`colonial-graticule-lines`, `colonial-graticule-labels`, `geo-reference-lines`) sont systématiquement insérés avant `braudel-polygons` lorsqu'il est présent, assurant qu'ils s'affichent sous les entités géopolitiques historiques et au-dessus du fond de carte.

### Robustesse & Élimination du Verrou `isStyleLoaded()`
- **Vérification non-bloquante `getStyle()`** : Remplacement du garde `!map.isStyleLoaded()` par `typeof map.getStyle === 'function' && !map.getStyle()`. Cette modification élimine les blocages infinis (`map.once('style.load')`) qui empêchaient l'activation des graticules sur les styles inline (mondes Tolkien) ou réutilisant une URL vectorielle identique (Positron : Peutinger, Idrissi, Portulan, Maior Blaeu, Cassini, Verne).
- **Prise en charge universelle** : Palettes et opacités rehaussées spécifiquement pour l'ensemble des 25 styles, garantissant l'apparition instantanée dès la coche dans le menu.


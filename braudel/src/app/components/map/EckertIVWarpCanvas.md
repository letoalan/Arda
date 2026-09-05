# Composant `EckertIVWarpCanvas.tsx`

## Rôle & Responsabilité
Le composant [`EckertIVWarpCanvas.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/app/components/map/EckertIVWarpCanvas.tsx) est le moteur de **reprojection continue des surfaces et des reliefs (Option B)** vers la projection d'Eckert IV via un **Shader WebGL 2D haute performance**.

---

## Fonctionnement Technique

1. **Capture & Échantillonnage de Texture** :
   - Le canevas WebGL de MapLibre (`mapCanvas`), qui calcule en temps réel le fond cartographique, les polygones continentaux et les ombrages 3D du relief (DEM / Hillshade), est injecté comme texture 2D GPU (`u_mapTexture`).
2. **Inversion Analytique d'Eckert IV en GLSL** :
   - Pour chaque fragment de l'écran situé dans le cadre centré $2:1$, le fragment shader résout de manière analytique et instantanée les coordonnées géodésiques WGS84 $(\lambda, \varphi)$ :
     $$\theta = \arcsin(y_{\text{norm}}), \quad X = x_{\text{norm}} \cdot 2C_y, \quad \lambda = \frac{X}{C_x(1+\cos\theta)}$$
     $$\sin\varphi = \frac{\theta + y_{\text{norm}}\cos\theta + 2y_{\text{norm}}}{C_{eq}}, \quad \varphi = \arcsin(\sin\varphi)$$
3. **Mappage Inverse vers Web Mercator & Échantillonnage Bilinéaire** :
   - Les coordonnées géodésiques sont projetées en coordonnées de texture $(u_{\text{merc}}, v_{\text{merc}})$.
   - Le GPU échantillonne la texture de carte avec interpolation bilinéaire matérielle.
4. **Conservation Stricte des Reliefs** :
   - Comme l'échantillonnage s'effectue sur le canevas complet avec son calque hillshade, **chaque massif montagneux, crête, versant et vallée est déformé de manière parfaitement solidaire avec les contours continentaux**.
   - Tout réglage d'exagération du relief (`exaggeration`) ou de palette d'ombre/lumière (`shadowColor`, `highlightColor`) se reflète instantanément à l'écran à 60 FPS.
5. **Cadrage Mondial & Normalisation UV (Zéro Élongation / Zéro Rognage Polaire)** :
   - Le zoom de centrage est calibré sur $\min(W_{\text{css}}, H_{\text{css}}) \times 0.94$ pour que le planisphère mondial entier ($-180^\circ$ à $+180^\circ$, $-85.05^\circ$ à $+85.05^\circ$) tienne sans rognage dans le canevas MapLibre sous-jacent.
   - Les bornes de texture UV `u_worldBounds` divisent les coordonnées d'écran par `mapCanvas.clientWidth` et `mapCanvas.clientHeight`, assurant une indépendance mathématique totale vis-à-vis du `window.devicePixelRatio` et supprimant tout effet d'étirement horizontal ou d'éventail polaire.
   - Rendu haute définition natif HiDPI/Retina ($W \times \text{dpr}, H \times \text{dpr}$).
6. **Navigation Interactive Pan & Zoom GPU (60 FPS)** :
   - Prise en charge intégrale du glissement souris (Pan) et de la molette (Zoom focalisé sur le curseur) ainsi que du tactile (pinch-to-zoom).
   - Uniform GPU `u_transform = vec3(panX, panY, zoom)` inversé analytiquement dans le fragment shader pour une réactivité instantanée à 60 FPS sans latence réseau.
   - Réinitialisation instantanée au double-clic ou via le bouton dédié de l'enveloppe.
7. **Transition d'Échelle Adaptative vers Globe 3D (Option 2)** :
   - Déclenchement au zoom avant (molette vers l'avant `deltaY < 0`, double-clic, ou pincement tactile) : la fonction `getGeoAtScreenPos` résout analytiquement les coordonnées WGS84 $(\lambda, \varphi)$ du curseur via [`eckertIVPixelToGeo`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/acquisition/projection.ts).
   - Le callback `onTransitionToGlobe({ lon, lat })` active immédiatement la projection `globe` et anime un vol fluide (`map.flyTo`) vers ce point avec les tuiles vectorielles natives et le relief 3D.
   - Contrôle strict des UV hors-cadre (`texU < 0 || texU > 1 || texV < 0 || texV > 1`) restituant la couleur de fond océanique sans étirement ni artefact de bordure.

---

## Robustesse & Résilience WebGL

1. **React Error Boundary (`EckertIVErrorBoundary`)** :
   - Encapsule le cycle de vie React du composant pour intercepter toute anomalie WebGL bas niveau sans jamais impacter ou démonter l'arborescence UI de l'application (`MapView`).
2. **Robustesse Asynchrone des Événements & Fermetures React** :
   - Dans `handleMouseMove` et `handleTouchMove`, les coordonnées de déplacement (`targetPanX`, `targetPanY`) sont précalculées de manière strictement synchrone avant l'invocation de `updateTransform(prev => ...)`. Cela immunise l'application contre les accès tardifs aux références `dragStartRef.current` / `touchStartRef.current` lorsque la souris est relâchée (`handleMouseUp`) avant que React ne vide sa file d'attente d'état.
   - Les propriétés dynamiques `currentTransform` et le callback `onTransitionToGlobe` sont également répliqués dans des refs synchronisées (`currentTransformRef`, `onTransitionToGlobeRef`).
3. **Écouteur de Molette Natif Non-Passif (`{ passive: false }`)** :
   - Afin d'éviter l'avertissement React 18 sur les écouteurs passifs (`L’appel « preventDefault() » sur un évènement de type « wheel » depuis un écouteur enregistré comme « passive » a été ignoré`), l'écouteur `wheel` est attaché nativement au canevas via `addEventListener('wheel', ..., { passive: false })` dans un `useEffect`, autorisant un appel `e.preventDefault()` fluide et sans blocage.
4. **Cycle de Vie WebGL & Perte de Contexte** :
   - Écoute les événements standard `webglcontextlost` et `webglcontextrestored`.
   - Contrôle préventif systématique via `gl.isContextLost()` avant toute création de shaders, de buffers ou appel `texImage2D`.
   - Utilisation conforme de `gl.getProgramParameter(program, gl.LINK_STATUS)` pour la validation du programme compilé, et encapsulation `try/catch` de la libération des ressources (`deleteTexture`, `deleteProgram`, `deleteShader`, `deleteBuffer`).

---

## Emplacement & Intégration
- Source : `src/app/components/map/EckertIVWarpCanvas.tsx`
- Parent : `src/app/views/MapView.tsx`
- Z-Index : 1 (placé au-dessus du conteneur MapLibre $z=0$ et sous les repères vectoriels d'atlas [`EckertIVOverlay`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/app/components/map/EckertIVOverlay.md) $z=5$).

# Documentation — Vue Cartographique (`MapView.tsx`)

## Rôle & Responsabilité
`MapView.tsx` est le composant central de visualisation cartographique :
1. **Initialisation MapLibre & Multi-Monde** :
   - Mode Réel (Braudel) : Charge le fond vectoriel historique ou contemporain.
   - Mode Imaginaire (Tolkien / Arda) : Initialise le canevas de monde imaginaire et applique le rendu vectoriel des continents dessinés (`renderContinents`) avec surfaces continentales, traits de côte, lignes de crêtes et sommets.
2. **Effet de Flou & Synthèse Visuelle Progressive** :
   - Lorsque `mapLoading` est actif, un filtre CSS dynamique `blur((1 - progress) * 16px)` applique un flou dégressif jusqu'à révélation nette de la tuile cartographique.
3. **Synchronisation Climat & Relief** :
   - Mise à jour en temps réel des calottes glaciaires, submersions marines et ombrages du relief avec typage sécurisé et valeurs de repli pour les propriétés de relief (`exaggeration`, `shadowColor`, `highlightColor`).
4. **Mode Studio (CapCut)** :
   - Masquage automatique du panneau de légende standard (`LegendPanel`) via `isStudioMode` pour laisser place aux moniteurs de régie vidéo Studio.
5. **Projection Cartographique Eckert IV 2D (Surfaces Équivalentes & Déformation Continue)** :
   - **Déformation GPU WebGL Analytique (`EckertIVWarpCanvas.tsx`)** : En mode `eckert4`, un fragment shader haute performance échantillonne la texture de carte MapLibre (tuiles vectorielles, fonds raster, ombrages hillshade 3D, calques d'entités et continents) et lui applique l'inversion mathématique analytique conforme Snyder d'Eckert IV à 60 FPS. Ce procédé garantit la véritable silhouette ovale pseudocylindrique, les méridiens elliptiques et le respect strict des proportions surfaciques équivalentes (Groenland vs Afrique).
   - **Enveloppe d'Atlas & Repères Géographiques (`EckertIVOverlay.tsx`)** : Cadre d'atlas 2:1 superposé avec masque sombre extérieur, halo cyan, tracé de l'Équateur, des Tropiques (Cancer & Capricorne) et des Cercles Polaires (Arctique & Antarctique).
   - **Contrôles HUD Intégrés & Navigation Fluide** : Boutons `[🌍 Globe 3D]`, `[Recentrer]` (recentrage instantané `[0, 0]` à zoom 1.0), et `[+ Zoom]` / `[- Zoom]` branchés sur le transformateur GPU et synchronisés avec le canevas.
   - **Machine d'États de Transition Fluide (Eckert IV ↔ Globe 3D)** :
     - `triggerEckertToGlobe(geo, screenPos)` : Calcule l'origine d'expansion optique focalisée (`transformOrigin: screenPos`), gèle l'échantillonnage de texture GPU, bascule MapLibre en projection `globe` et amorce un vol cinématique `map.flyTo({ zoom: 3.2, duration: 1800ms })` avec un zoom avant plein écran (`getOffscreenScale()` $\approx 1.85\times - 2.0\times$) et fondu enchaîné (`opacity: 1 -> 0`), assurant que les contours d'atlas et les pôles s'évadent hors du viewport pour un rendu immersif sans bordure visible.
     - `triggerGlobeToEckert()` : Vol arrière doux du Globe vers l'espace cosmique (`zoom: 1.12, duration: 480ms`). Le planisphère Eckert IV apparaît à l'échelle plein écran hors-champ (`scale: offscreenScale`), puis glisse et se rétracte doucement vers son cadre d'atlas 2:1 centré (`scale: 1.0, opacity: 0 -> 1`, 600ms) au-dessus de la sphère 3D toujours active. À 780ms, une fois Eckert stabilisé, MapLibre bascule silencieusement en Mercator (« Zéro Pop »).
     - **Dézoom Molette Automatique en Mode Globe** : Détecte le dézoom arrière (`deltaY > 0`) lorsque la caméra est en orbite cosmique (`zoom <= 1.35`), déclenchant instantanément et naturellement la transition vers Eckert IV.
     - **Sécurisation des Mises à Jour d'État (`handleTransformChange`)** : Wrapper de mise à jour défensif filtrant les valeurs `NaN`/null/undefined et capturant toute exception pour immuniser le canevas MapLibre et le contexte WebGL contre toute défaillance d'état.
   - **Bouton Flottant de Retour** : En projection `globe`, le bouton glassmorphic `[🧭 Planisphère Eckert IV]` permet un retour immédiat et cinématique au planisphère d'ensemble.

# Documentation — Logique de Timeline, Waypoints & Légende Dynamique (`standalone-timeline-logic.ts`)

## Rôle et Responsabilités
`standalone-timeline-logic.ts` génère le fragment JavaScript client gérant :
- L'initialisation de la réglette temporelle interactive (`initTimeline`) avec **échelle strictement proportionnelle au temps réel** $\left(\frac{t - t_{\min}}{t_{\max} - t_{\min}}\right)$.
- La génération des étiquettes de dates sur **une seule ligne horizontale compacte avec filtre anti-collision automatique** (`MIN_TICK_DISTANCE_PCT = 7%`), évitant les superpositions et les désynchronisations.
- L'affichage de la mini-légende des **4 grandes ères historiques** (Antiquité, Moyen Âge, Époque Moderne, Époque Contemporaine).
- La modulation de la taille des marqueurs selon la densité des entités actives.
- Le filtrage dynamique des entités de la carte par intervalle temporel semi-ouvert `[validFrom, validTo[` (`updateTemporalFilter`) pour éviter toute superposition aux dates charnières.
- Le vol de caméra animé (`map.flyTo`) et la mise à jour synchronisée du volet Bento lors de l'appel à `goToWaypoint`.
- Le **Mode EX (Sidecar Scrollytelling)** (`initModeExSidecar`, `toggleSidecarMode`, `toggleSidecarOrientation`) :
  - Synchronisation scroll $\leftrightarrow$ caméra via `IntersectionObserver` avec durée de vol cinématique calibrée (800ms).
  - Déclencheurs textuels interactifs (`Map Actions`) avec zoom ponctuel et popover inline avec retour au fil (`triggerMapAction`).
  - **Mini-carte de repère multi-échelle (`initContextMinimap`)** :
    - **Vue Macro** : Zoom mondial planétaire dézoomé (`zoom: 0.9`, centré sur la vue globale), avec point indicateur projeté selon sa position géographique sur le globe.
    - **Vue Continentale** : Zoom régional/continental rapproché (`zoom: 3.2`, centré sur le point d'observation courant de la caméra principale `map.getCenter()`), boîte élargie à 220px, badge `Continentale` vert émeraude et suivi continu de la zone géographique en déplacement.
    - Bascule interactive au clic avec transitions de vol (`easeTo`) et redimensionnement dynamique du canvas.
  - Progression diachronique intégrée sur ruban vertical (`updateVerticalTimelineProgress`).
- Le **recalcul dynamique et instantané de la légende** (`renderLegendContent`) à chaque changement de date selon les entités actives (surfaces, lignes, points).
- Les fonctions d'ouverture et fermeture du tiroir de légende (`toggleLegend`, `closeLegend`).

## Fil d'Ariane
[services/](../../services.md) -> [export/](../export.md) -> [modules/](./modules.md) -> **standalone-timeline-logic.md**

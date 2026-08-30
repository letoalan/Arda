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
  - Mini-carte de repère macro permanente (`initContextMinimap`) synchronisée avec le déplacement cartographique.
  - Progression diachronique intégrée sur ruban vertical (`updateVerticalTimelineProgress`).
- Le **recalcul dynamique et instantané de la légende** (`renderLegendContent`) à chaque changement de date selon les entités actives (surfaces, lignes, points).
- Les fonctions d'ouverture et fermeture du tiroir de légende (`toggleLegend`, `closeLegend`).

## Fil d'Ariane
[services/](../../services.md) -> [export/](../export.md) -> [modules/](./modules.md) -> **standalone-timeline-logic.md**



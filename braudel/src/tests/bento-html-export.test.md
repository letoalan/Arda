# Documentation — Tests de l'Export HTML Carte-Récit Bento (`bento-html-export.test.ts`)

## Rôle et Couverture des Tests
`bento-html-export.test.ts` valide les spécifications fonctionnelles et techniques définies dans `bento.md` :
- **Transformation ArdaDoc** : Vérifie la conversion d'un `StoryProject` en structure `ArdaDoc` où `waypoints` constitue l'axe temporel principal et `slides` les nœuds d'appui rattachés (`attachedToWaypoint`).
- **Génération HTML5 auto-portante** : Vérifie la présence du bloc `<script id="arda-doc">`, de MapLibre GL JS, des conteneurs (`#map`, `#bento-overlay`, `#bento-timeline-bar`, `#slide-container`) et des fonctions logiques client (`goToWaypoint`, `openSlide`, `closeSlideAndReturn`, `saveDeck`, `togglePresentMode`).

## Fil d'Ariane
[tests/](./tests.md) -> **bento-html-export.test.md**

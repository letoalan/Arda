Voici le plan d'implémentation consolidé du mode EX, intégrant le modèle Sidecar ArcGIS comme socle technique, la structure argumentative de type dissertation, et les logiques disciplinaires synchronie/diachronie et multiscalaire discutées précédemment.

## Principe directeur du mode EX

Le mode EX transforme chaque module Arda3 en un **Sidecar pédagogique** : un panneau narratif défilant (docked par défaut) synchronisé avec une carte dont le point de vue, l'étendue et les couches changent automatiquement au fil du scroll, sans jamais superposer texte et carte de façon incontrôlée. [guides.library.brandeis](https://guides.library.brandeis.edu/storymaps/sidecar)

## Phase 1 — Fondations techniques (Sidecar docked)

**Objectif** : éliminer les problèmes de débordement et de chevauchement identifiés sur les captures précédentes.

- Implémenter un layout à deux zones fixes et non superposées : panneau narratif (30-40% de largeur ou hauteur) + panneau carte (60-70%), jamais en flottant par défaut. [guides.lib.uci](https://guides.lib.uci.edu/storymaps/immersive)
- Ajouter un bouton "Orientation" (icône ⇄/⇵) permettant de basculer entre disposition horizontale (carte à droite) et verticale (carte en haut, texte en bas défilant), avec la bascule persistée en préférence utilisateur.
- Règle de sécurité automatique : si le texte d'une slide dépasse un seuil de caractères défini (ex. 500 caractères), forcer temporairement l'agrandissement du panneau narratif au détriment de la carte plutôt que de laisser le texte déborder. [support.esri](https://support.esri.com/en-us/knowledge-base/faq-can-the-floating-narrative-panel-in-a-floating-side-000033131)
- `overflow: hidden` strict sur chaque panneau, `aspect-ratio` contraint sur le panneau carte pour éviter toute distorsion.

## Phase 2 — Modèle de données par slide

**Objectif** : structurer chaque étape du récit comme un couple texte/vue-carte explicite, réutilisable et éditable.

```json
{
  "slide_id": "arda3-023",
  "text": "...",
  "viewpoint": { "center": [12.5, 41.9], "zoom": 5, "bearing": 0 },
  "map_layers": ["antiquite", "entites_actives"],
  "actions": [
    { "trigger_text": "Hannibal Barca", "viewpoint": {...}, "highlight_entity": "carthage" }
  ],
  "part_of_argument": "II.1",
  "recommended_document": "doc-042"
}
```

- Champ `viewpoint` : centre géographique + niveau de zoom, remplaçant les coordonnées pixel X/Y actuelles pour les éléments liés à la carte. [developers.arcgis](https://developers.arcgis.com/python-2-3/api-reference/arcgis.apps.storymap.html)
- Champ `actions` : liste de déclencheurs textuels cliquables dans le récit, chacun associé à un mini-changement de vue sans avancer de slide. [esri](https://www.esri.com/arcgis-blog/products/arcgis-storymaps/mapping/supercharge-your-stories-with-map-actions-beta)
- Champ `part_of_argument` : rattache la slide à une partie du plan argumentatif (repris de la structure "dissertation" définie précédemment).
- Champ `recommended_document` : pointeur unique vers un document du corpus mis en avant par défaut (évite le double-étiquetage lourd critiqué précédemment).

## Phase 3 — Synchronisation scroll/carte

**Objectif** : faire de la carte une conséquence automatique de la lecture, pas un objet piloté séparément.

- Chaque fois que le panneau narratif atteint une nouvelle slide (par scroll ou clic Suivant/Précédent), déclencher une transition de caméra fluide (`flyTo`) vers le `viewpoint` défini, avec une durée d'animation courte (600-900ms) pour rester perceptible sans ralentir la lecture. [esri](https://www.esri.com/arcgis-blog/products/arcgis-storymaps/mapping/supercharge-your-stories-with-map-actions-beta)
- Les `map_layers` associés à la slide s'activent/désactivent en fondu (300ms) en même temps que le déplacement de caméra.
- Implémenter un `IntersectionObserver` sur les blocs de texte du panneau narratif pour déclencher la synchronisation au bon moment du scroll, pattern standard du scrollytelling. [scrollytelling](https://scrollytelling.ai/scrollytelling-design-patterns/)

## Phase 4 — Actions de texte interactives

**Objectif** : permettre l'exploration en profondeur sans quitter le fil narratif.

- Détecter dans le texte des mots-clés balisés (`<span data-action="carthage">Hannibal Barca</span>`) et les afficher avec un style discret (soulignement pointillé, couleur d'accent).
- Au clic, déclencher un zoom ciblé temporaire vers l'entité, avec affichage d'une pop-up courte (nom, dates, fonction) ; un bouton "Retour au fil" ramène instantanément à la vue de la slide en cours. [esri](https://www.esri.com/arcgis-blog/products/story-maps/mapping/using-story-map-journal-story-actions)
- Ces actions ne modifient jamais la position dans le récit (pas de changement de `slide_id`), garantissant qu'on ne perd jamais le fil argumentatif.

## Phase 5 — Mini-carte de contexte

**Objectif** : garder une vue d'ensemble permanente pendant les zooms locaux.

- Ajouter une mini-carte fixe (150×150px) en coin du panneau carte principal, toujours à l'échelle continentale, avec un point clignotant indiquant la zone actuellement affichée en grand.
- Clic sur la mini-carte : bascule temporaire en plein écran de cette vue d'ensemble, puis retour automatique à la vue précédente.

## Phase 6 — Éditeur visuel du point de vue

**Objectif** : remplacer la saisie de coordonnées numériques par une manipulation directe.

- Dans l'éditeur Arda3, ajouter un mode "Définir la vue carte" par slide : l'auteur navigue librement sur la carte (drag pour centrer, molette pour zoomer), puis clique "Capturer cette vue" pour enregistrer automatiquement `center`/`zoom`/`bearing` dans le JSON de la slide. [esri](https://www.esri.com/arcgis-blog/products/arcgis-storymaps/mapping/supercharge-your-stories-with-map-actions-beta)
- Afficher une vignette de prévisualisation de la vue capturée directement dans la liste des slides du panneau latéral existant.

## Phase 7 — Timeline intégrée au scroll (option avancée)

**Objectif** : réduire la frise séparée en la fusionnant dans le geste de lecture.

- Remplacer ou compléter la frise horizontale actuelle par une fine graduation verticale accolée au panneau narratif, qui avance visuellement au même rythme que le scroll de lecture, matérialisant la progression temporelle sans composant séparé à gérer.
- Conserver la frise horizontale existante comme mode de navigation rapide optionnel (accessible via un bouton "Vue d'ensemble temporelle"), pour ne pas perdre l'usage déjà en place.

## Priorisation et dépendances

| Phase | Fonctionnalité | Effort | Dépendances |
|---|---|---|---|
| 1 | Sidecar docked, orientation, anti-débordement | Moyen | Aucune |
| 2 | Modèle de données `viewpoint`/`actions` | Faible | Phase 1 |
| 3 | Synchronisation scroll → caméra/couches | Élevé | Phase 2 |
| 4 | Actions de texte interactives | Moyen | Phase 2, 3 |
| 5 | Mini-carte de contexte | Faible | Phase 3 |
| 6 | Éditeur visuel du point de vue | Moyen | Phase 2 |
| 7 | Timeline intégrée au scroll | Élevé | Phase 3, optionnel |

Cette séquence permet de livrer d'abord une correction visible immédiatement (fin des débordements, phase 1), puis d'installer progressivement l'automatisme carte/texte qui constitue le cœur de l'innovation du mode EX (phases 2-4), avant d'ajouter les raffinements de confort (phases 5-7).
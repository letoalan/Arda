Voici un plan d'implémentation structuré pour faire évoluer l'éditeur Arda3 vers une expérience proche de PowerPoint, avec manipulation souris, gestion de calques (layers) et transparence.

## Choix technique de base

Pour la manipulation souris (déplacement, redimensionnement, rotation), la bibliothèque `interact.js` est la référence légère et sans dépendance pour ce type d'éditeur, avec un support natif du drag, du resize par poignées d'angle/bord et du snapping. Elle ne fait aucune supposition sur le rendu (SVG, DOM, Canvas), ce qui convient à votre stack existante (JS/HTML/CSS, potentiellement Vite) sans réécrire tout le moteur d'édition. [interactjs](https://interactjs.io/)

- `interact.js` gère le drag, le resize par poignées et le snap-to-grid/aux autres objets nativement. [interactjs](https://interactjs.io/docs/migrating/)
- La rotation combinée au resize n'est en revanche pas gérée nativement et nécessite une implémentation manuelle des transformations CSS (`transform: rotate() translate()`). [stackoverflow](https://stackoverflow.com/questions/55869080/drag-and-drop-with-interact-js)
- Alternative à considérer si vous souhaitez aussi la rotation intégrée : Konva.js (rendu Canvas, bon support resize/drag, mais pas de rotation native non plus) — interact.js reste préférable pour un rendu DOM/HTML cohérent avec votre éditeur actuel. [stackoverflow](https://stackoverflow.com/questions/40560326/which-js-framework-is-best-fit-for-drag-and-drop-resize-and-rotate-functionalit)

## Étape 1 — Manipulation souris (drag & resize)

Intégrer `interact.js` sur chaque élément sélectionnable (titre, texte, image, forme) pour remplacer la saisie manuelle des champs X/Y/Largeur/Hauteur par une manipulation directe à la souris.

- Ajouter `interact(element).draggable({...})` avec des listeners `move` qui mettent à jour `style.transform: translate()` et synchronisent les champs Position X/Y du panneau latéral en temps réel. [medium](https://medium.com/@kapoorprakhar99/create-a-draggable-element-using-interact-js-5345bd477493)
- Ajouter `.resizable({ edges: {top,left,bottom,right} })` avec des poignées visibles aux 4 coins et 4 bords lors de la sélection, en répercutant `event.rect.width/height` dans les champs Largeur/Hauteur existants. [interactjs](https://interactjs.io/docs/resizable/)
- Utiliser les modifiers `restrictEdges` (limiter au cadre de la slide 16:9) et `snap`/`snapSize` pour aligner automatiquement sur une grille ou sur les bords d'autres objets, à la manière des guides magnétiques de PowerPoint. [interactjs](https://interactjs.io/docs/migrating/)
- Conserver le panneau Propriétés existant en lecture/écriture bidirectionnelle : toute modification à la souris met à jour les champs numériques, et l'inverse reste possible pour un positionnement précis.

## Étape 2 — Système de calques (layers)

Ajouter un panneau latéral "Calques" listant tous les éléments de la slide dans leur ordre d'empilement (z-index), avec drag-and-drop pour réordonner, à la manière des panneaux de calques Figma/PowerPoint.

- Stocker un attribut `zIndex` numérique dans le modèle de données de chaque élément (déjà partiellement esquissé par l'ordre d'ajout actuel). [infinitecanvas](https://infinitecanvas.cc/guide/lesson-014)
- Implémenter une fonction `sortByZIndex` qui trie les éléments par `zIndex` décroissant avant le rendu, méthode standard utilisée dans les moteurs de canvas/carte (ex. OpenLayers gère ainsi l'ordre de rendu de ses couches). [openlayers](https://openlayers.org/en/latest/examples/layer-z-index.html)
- Ajouter dans le panneau Propriétés (ou un panneau dédié) des actions rapides : "Premier plan", "Arrière-plan", "Monter d'un niveau", "Descendre d'un niveau", qui incrémentent/décrémentent ou réassignent le `zIndex`. [infinitecanvas](https://infinitecanvas.cc/guide/lesson-014)
- Le panneau de calques liste chaque objet avec une icône de type (Titre/Texte/Image/Schéma/Rectangle/Cercle), un nom éditable, un toggle visibilité (œil), et un toggle verrouillage (cadenas) pour empêcher les déplacements accidentels.

## Étape 3 — Transparence et opacité

Ajouter un curseur (slider) "Opacité" dans le panneau Propriétés & Format, appliqué via la propriété CSS `opacity` sur chaque élément individuellement, indépendamment de la couleur de fond de la slide.

- Slider de 0 à 100% avec valeur numérique affichée, modifiant `element.style.opacity` en temps réel.
- Pour les formes (rectangle/cercle), séparer la transparence du remplissage (`fill-opacity` ou couleur RGBA) de celle du contour (`stroke-opacity`), pour un contrôle plus fin façon PowerPoint.
- Pour les images, prévoir un mode "fondu" additionnel avec un dégradé de transparence sur les bords (masque CSS `mask-image: linear-gradient()`), utile pour superposer des cartes historiques sur le fond.

## Priorisation suggérée

| Phase | Fonctionnalité | Effort estimé | Dépendance |
|---|---|---|---|
| 1 | Drag & resize souris avec interact.js | Moyen | Aucune |
| 2 | Snap/alignement magnétique | Faible | Phase 1 |
| 3 | Panneau de calques + z-index | Moyen | Modèle de données à étendre |
| 4 | Opacité par élément | Faible | Aucune, peut être fait en parallèle |
| 5 | Rotation manuelle (transform combiné) | Élevé | Phase 1 (calculs de matrice) |
| 6 | Verrouillage/visibilité par calque | Faible | Phase 3 |

Cette approche progressive permet de livrer rapidement la partie manipulation souris (la plus visible pour l'utilisateur final), puis d'enrichir avec les calques et la transparence sans casser le modèle de données existant basé sur X/Y/Largeur/Hauteur déjà en place dans votre éditeur. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/43012280/6b843085-fe11-4e81-912a-c510c0d86aa1/image.jpg?AWSAccessKeyId=ASIA2F3EMEYEWZFHNQBD&Signature=fPoxUtx7QAl4Hs8khnMgWQRgp2I%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJz%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQCfTDo3%2BR4W1K1bq7rP0g7Bbx1LX1tZPlrs3LjgQmsKRAIgS05F6JTFXhUR%2BR46UxXV6le5dB3YxlCai%2FUjGmkxkDQq8wQIZRABGgw2OTk3NTMzMDk3MDUiDPx4QZTSFybUSg%2FM%2BCrQBMphkWwE74Q%2BDuQMunVWsvheGsXwoVrJfccVkrnPElmY1dPunVEA8ZParLOYfONLjKcFfB%2Bn%2BoX5NOlW0kxlghFpuZqJbdh71rkl5EOs7avXUX2i%2FLIvHhZoZwNGKwqwYMt%2BE2nauWlkjcNZ%2FaLgDSIGjyfCXxM4pkLwx6f4%2FK%2FpIeUOfc3z%2F1VhIuBwND3AzoSGY8HRPFIXdItiADGeZ5fqnjzr242ypIrmvyiy%2BLihV2KNnZw%2FWvDNxn2%2Fgjq%2BYboFpiW41BVVd3VeqlvO8cDeCR8HxhEiP1qcOlkh3%2BjuR3QOc5QrtovY2nM08qLZYmi%2FoXJZiXxRsENxcbmSFaMmiNAGJsdxeUGG3%2F3fdPIFOWZkJ%2FUwXpAMzrwayXhVc%2F%2BlZBvhvdZIgLbpcX6d78ehFjung18EO3Ek0JuMzKyBfis%2BjHRUjeu%2BWq%2BX0fwR6yRBUyQiVJhPiKJC43hNfDINjJlJc5giKd5xQwaRNut2I0qYVMfrBIxGxK8MZMpL%2FS1BG04qEkFzCcmTq63kTXXHrkbcGHI%2FP1xMVRBXJfp%2BcND8y34jKEFJm088z0l%2FiBVwr%2F9N704te1Gf28ufnYifMTsUlWnaC6BGW3t9Y80IX3HQcHZHY0dO6hTgt7%2FgbXWetXd2v6l3sz7dbWG%2BGuta%2Bk5mCA%2BuP5r7GpzhGo1zlsu%2FdhfPPqGKLK1VOfYJ%2Fky40YVrlXpkXAgDER2YHrFTFy%2FMin%2FOa%2FYYDneRCJvPdUGNfZdRNosb8me%2FfJ2V5P2fh4fJ1EHLWKPTdSe6XNMw0JPL1AY6mAFsqz%2Blo5JfPypNbipbeuk2gIA5D0MouhI94dQTch6oUTBLdkXJuKU0vQl64ySNXpETCiDBueHEPH1UMwvgcIjtDmOKNdzSvEwSIgAEZer4PDzZ3klI%2Bqfig%2FMnezRwnh2Jk3OMFvbGRoczkar%2FkXqW2mlQH%2Fq1uMRXvxiztSe3PSKzf5DPH%2Bq4KowUn3AF97lZnnzUQ4dSyw%3D%3D&Expires=1788008355)
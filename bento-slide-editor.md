# Spécification & Ergonomie — Mode Slide & Éditeur Bento Embarqué

Ce document détaille l'architecture ergonomique, l'agencement de l'interface et les modalités d'affichage de la diapositive d'appui (mode standard et projection plein écran) dans l'export autonome Bento d'Arda.

---

## 1. Ergonomie et Interface de l'Éditeur de Diapositives (Type PowerPoint)

L'éditeur de diapositives intégré s'ouvre via le bouton **?? Éditer la Diapositive** présent sur la vue d'appui. Il fournit un environnement de composition complet au format **16:9** structuré en trois zones majeures :

`
+---------------------------------------------------------------------------------------------+
¦ ??? Éditeur de Diapositive   [?? Titre] [?? Texte] [??? Image] [?? Vidéo] [?? Schéma] [? Forme] ¦ [? Enregistrer] [?] ¦
+---------------------------------------------------------------------------------------------¦
¦                                                                   ¦ ?? Propriétés ¦ ?? Calques¦
¦                                                                   +-------------------------¦
¦                    CANEVAS DE COMPOSITION 16:9                    ¦ ??  ?  ?  ?? (Ordre)    ¦
¦                        (960px × 540px)                            ¦                         ¦
¦                                                                   ¦ ??? Image #1    [??] [???] ¦
¦      +-------------------------+                                  ¦ ?? Titre      [??] [???] ¦
¦      ¦ 8 Poignées de contrôle  ¦                                  ¦ ?? Texte #3   [??] [??] ¦
¦      ¦ ?        ?        ?     ¦                                  +-------------------------¦
¦      ¦ ?   Élément actif ?     ¦                                  ¦ Pos X / Y : [80] [120]  ¦
¦      ¦ ?        ?        ?     ¦                                  ¦ Dim W / H : [400] [180] ¦
¦      +-------------------------+                                  ¦ Opacité   : [---?--] 85%¦
¦                                                                   ¦ Couleur   : [ #3B82F6 ] ¦
+---------------------------------------------------------------------------------------------+
`

### A. Le Ruban Supérieur d'Outils (Ribbon)
- **Insertion rapide d'éléments vectoriels et multimédias** :
  - ?? Titre : Bloc de titre typographique principal (taille 28px, gras).
  - ?? Texte : Paragraphe explicatif, citations ou contexte historiographique.
  - ??? Image : Intégration d'illustrations, gravures, cartes historiques ou fac-similés (avec redimensionnement proportionnel object-fit: cover).
  - ?? Vidéo : Intégration de flux multimédia (YouTube / MP4 / WebM).
  - ?? Schéma : Diagramme visuel synthétisant une dynamique stratégique, économique ou territoriale.
  - ? Rectangle / ? Cercle : Formes géométriques d'accentuation avec remplissage translucide et bordures colorées.
- **Actions d'enregistrement** :
  - Bouton **? Enregistrer** (Ctrl+S) qui applique immédiatement les modifications en mémoire vive (doc.slides) et ré-écrit la balise <script type=application/arda+json> dans le fichier HTML.

### B. Le Canevas Central 16:9 & Manipulation Directe
- **Ratio fixe 16:9 (960×540px)** : Garantit un rendu isométrique parfait et sans distorsion entre la phase d'édition et la projection grand écran.
- **Manipulation souris directe (Drag & Drop)** : Déplacement fluide au curseur avec guidage magnétique (*snap-to-grid* à pas de \text{px}$).
- **8 poignées de redimensionnement interactives** :
  - 4 coins (
w, 
e, se, sw) et 4 bords médians (
, e, s, w).
  - Curseurs contextuels directionnels (
wse-resize, 
s-resize, 
esw-resize, ew-resize).
- **Grille de repère subtile** : Trame millimétrée discrète en arrière-plan pour faciliter l'alignement visuel.

### C. Le Panneau Latéral : Inspecteur & Calques
- **Onglet [?? Propriétés & Format]** :
  - Positionnement numérique bidirectionnel instantané : X, Y, Largeur (W), Hauteur (H).
  - **Curseur d'Opacité / Transparence** réglable de 5% à 100%.
  - Palette de couleurs, taille de typographie et éditeur de texte direct.
  - Sélecteur de couleur de fond globale de la diapositive.
- **Onglet [?? Calques & Empilement]** :
  - Vue hiérarchique de tous les objets de la diapositive du premier plan au fond.
  - **Boutons de réorganisation** : ?? (Premier plan), ? (Monter d'un cran), ? (Descendre d'un cran), ?? (Arrière-plan).
  - **?? Cadenas de verrouillage** : Fige la position et la taille de l'élément sur le canevas pour éviter toute manipulation involontaire.
  - **??? / ?? Oeil de visibilité** : Masque ou affiche temporairement l'élément.

---

## 2. Modalités d'Affichage de la Diapositive en Mode Plein Écran (Projection F5)

Le mode Plein Écran / Projection transforme le support autonome en un véritable outil de présentation pédagogique et académique :

`
+---------------------------------------------------------------------------------------------+
¦ [DIAPOSITIVE D'APPUI]  Campagnes d'Alexandre le Grand (-334 à -323)                  [?] [??]¦
+---------------------------------------------------------------------------------------------¦
¦                                                                                             ¦
¦   +-----------------------------------------------+   +---------------------------------+   ¦
¦   ¦                                               ¦   ¦ • 334 av. J.-C. : Passage de    ¦   ¦
¦   ¦                                               ¦   ¦   l'Hellespont et Granique       ¦   ¦
¦   ¦            CARTE HISTORIQUE HD                ¦   ¦                                 ¦   ¦
¦   ¦            OU FAC-SIMILÉ SOURCE               ¦   ¦ • 333 av. J.-C. : Issos         ¦   ¦
¦   ¦                                               ¦   ¦ • 331 av. J.-C. : Gaugamèles    ¦   ¦
¦   ¦                                               ¦   ¦ • Fondation d'Alexandrie        ¦   ¦
¦   +-----------------------------------------------+   +---------------------------------+   ¦
¦                                                                                             ¦
¦   +-------------------------------------------------------------------------------------+   ¦
¦   ¦ ?? Notes de l'orateur : Insister sur la logistique des sièges de Tyr et de Gaza.      ¦   ¦
¦   +-------------------------------------------------------------------------------------+   ¦
+---------------------------------------------------------------------------------------------+
`

### A. Rendu Visuel et Isolation Graphique
- **Overlay Plein Écran Flouté (Backdrop Filter 18px)** :
  - Lorsque la diapositive d'appui est ouverte (openSlide), elle se superpose au canevas cartographique 3D MapLibre avec un voile sombre (gba(10, 15, 29, 0.94)) et un flou gaussien artistique.
  - Aucun élément parasite de l'interface (barre d'outils supérieure, boutons tiers) ne vient perturber la lecture.
- **Agencement Responsive Hybride** :
  - Si la diapositive utilise des positions absolues, les blocs sont rendus selon leurs coordonnées 16:9 projetées.
  - Si la diapositive est textuelle / modulaire, elle adopte une grille adaptative (.slide-grid) avec cartes d'information (.slide-card), typographie Google Fonts soignée et contrastée.
- **Section Notes de l'Orateur (.slide-speaker-notes)** :
  - Bloc contextuel en bas de diapositive avec bordure latérale d'accentuation pour guider le discours du présentateur sans surcharger la zone visuelle principale.

### B. Contrôles et Navigation Fluide (Raccourcis Clavier)
- **F5 ou P** : Bascule en mode Présentation globale (masquage complet des barres d'outils, centrage automatique des fiches et agrandissement du volet narratif Bento).
- **Échap ou M** : Ferme la diapositive d'appui et garantit un **retour contextuel instantané** au waypoint cartographique d'origine (caméra, zoom et entités synchronisées).
- **Espace / Flèche Droite** : Avance vers le waypoint / la slide suivante.
- **Flèche Gauche** : Recule vers l'étape précédente.
- **L** : Déploie ou rétracte le tiroir de légende cartographique interactif.
- **D** : Bascule instantanément entre le thème Sombre (ambiance amphithéâtre / nocturne) et Clair (vidéoprojection en salle lumineuse).


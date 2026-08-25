# Guide d'Interface & Audit des Fonctionnalités — Arda

Ce document présente l'audit complet de l'interface utilisateur de l'application **Arda**, décrivant la disposition générale, les outils disponibles et la manière de les exploiter sur différents types de supports (PC, smartphones, tableaux interactifs Promethean).

---

## 1. Dispositif de Création (Le Wizard de Démarrage)

Le flux d'initialisation de projet est scindé en deux étapes claires pour maximiser la lisibilité :

- **Étape 1 : Identité & Cadre Temporel**
  - **Saisie du nom** : Permet de définir le nom du projet/monde.
  - **Description** (facultatif) : Explications textuelles sur le monde créé.
  - **Bornes de la chronologie** : Définit les années de début (ex: `-3000` ou `1`) et de fin (ex: `2100` ou `3019`). Ces valeurs limitent la timeline dynamique globale.
  - **Bouton Importer** : Permet de charger un fichier `.json` précédemment exporté.
- **Étape 2 : Choix du Mode de Création**
  - **Bouton « Retour »** : Permet de revenir à l'étape 1 sans perdre les données déjà saisies.
  - **Mode Braudel** (Monde réel) :
    - Présente un sélecteur de fond de carte initial sous forme de liste défilante verticale (optimisée pour éviter le scroll de page).
    - Permet de choisir l'ambiance historique (Antiquité, Moyen Âge, Renaissance, Moderne, Colonial, etc.).
  - **Mode Tolkien** (Monde fictif) :
    - Lance un canevas vierge pour dessiner ses propres continents et reliefs de manière procédurale ou libre.

---

## 2. Modes d'Affichage Principaux

Une fois le monde généré, l'interface se sépare en trois grandes zones :

### A. La Barre Latérale de Contrôle (Volet de Gauche)
Elle contient des panneaux rétractables gérant le modèle de données :
1. **Couches (Layers)** : Créer des couches physiques, historiques ou politiques pour classer les entités. Possibilité de masquer ou d'afficher chaque couche individuellement.
2. **Entités** :
   - Ajouter de nouvelles entités géographiques en les associant à une couche et en spécifiant leur période de validité.
   - Outils de dessin : Boutons pour dessiner des **Points** (Villes, Monuments), **Lignes** (Routes, Fleuves) ou **Polygones** (Empires, Régions).
   - Modification : Lorsqu'une entité est sélectionnée, un sous-panneau permet d'éditer sa géométrie, de la déplacer sur la carte, de la supprimer ou de modifier son style visuel (couleurs, épaisseur, opacité, pointillés).
3. **Relations** : Lier des entités entre elles (ex: routes commerciales, alliances) en spécifiant le type de relation (dirigée, bidirectionnelle), le poids d'intensité et la validité temporelle.
4. **Style & Fonds** (pour le mode Braudel) :
   - Permet de changer à tout moment de fond de carte historique.
   - Activer/désactiver l'affichage des repères textuels (labels) et des frontières politiques modernes.
   - Ajuster l'exagération du relief (ombrage 3D du terrain) et les teintes de la carte.
5. **Données & IA** : Import/Export rapide des données brutes au format JSON et gestion des propositions de l'agent IA.

### B. La Zone de Visualisation Centrale
- **Mode Carte** : Rendu cartographique vectoriel 2D/3D (propulsé par MapLibre). Affiche les entités physiques et géométriques.
- **Mode Réseau (Graphe)** : Affiche les entités sous forme de nœuds et les relations sous forme de liens interactifs d'épaisseurs variables. Utile pour analyser la connectivité historique.
- Bascule rapide entre les deux modes via le panneau latéral.

### C. La Chronologie Dynamique (La Timeline)
Située au bas de l'écran :
- S'adapte automatiquement aux limites temporelles configurées à la création du monde.
- **Contrôles** : Lecture, pause, vitesse d'accélération (1x, 5x, 10x, etc.).
- **Filtrage automatique** : Les entités et relations apparaissent ou disparaissent de la carte selon l'année en cours sélectionnée sur la barre.
- **Butoir de fin** : La lecture s'arrête proprement et se met en pause dès qu'elle atteint la date limite maximale définie.

---

## 3. Adaptabilité Multi-Écran & Ergonomie

### Sur PC (Écran Paysage)
- La barre latérale reste fixe à gauche (`width: 320px`), offrant un accès complet à tous les formulaires.
- La carte occupe le reste de l'écran, avec la timeline positionnée en bas à droite pour une visibilité optimale.

### Sur Smartphone / Tablette (Écran Portrait)
- **Tiroir latéral (Drawer) coulissant** : Pour dégager la carte, le volet de contrôle gauche se replie automatiquement hors de l'écran.
- **Bouton Hamburger** : Un bouton flottant en haut à gauche permet de faire coulisser le panneau de contrôle au-dessus de la carte en un seul tap.
- **Optimisation Timeline** : La timeline se repositionne de manière compacte pour laisser la carte utilisable au doigt.

### Sur Écran Interactif Géant (Type Promethean)
L'activation du **Mode Stylet** (bouton en haut de la barre latérale) reconfigure l'interface :
- **Boutons agrandis** : Les zones cliquables (boutons, sélecteurs, cases) gagnent 50% de hauteur et de marge pour faciliter la précision au stylet ou au doigt sans fausse manipulation.
- **Polices agrandies** (`1.15rem` de base) : Garantit une excellente lisibilité pour les élèves ou auditeurs situés au fond d'une salle de classe/conférence.
- **Jauge épaisse** : La glissière temporelle de la timeline est épaissie pour faciliter le glisser-déposer au stylet.
- **Panneau latéral élargi** : Ajusté à `380px` pour éviter la superposition des textes de grande taille.

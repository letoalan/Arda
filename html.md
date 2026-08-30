# Mode d'Exportation HTML Autonome (« Carte-Récit ») (`html.md`)

## 1. Vision et Objectifs de l'Export HTML

L'**Export HTML Autonome** (*Standalone HTML Export*) de Braudel permet de compiler un monde cartographique ou un récit historique complet en un **fichier unique `.html` auto-suffisant**, consultable immédiatement dans n'importe quel navigateur web sans nécessiter de serveur backend, d'installation Node.js ou de configuration complexe (*Zero-Backend*).

### Piliers Fondamentaux :
- **Zéro Dépendance Serveur (*Zero-Backend*)** : Le fichier généré fonctionne directement en protocole local (`file:///`) ou déposé sur n'importe quel hébergement statique (GitHub Pages, S3, Netlify, intranet).
- **Single File Web Application** : Le HTML, le CSS (thèmes sombres/clairs, conteneurs Bento, effets de verre *glassmorphism*), le JavaScript d'orchestration et les données GeoJSON (entités, relations, récits) sont intégralement inlinés dans un fichier unique.
- **Interactivité Cartographique Complète** : Moteur WebGL embarqué via MapLibre GL 4.7.1, supportant le zoom vectoriel, le panoramique fluide, l'inclinaison (*pitch*), la rotation (*bearing*) et l'interrogation au clic.
- **Aller-Retour Garanti Carte $\leftrightarrow$ Diapositives d'Appui** : Consultation de la slide enrichie (zoom, archive, chronologie) et retour immédiat (`Échap` / `M`) au point temporel et spatial d'origine sans perte de contexte.
- **Tiroir de Légende Dynamique (*Drawer*)** : Légende escamotable (`L`) recalculée en temps réel selon les entités actives à la date sélectionnée.
- **Hyper-Documentation & Routage Wiki** : Navigation par ancre URL (`#/wiki/<entity_id>`) ouvrant dynamiquement les fiches encyclopédiques.
- **Sauvegarde en Place (`saveDeck` / `Ctrl+S`)** : Modification directe des étapes et ré-exportation immédiate depuis le fichier HTML ouvert.

---

## 2. Architecture Technique du Pipeline

```
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                 generateStandaloneHtml(worldName, style, ...)            │
  │                  (src/services/export/standalone-template.ts)            │
  └─────────────────────────────────────┬────────────────────────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        ▼                               ▼                               ▼
┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
│  standaloneStyles.ts   │  │   standaloneScripts    │  │   Données Inlinées     │
│  - Glassmorphism       │  │  - Init MapLibre GL    │  │  - GeoJSON Entités     │
│  - Tiroir Légende (L)  │  │  - Caméra (flyTo)      │  │  - GeoJSON Relations   │
│  - Cartes Bento        │  │  - Routage Wiki Hash   │  │  - ArdaDoc JSON        │
│  - Slides Plein Écran  │  │  - Légende dynamique   │  │  - Style Config Réel   │
└────────────────────────┘  └────────────────────────┘  └────────────────────────┘
```

### Rôle des Fichiers Associés :
- **[`standalone-template.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/standalone-template.ts)** : Assemble le squelette HTML5 sémantique, injecte `<script id="arda-doc">` et charge MapLibre GL via CDN.
- **[`standaloneStyles.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/standaloneStyles.ts)** : Façade CSS assemblant les styles Bento ([`standalone-bento-styles.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/standalone-bento-styles.ts)) et les styles des slides/tiroir de légende ([`standalone-slide-styles.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/standalone-slide-styles.ts)).
- **[`standaloneScripts.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/standaloneScripts.ts)** : Façade JavaScript assemblant l'initialisation de la carte ([`standalone-map-init.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/standalone-map-init.ts)), le moteur de timeline/légende ([`standalone-timeline-logic.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/standalone-timeline-logic.ts)) et la logique des diapositives/sauvegarde ([`standalone-slide-logic.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/standalone-slide-logic.ts)).

---

## 3. Les Deux Modes d'Exportation

### 1. Mode `map` (Exploration Libre)
Le mode `map` produit une console cartographique interactive épurée :
- **Vue d'ensemble dynamique** : Affichage plein écran de la carte avec tuiles vectorielles stylisées selon la charte exacte du monde actif.
- **Couches de données interactives** : Polygones de territoires, réseaux routiers/maritimes et points d'intérêt cliquables.
- **Tiroir de légende interactif** : Ouvrable avec le bouton `Légende (L)` ou la touche `L`.
- **Fiches Wiki au clic** : Cliquer sur un lieu ou une zone ouvre immédiatement un panneau d'information avec description historique et source.

### 2. Mode `story` (Carte-Récit Bento & Mode EX Sidecar)
Le mode `story` transforme le monde en une présentation interactive scénarisée :
- **Volet Bento Narratif Flottant** : Panneau en verre translucide présentant la chronologie de l'histoire, le titre de l'étape, la datation contextuelle et le texte narratif.
- **Mode EX — Sidecar Pédagogique Docké (ArcGIS / Scrollytelling)** :
  - **Partitionnement Fixe Garanti** : Disposition en Sidecar docked (38% texte / 62% carte WebGL) éliminant tout risque de chevauchement visuel.
  - **Synchronisation Scroll $\leftrightarrow$ Caméra** : Transition cinématographique fluide (`flyTo` 800ms) et activation des couches à mesure que le lecteur fait défiler le fil narratif via `IntersectionObserver`.
  - **Actions de Texte Interactives (*Map Actions*)** : Mots-clés balisés cliquables déclenchant des zooms contextuels avec popover d'explication et bouton `← Retour au fil`.
  - **Bascule d'Orientation (`⇄` / `⇵`, touche `O`)** : Permet de choisir entre disposition horizontale (carte à droite) et verticale (carte en haut, texte en bas).
  - **Règle Anti-Débordement Automatique** : Élargissement automatique du volet pour les narrations longues (> 500 caractères).
  - **Mini-Carte de Contexte Fixe** : Vue d'ensemble macro permanente avec repère d'emprise clignotant.
  - **Ruban Temporel Vertical Intégré** : Jauge diachronique évoluant au rythme du scroll de lecture.
- **Points d'Appui Illustrés (`.has-slide`)** : Les étapes disposant de diapositives d'appui affichent un bouton dédié « *Voir la diapositive d'appui (★)* ».
- **Aller-Retour Sans Dérive Spatiale** : La touche `Échap`, `M` ou le bouton `← Retour à la Carte` ramène immédiatement l'utilisateur sur la carte à la même date et au même cadrage.

---

## 4. Fonctionnalités et Capacités Embarquées

| Fonctionnalité | Implémentation dans le Fichier Autonome | Bénéfice Utilisateur |
|---|---|---|
| **Moteur Cartographique** | MapLibre GL JS 4.7.1 (WebGL / Canvas) | Rendu vectoriel fluide 60 fps, rotation 3D et zoom sans pixellisation. |
| **Anti-Clipping Frontières** | `buffer: 128`, `tolerance: 0.375`, calques cercles natifs | Tous les points aux limites de territoires ou de tuiles restent parfaitement visibles. |
| **Légende Dynamique (Drawer)** | Panneau latéral escamotable avec pastilles (*swatches*) et compteurs | Lisibilité immédiate des entités actives sans masquer la carte. Raccourci `L`. |
| **Mode Présentation (F5)** | Bascule plein écran avec masquage des contrôles secondaires | Confort maximal pour la projection en salle de classe. |
| **Sauvegarde en Place (Ctrl+S)** | Ré-écriture immédiate du bloc JSON `#arda-doc` | Permet d'annoter et d'adapter le cours directement dans le fichier ouvert. |
| **Routage Wiki Hash** | Écoute de l'événement `window.onhashchange` (`#/wiki/<id>`) | Possibilité de partager des liens directs vers une entité précise. |

---

## 5. Tableau Comparatif des Formats d'Exportation de Braudel

| Critère | **Export HTML Autonome** | **Export PDF Normalisé** | **Export JPEG HD** | **Export Timelapse ZIP** |
|---|---|---|---|---|
| **Type de Rendu** | Web interactif (WebGL 60 fps) | Document vectoriel figé A4 | Image matricielle statique | Archive chronophotographique |
| **Interactivité** | **Maximale** (zoom, clic, wiki, slides) | Nulle (impression papier/archivage) | Nulle | Linéaire (diaporama) |
| **Navigation Temporelle** | Animée, fluide et continue | Pagination par points de rupture | Snapshot instantané | Défilement d'images |
| **Légende** | Tiroir dynamique réactif (`L`) | Panneau latéral fixe par page | Absente | Absente |
| **Poids Typique** | Très léger (100 Ko – 1 Mo) | Modéré (1 – 5 Mo) | Faible (500 Ko – 2 Mo) | Moyen à Élevé (5 – 25 Mo) |
| **Usage Idéal** | Cours interactif, e-learning, web | Rapports scientifiques, impressions A4 | Réseaux sociaux, bureautique | Vidéos, animations |

---

## 6. Guide d'Utilisation dans l'Application

1. **Ouvrir le panneau d'exportation** : Cliquer sur l'onglet **Données & Projets** (`DataPanel.tsx`) dans la barre latérale droite de Braudel.
2. **Accéder à la section multimédia** : Se positionner dans la zone **Exports Multimédias & Interactifs**.
3. **Sélectionner le mode souhaité** :
   - Cliquer sur **« Exporter HTML Autonome (Carte) »** pour une exploration cartographique libre.
   - Cliquer sur **« Exporter Récit Interactif (Bento) »** pour exporter le projet narratif actif avec ses waypoints, mouvements de caméra et diapositives d'appui.
4. **Téléchargement immédiat** : Le fichier nommé `[nom_du_monde]_standalone.html` ou `[nom_du_monde]_story.html` est immédiatement généré et téléchargé.
5. **Raccourcis en consultation** :
   - `Flèches Droite / Gauche` ou `Espace` : Déplacement entre waypoints.
   - `L` : Ouvrir / fermer le tiroir de légende.
   - `Échap` / `M` : Revenir de la diapositive vers la carte.
   - `F5` / `P` : Mode plein écran / présentation.
   - `Ctrl+S` : Sauvegarder les modifications apportées.

---

## 7. Fil d'Ariane
[ARCHITECTURE.md](../../docs/ARCHITECTURE.md) -> [services/export/](./braudel/src/services/export/export.md) -> [standaloneExport.md](./braudel/src/services/export/standaloneExport.md) -> **html.md**

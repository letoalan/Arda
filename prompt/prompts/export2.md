# Plan d’implémentation révisé — Exports Arda / Braudel

## 1. Objet du plan

Ce document remplace le plan initial d’extension des exports. Il prend pour point de départ l’état réel du module existant : Arda dispose déjà d’exports JSON canoniques, PDF, JPEG, chronophotographie ZIP et HTML interactif avec MapLibre et timeline.

L’objectif n’est donc pas de recréer un système d’export, mais d’étendre les sorties existantes avec :

1. un **mode narratif HTML inspiré de Bento** ;
2. un **mode vidéo commentée** dérivé de cette narration ;
3. un **catalogue GeoJSON enrichi** intégrant fonds historiques, contemporains, administratifs et maritimes.

Le principe directeur est : **un projet source unique, plusieurs rendus dérivés**.

---

## 2. État existant à préserver

### 2.1 Exports déjà fonctionnels

- JSON canonique depuis IndexedDB ou Zustand.
- Rapport cartographique PDF avec capture de carte, légende dynamique, date, échelle et styles Fantasy.
- Capture JPEG de la vue courante.
- Chronophotographie : captation par pas temporel et archivage ZIP via JSZip.
- Page HTML interactive : données GeoJSON embarquées, carte MapLibre, timeline et interface responsive.

### 2.2 Modules existants

```text
src/services/export/
├── index.ts                 # JSON canonique, export depuis IndexedDB ou store
├── export-multimedia.ts     # PDF, JPEG, timelapse ZIP
└── standalone-template.ts   # page HTML interactive autonome

src/app/views/
└── DataPanel.tsx            # point d’entrée actuel des exports

src/tests/
├── export-import.test.ts
└── multimedia-export.test.ts
```

### 2.3 Règle de non-régression

Les exports existants doivent être conservés sans changement de comportement : JSON, PDF, JPEG, ZIP chronophotographique et HTML interactif simple restent disponibles à tout moment.

---

## 3. Architecture cible

### 3.1 Source canonique

Le JSON du monde demeure la source de vérité. Les objets `story`, `mediaLibrary` et `geojsonSources` sont ajoutés de façon optionnelle afin de préserver la compatibilité avec les projets existants.

```ts
interface ExportProjectExtensions {
  story?: StoryProject;
  mediaLibrary?: StoryMedia[];
  geojsonSources?: GeojsonCatalogEntry[];
}
```

### 3.2 Rendus dérivés

| Intention | Sortie | Fonction existante ou nouvelle |
|---|---|---|
| Sauvegarder / reprendre | JSON | Existant |
| Imprimer / diffuser | PDF | Existant |
| Illustrer un document | JPEG | Existant |
| Montrer une évolution | Timelapse ZIP | Existant |
| Explorer une carte | HTML interactif | Existant |
| Raconter avec une carte | HTML narratif | Nouveau |
| Préparer une vidéo | Storyboard ZIP | Nouveau |
| Diffuser un récit commenté | WebM puis MP4 | Nouveau |

---

## 4. Phase 1 — HTML narratif inspiré de Bento

### 4.1 Objectif

Faire évoluer l’export HTML existant pour ajouter un mode narratif. La carte MapLibre reste le cœur du document ; les scènes ajoutent un texte, un cadrage, une période, des couches visibles, des entités mises en évidence et des médias.

Il ne s’agit pas de cloner Bento ni de remplacer le lecteur actuel. Il s’agit d’ajouter une surcouche de narration à `standalone-template.ts`.

### 4.2 Modèle de données

```ts
type StoryLayout = 'map-full' | 'map-text' | 'split' | 'media-focus';
type StoryTransition = 'cut' | 'fade' | 'fly';

interface StoryScene {
  id: string;
  title?: string;
  body?: string;
  mapState: {
    center: [number, number];
    zoom: number;
    bearing?: number;
    pitch?: number;
    timelineYear?: number;
    visibleLayerIds: string[];
    selectedEntityIds?: string[];
    basemapStyle?: string;
  };
  mediaIds?: string[];
  layout: StoryLayout;
  transition: StoryTransition;
  durationHint?: number;
}

interface StoryProject {
  id: string;
  title: string;
  description?: string;
  theme?: string;
  scenes: StoryScene[];
}
```

### 4.3 Nouveaux fichiers

```text
src/core/schema/
└── story.ts                         # types + schémas Zod

src/services/export/
├── story-export.ts                  # sérialisation story dans le projet canonique
└── standalone-template.ts           # extension : modes map / story

src/app/views/
├── StoryEditorPanel.tsx             # édition des scènes
└── StoryMediaPanel.tsx              # rattachement d’images et médias

src/app/components/story/
├── StorySceneList.tsx
├── StorySceneEditor.tsx
└── StoryPreview.tsx
```

### 4.4 Fonctionnalités MVP

- Créer, dupliquer, réordonner et supprimer une scène.
- Capturer l’état courant de la carte comme `mapState`.
- Éditer titre, texte, disposition et transition.
- Associer une ou plusieurs images à une scène.
- Prévisualiser la narration dans l’application.
- Exporter soit le HTML carte simple, soit le HTML narratif.

### 4.5 Intégration au template HTML

Le template reçoit une option explicite :

```ts
type StandaloneExportMode = 'map' | 'story';
```

- `map` conserve l’HTML interactif actuel : carte, timeline, navigation libre.
- `story` ajoute : navigation scène précédente/suivante, compteur, texte, média, rappel d’état de carte et transitions.

### 4.6 Critères de validation

- Une scène rappelle fidèlement le centre, le zoom, la date, le style et les couches visibles.
- Un ancien export HTML se comporte strictement comme avant.
- Le fichier HTML narratif peut être ouvert sans backend.
- Les données de narration sont réimportables avec le JSON canonique.
- Au moins une présentation de cinq scènes est lisible sur ordinateur et tablette.

### 4.7 Point de vigilance hors-ligne

Le HTML actuel charge MapLibre GL JS via CDN. Les données sont embarquées, mais le fichier n’est pas totalement autonome sans réseau. Deux stratégies doivent être comparées après le MVP :

1. conserver le CDN, pour un fichier léger ;
2. embarquer le runtime MapLibre et les ressources requises, pour une autonomie complète au prix d’un fichier plus lourd.

---

## 5. Phase 2 — Storyboard et vidéo commentée

### 5.1 Objectif

Produire une sortie audiovisuelle à partir des scènes définies dans le mode narratif : vues de cartes, photos, vidéos, slides, textes, voix off et sous-titres.

La vidéo est un rendu dérivé de `StoryProject`. Elle ne doit pas être conçue comme un simple enregistrement écran, car les scènes permettent un rendu reproductible, stable et éditable.

### 5.2 Paliers de livraison

| Palier | Contenu | Priorité |
|---|---|---|
| 1. Storyboard ZIP | JPEG par scène, manifeste JSON, script textuel, crédits | Très haute |
| 2. Narration audio | Enregistrement micro par scène, rattachement au storyboard | Haute |
| 3. Prévisualisation | Lecture linéaire carte + médias + audio dans l’application | Haute |
| 4. Export WebM | Capture de rendu, transitions et piste audio | Moyenne |
| 5. Export MP4 | Conversion ou pipeline complémentaire après validation WebM | Basse |

### 5.3 Modèle média et narration

```ts
type StoryMediaType = 'image' | 'video' | 'audio';

interface StoryMedia {
  id: string;
  type: StoryMediaType;
  name: string;
  mimeType: string;
  dataUrl?: string;
  caption?: string;
  credit?: string;
  sourceUrl?: string;
}

interface NarrationTrack {
  sceneId: string;
  audioMediaId?: string;
  transcript?: string;
  subtitles?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}
```

### 5.4 Nouveaux fichiers

```text
src/services/export/
├── storyboard-export.ts             # ZIP, manifeste, visuels, textes, crédits
└── video-export.ts                  # WebM, à introduire après le storyboard

src/app/views/
├── NarrationPanel.tsx               # script, audio, sous-titres
└── VideoExportPanel.tsx             # paramètres et suivi d’export

src/app/components/story/
├── StoryPlayer.tsx                  # lecture linéaire de scènes
└── AudioRecorder.tsx                # enregistrement micro par scène
```

### 5.5 Fonctionnalités du storyboard MVP

- Générer une capture JPEG de chaque scène depuis son `mapState`.
- Réutiliser le mécanisme de capture existant de `exportToJPEG`.
- Générer `story.json` avec scènes, durée et transition.
- Générer `script.md` avec titre, texte de scène, transcription et emplacement audio.
- Exporter `credits.md` listant images, vidéos, auteurs et URL de source.
- Regrouper le tout via JSZip.

### 5.6 Audio et sous-titres

- Enregistrement par `MediaRecorder` depuis le microphone.
- Rattachement de la piste à une scène.
- Champ de transcription éditable manuellement.
- Sous-titres simples édités à la main pour le MVP.
- Pas de génération automatique de voix ou de transcription avant stabilisation du flux humain.

### 5.7 Export vidéo

Le premier rendu cible est **WebM**, plus adapté à une production entièrement navigateur. La capture peut combiner le canvas de carte, les overlays narratifs et la piste audio.

Le MP4 sera traité comme une amélioration ultérieure, car il peut nécessiter un encodeur, une conversion ou une dépendance supplémentaire. Il ne doit pas bloquer le MVP.

### 5.8 Critères de validation

- Un storyboard de cinq scènes génère cinq JPEG, un manifeste, un script et des crédits.
- Une piste audio peut être enregistrée, relue et associée à une scène.
- La prévisualisation enchaîne correctement vues de carte, textes et médias.
- Un export WebM de courte durée est lisible dans un navigateur standard.
- Les exports JPEG et timelapse existants restent fonctionnels.

---

## 6. Phase 3 — Catalogue GeoJSON historique et contemporain

### 6.1 Objectif

Étendre le panneau Géopolitica afin qu’il ne traite plus uniquement les fonds historiques disponibles, mais un catalogue unifié : historique, contemporain, subdivisions administratives et espaces maritimes.

Le système d’import existant reste la base : sélection de fonds, sélection partielle d’entités, temporalité automatique/manuelle, simplification géométrique et fusion éventuelle.

### 6.2 Modèle de registre unifié

```ts
type GeojsonFamily = 'historical' | 'contemporary' | 'administrative' | 'maritime';
type GeographicScope = 'world' | 'continent' | 'country' | 'subnational';
type GeometryKind = 'polygon' | 'line' | 'point' | 'mixed';
type PrecisionLevel = 'overview' | 'standard' | 'detailed';
type RecommendedUse = 'narrative' | 'pedagogy' | 'analysis' | 'print';

interface GeojsonCatalogEntry {
  id: string;
  label: string;
  url: string;
  family: GeojsonFamily;
  geographicScope: GeographicScope;
  temporalRange?: [number, number];
  referenceYear?: number;
  geometryKind: GeometryKind;
  source: string;
  license?: string;
  precision?: PrecisionLevel;
  recommendedUse: RecommendedUse;
  sizeBytes?: number;
}
```

### 6.3 Familles prioritaires

- **Historique** : fonds Géopolitica existants, depuis les périodes préhistoriques jusqu’aux états modernes.
- **Contemporain** : frontières internationales actuelles, États et territoires dépendants.
- **Administratif** : régions, provinces, Länder, départements, États fédérés et subdivisions adaptées aux analyses territoriales.
- **Maritime** : ZEE, détroits, façades, espaces maritimes et autres couches géopolitiques utiles.

Le registre déjà recensé comprend un fond mondial de 2024 très lourd. L’interface doit donc rendre sa taille visible et éviter son chargement complet par défaut.

### 6.4 Évolutions de l’interface

- Onglets : **Historique**, **Contemporain**, **Territoires internes**, **Maritime**.
- Filtres : période, échelle, famille, précision, usage recommandé.
- Affichage de la source, licence, date, poids et couverture avant import.
- Aperçu cartographique léger avant import.
- Chargement à la demande, sélection par entité et limitation à une emprise géographique.
- Mode comparaison historique/contemporain : opacité, ordre des couches, contours différenciés.
- Préservation des sources et licences dans les exports HTML, PDF, storyboard et vidéo.

### 6.5 Nouveaux fichiers et extensions

```text
src/core/schema/
└── geojson-catalog.ts               # registre, types et validation

src/services/import/
├── geopoliticaImporter.ts           # à conserver et étendre
└── geojson-catalog-service.ts       # registre, filtrage, manifeste

src/app/views/
└── GeopoliticaPanel.tsx             # extension de l’interface actuelle

src/app/components/geojson/
├── CatalogFilters.tsx
├── CatalogEntryCard.tsx
├── GeojsonPreview.tsx
└── LayerComparisonControls.tsx
```

### 6.6 Critères de validation

- Les fonds sont clairement séparés par famille et usage.
- L’utilisateur peut limiter un import lourd à des entités choisies ou à une zone géographique.
- Les couches contemporaines et historiques peuvent être affichées simultanément avec un rendu lisible.
- Une couche importée peut être intégrée dans une scène narrative.
- Les sources, licences et métadonnées sont exportées avec le projet.

---

## 7. Réorganisation de DataPanel

Le panneau ne doit plus être une liste plate de boutons techniques. Il devient un hub organisé selon la finalité de l’utilisateur.

| Groupe | Fonctions |
|---|---|
| Sauvegarder / reprendre | Export JSON, import JSON, version du projet |
| Publier une carte | JPEG, PDF, HTML interactif simple |
| Raconter | Story editor, HTML narratif, storyboard ZIP |
| Diffuser | Prévisualisation, narration audio, WebM, sous-titres |
| Archiver | Timelapse ZIP, package ZIP complet, sources et crédits |

---

## 8. Plan d’exécution Antigravity

### 8.1 Règle de travail

Avec Gemini 3.6 Flash Low, chaque demande doit être atomique : un objectif local, quelques fichiers connus, un test ou une vérification précise, puis un commit. Le mode Low est réservé au scaffolding, aux types, aux composants UI isolés et aux tests locaux.

Le mode Medium est utilisé ponctuellement pour les sujets nécessitant une coordination importante : synchronisation carte/scène, lecture linéaire, capture vidéo et évolution de plusieurs services connectés.

### 8.2 Séquence de réalisation

1. Auditer les interfaces TypeScript réellement disponibles dans les services d’export.
2. Créer `story.ts` et ses schémas Zod.
3. Étendre le JSON canonique avec des champs optionnels.
4. Ajouter l’action « Capturer comme scène » depuis la carte.
5. Créer `StoryEditorPanel` et la prévisualisation locale.
6. Étendre `standalone-template.ts` avec les modes `map` et `story`.
7. Ajouter les tests de compatibilité des exports HTML anciens et nouveaux.
8. Créer `storyboard-export.ts` en réutilisant JPEG et JSZip.
9. Ajouter bibliothèque média, script et crédits.
10. Ajouter enregistrement audio et lecture de story.
11. Produire un premier export WebM court.
12. Définir le registre `GeojsonCatalogEntry`.
13. Étendre `GeopoliticaPanel` avec onglets, filtres et import à la demande.
14. Réorganiser `DataPanel.tsx`.
15. Lancer l’ensemble des tests d’export et les tests manuels multi-écrans.

### 8.3 Priorité effective

La première version utile doit atteindre :

**StoryProject → HTML narratif → Storyboard ZIP**.

La vidéo encodée et l’élargissement massif du catalogue GeoJSON viennent ensuite. Cette séquence apporte rapidement une vraie valeur pédagogique et professionnelle sans fragiliser les exports qui fonctionnent déjà.

---

## 9. Résultats attendus

À terme, un utilisateur pourra conserver le même projet source et choisir la sortie adaptée :

- carte interactive librement explorée ;
- carte publiée en JPEG ou PDF ;
- présentation HTML narrative et modifiable ;
- storyboard pédagogique ou professionnel prêt à commenter ;
- vidéo commentée ;
- projet JSON archivé avec données, médias, sources et licences.

La carte devient ainsi un support de narration, de documentation, d’enseignement, de médiation et de diffusion, sans perdre sa nature cartographique éditable.

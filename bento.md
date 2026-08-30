# bento.md — Plan d'implementation : Export HTML "Carte-Recit" pour ARDA/Braudel

## 0. Reformulation de l'objectif metier

Le besoin exprime n'est pas "ajouter des diapositives a la carte" mais l'inverse : **la carte et sa timeline sont le support principal de la narration**, et les diapositives sont des illustrations ponctuelles que l'enseignant ou l'etudiant invoque en se deplacant dans le temps. C'est une inversion de hierarchie par rapport a Bento, ou le document est une suite lineaire de slides et la carte ne serait qu'un element parmi d'autres [web:52].

Concretement, en salle de classe (BTS Tourisme, cours d'histoire-geographie), l'usage attendu est :

1. Le professeur ouvre le fichier HTML autonome en plein ecran, sur la carte.
2. Il deplace le curseur de la timeline vers une periode (ex. -250, expansion romaine en Mediterranee).
3. La carte se met a jour (entites actives, camera `flyTo`) — comportement deja acquis via le mode `story` [file:26].
4. **Point cle manquant** : a certains instants de la timeline, une ou plusieurs diapositives "d'appui" existent (carte thematique zoomee, image d'archive, texte de synthese, chronologie comparative). L'enseignant doit pouvoir y basculer d'un raccourci ou d'un clic sur un marqueur de la timeline, puis **revenir directement a la carte a la meme periode** sans perdre le fil.
5. La navigation n'est donc pas "slide 1 -> slide 2 -> slide 3" (lineaire, a la Bento) mais "carte <-> slide <-> carte", ancree sur des points precis de la timeline.

Le modele de document doit donc traiter la **timeline comme colonne vertebrale** et les slides comme des **noeuds attaches a des instants ou intervalles de cette timeline**, jamais l'inverse.

## 1. Modele de document : `#arda-doc` (inspire du schema Bento, restructure)

Bento stocke son document en JSON dans un bloc `#bento-doc`, avec `slides: Slide[]` en ordre lineaire et des ids d'elements stables pour le morph inter-slides [web:52]. On reprend ce principe de fichier auto-portant et editable, mais on restructure la racine autour de la timeline :

```json
<script type="application/arda+json" id="arda-doc">
{
  "format": "arda/map-story",
  "title": "Expansion territoriale de Rome",
  "map": {
    "style": "contemporary-voyager",
    "worldId": "world-rome-mediterranee"
  },
  "timeline": {
    "start": -700,
    "end": 200,
    "unit": "year"
  },
  "waypoints": [
    {
      "id": "wp-1",
      "year": -450,
      "cameraState": { "center": [12.5, 41.9], "zoom": 5.5, "pitch": 20, "bearing": 0 },
      "narrationText": "Rome, cite parmi d'autres cites italiques.",
      "slideRefs": []
    },
    {
      "id": "wp-2",
      "year": -250,
      "cameraState": { "center": [15.2, 37.5], "zoom": 5.2, "pitch": 35, "bearing": -15 },
      "narrationText": "Expansion dans le bassin mediterraneen.",
      "slideRefs": ["slide-punic-wars"]
    }
  ],
  "slides": [
    {
      "id": "slide-punic-wars",
      "attachedToWaypoint": "wp-2",
      "returnBehavior": "same-waypoint",
      "elements": [ /* meme schema d'elements que bento/slides : text, image, chart, table... */ ]
    }
  ]
}
</script>
```

Difference structurante avec Bento : `slides` n'est plus la liste-maitresse parcourue lineairement [web:52], c'est `waypoints` (points de la timeline) qui pilote la navigation, et chaque `slide` porte une reference explicite `attachedToWaypoint` + un `returnBehavior` qui garantit le retour exact a la carte, a la bonne annee, apres consultation.

## 2. Reutilisation du schema d'elements Bento pour le contenu des slides

Pour ne pas reinventer un langage de mise en page, le contenu interne de chaque slide (texte, image, graphique, tableau, morph) reprend directement les types d'elements documentes par Bento : `text`, `shape`, `image`, `chart`, `table`, `media` avec leurs proprietes (`fontFamily`, `fill`, `stroke`, etc.) [web:52][web:37]. Cela permet de reutiliser telles quelles les regles de composition deja eprouvees (96px de marge, une couleur d'accent, deux polices maximum, notes du presentateur sur chaque slide) [web:37].

Le mecanisme de `morph` (elements partageant le meme `id` entre deux slides qui animent position/taille/couleur) [web:31][web:52] est repris pour un cas pedagogique precis : illustrer un meme territoire qui change de forme entre deux slides d'appui rattachees a deux waypoints proches (ex. le territoire carthaginois avant/apres la deuxieme guerre punique).

## 3. Composant technique : timeline pilotee, pas seulement une barre de defilement

Les plugins existants (`maplibre-gl-time-slider`, `maplibre-gl-temporal-control`) fournissent deja un curseur avec lecture automatique et filtrage de couches par date [web:45][web:46][web:48], mais ils ne gerent pas la notion de "point d'ancrage vers une slide". Il faut donc un composant maison, construit sur le meme principe d'input `range` que l'exemple officiel MapLibre [web:43][web:44], enrichi de marqueurs cliquables :

```typescript
// standaloneScripts.ts — extension timeline
interface Waypoint {
  id: string;
  year: number;
  cameraState: CameraState;
  narrationText: string;
  slideRefs: string[];
}

function renderTimelineMarkers(waypoints: Waypoint[], container: HTMLElement) {
  waypoints.forEach((wp) => {
    const marker = document.createElement('button');
    marker.className = wp.slideRefs.length > 0 ? 'timeline-marker has-slide' : 'timeline-marker';
    marker.style.left = `${percentFromYear(wp.year)}%`;
    marker.title = wp.narrationText;
    marker.onclick = () => goToWaypoint(wp.id);
    container.appendChild(marker);
  });
}

function goToWaypoint(waypointId: string): void {
  const wp = doc.waypoints.find((w) => w.id === waypointId);
  map.flyTo(wp.cameraState);
  updateMapEntities(wp.year);
  updateNarrationPanel(wp.narrationText);
  history.replaceState(null, '', `#/timeline/${wp.year}`);
}
```

Les marqueurs avec `has-slide` sont visuellement distincts (ex. petit pictogramme) pour que l'enseignant sache, sans devoir cliquer, ou se trouvent les points d'appui illustres — c'est la traduction directe du besoin "aller et venir vers des slides qui illustrent les espaces dans la periode souhaitee".

## 4. Bascule carte <-> slide avec retour garanti

```typescript
function openSlide(slideId: string, fromWaypointId: string): void {
  const slide = doc.slides.find((s) => s.id === slideId);
  mapContainer.classList.add('hidden');
  slideContainer.classList.remove('hidden');
  renderSlideElements(slide.elements); // reutilise le renderer d'elements type Bento
  currentContext = { returningTo: fromWaypointId };
  history.replaceState(null, '', `#/slide/${slideId}`);
}

function closeSlideAndReturn(): void {
  slideContainer.classList.add('hidden');
  mapContainer.classList.remove('hidden');
  goToWaypoint(currentContext.returningTo); // retour exact a la meme annee/camera
}
```

Raccourci clavier propose : `Echap` ou touche `M` (Map) pour revenir instantanement de la slide vers la carte, `Entree` ou clic sur un marqueur `has-slide` pour l'ouvrir. Cela reproduit l'ergonomie "aller-retour" attendue en salle de classe, sans jamais perdre la position temporelle courante.

## 5. Mode present() distinct du mode consultation

Bento distingue implicitement l'edition et la lecture via `present?: { slideNumber?, controls?, progress? }` dans son schema [web:52]. On reprend ce principe pour ARDA :

```typescript
function enterPresentMode(): void {
  document.documentElement.requestFullscreen();
  document.body.classList.add('present-mode'); // masque les controles d'edition, garde timeline + marqueurs
}
```

Ce mode plein ecran est le point identifie dans l'echange precedent comme manquant : un bouton/raccourci (`F5` ou icone dediee) qui bascule l'affichage en mode presentation devant la classe, sans les elements d'interface secondaires (menus d'export, reglages de style).

## 6. Sauvegarde et edition en place (principe Bento conserve)

Comme Bento reecrit son propre fichier HTML a la sauvegarde (`window.bento.loadDoc`, ecriture non destructive du bloc JSON) [web:52][web:31], l'export ARDA doit permettre a l'enseignant d'ajouter/deplacer un waypoint ou une slide directement dans le fichier ouvert, puis de re-telecharger une version mise a jour :

```typescript
function saveDeck(): void {
  const updatedHtml = serializeDocIntoTemplate(doc, originalTemplate);
  const blob = new Blob([updatedHtml], { type: 'text/html' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${doc.title}-edited.html`;
  link.click();
}
```

Cela permet a un professeur de preparer sa progression, l'annoter avec des waypoints/slides specifiques a sa classe, sans repasser par l'editeur complet de Braudel.

## 7. Etapes d'implementation, par ordre de priorite

| Etape | Livrable | Fichier(s) concerne(s) |
| --- | --- | --- |
| 1 | Restructurer le JSON exporte : `waypoints` comme colonne vertebrale, `slides` rattachees par `attachedToWaypoint` | `standalone-template.ts` |
| 2 | Composant timeline avec marqueurs cliquables distincts pour les waypoints porteurs de slides | `standaloneScripts.ts` |
| 3 | Bascule carte/slide avec retour garanti a la meme annee (`goToWaypoint` / `openSlide` / `closeSlideAndReturn`) | `standaloneScripts.ts` |
| 4 | Renderer d'elements de slide reprenant le schema Bento (text, image, chart, table, morph) | `standaloneScripts.ts`, `standaloneStyles.ts` |
| 5 | Mode presentation plein ecran distinct de la consultation (`enterPresentMode`) | `standaloneScripts.ts` |
| 6 | Sauvegarde/edition en place avec re-telechargement du HTML mis a jour | `standaloneScripts.ts` |
| 7 | Tests : navigation timeline -> slide -> retour timeline sans perte de position ; morph entre deux slides d'un meme territoire | `multimedia-export.test.ts` (nouveau bloc) |

## 8. Difference finale avec un "clone Bento" au sens strict

Le resultat n'est pas un clone generique de Bento mais un **outil de narration cartographique** qui reutilise le format de document auto-portant, le schema d'elements et le principe de sauvegarde en place de Bento [web:52][web:31], en inversant sa logique de navigation : la timeline devient l'axe principal, les slides des points d'appui subordonnes, exactement comme un enseignant deroule son cours en s'appuyant sur une carte murale et en s'arretant ponctuellement sur un document projete.

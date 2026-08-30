# modifications.md — Compilation des chantiers actes (tuile.md + roadmap-ux.md)

Document de synthese regroupant l'ensemble des decisions prises, les consignes techniques a respecter, et les taches restant a amender lors de l'implementation. Compile a partir de `tuile.md` (style de tuile + DEM) et `roadmap-ux.md` (bordures, slides plein ecran, edition, sauvegarde).

---

## Sommaire des chantiers

| # | Chantier | Statut de la decision |
| --- | --- | --- |
| 1 | Embedding du style de tuile a l'export | Acte — capture reelle, mode online pour le style |
| 2 | Embedding du relief (DEM) a l'export | Acte — mode distant (online) uniquement, mode inline ecarte de l'iteration |
| 3 | Bordures de layers en lignes (pas en points) | Acte — nouvelle couche `line` dediee |
| 4 | Slide plein ecran superposee a la carte | Acte — overlay avec croix de fermeture, carte non demontee |
| 5 | Edition de slide type PowerPoint | Acte — socle median V1, architecture extensible |
| 6 | Sauvegarde/reedition du fichier HTML | Acte — le `.html` exporte sert de fichier de sauvegarde canonique |

---

## 1. Style de tuile a l'export

### Consigne
Le fichier HTML exporte doit refleter le style vectoriel reellement actif dans l'editeur au moment de l'export (`styleUrl`, `styleId`), jamais un fond Voyager impose par defaut.

### Schema ArdaDoc concerne
```json
{ "map": { "styleUrl": "...", "styleId": "tolkien-parchment" } }
```

### Taches a amender lors des travaux
- [ ] Localiser dans le pipeline d'export l'endroit ou `styleUrl` est actuellement fige en dur sur Voyager.
- [ ] Remplacer par une lecture de `map.getStyle().sprite` / config active de l'editeur au moment du clic sur "Exporter".
- [ ] Verifier la coherence entre `styleId` (identifiant logique du theme Braudel) et `styleUrl` (URL technique MapLibre) pour eviter une desynchronisation si l'un est mis a jour sans l'autre.
- [ ] Ajouter un test de non-regression comparant deux exports avec deux themes differents et verifiant des `styleUrl` distincts dans le document serialise.

---

## 2. Relief (DEM) a l'export — mode distant (online)

### Consigne
Le DEM n'est jamais embarque en donnees brutes dans le fichier. Seule l'URL du service de tuiles `raster-dem` est inlinee ; le chargement se fait a la demande via requetes reseau standard, exactement comme pour le style vectoriel. Le mode inline (hors-ligne strict) est explicitement ecarte de cette iteration — a documenter comme piste future uniquement, pas a developper maintenant.

### Schema ArdaDoc concerne
```json
{
  "map": {
    "terrain": {
      "mode": "remote",
      "terrainTilesUrl": "https://tiles.mapterhorn.com/{z}/{x}/{y}.webp",
      "encoding": "mapbox",
      "exaggeration": 1.2,
      "hillshadeEnabled": true
    }
  }
}
```

### Taches a amender lors des travaux
- [ ] Implementer `getActiveTerrainConfig(map)` qui lit `map.getTerrain()` dans l'editeur et exporte `mode: "none"` si aucun relief n'est actif (evite toute requete reseau inutile).
- [ ] Ajouter la reconstruction cote client : `addSource('terrain-dem', { type: 'raster-dem', ... })` + `map.setTerrain(...)` uniquement si `terrain.mode === "remote"`.
- [ ] Ajouter la couche `hillshade` complementaire (fonctionne meme en vue plate, pitch = 0), avec option `hillshadeEnabled` dans le schema.
- [ ] Implementer le garde-fou reseau obligatoire : `map.on('error', ...)` avec repli `map.setTerrain(null)` + notification discrete non bloquante en cas d'echec du CDN.
- [ ] Mettre a jour le recapitulatif UI d'export : case "Inclure le relief (necessite internet)" avec mention explicite que le reste de la carte-recit reste consultable hors-ligne.
- [ ] Tests de non-regression : capture correcte d'un terrain actif (`mode: "remote"`), absence de config si aucun relief actif (`mode: "none"`), degradation propre sans exception si la source echoue au chargement.

---

## 3. Bordures de layers en lignes, pas en points

### Consigne
Les limites de territoires (polygones) doivent etre marquees par un trace lineaire visible, independamment de la couleur de remplissage. Actuellement, seule la couche `braudel-points` (type circle, reservee aux geometries Point) et `braudel-polygons` (type fill, sans contour) existent — aucune couche `line` dediee au contour des polygones n'est presente.

### Correctif retenu
```javascript
map.addLayer({
  id: 'braudel-polygon-outline',
  type: 'line',
  source: 'braudel-entities',
  filter: ['==', ['get', 'type'], 'Polygon'],
  paint: {
    'line-color': ['coalesce', ['get', 'strokeColor'], ['get', 'color'], '#3B82F6'],
    'line-width': ['coalesce', ['get', 'lineWidth'], 1.5],
    'line-opacity': ['coalesce', ['get', 'strokeOpacity'], 0.8],
  },
});
```

### Taches a amender lors des travaux
- [ ] Ajouter la couche `braudel-polygon-outline` dans le pipeline de construction de carte (editeur + export standalone).
- [ ] Repliquer le filtre temporel dynamique (`updateTemporalFilter`, base sur `validFrom`/`validTo`) sur cette nouvelle couche, comme deja fait pour `braudel-polygons`, `braudel-lines`, `braudel-points`.
- [ ] Determiner l'ordre d'empilement (avant/apres `braudel-points`) selon la lisibilite souhaitee entre contours et points.
- [ ] Verifier que `strokeColor`/`strokeOpacity`/`lineWidth` sont bien renseignes par defaut pour les entites important depuis le catalogue geopolitique (fallback deja prevu via `coalesce`).
- [ ] Test de non-regression : verifier la presence de la couche `braudel-polygon-outline` de type `line` dans le HTML exporte.

---

## 4. Slide plein ecran superposee a la carte

### Consigne
La slide s'agrandit en plein ecran mais **par superposition** (overlay), sans demonter ni masquer la carte en arriere-plan. Un bouton croix (X) remplace le bouton texte actuel pour revenir a l'etat precedent.

### Correctif retenu
```css
.slide-container {
  position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 50;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
}
.slide-close-btn {
  position: absolute; top: 20px; right: 24px; z-index: 51;
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--bg-panel); border: 1px solid var(--border-color);
  font-size: 1.3rem; cursor: pointer;
}
```

### Taches a amender lors des travaux
- [ ] Retirer la logique actuelle de bascule exclusive `map.hidden` / `slide-container` — la carte ne doit plus jamais etre masquee.
- [ ] Remplacer le bouton `#btn-return-map` (texte) par une croix `#btn-slide-close` positionnee en haut a droite de l'overlay.
- [ ] Ajouter le fond semi-transparent + `backdrop-filter: blur()` pour laisser transparaitre la carte en arriere-plan.
- [ ] Verifier le comportement si une animation de camera (`flyTo`) est en cours au moment de l'ouverture d'une slide — elle doit continuer normalement en arriere-plan.
- [ ] Adapter le mode presentation (F5, `body.present-mode`) pour rester coherent avec ce nouveau comportement d'overlay.
- [ ] Tests de non-regression : la carte reste non masquee (`#map` sans classe `hidden`) quand la slide est ouverte ; le clic sur la croix ferme correctement l'overlay.

---

## 5. Edition de slide avec outils type PowerPoint (socle median V1)

### Consigne
Ne pas viser un editeur complet d'emblee. Fournir un socle de fonctionnalites medianes suffisant pour composer une slide de cours simple, avec une architecture en `elements[]` extensible sans refonte future.

### Perimetre V1 retenu

| Categorie | Inclus V1 | Reporte (a amender plus tard) |
| --- | --- | --- |
| Blocs de contenu | Texte, image, forme simple (rectangle, cercle) | Video, graphiques, tableaux, icones |
| Mise en page | Deplacement libre, redimensionnement, grille magnetique | Calques multiples avec z-index manuel, groupement |
| Texte | Police restreinte, taille, couleur, gras/italique/souligne, alignement | Listes multi-niveaux, styles de paragraphe nommes |
| Fond de slide | Couleur unie, image de fond | Degrade, texture, video de fond |
| Transitions | Aucune (statique) | Transitions d'entree/sortie entre slides |

### Schema d'element retenu
```json
{
  "slideId": "slide-1",
  "background": { "type": "color", "value": "#f8fafc" },
  "elements": [
    { "id": "el-1", "type": "text", "x": 40, "y": 40, "w": 500, "h": 80, "content": "...", "fontSize": 28, "fontWeight": 700, "color": "#1f2937", "align": "left" }
  ]
}
```

### Taches a amender lors des travaux
- [ ] Definir le canevas de reference fixe (ex. 1280x720, ratio 16:9) pour garantir un rendu identique entre edition et presentation/export.
- [ ] Implementer la barre d'outils minimale : ajout texte / image / forme, police, taille, couleur texte, gras/italique, couleur de fond, alignement.
- [ ] Implementer le deplacement/redimensionnement des elements avec grille magnetique (snapping).
- [ ] Prevoir explicitement l'extensibilite du schema `elements[]` (type discrimine) pour ajouter video/graphique/tableau sans migration lourde plus tard.
- [ ] Integrer ce nouveau format de slide avec le point 4 (rendu dans l'overlay plein ecran) et le point 6 (serialisation dans le document de sauvegarde).
- [ ] Test de non-regression : ajout d'un bloc texte et verification de son repositionnement dans le modele de donnees.

---

## 6. Sauvegarde et reedition ulterieure du fichier HTML

### Consigne
Le fichier `.html` exporte doit pouvoir etre reouvert plus tard soit pour projection directe (consultation), soit pour reprise d'edition dans l'outil, sans perte de donnees. Pas de format `.arda` separe : le `.html` sert lui-meme de fichier de sauvegarde canonique via son bloc `<script type="application/arda+json">`.

### Flux retenu
1. Bouton "Sauvegarder" (deja present, `#btn-save-deck`) : reexporte un `.html` a jour avec l'etat courant complet.
2. Nouveau bouton "Ouvrir un fichier ARDA" (cote editeur uniquement) : charge un `.html` existant, parse le bloc `arda-doc`, reconstruit l'etat interne.
3. Le fichier exporte reste toujours consultable independamment de l'editeur pour la simple projection.

### Taches a amender lors des travaux
- [ ] Ajouter le bouton/flux d'import de fichier `.html` existant dans l'editeur (input file + parsing du bloc `arda-doc`).
- [ ] Implementer `validateArdaDocSchema(doc)` pour detecter un fichier invalide ou corrompu avant reconstruction de l'etat.
- [ ] Ajouter un champ `schemaVersion` explicite dans le document serialise (actuellement absent).
- [ ] Implementer `migrateArdaDoc(doc, fromVersion, toVersion)` pour assurer la compatibilite ascendante des fichiers sauvegardes avec des versions anterieures de l'outil.
- [ ] Definir la politique de migration pour les champs ajoutes par les chantiers 1 a 5 ci-dessus (`terrain`, `slides.elements`, `braudel-polygon-outline` implicite) — valeurs par defaut a appliquer si absentes d'un ancien fichier.
- [ ] Tests de non-regression : cycle export puis reimport doit restituer un document identique ; migration d'un document de version anterieure ne doit provoquer aucune perte de donnees connues.

---

## Dependances transverses a surveiller pendant l'implementation

- Le point 6 (sauvegarde) depend directement des points 1, 2, 3 et 5 : chaque nouveau champ de schema (`terrain`, `slides.elements`) doit etre pris en compte dans la logique de migration avant d'etre considere comme termine.
- Le point 4 (slide overlay) et le point 5 (edition de slide) doivent partager le meme moteur de rendu de `elements[]` pour eviter une divergence entre le mode edition et le mode presentation.
- Le point 3 (bordures) est independant des autres chantiers et peut etre traite en premier, sans dependance bloquante.

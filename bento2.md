# bento2.md — Axes d'amelioration du mode Export HTML "Carte-Recit" (Iteration 2)

## 0. Contexte

L'analyse du fichier `arda_carte_interactive-1.html` a confirme que le moteur client (timeline, bascule slide/carte, sauvegarde) est fonctionnellement correct, mais que trois problemes distincts degradent l'usage reel : (1) le convertisseur StoryProject -> ArdaDoc ne produit qu'un waypoint factice, (2) aucune gestion de densite visuelle a faible zoom, (3) aucun mecanisme anti-corruption robuste pour `saveDeck`. A cela s'ajoutent trois axes complementaires demandes explicitement : conservation stricte du fond vectoriel choisi par l'utilisateur, disparition de points aux frontieres, et integration de la legende dans un panneau a tiroir plutot qu'en surimpression permanente.

## 1. Axe A — Corriger la conversion StoryProject -> ArdaDoc (bloquant)

### Constat
Le document inline ne contient qu'un waypoint `wp-default` (annee 0, texte generique) et un tableau `slides: []` vide, alors que le monde source contient manifestement plusieurs scenes et periodes historiques (visibles dans les entites GeoJSON elles-memes, echelonnees de -500 a +200). Le convertisseur `convertStoryProjectToArdaDoc` n'est donc jamais alimente avec les scenes reelles du monde au moment de l'export.

### Correctif propose
```typescript
// src/services/export/bento-types.ts
export function convertStoryProjectToArdaDoc(
  storyProject: StoryProject | null,
  world: World,
  fallbackYearRange: [number, number]
): ArdaDoc {
  if (!storyProject || storyProject.scenes.length === 0) {
    // Repli explicite et TRACE plutot que silencieux : log + waypoint unique documente
    console.warn('[ARDA Export] Aucun StoryProject fourni : export en mode "carte libre" sans scenes.');
    return buildFallbackSingleWaypointDoc(world, fallbackYearRange);
  }
  return {
    format: 'arda/map-story',
    title: world.name,
    waypoints: storyProject.scenes.map((scene) => ({
      id: `wp-${scene.id}`,
      year: scene.year,
      label: scene.title,
      cameraState: scene.mapState,
      narrationText: scene.narrationText,
      slideRefs: scene.attachedSlideIds ?? [],
    })),
    slides: storyProject.slides ?? [],
    // ...
  };
}
```

### Garde-fou obligatoire
Le point critique n'est pas seulement de corriger le convertisseur, mais d'empecher qu'un export silencieux en mode degrade (1 waypoint) puisse etre confondu avec un export reussi. L'UI d'export doit afficher un avertissement bloquant si `storyProject.scenes.length === 0` avant de lancer la generation, plutot que de laisser l'utilisateur decouvrir le probleme en ouvrant le fichier.

## 2. Axe B — Conservation stricte de la tuile vectorielle choisie par l'utilisateur

### Constat
Le document inline fixe `styleUrl: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"` en dur, sans lien verifiable avec le choix effectif fait par l'utilisateur dans l'editeur au moment de l'export (Contemporain / Tolkien / Cyberpunk / Antique / Dark, etc., mentionnes dans `html.md`). Rien dans le pipeline ne garantit que le style exporte correspond exactement au style actif dans l'editeur au clic sur "Exporter".

### Correctif propose
```typescript
// src/services/export/standalone-template.ts
export function generateStandaloneHtml(
  worldName: string,
  activeStyleConfig: MapStyleConfig, // capture explicite de l'etat editeur au moment T de l'export
  ...
) {
  const doc: ArdaDoc = {
    map: {
      styleUrl: activeStyleConfig.url,       // jamais une constante en dur
      styleId: activeStyleConfig.id,          // ex. "tolkien-parchment", pas "contemporary" par defaut
      themeVariables: activeStyleConfig.cssVariables, // couleurs, polices du theme, injectees dans standaloneStyles.ts
    },
    // ...
  };
}
```
Un test de non-regression doit verifier que `styleId` exporte correspond bien au theme actif dans le store editeur au moment de l'appel, pas a une valeur par defaut du template.

## 3. Axe C — Disparition de points aux frontieres (artefact de rendu)

### Diagnostic
Le symptome ("points qui disparaissent aux frontieres") est un artefact classique de rendu MapLibre GL du type "point-in-polygon boundary clipping" : lorsque les entites de type `Point` (villes, marqueurs) sont rendues avec la meme source `braudel-entities` que les polygones territoriaux, et que le style de couche applique un filtre `['==', ['geometry-type'], 'Point']` combine a un `symbol-placement` ou une regle d'anti-collision (`icon-allow-overlap: false`, `text-allow-overlap: false`), les points positionnes exactement sur ou pres d'une frontiere de polygone peuvent etre elimines par l'algorithme de gestion des collisions de labels/symboles au moment ou deux tuiles adjacentes se chevauchent (tile boundary). C'est un phenomene connu de MapLibre/Mapbox GL sur les geometries situees pres des limites de tuiles vectorielles.

### Correctif propose
```typescript
// src/services/cartography/mapLayersManager.ts
map.addLayer({
  id: 'braudel-points',
  type: 'circle', // remplacer 'symbol' par 'circle' pour les marqueurs simples : pas de gestion de collision
  source: 'braudel-entities',
  filter: ['==', ['geometry-type'], 'Point'],
  paint: {
    'circle-radius': 5,
    'circle-color': ['get', 'color'],
    'circle-stroke-width': 1.5,
    'circle-stroke-color': '#ffffff',
  },
});
// Si des icones/labels sont necessaires en complement, les ajouter sur une couche 'symbol' SEPAREE
// avec icon-allow-overlap: true et text-allow-overlap: true pour desactiver l'anti-collision fautive.
```
Alternative si le rendu `circle` est insuffisant visuellement : forcer `promoteId` sur la source et augmenter `buffer` dans les options de tuile vectorielle source (`tileBuffer` ou equivalent GeoJSON `buffer: 128`) pour eviter le clipping des geometries aux limites de tuiles.

### Test de non-regression
Verifier par capture de canevas (pixel sampling) qu'un point positionne exactement sur une frontiere connue entre deux polygones du jeu de test reste visible apres rendu, quel que soit le niveau de zoom testé (4, 6, 8).

## 4. Axe D — Legende integree dans un panneau a tiroir lateral

### Constat
Actuellement, aucune legende n'est visible dans le mode carte-recit : seul le volet narratif Bento et la timeline occupent l'espace. Contrairement au mode PDF (qui a une legende laterale fixe, cf. `atlas_arda_9_epoques.pdf`), le mode HTML ne propose aucune equivalence, alors que la lisibilite des couleurs/categories d'entites en depend directement pour un usage pedagogique.

### Correctif propose — panneau a tiroir (drawer)
```html
<!-- standalone-template.ts -->
<button class="tool-btn" id="btn-toggle-legend" title="Legende (L)">
  <span>🗺️</span><span>Legende</span>
</button>
<aside class="legend-drawer hidden" id="legend-drawer">
  <div class="legend-drawer-header">
    <h3>Legende</h3>
    <button id="btn-close-legend">&times;</button>
  </div>
  <div class="legend-drawer-body" id="legend-content"></div>
</aside>
```
```css
/* standalone-slide-styles.ts */
.legend-drawer {
  position: absolute; top: 0; right: 0; height: 100vh; width: 320px;
  background: var(--bg-panel); backdrop-filter: blur(16px);
  border-left: 1px solid var(--border-color);
  transform: translateX(100%); transition: transform 0.3s ease; z-index: 40;
}
.legend-drawer:not(.hidden) { transform: translateX(0); }
```
```typescript
// standalone-timeline-logic.ts
function renderLegendContent(activeEntities: Feature[]): void {
  const categories = groupByCategory(activeEntities); // regroupement par type/couleur
  legendContentEl.innerHTML = categories.map((c) => `
    <div class="legend-item">
      <span class="legend-swatch" style="background:${c.color}"></span>
      <span>${c.label} (${c.count})</span>
    </div>
  `).join('');
}
```
La legende doit se **recalculer dynamiquement** a chaque changement de waypoint (memes entites actives que celles affichees sur la carte a cet instant), et non rester statique sur l'ensemble du monde — ce qui la rend directement utile en contexte de cours, ou l'enseignant peut l'ouvrir/fermer via le bouton dedie ou le raccourci `L` sans jamais masquer la carte elle-meme (contrairement a un panneau fixe qui reduirait l'espace cartographique en permanence).

## 5. Synthese des axes et priorites

| Axe | Probleme | Priorite | Fichier(s) |
| --- | --- | --- | --- |
| A | Convertisseur StoryProject -> ArdaDoc ne produit qu'un waypoint factice | Bloquant | `bento-types.ts`, UI d'export |
| B | Style de fond exporte non lie au choix reel de l'utilisateur | Haute | `standalone-template.ts` |
| C | Points disparaissant aux frontieres (collision de rendu MapLibre) | Haute | `mapLayersManager.ts` |
| D | Absence de legende, a integrer en tiroir lateral | Moyenne | `standalone-template.ts`, `standalone-slide-styles.ts`, `standalone-timeline-logic.ts` |
| E (rappel iteration 1) | Chevauchement/illisibilite a faible zoom (clustering absent) | Moyenne | `mapLayersManager.ts` |
| F (rappel iteration 1) | `saveDeck` fragile (remplacement regex non echappe) | Moyenne | `standalone-slide-logic.ts` |

## 6. Recommandation de sequencement

1. Corriger l'Axe A en premier : sans scenes reelles, aucun autre axe ne peut etre valide visuellement (impossible de tester la legende dynamique, la persistance du style ou le clustering sur un document a un seul waypoint).
2. Traiter B et C en parallele : ce sont deux corrections independantes du pipeline de rendu MapLibre, sans dependance croisee.
3. Ajouter le tiroir de legende (D) une fois qu'un export multi-waypoints reel est disponible pour tester le recalcul dynamique par periode.
4. Revalider l'ensemble avec un test d'integration end-to-end (navigateur headless) ouvrant le fichier exporte reel et verifiant : plusieurs waypoints navigables, style de fond conserve, points visibles aux frontieres testees, legende synchronisee avec le waypoint courant.

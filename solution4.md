# Solution 4 : Regression - la premiere epoque ecrase toutes les pages suivantes

## 1. Constat

Apres application cumulee des Solutions 2 et 3-1 (chargement dynamique, filtrage par `targetYear`, reattachement des layers, `waitForAllSourcesReady`), un nouveau symptome apparait, plus grave que la duplication partielle observee en Solution 3 : **toutes les pages de l'atlas affichent desormais la carte de la premiere epoque**, quel que soit le nombre de periodes selectionnees. Les 142 tests Vitest passent malgre cette regression, ce qui confirme — comme en Solution 3 — que la suite ne verifie jamais la difference de contenu entre deux pages consecutives d'un meme export.

Ce comportement est un retour en arriere plus severe que le bug initial (issue.md) : la ou l'ancien bug figeait la carte sur l'instant du clic d'export, celui-ci fige la carte sur l'instant de la premiere page et la reproduit indefiniment.

## 2. Cause racine : le verrouillage `waitForAllSourcesReady` valide un etat "faux positif"

Le correctif de la Solution 3-1 poll l'etat des sources via `map.isSourceLoaded(id)` a intervalle de 50 ms, sans lien avec l'appel `setData()` qui l'a precede. Or le cycle de vie reel de `source.setData()` dans MapLibre GL est le suivant :

1. `setData(geojson)` est appele -> `isSourceLoaded()` **repasse a `false`** de facon transitoire (source en cours de reparsing).
2. Le Worker reparse le GeoJSON -> `isSourceLoaded()` **redevient `true`** une fois les tuiles reconstruites.

Le probleme : entre l'etape 1 et l'etape 2, la fenetre transitoire `false` peut durer moins de 50 ms (le GeoJSON d'une seule epoque est souvent leger). Si le premier appel `map.isSourceLoaded('braudel-entities')` du polling tombe **avant** que `setData` n'ait bascule l'etat a `false`, ou juste **apres** qu'il soit redevenu `true` mais toujours avec l'ancien contenu affiche a l'ecran (car le repaint GPU n'a pas encore eu lieu), la fonction `waitForAllSourcesReady` conclut a tort que tout est pret et retourne immediatement.

```typescript
// Comportement actuel probable — waitForAllSourcesReady (Solution 3-1)
for (let attempt = 0; attempt < maxAttempts; attempt++) {
  const allSourcesLoaded = sourceIds.every((id) => map.isSourceLoaded(id)); // <-- lit un etat global,
  // pas un etat "lie a ce setData precis" -> peut etre vrai a cause du chargement PRECEDENT
  const tilesReady = map.areTilesLoaded();
  const cameraSettled = !map.isMoving() && !map.isZooming() && !map.isRotating();
  if (allSourcesLoaded && tilesReady && cameraSettled) {
    // Sur la page 2, si aucun fitBounds n'est declenche (cameraSettled est vrai en permanence
    // puisque le viewport ne change pas entre pages), cette condition peut etre satisfaite
    // DES LE PREMIER TOUR DE BOUCLE, avant que le nouveau setData n'ait ete traite.
    return;
  }
}
```

Sur un atlas ou le viewport ne change pas entre epoques (pas de `fitBounds`), `cameraSettled` est vrai en permanence, et si `isSourceLoaded` reste bloque a `true` (residu de la page precedente) pendant toute la duree du reparsing invisible au polling, **la fonction ne bloque jamais** : chaque page est capturee immediatement apres `setData`, avant que le nouveau contenu ne soit reellement rendu. Resultat : la premiere page capture correctement l'epoque 1 (chargement initial, delai naturel plus long), mais toutes les pages suivantes capturent un canevas qui n'a pas eu le temps de se rafraichir — donc, par inertie du framebuffer, la meme image que la page precedente, en cascade jusqu'a la premiere.

## 3. Correctif : lier l'attente a un jeton de mise a jour explicite, pas a un etat global

Il faut remplacer le polling d'etat global par une attente evenementielle liee explicitement a l'appel `setData` en cours, via l'evenement `sourcedata` de MapLibre avec verification du type de mise a jour :

```typescript
// src/services/export/export-multimedia.ts
async function updateEntitiesAndWaitForRender(
  map: MapLibreMap,
  sourceId: string,
  geojson: FeatureCollection
): Promise<void> {
  const source = map.getSource(sourceId) as GeoJSONSource;

  const updateComplete = new Promise<void>((resolve) => {
    const onSourceData = (e: MapSourceDataEvent) => {
      // 'sourcedata' + isSourceLoaded(true) confirme que CE setData precis
      // a ete traite, pas un residu d'un appel anterieur.
      if (e.sourceId === sourceId && e.isSourceLoaded) {
        map.off('sourcedata', onSourceData);
        resolve();
      }
    };
    map.on('sourcedata', onSourceData);
  });

  source.setData(geojson); // declenche la sequence false -> (parsing) -> true
  await updateComplete;

  // Attente supplementaire du repaint GPU, uniquement APRES confirmation
  // que les donnees sont bien celles de cette page.
  await new Promise<void>((resolve) => {
    map.once('render', () => resolve());
    map.triggerRepaint();
  });
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}
```

`captureSnapshotAt` doit appeler cette fonction a la place de `setData` brut + `waitForAllSourcesReady` generique :

```typescript
async function captureSnapshotAt(
  targetYear: number,
  map: MapLibreMap,
  worldStore: WorldStore,
  renderOptions: RenderOptions
): Promise<PdfPage> {
  await ensureEpochEntitiesLoaded(targetYear, worldStore);
  const geojson = buildEntitiesGeoJSON(worldStore.entities, targetYear);

  await updateEntitiesAndWaitForRender(map, 'braudel-entities', geojson); // lie au setData de CETTE page
  await waitForBackgroundTilesReady(map); // conserve la verification du fond (Solution 3-1), mais separee

  return renderMapPDFPage(map, targetYear, renderOptions);
}
```

La verification du fond de carte (tuiles OSM/Voyager, Solution 3-1) reste utile et doit etre conservee, mais **separee** de la verification des entites Braudel : les deux sources n'ont pas le meme cycle de vie, et les fusionner dans une seule condition globale est precisement ce qui a permis au faux positif de se produire.

## 4. Pourquoi ce bug est plus grave que celui de la Solution 3

Dans la Solution 3, le probleme touchait la **granularite** du catalogue (des groupes de pages partageaient legitimement le meme contenu car issus de la meme source). Ici, le probleme touche la **synchronisation** : meme si chaque page demande des donnees reellement distinctes (chargees, filtrees correctement), le canevas n'est jamais rafraichi avant capture apres la premiere page. C'est une regression du verrou de synchronisation lui-meme, introduite par la generalisation trop large de `waitForAllSourcesReady` a la Solution 3-1.

## 5. Test de non-regression cible

```typescript
// src/tests/multimedia-export.test.ts
it('chaque page doit capturer un canevas distinct correspondant a son targetYear', async () => {
  const map = createMockMapWithCanvasSpy();
  const pages = await exportTimelineDrivenPDF(map, mockWorldStore, mockCatalogService, [
    { midpoint: -450 }, { midpoint: -250 }, { midpoint: 150 },
  ], mockRenderOptions);

  const canvasSnapshots = map.getCanvas.mock.results.map((r) => r.value.toDataURL());
  const uniqueSnapshots = new Set(canvasSnapshots);
  expect(uniqueSnapshots.size).toBe(3); // echoue actuellement : toutes identiques a la page 1
});

it('doit attendre l\'evenement sourcedata specifique avant de capturer', async () => {
  const map = createMockMap();
  const setDataSpy = vi.spyOn(map.getSource('braudel-entities'), 'setData');
  await updateEntitiesAndWaitForRender(map, 'braudel-entities', mockGeojson);
  expect(setDataSpy).toHaveBeenCalledBefore(map.getCanvas as any);
});
```

## 6. Synthese

| Etape | Diagnostic | Fichier |
| --- | --- | --- |
| Cause | Polling d'etat global (`isSourceLoaded`) non lie au `setData` de la page courante | `export-multimedia.ts` |
| Effet | Capture immediate apres `setData`, avant reparsing/repaint -> canevas non rafraichi | Toutes les pages sauf la 1re |
| Correctif | Ecoute de l'evenement `sourcedata` filtre sur `isSourceLoaded === true` pour CE `setData` precis | `updateEntitiesAndWaitForRender` |
| Garde-fou | Separer explicitement la verification du fond de carte de celle des entites Braudel | `waitForBackgroundTilesReady` (ex-Solution 3-1) |
| Test manquant | Aucun test ne comparait le contenu du canevas entre deux pages | `multimedia-export.test.ts` |

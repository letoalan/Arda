# Solution 3-1 : Complement — Disparition de la tuile vectorielle de fond lors de la capture

## 1. Portee de ce complement

`solution3.md` traitait la duplication de contenu entre pages consecutives (granularite du catalogue vs pagination de l'atlas). Ce document traite un angle mort distinct, identifie a posteriori : le verrouillage evenementiel `waitForMapReady` propose dans les correctifs precedents ne surveille que la source `braudel-entities` (polygones/entites historiques), jamais les sources de tuiles vectorielles du **fond de carte** (OpenStreetMap / Voyager) [file:19]. Or ce fond peut lui-meme disparaitre ou etre incomplet au moment exact du `toDataURL`, independamment de l'etat des entites Braudel.

## 2. Mecanisme du bug

Deux scenarios concrets expliquent la disparition ponctuelle du fond lors d'un export multi-pages :

- **Changement de viewport entre epoques** : si la boite englobante des entites varie fortement d'une page a l'autre (ex. Italie antique -> Empire seleucide), un `fitBounds()` ou `flyTo()` declenche le rechargement des tuiles de fond dans la nouvelle zone. Si la capture intervient avant la fin de ce chargement, le canevas peut afficher une zone blanche/grise en fond, meme si `braudel-entities` est correctement chargee et rendue.
- **Eviction du cache de tuiles MapLibre** : la limite `maxTileCacheSize` peut evincer les tuiles de la page precedente avant que celles de la page courante soient pleinement chargees, lors d'un enchainement rapide de captures (cas d'un export 9 pages).

Le verrouillage actuel ne detecte aucun des deux cas car il ne teste que `map.isSourceLoaded('braudel-entities')`, jamais l'etat des autres sources du style ni l'etat de mouvement de la camera.

## 3. Correctif : verrouillage etendu a toutes les sources + etat de camera

```typescript
// src/services/export/export-multimedia.ts
async function waitForAllSourcesReady(map: MapLibreMap): Promise<void> {
  const style = map.getStyle();
  const sourceIds = Object.keys(style.sources ?? {});
  const maxAttempts = 30;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const allSourcesLoaded = sourceIds.every((id) => map.isSourceLoaded(id));
    const tilesReady = typeof map.areTilesLoaded === 'function'
      ? map.areTilesLoaded()
      : true;
    const cameraSettled = !map.isMoving() && !map.isZooming() && !map.isRotating();

    if (allSourcesLoaded && tilesReady && cameraSettled) {
      // Double frame d'animation pour garantir que le GPU a bien repeint
      // apres la derniere mise a jour de source, pas seulement "planifie" le repaint.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      return;
    }
    await new Promise((r) => setTimeout(r, 50));
  }

  throw new PdfExportError(
    'Timeout: tuiles de fond ou entites Braudel non chargees avant capture. ' +
    'Export annule pour eviter une page avec fond de carte incomplet.'
  );
}
```

## 4. Integration dans le pipeline de capture existant

`waitForAllSourcesReady` remplace `waitForMapReady` (limite a `braudel-entities`) a l'interieur de `captureSnapshotAt`, sans modifier le reste du pipeline deja corrige (chargement dynamique, filtrage par `targetYear`, reattachement des layers) :

```typescript
async function captureSnapshotAt(
  targetYear: number,
  map: MapLibreMap,
  worldStore: WorldStore,
  renderOptions: RenderOptions
): Promise<PdfPage> {
  await ensureEpochEntitiesLoaded(targetYear, worldStore);

  const geojson = buildEntitiesGeoJSON(worldStore.entities, targetYear);
  await updateMapEntities(map, geojson);

  // Ancien : await waitForMapReady(map, 'braudel-entities', geojson.features.length);
  // Nouveau : couvre le fond de carte ET les entites, ET l'etat de la camera.
  await waitForAllSourcesReady(map);

  return renderMapPDFPage(map, targetYear, renderOptions);
}
```

Si un changement de viewport (`fitBounds`/`flyTo`) est declenche entre deux pages, il doit imperativement etre `await`-e (ou son evenement `moveend` attendu) **avant** l'appel a `waitForAllSourcesReady`, sinon la condition `cameraSettled` pourrait etre evaluee vraie sur une frame transitoire.

## 5. Test unitaire complementaire

```typescript
// src/tests/multimedia-export.test.ts
it('ne doit pas capturer tant que le fond de carte est en mouvement ou incomplet', async () => {
  const map = createMockMap({
    sources: { 'braudel-entities': true, 'openmaptiles': false }, // fond non charge
    isMoving: false,
  });

  const capturePromise = captureSnapshotAt(-450, map, mockWorldStore, mockRenderOptions);

  // Simule la fin du chargement du fond apres un delai
  setTimeout(() => map.setSourceLoaded('openmaptiles', true), 100);

  await expect(capturePromise).resolves.toBeDefined();
  expect(map.getCanvas).toHaveBeenCalledTimes(1); // capture apres, pas pendant le chargement
});

it('doit rejeter si la camera est encore en transition apres timeout', async () => {
  const map = createMockMap({ isMoving: () => true }); // reste en mouvement indefiniment
  await expect(
    captureSnapshotAt(-450, map, mockWorldStore, mockRenderOptions)
  ).rejects.toThrow(/Timeout/);
});
```

## 6. Synthese des correctifs cumules

| Correctif | Origine | Portee |
| --- | --- | --- |
| Chargement dynamique du catalogue | issue2.md / solution2.md | Evite les entites manquantes |
| Filtrage temporel recalcule a chaque page | solution3.md | Evite la duplication de contenu inter-pages |
| Reattachement des layers Braudel | issue2.md / solution2.md | Evite l'absence de polygones/frontieres |
| **Verrouillage etendu a toutes les sources + camera** | **solution3-1.md** | **Evite la disparition du fond de carte pendant la capture** |

Ce dernier point ferme la boucle sur les quatre causes racines identifiees initialement, en couvrant explicitement la brique manquante du fond vectoriel, jusque-la non testee par la suite de 140 assertions.

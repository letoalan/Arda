# Correction de la contamination inter-époques dans l'export Atlas PDF

## Diagnostic

L'export multi-époques souffre de **3 vecteurs de contamination** qui provoquent la superposition visuelle d'entités de l'époque précédente sur l'époque courante, tant sur la carte que dans la légende :

### Vecteur 1 — Contamination de la légende (cause principale)

Dans [`pdf-atlas-generator.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/pdf-atlas-generator.ts#L242-L254), `renderMapPDFPage` reçoit le **tableau complet** `entities` et `relations` — non filtré pour l'époque courante :

```typescript
await renderMapPDFPage(
  doc, worldName, snapshotYear, styleConfig, map,
  entities,    // ← tableau COMPLET, pas filtré
  relations,   // ← tableau COMPLET, pas filtré
  pageOptions, i + 1, totalPages, epochRange
);
```

Ensuite dans [`pdf-page-renderer.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/pdf-page-renderer.ts#L153), le filtre `isEntityVisibleAt(e, year, epochRange)` utilise un test de **chevauchement de plages** :

```typescript
// Si from <= epochRange.validTo ET to >= epochRange.validFrom → visible
return from <= epochRange.validTo && to >= epochRange.validFrom;
```

Ce test d'intersection est **intentionnel** pour la couverture cartographique, mais provoque l'apparition dans la légende d'entités qui **chevauchent** les bornes de l'époque sans être spécifiques à cette époque. Par exemple, un Empire Romain visible de -27 à 476 apparaîtra dans TOUTES les époques de cette période.

### Vecteur 2 — Contamination du canvas MapLibre (race condition)

Dans `exportMultiEpochPDF`, la séquence par itération est :

```
1. updateEntitiesAndWaitForRender(map, geojson)  // setData + attente sourcedata
2. updateMapEntities(snapshotYear, epoch)         // callback → mapService.updateEntities()
3. waitForBackgroundTilesReady(map)
4. renderMapPDFPage → captureMapCanvas → waitForBackgroundTilesReady (encore) → drawImage
```

Le problème : **l'étape 2** appelle `mapService.updateEntities()` qui reconstruit un GeoJSON à partir de `liveWorld.entities` et fait un **second `setData`** sur la même source. Cette double-écriture crée une **race condition** : l'étape 1 injecte le bon GeoJSON filtré, puis l'étape 2 le remplace par un GeoJSON potentiellement différent (construit depuis le state global non filtré correctement).

### Vecteur 3 — Accumulation dans le store (via `ensureEpochEntitiesLoaded`)

Dans [`pdf-map-capture.ts:229`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/pdf-map-capture.ts#L229), `ensureEpochEntitiesLoaded` fait `worldStore.entities.push(...formatted)` — mutation directe qui **accumule** les entités catalogue de toutes les époques. Au fur et à mesure de l'itération, les entités des époques précédentes restent dans le store. Ce vecteur n'est actif que via `captureSnapshotAt`, pas directement dans `exportMultiEpochPDF`, mais il est une bombe à retardement.

---

## Changements proposés

### 1. Filtrage strict des entités passées à `renderMapPDFPage`

#### [MODIFY] [`pdf-atlas-generator.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/pdf-atlas-generator.ts)

Dans les deux boucles d'export (`exportTimelineDrivenPDF` et `exportMultiEpochPDF`), passer les **entités filtrées** pour l'époque courante à `renderMapPDFPage` au lieu du tableau brut :

```diff
+   // Construire la liste filtrée d'entités visibles pour CETTE époque uniquement
+   const epochEntities = (entities || []).filter(e => isEntityVisibleAt(e, snapshotYear, epochRange));
+   const epochRelations = (relations || []).filter(r => isRelationVisibleAt(r, snapshotYear, epochRange));
+
    await renderMapPDFPage(
      doc, worldName, snapshotYear, styleConfig, map,
-     entities,
-     relations,
+     epochEntities,
+     epochRelations,
      pageOptions, i + 1, totalPages, epochRange
    );
```

Même traitement pour `exportTimelineDrivenPDF` (sans `epochRange`, le filtre `isEntityVisibleAt(e, year)` fait un test point-in-time strict).

> [!IMPORTANT]
> Ceci garantit que la légende ne contient que les entités strictement visibles à l'instant capturé.

---

### 2. Suppression du double `setData` (race condition)

#### [MODIFY] [`pdf-atlas-generator.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/pdf-atlas-generator.ts)

Supprimer l'appel `updateMapEntities(snapshotYear, epoch)` après `updateEntitiesAndWaitForRender`. Le GeoJSON injecté à l'étape 1 EST la source de vérité pour cette page. Le callback `updateMapEntities` re-construit un second GeoJSON et écrase le premier, créant la race condition.

```diff
    if (geojsonToInject) {
      await updateEntitiesAndWaitForRender(map, 'braudel-entities', geojsonToInject);
    } else {
      const geojson = buildEntitiesGeoJSON(entities || [], relations || [], snapshotYear, 'all', [], epochRange);
      await updateEntitiesAndWaitForRender(map, 'braudel-entities', geojson);
-     updateMapEntities(snapshotYear, epoch);
    }
```

Même chose dans `exportTimelineDrivenPDF` : retirer `updateMapEntities(year)` après `updateEntitiesAndWaitForRender`.

> [!WARNING]
> `updateMapEntities` est un callback provenant de `DataPanel.tsx` qui appelle `mapService.updateEntities()`. Son rôle est de synchroniser les couches visuelles interactives. Pendant l'export PDF, cette synchronisation est **contre-productive** car elle écrase le GeoJSON filtré avec un GeoJSON reconstruit depuis le state global. Le nettoyage post-export (dans le `finally` de `handleConfirmMultiPdf`) restaurera correctement l'état interactif.

---

### 3. Purge explicite de la source avant chaque itération

#### [MODIFY] [`pdf-atlas-generator.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/pdf-atlas-generator.ts)

Ajouter un flush explicite de la source GeoJSON au début de chaque itération pour garantir qu'aucun résidu de l'époque précédente ne persiste :

```diff
  for (let i = 0; i < totalPages; i++) {
+   // Purger la source pour éliminer tout résidu de l'époque précédente
+   await updateEntitiesAndWaitForRender(map, 'braudel-entities', { type: 'FeatureCollection', features: [] });
+
    const epoch = epochs[i];
```

> [!NOTE]
> Ce flush coûte ~700ms par page, mais c'est un prix acceptable pour garantir l'isolation des données. Il élimine définitivement toute possibilité que des features "fantômes" du cycle précédent persistent dans le pipeline de rendu WebGL.

---

### 4. Import de `isRelationVisibleAt` dans `pdf-atlas-generator.ts`

#### [MODIFY] [`pdf-atlas-generator.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/pdf-atlas-generator.ts)

Ajouter `isRelationVisibleAt` à l'import depuis `pdf-types.ts` (il est déjà exporté, mais pas importé dans l'atlas generator).

---

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| [`pdf-atlas-generator.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/pdf-atlas-generator.ts) | Flush + filtrage pré-render + suppression du double setData |
| [`pdf-atlas-generator.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/pdf-atlas-generator.md) | Mise à jour documentation |
| [`pdf-map-capture.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/services/export/modules/pdf-map-capture.md) | Mise à jour documentation |

## Plan de vérification

### Vérification automatisée
- `cmd /c "npx tsc --noEmit"` — compilation TypeScript sans erreur

### Vérification manuelle
- Export Atlas PDF multi-époques : vérifier visuellement que chaque page montre uniquement les entités de l'époque correspondante
- Vérifier que la légende de chaque page ne contient pas d'entités de l'époque précédente
- Vérifier qu'après l'export, la carte interactive retrouve son état normal

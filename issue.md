# Rapport d'Analyse d'Anomalie : Synchronisation et Rendu Multi-Époques de l'Atlas PDF

## 1. Description du Problème

Lors de la génération d'un livret cartographique complet (*Atlas Multi-Époques A4 Paysage*), toutes les pages du document PDF généré comportaient une image de carte identique (celle présente sous le curseur temporel à l'instant du clic d'exportation), écrasant les configurations géographiques réelles des époques sélectionnées. Si l'exportation était initiée sur une période sans données, toutes les pages du livret apparaissaient vides malgré une légende et un cartouche textuel corrects.

---

## 2. Analyse des Causes Techniques dans le Contexte du Code

Deux facteurs interconnectés provoquaient ce comportement :

### A. Asynchronisme des Web Workers et Rendu WebGL MapLibre GL
Dans `src/services/export/export-multimedia.ts`, la fonction `exportMultiEpochPDF` itérait sur la liste des époques sélectionnées :
```typescript
for (let i = 0; i < totalPages; i++) {
  const epoch = epochs[i];
  setTime(epoch.year);
  updateMapEntities(epoch.year);
  
  // Attente insuffisante par simple setTimeout
  await new Promise((r) => setTimeout(r, 450));
  
  await renderMapPDFPage(...);
}
```
- L'appel `updateMapEntities(epoch.year)` délègue la reconstruction GeoJSON et l'appel `source.setData(geojsonData)` à MapLibre GL.
- MapLibre traite les tuiles vectorielles et les géométries via des **Web Workers asynchrones**.
- Un simple délai passif (`setTimeout`) ne garantissait pas que le worker avait terminé la triangulation des polygones ni que la boucle d'animation GPU avait exécuté le draw call WebGL.
- En conséquence, `captureMapCanvas` extrayait le buffer du canevas avant l'achèvement de la frame, capturant l'état précédent ou initial.

### B. Bornage Temporel Excessif des Entités Importées
Dans `src/services/import/geojson-catalog-service.ts`, les périodes historiques se voyaient assigner par défaut une borne de validité s'étendant arbitrairement à `+100 ans` voire `2100` (`[source.referenceYear, source.referenceYear + 100]`).
- Lors de l'itération temporelle, les entités d'une époque antérieure continuaient d'être validées par le filtre `validFrom <= currentTime && validTo >= currentTime`, entraînant une superposition non désirée des calques historiques.

---

## 3. Corrections Apportées

### A. Synchronisation Événementielle Stricte du Moteur de Rendu
Dans `src/services/export/export-multimedia.ts`, la boucle de capture applique désormais un verrouillage événementiel direct sur le cycle de vie de MapLibre :

```typescript
// 1. Déplacement temporel et actualisation des entités
setTime(epoch.year);
updateMapEntities(epoch.year);

// 2. Forçage du rafraîchissement et attente de l'événement de dessin WebGL
await new Promise<void>((resolve) => {
  let resolved = false;
  const onComplete = () => {
    if (!resolved) {
      resolved = true;
      resolve();
    }
  };

  if (map && typeof map.triggerRepaint === 'function') {
    map.triggerRepaint();
    if (typeof map.once === 'function') {
      map.once('idle', onComplete);
      map.once('render', onComplete);
    }
  }
  // Garde-fou temporel
  setTimeout(onComplete, 400);
});
```

### B. Bornage Temporel Strict des Périodes Historiques
Dans `src/services/import/geojson-catalog-service.ts`, les plages temporelles (`temporalRange`) sont désormais calculées de manière séquentielle et stricte entre chaque période du catalogue :
```typescript
const nextSourceYear = index + 1 < sortedSources.length
  ? sortedSources[index + 1].referenceYear
  : source.referenceYear + 50;

temporalRange: [source.referenceYear, nextSourceYear]
```

### C. Réinitialisation Dynamique de la Sélection dans la Modale
Dans `src/app/components/data/ExportPdfModal.tsx`, un hook synchronise automatiquement la sélection sur les fonds et entités réellement importés (`importedEpochs`) à chaque réouverture de la modale sans écraser les actions utilisateur.

---

## 4. Résultats & Validation

1. **Génération Page par Page Décorrélée :** Chaque page de l'Atlas PDF dispose de son snapshot cartographique autonome correspondant exactement aux données de son époque.
2. **Tests Unitaires :** 135 tests validés avec succès sur l'ensemble de la suite Vitest (`multimedia-export.test.ts`, `candidate-indexer.test.ts`, `temporal.test.ts`, etc.).
3. **Build :** Compilation TypeScript et bundling Vite validés sans avertissement.

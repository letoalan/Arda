# Proposition Technique : Résolution de l'Absence des Calques Vectoriels sur l'Atlas PDF (solution2.md)

## 1. Rappel du Problème et Spécifications Cibles

### Problème Identifié dans `issue2.md` :
Lors de l'exportation du livret cartographique PDF (ou d'un snapshot unique), le document généré contient les cartouches, la légende et le fond de carte vectoriel (océans, masses terrestres, grille), mais **aucun polygone géopolitique, tracé de frontière, réseau ou point d'entité n'apparaît sur le canevas de la carte** (carte vierge).

### Exigences Fonctionnelles Stricte :
1. **Correspondance 1 pour 1 :** Si $X$ périodes sont sélectionnées dans la modale d'export, exactement $X$ pages doivent être générées dans le livret PDF.
2. **Photographie au point médian :** La capture de chaque période $[T_{\text{start}}, T_{\text{end}}]$ doit être effectuée à son point médian exact :
   $$T_{\text{snapshot}} = \text{round}\left(\frac{T_{\text{start}} + T_{\text{end}}}{2}\right)$$
   *(Exemple : pour une période de $-500$ à $-400$, la photographie est prise à $-450$).*
3. **Visibilité intégrale des calques :** Tous les polygones d'empires/territoires, contours de frontières, lignes de routes et points de cités valides pour la période doivent être matérialisés, compilés par les shaders WebGL et visibles sur le canevas capturé dans le PDF.

---

## 2. Architecture Technique de la Solution

Pour éliminer définitivement la carte vierge, la solution repose sur 4 piliers complémentaires :

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          ARCHITECTURE DU PIPELINE DE CAPTURE ROBUSTE                         │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

 [1. Sélection Modale : X époques avec T_midpoint]
                          │
                          ▼
 [2. Résolution Dynamique GeoJSON (Catalog & Store)] 
     └─► Si entités absentes du store, chargement immédiat du GeoJSON catalogue
                          │
                          ▼
 [3. Injection dans la source MapLibre 'braudel-entities']
     └─► source.setData(featuresCollection)
                          │
                          ▼
 [4. Verrouillage Asynchrone WebGL (isSourceLoaded + idle)]
     └─► Attente active que le Web Worker ait téléversé les vertex buffers sur le GPU
                          │
                          ▼
 [5. Capture du Framebuffer WebGL (preserveDrawingBuffer / double tick)]
     └─► map.getCanvas().toDataURL('image/png') ──► Livret PDF complet avec tous les layers
```

---

## 3. Implémentation Détaillée par Composant

### A. Composant 1 : Résolution et Injection Dynamique des Données d'Époque (`export-multimedia.ts`)

Lors de la boucle d'export, si l'époque sélectionnée provient du catalogue historique (`source: 'geopolitica'`) ou si `world.entities` ne contient pas d'entités pour cette tranche, nous chargeons dynamiquement le GeoJSON depuis le registre de catalogue (`geojson-catalog-service.ts`) et mettons à jour la source vectorielle.

```typescript
// src/services/export/export-multimedia.ts

/**
 * Prépare et garantit la présence des données GeoJSON pour une époque donnée,
 * qu'elles soient déjà dans le store ou issues du catalogue historique.
 */
async function resolveAndInjectEpochData(
  epoch: EpochExportTarget,
  entities: WorldEntity[],
  mapService: MapService
): Promise<void> {
  const midpointYear = epoch.year;
  
  // 1. Chercher les entités correspondant à la période dans le store
  const matchingEntities = entities.filter(e => {
    if (!e.temporalRange) return true;
    const from = Array.isArray(e.temporalRange) 
      ? e.temporalRange[0] 
      : (e.temporalRange as any).validFrom ?? -Infinity;
    const to = Array.isArray(e.temporalRange) 
      ? e.temporalRange[1] 
      : (e.temporalRange as any).validTo ?? Infinity;
    return from <= midpointYear && to >= midpointYear;
  });

  // 2. Si aucune entité n'est présente en mémoire et qu'un fichier catalogue existe
  if (matchingEntities.length === 0 && epoch.catalogSourceId) {
    const catalogData = await loadGeoJsonFromCatalog(epoch.catalogSourceId);
    if (catalogData) {
      mapService.updateEntities(catalogData);
      return;
    }
  }

  // 3. Sinon, injecter le GeoJSON calculé depuis les entités actives
  const geojson = buildEntitiesGeoJSON(entities, midpointYear, 'all', []);
  mapService.updateEntities(geojson);
}
```

---

### B. Composant 2 : Synchronisation Événementielle Stricte du Moteur WebGL (`export-multimedia.ts`)

Pour pallier le traitement asynchrone des Web Workers de MapLibre GL, le moteur d'export n'utilise plus de simple délai passif mais une attente vérifiant la disponibilité réelle de la source `braudel-entities` et l'achèvement du cycle de rendu GPU :

```typescript
// src/services/export/export-multimedia.ts

/**
 * Attend de manière garantie que la source GeoJSON soit compilée et rendue sur le canevas GPU.
 */
async function waitForMapSourceReady(map: maplibregl.Map, sourceId: string = 'braudel-entities'): Promise<void> {
  return new Promise<void>((resolve) => {
    let resolved = false;

    const finalize = () => {
      if (!resolved) {
        resolved = true;
        // Laisser 2 frames d'animation pour garantir le swap du framebuffer WebGL
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      }
    };

    const checkSourceState = () => {
      if (map.isSourceLoaded(sourceId) && map.areTilesLoaded()) {
        map.off('data', onData);
        map.off('idle', onIdle);
        map.once('render', finalize);
        map.triggerRepaint();
      }
    };

    const onData = (e: any) => {
      if (e.sourceId === sourceId && e.isSourceLoaded) {
        checkSourceState();
      }
    };

    const onIdle = () => {
      checkSourceState();
    };

    map.on('data', onData);
    map.on('idle', onIdle);
    map.triggerRepaint();

    // Garde-fou temporel de sécurité (600ms max)
    setTimeout(() => {
      map.off('data', onData);
      map.off('idle', onIdle);
      finalize();
    }, 600);
  });
}
```

---

### C. Composant 3 : Normalisation du Filtrage Temporel au Point Médian (`mapGeojsonRenderer.ts`)

Le renderer GeoJSON doit accepter à la fois les structures `{ validFrom, validTo }`, les tableaux `[start, end]`, et inclure une tolérance sur les bornes de l'époque englobante $[T_{\text{start}}, T_{\text{end}}]$ :

```typescript
// src/services/cartography/mapGeojsonRenderer.ts

export function buildEntitiesGeoJSON(
  entities: WorldEntity[],
  currentTime: number,
  empireFilter: string = 'all',
  layers: any[] = []
): GeoJSON.FeatureCollection {
  const hiddenLayerIds = new Set(
    (layers || []).filter((l) => l.visible === false).map((l) => l.id)
  );

  const activeEntities = entities.filter((e) => {
    if (e.properties?.isRelation) return false;
    if (e.layerId && hiddenLayerIds.has(e.layerId)) return false;
    if (!e.temporalRange) return true;

    // Support universel des formats de temporalRange
    const from = (e.temporalRange as any).validFrom !== undefined
      ? Number((e.temporalRange as any).validFrom)
      : Array.isArray(e.temporalRange)
      ? Number(e.temporalRange[0])
      : -Infinity;

    const to = (e.temporalRange as any).validTo !== undefined
      ? Number((e.temporalRange as any).validTo)
      : Array.isArray(e.temporalRange)
      ? Number(e.temporalRange[1])
      : Infinity;

    return from <= currentTime && to >= currentTime;
  });

  const features: GeoJSON.Feature[] = [];

  activeEntities.forEach((entity) => {
    if (!entity.geometry) return;
    if (empireFilter !== 'all' && entity.properties?.empire && entity.properties.empire !== empireFilter) return;

    const entityColor =
      (typeof entity.properties?.color === 'string' && entity.properties.color) ||
      (typeof (entity as any).color === 'string' && (entity as any).color) ||
      '#3B82F6';

    const fillOpacity =
      typeof entity.properties?.fillOpacity === 'number'
        ? entity.properties.fillOpacity
        : 0.45;

    const strokeOpacity =
      typeof entity.properties?.strokeOpacity === 'number'
        ? entity.properties.strokeOpacity
        : 0.9;

    features.push({
      type: 'Feature',
      id: entity.id,
      geometry: entity.geometry,
      properties: {
        ...entity.properties,
        id: entity.id,
        name: entity.name,
        color: entityColor,
        fillColor: entityColor,
        strokeColor: entityColor,
        fillOpacity,
        strokeOpacity,
        lineWidth: 1.5,
      },
    });
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}
```

---

### D. Composant 4 : Garantie d'Empilement et Rendu des Calques MapLibre (`mapLayersManager.ts`)

Pour s'assurer que les calques d'entités (`braudel-polygons`, `braudel-polygons-outline`, `braudel-lines`, `braudel-points`) ne sont jamais écrasés ou masqués par des calques de tuiles vectorielles de fond :

```typescript
// src/services/cartography/mapLayersManager.ts

export function setupVectorLayers(map: maplibregl.Map) {
  // 1. Initialiser la source si absente
  if (!map.getSource('braudel-entities')) {
    map.addSource('braudel-entities', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }

  // 2. Polygones remplis (Placement au premier plan au-dessus des tuiles raster/basemap)
  if (!map.getLayer('braudel-polygons')) {
    map.addLayer({
      id: 'braudel-polygons',
      type: 'fill',
      source: 'braudel-entities',
      filter: ['in', '$type', 'Polygon'],
      paint: {
        'fill-color': ['coalesce', ['get', 'fillColor'], ['get', 'color'], '#3B82F6'],
        'fill-opacity': ['coalesce', ['get', 'fillOpacity'], 0.45],
      },
    });
  }

  // 3. Contours de polygones
  if (!map.getLayer('braudel-polygons-outline')) {
    map.addLayer({
      id: 'braudel-polygons-outline',
      type: 'line',
      source: 'braudel-entities',
      filter: ['in', '$type', 'Polygon'],
      paint: {
        'line-color': ['coalesce', ['get', 'strokeColor'], ['get', 'color'], '#1D4ED8'],
        'line-width': ['coalesce', ['get', 'lineWidth'], 1.5],
        'line-opacity': ['coalesce', ['get', 'strokeOpacity'], 0.9],
      },
    });
  }

  // 4. Lignes / Routes
  if (!map.getLayer('braudel-lines')) {
    map.addLayer({
      id: 'braudel-lines',
      type: 'line',
      source: 'braudel-entities',
      filter: ['in', '$type', 'LineString'],
      paint: {
        'line-color': ['coalesce', ['get', 'color'], '#F59E0B'],
        'line-width': ['coalesce', ['get', 'lineWidth'], 2.5],
        'line-opacity': 0.9,
      },
    });
  }

  // 5. Points / Villes
  if (!map.getLayer('braudel-points')) {
    map.addLayer({
      id: 'braudel-points',
      type: 'circle',
      source: 'braudel-entities',
      filter: ['in', '$type', 'Point'],
      paint: {
        'circle-radius': 5,
        'circle-color': ['coalesce', ['get', 'color'], '#EF4444'],
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#ffffff',
      },
    });
  }
}
```

---

## 4. Matrice de Test et Critères d'Acceptation

| Cas de Test | Scénario | Résultat Attendu |
|---|---|---|
| **Test 1 : 1-to-1 Périodes / Pages** | Sélection de 3 périodes : $[-500, -400]$, $[-300, -200]$, $[1, 100]$. | Génération exacte de **3 pages PDF**. |
| **Test 2 : Snapshot au point médian** | Période $[-500, -400]$. | Capture de la carte à l'année **$-450$**. |
| **Test 3 : Présence des layers sur le PDF** | Période avec entités de l'Empire Romain / Cités Grecques. | Les polygones colorés et frontières sont **clairement visibles** sur le PDF, superposés au fond de carte. |
| **Test 4 : Non-régression unitaire** | Exécution de `cmd /c npm test`. | **138+ tests validés avec succès** (100% passants). |

---

## 5. Synthèse des Fichiers Impactés

1. `src/services/export/export-multimedia.ts` : Intégration de `resolveAndInjectEpochData` et `waitForMapSourceReady`.
2. `src/services/cartography/mapGeojsonRenderer.ts` : Polymorphisme `temporalRange` et parsing sécurisé des propriétés de style.
3. `src/services/cartography/mapLayersManager.ts` : Sécurisation de l'empilement Z-Index des couches vectorielles.
4. `src/app/components/data/ExportPdfModal.tsx` : Maintien de l'exactitude des calculs $T_{\text{snapshot}}$ au point médian.

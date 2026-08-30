# Solution : Moteur d'export PDF piloté par les points de rupture de la timeline (ARDA / Braudel)

## 1. Constat de départ

Le rapport `issue.md` corrige un bug de synchronisation (attente insuffisante entre `setTime()` et le rendu WebGL) et un bug de bornage temporel (`temporalRange` trop large). Ces correctifs sont nécessaires mais **insuffisants** par rapport à l'exigence fonctionnelle réelle : l'export ne doit plus dépendre d'une liste fixe d'« époques » sélectionnées dans une modale, mais doit **suivre automatiquement la timeline** et ne capturer un snapshot qu'aux instants où la carte change réellement.

Le comportement cible :

1. Positionner le curseur temporel sur l'instant de départ (année courante ou année de début choisie).
2. Capturer le snapshot (PDF simple ou première page du PDF multiple).
3. Si l'export est multiple : calculer le **prochain instant de la timeline où la composition de la carte change** (apparition, disparition ou modification géométrique d'une entité), s'y déplacer, capturer un nouveau snapshot.
4. Répéter l'étape 3 jusqu'à ce qu'aucun changement supplémentaire ne soit détectable dans la timeline (fin de catalogue).

## 2. Notion clé : le « point de rupture » (`changepoint`)

Un point de rupture est un instant `t` tel que l'ensemble des entités actives (ou leurs géométries) à `t` diffère de l'ensemble actif à `t - ε`. Dans le modèle de données actuel, chaque entité possède un `temporalRange: [validFrom, validTo]`. Les points de rupture sont donc exactement les bornes `validFrom` et `validTo` de toutes les entités du catalogue, dédupliquées et triées.

```typescript
// src/services/timeline/changepoints.ts
export interface TemporalEntity {
  id: string;
  temporalRange: [number, number]; // [validFrom, validTo]
}

/**
 * Calcule tous les instants où l'ensemble des entités actives change.
 * Complexité: O(n log n), n = nombre d'entités du catalogue.
 */
export function computeChangepoints(entities: TemporalEntity[]): number[] {
  const points = new Set<number>();
  for (const e of entities) {
    points.add(e.temporalRange[0]);
    points.add(e.temporalRange[1]);
  }
  return Array.from(points).sort((a, b) => a - b);
}

/**
 * Renvoie le prochain point de rupture strictement supérieur à `currentTime`.
 * Retourne `null` si la timeline est épuisée (fin de catalogue).
 */
export function getNextChangepoint(
  currentTime: number,
  changepoints: number[]
): number | null {
  for (const t of changepoints) {
    if (t > currentTime) return t;
  }
  return null;
}
```

Ce module est indépendant de MapLibre : il travaille uniquement sur les métadonnées du catalogue (`geojson-catalog-service.ts`), ce qui le rend testable unitairement sans mock de rendu WebGL.

## 3. Refonte de `export-multimedia.ts`

L'ancienne fonction `exportMultiEpochPDF` itérait sur `epochs: Epoch[]`, une liste choisie par l'utilisateur dans `ExportPdfModal`. La nouvelle version itère sur les **points de rupture calculés dynamiquement**, tout en réutilisant le verrou événementiel `idle` / `render` déjà introduit dans le correctif de `issue.md` (section 3.A), qui reste indispensable pour garantir qu'un snapshot correspond bien à la frame WebGL post-mise à jour.

```typescript
// src/services/export/export-multimedia.ts
import { computeChangepoints, getNextChangepoint } from '../timeline/changepoints';

async function waitForMapIdle(map: MapLibreMap): Promise<void> {
  return new Promise<void>((resolve) => {
    let resolved = false;
    const onComplete = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };
    if (map && typeof map.triggerRepaint === 'function') {
      map.triggerRepaint();
      map.once('idle', onComplete);
      map.once('render', onComplete);
    }
    setTimeout(onComplete, 400); // garde-fou temporel conservé
  });
}

async function captureSnapshotAt(
  time: number,
  map: MapLibreMap,
  renderOptions: RenderOptions
): Promise<PdfPage> {
  setTime(time);
  updateMapEntities(time);
  await waitForMapIdle(map);
  return renderMapPDFPage(map, time, renderOptions);
}

/**
 * Export unifié : gère aussi bien le PDF simple (une seule page)
 * que le PDF multiple (parcours automatique des points de rupture).
 */
export async function exportTimelineDrivenPDF(
  map: MapLibreMap,
  catalogEntities: TemporalEntity[],
  options: {
    startTime: number;
    multi: boolean;
    maxPages?: number; // garde-fou anti-boucle infinie
    renderOptions: RenderOptions;
  }
): Promise<PdfPage[]> {
  const pages: PdfPage[] = [];
  const maxPages = options.maxPages ?? 200;

  // 1. Snapshot initial (couvre le cas "PDF simple")
  let currentTime = options.startTime;
  pages.push(await captureSnapshotAt(currentTime, map, options.renderOptions));

  if (!options.multi) {
    return pages; // export simple : une seule page, on s'arrête ici
  }

  // 2. Parcours automatique des points de rupture jusqu'à épuisement
  const changepoints = computeChangepoints(catalogEntities);

  while (pages.length < maxPages) {
    const nextTime = getNextChangepoint(currentTime, changepoints);
    if (nextTime === null) break; // plus aucune modification dans la timeline
    currentTime = nextTime;
    pages.push(await captureSnapshotAt(currentTime, map, options.renderOptions));
  }

  return pages;
}
```

Points importants :

- **Un seul chemin de code** gère désormais le PDF simple et le PDF multiple : le simple est un cas particulier (`multi: false`) du même moteur, ce qui élimine une classe entière de bugs de divergence entre les deux modes.
- Le `maxPages` est un garde-fou obligatoire : sans lui, un catalogue mal borné (cf. bug B du rapport `issue.md`) pourrait produire une boucle de plusieurs milliers de pages.
- `waitForMapIdle` est repris tel quel du correctif existant : la logique de rupture temporelle est orthogonale au problème de synchronisation WebGL, donc les deux corrections sont cumulatives et non redondantes.

## 4. Impact sur `geojson-catalog-service.ts`

Le correctif du bornage temporel (section 3.B de `issue.md`) devient une **dépendance directe** de l'algorithme de rupture : si `temporalRange` reste mal calculé, `computeChangepoints` produira de faux points de rupture (ou en manquera). Il faut donc exposer une fonction dédiée dans ce service, appelée par le moteur d'export :

```typescript
// src/services/import/geojson-catalog-service.ts
export function getCatalogTemporalEntities(): TemporalEntity[] {
  return sortedSources.map((source, index) => {
    const nextSourceYear =
      index + 1 < sortedSources.length
        ? sortedSources[index + 1].referenceYear
        : source.referenceYear + 50;
    return {
      id: source.id,
      temporalRange: [source.referenceYear, nextSourceYear] as [number, number],
    };
  });
}
```

## 5. Impact sur `ExportPdfModal.tsx`

La modale n'a plus besoin de proposer une sélection manuelle d'époques pour le mode multiple : elle propose uniquement l'**instant de départ** et un bouton « Parcourir automatiquement jusqu'à la fin ». La logique de synchronisation dynamique déjà introduite (section 3.C de `issue.md`) est conservée pour pré-remplir l'instant de départ avec la première époque réellement importée.

```typescript
// src/app/components/data/ExportPdfModal.tsx (extrait)
const handleExport = async () => {
  const catalogEntities = getCatalogTemporalEntities();
  const pages = await exportTimelineDrivenPDF(map, catalogEntities, {
    startTime,
    multi: exportMode === 'multi',
    renderOptions,
  });
  await buildPdfDocument(pages);
};
```

## 6. Cas limites à couvrir dans les tests unitaires

| Cas | Comportement attendu |
| --- | --- |
| Timeline vide (aucune entité) | Une seule page vide, pas de boucle |
| Toutes les entités partagent le même `temporalRange` | Un seul point de rupture, export simple équivalent au multiple |
| Point de rupture égal à `startTime` | Ignoré (on ne veut que les ruptures strictement postérieures) |
| Catalogue avec des milliers de bornes rapprochées | `maxPages` stoppe l'export et déclenche un avertissement UI |
| Rupture sans modification visuelle réelle (ex. `validTo` d'une entité masquée) | Accepté par design : la définition du point de rupture reste basée sur les métadonnées, pas sur un diff pixel-perfect, pour rester performant |

## 7. Synthèse des fichiers à modifier

- `src/services/timeline/changepoints.ts` (nouveau) : calcul des points de rupture.
- `src/services/export/export-multimedia.ts` : remplacement de `exportMultiEpochPDF` par `exportTimelineDrivenPDF`, réutilisation du verrou `idle`/`render`.
- `src/services/import/geojson-catalog-service.ts` : exposition de `getCatalogTemporalEntities`, conservation du bornage séquentiel strict déjà corrigé.
- `src/app/components/data/ExportPdfModal.tsx` : simplification de l'UI (instant de départ + mode simple/multiple), suppression de la sélection manuelle des époques pour le mode multiple.
- `multimedia-export.test.ts` : ajout des cas du tableau ci-dessus.

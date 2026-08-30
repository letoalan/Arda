# Module d'Exportation Multimédia & Cartographique (`export-multimedia.ts`)

## Rôle et Responsabilités
Le module `export-multimedia.ts` sert de **façade principale** unifiée pour l'ensemble des fonctionnalités de génération des livrables visuels et cartographiques haute définition :
- **Export PDF Normalisé (A4 Paysage 297 × 210 mm)** conforme aux standards géographiques et aux spécifications techniques de `exportpdf.md`.
- **Export Image JPEG HD** de la vue cartographique courante.
- **Export Timelapse ZIP** générant une suite chronophotographique compressée au fil de la réglette temporelle.

Conformément aux principes de modularité du projet, la logique est découpée en **sous-modules spécialisés (< 200 lignes chacun)** dans le répertoire [`modules/`](./modules/modules.md).

---

## 1. Architecture Modulaire

```
                              ┌──────────────────────────────────────────────┐
                              │            export-multimedia.ts              │
                              │           (Façade d'exportation)             │
                              └──────────────────────┬───────────────────────┘
                                                     │
         ┌───────────────────┬───────────────────────┼───────────────────────┬───────────────────┐
         ▼                   ▼                       ▼                       ▼                   ▼
┌─────────────────┐ ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐ ┌─────────────────┐
│  pdf-types.ts   │ │ pdf-map-capture │     │pdf-carto-element│     │pdf-page-renderer│ │pdf-atlas-gen.ts │
│ (Types, Erreurs,│ │(Capture WebGL & │     │(Échelle, Rose,  │     │(Composition A4, │ │ (Orchestrateur  │
│  Visibilités)   │ │  Synchro GPU)   │     │  Ornements)     │     │ Légende, Cadre) │ │  Livrets PDF)   │
└─────────────────┘ └─────────────────┘     └─────────────────┘     └─────────────────┘ └─────────────────┘
```

### Sous-Modules Spécialisés :
1. **[`modules/pdf-types.ts`](./modules/pdf-types.md)** : Types, interfaces (`PDFExportOptions`, `EpochExportTarget`), classe `PdfExportError` et prédicats spatio-temporels polymorphes (`isEntityVisibleAt`, `isRelationVisibleAt`).
2. **[`modules/pdf-map-capture.ts`](./modules/pdf-map-capture.md)** : Synchronisation événementielle `setData` (`updateEntitiesAndWaitForRender`), stabilisation séparée du fond (`waitForBackgroundTilesReady`), pré-chargement catalogue (`ensureEpochEntitiesLoaded`), et capture du canvas WebGL (`captureMapCanvas`, `captureSnapshotAt`).
3. **[`modules/pdf-carto-elements.ts`](./modules/pdf-carto-elements.md)** : Éléments vectoriels de précision (rose des vents, calcul dynamique de l'échelle métrique locale `metersPerPixel`, échelle graphique graduée bicolore).
4. **[`modules/pdf-page-renderer.ts`](./modules/pdf-page-renderer.md)** : Rendu unitaire d'une planche cartographique A4 (cartouche supérieur, cadrage anti-déformation *Smart Ratio*, légende structurée catégorisée, pied de page).
5. **[`modules/pdf-atlas-generator.ts`](./modules/pdf-atlas-generator.md)** : Générateurs d'atlas et de livrets complets (`exportToPDF`, `exportTimelineDrivenPDF`, `exportMultiEpochPDF` avec règle 1 époque = 1 page au point médian $T_{\text{snapshot}}$).
6. **[`modules/media-export-utils.ts`](./modules/media-export-utils.md)** : Exportations d'images haute définition (`exportToJPEG`) et archives chronophotographiques (`exportTimeLapseZIP`).

---

## 2. API et Interfaces Ré-exportées

```typescript
export interface PDFExportOptions {
  historicalPeriod?: string;
  relations?: any[];
  customTitle?: string;
  notes?: string;
  multi?: boolean;
  startTime?: number;
  maxPages?: number;
  catalogEntities?: { id: string; temporalRange: [number, number] }[];
}

export interface EpochExportTarget {
  year: number;
  label: string;
  referenceYear?: number;
  validFrom?: number;
  validTo?: number;
}

export class PdfExportError extends Error;

export async function updateEntitiesAndWaitForRender(map: any, sourceId: string, geojson: any): Promise<void>;

export async function waitForBackgroundTilesReady(map: any, maxAttempts?: number): Promise<void>;

export const waitForAllSourcesReady: typeof waitForBackgroundTilesReady;
export const waitForMapReady: typeof waitForBackgroundTilesReady;

export function isEntityVisibleAt(e: any, year: number, epochRange?: { validFrom?: number; validTo?: number }): boolean;

export function isRelationVisibleAt(r: any, year: number, epochRange?: { validFrom?: number; validTo?: number }): boolean;

export async function ensureEpochEntitiesLoaded(targetYear: number, worldStore: any): Promise<void>;

export async function captureSnapshotAt(
  targetYear: number,
  map: any,
  worldStore?: any,
  renderOptions?: any
): Promise<{ dataUrl: string; width: number; height: number }>;

export async function exportToPDF(
  worldName: string,
  year: number,
  styleConfig: StyleConfig,
  map: any,
  entities?: any[],
  relationsOrOptions?: any[] | PDFExportOptions,
  options?: PDFExportOptions
): Promise<void>;

export async function exportMultiEpochPDF(
  worldName: string,
  epochs: EpochExportTarget[],
  styleConfig: StyleConfig,
  map: any,
  setTime: (year: number) => void,
  updateMapEntities: (currentTime: number, epochTarget?: EpochExportTarget) => void,
  entities?: any[],
  relations?: any[],
  options?: PDFExportOptions,
  progressCallback?: (pct: number) => void
): Promise<void>;

export async function exportToJPEG(worldName: string, year: number, map: any, styleConfig?: StyleConfig): Promise<void>;

export async function exportTimeLapseZIP(
  worldName: string,
  map: any,
  setTime: (year: number) => void,
  startYear: number,
  endYear: number,
  stepYears: number,
  progressCallback?: (pct: number) => void
): Promise<void>;
```

---

## Fil d'Ariane
[services/](../services.md) -> [export/](./export.md) -> **export-multimedia.md**

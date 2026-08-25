# Plan d'implémentation — Intégration des fonds Géopolitica au mode Braudel

## 1. Contexte et objectif

Le mode **Braudel** dispose déjà d'un modèle d'entités temporalisées (`Entity`, `temporalRange`) géré par Zustand (`store.ts`) et rendu via MapLibre (`map-service.ts`). L'objectif est d'importer les fonds GeoJSON produits par **Géopolitica** (aires de civilisations/états sur les périodes préhistoriques et historiques) comme des `Entity` natives, avec un contrôle utilisateur fin : activation globale, sélection par fond/période, sélection par entité (pays/civilisation), et retouche géométrique post-import.

Ce document sert de plan d'implémentation technique et fonctionnel.

---

## 2. Nouveau panneau UI : « Fonds Géopolitica »

### 2.1 Emplacement
Cinquième panneau rétractable dans la barre latérale gauche, entre **Style & Fonds** et **Données & IA**. Visible uniquement en mode Braudel (masqué en mode Tolkien).

### 2.2 Hiérarchie des contrôles

| Niveau | Composant UI | Comportement |
|---|---|---|
| Global | `Toggle` "Activer les fonds historiques" (off par défaut) | Replie/déplie le reste du panneau |
| Mode | `RadioGroup` "Automatique (succession chronologique)" / "Manuel (par fond)" | Détermine le calcul des `temporalRange` |
| Par fond | `CheckboxList` des fichiers GeoJSON dont la période intersecte `[startYear, endYear]` du projet | Coche = fond candidat à l'import |
| Par entité | `Accordion` par fond coché, listant les valeurs uniques `NAME`/`SUBJECTO`, avec `SearchInput` + boutons "Tout/Aucun" | Coche = entité incluse dans l'import |
| Retouche | Boutons "Simplifier le tracé", "Fusionner avec entité existante" | Actifs après import, avant validation finale |

### 2.3 Flux utilisateur (3 étapes)

1. **Sélection des fonds** — badge indiquant le nombre de fonds compatibles avec la période du projet.
2. **Filtrage interne** — sous-liste des entités par fond, recherche textuelle, gestion des valeurs `"Unknown"` (repli sur `SUBJECTO` ou `CONTINENT`).
3. **Import et conversion** — bouton "Importer la sélection" déclenchant la conversion GeoJSON → Entity.

---

## 3. Modélisation des données

### 3.1 Type `GeopoliticaImportConfig`

```typescript
// core/schema/geopoliticaImport.ts

export type ImportMode = 'automatic' | 'manual';

export interface GeopoliticaSourceFile {
  id: string;                 // ex: "world_bc8000"
  url: string;                // chemin vers le .geojson
  referenceYear: number;      // ex: -8000, déduit du nom de fichier
  label: string;              // libellé affiché dans la liste
}

export interface GeopoliticaFeatureSelection {
  sourceId: string;           // référence à GeopoliticaSourceFile.id
  selectedNames: string[];    // valeurs NAME/SUBJECTO cochées ; ['*'] = tout
  temporalRangeOverride?: [number, number]; // utilisé en mode manuel
}

export interface GeopoliticaImportConfig {
  enabled: boolean;
  mode: ImportMode;
  targetLayerId: string;      // ex: "layer-civilisations-historiques"
  selections: GeopoliticaFeatureSelection[];
  simplifyTolerance?: number; // en degrés, pour turf.simplify
  mergeWithExisting: boolean;
}
```

### 3.2 Extension du type `Entity` existant

Aucune modification du schéma `Entity` n'est nécessaire : les polygones importés deviennent des `Entity` de `geometryType: 'polygon'` classiques, avec des métadonnées additionnelles dans `properties.sourceMeta` :

```typescript
interface GeopoliticaSourceMeta {
  originalName: string;   // NAME ou SUBJECTO
  partOf: string;         // PARTOF
  continent: string;      // CONTINENT
  borderPrecision: number;// BORDERPRECISION
  sourceFileId: string;   // GeopoliticaSourceFile.id
}
```

---

## 4. Fonction de conversion GeoJSON → Entity

```typescript
// services/import/geopoliticaImporter.ts

import { v4 as uuid } from 'uuid';
import simplify from '@turf/simplify';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import type { Entity } from '@/core/schema/types';
import type {
  GeopoliticaImportConfig,
  GeopoliticaSourceFile,
} from '@/core/schema/geopoliticaImport';

/**
 * Calcule la temporalRange automatique d'un fond en fonction
 * de son année de référence et de l'année de référence du fond suivant
 * (succession chronologique continue).
 */
function computeAutomaticRange(
  sources: GeopoliticaSourceFile[],
  currentId: string,
): [number, number] {
  const sorted = [...sources].sort((a, b) => a.referenceYear - b.referenceYear);
  const idx = sorted.findIndex((s) => s.id === currentId);
  const start = sorted[idx].referenceYear;
  const end = idx + 1 < sorted.length ? sorted[idx + 1].referenceYear : start + 1000;
  return [start, end];
}

function resolveDisplayName(props: Record<string, any>): string {
  if (props.NAME && props.NAME !== 'Unknown') return props.NAME;
  if (props.SUBJECTO && props.SUBJECTO !== 'Unknown') return props.SUBJECTO;
  if (props.CONTINENT) return `Zone non identifiée (${props.CONTINENT})`;
  return 'Entité inconnue';
}

export async function importGeopoliticaLayer(
  config: GeopoliticaImportConfig,
  availableSources: GeopoliticaSourceFile[],
  existingEntities: Entity[],
): Promise<Entity[]> {
  const newEntities: Entity[] = [];

  for (const selection of config.selections) {
    const source = availableSources.find((s) => s.id === selection.sourceId);
    if (!source) continue;

    const response = await fetch(source.url);
    const geojson: FeatureCollection<MultiPolygon | Polygon> = await response.json();

    const temporalRange =
      config.mode === 'automatic'
        ? computeAutomaticRange(availableSources, source.id)
        : selection.temporalRangeOverride ?? [source.referenceYear, source.referenceYear + 1000];

    for (const feature of geojson.features) {
      const name = resolveDisplayName(feature.properties ?? {});

      const included =
        selection.selectedNames.includes('*') || selection.selectedNames.includes(name);
      if (!included) continue;

      let geometry = feature.geometry;
      if (config.simplifyTolerance) {
        geometry = simplify(feature as Feature, {
          tolerance: config.simplifyTolerance,
          highQuality: true,
        }).geometry as typeof geometry;
      }

      const conflicting = config.mergeWithExisting
        ? existingEntities.find((e) => e.properties?.sourceMeta?.originalName === name)
        : undefined;

      const entity: Entity = {
        id: conflicting?.id ?? uuid(),
        layerId: config.targetLayerId,
        geometryType: 'polygon',
        geometry,
        temporalRange,
        style: {
          // hérite du style d'époque actif ; surchargeable ensuite dans le panneau Entités
          fillOpacity: 0.35,
          strokeWidth: 1,
        },
        properties: {
          name,
          sourceMeta: {
            originalName: name,
            partOf: feature.properties?.PARTOF ?? 'Unknown',
            continent: feature.properties?.CONTINENT ?? 'Unknown',
            borderPrecision: feature.properties?.BORDERPRECISION ?? 1,
            sourceFileId: source.id,
          },
        },
      };

      newEntities.push(entity);
    }
  }

  return newEntities;
}
```

### 4.1 Points clés de la fonction

- **Résolution des noms** : repli en cascade `NAME → SUBJECTO → CONTINENT` pour gérer les nombreuses valeurs `"Unknown"` observées dans les fonds testés.
- **Simplification optionnelle** : via `@turf/simplify`, appliquée avant stockage IndexedDB pour limiter le poids des polygones complexes.
- **Fusion** : si `mergeWithExisting` est actif, une entité déjà présente portant le même `originalName` est mise à jour plutôt que dupliquée (recherche par `sourceMeta.originalName`).
- **Style hérité** : les nouvelles entités n'imposent pas de couleur fixe ; elles héritent du style d'époque actif (`styles.config.ts`) et restent éditables comme toute entité classique.

---

## 5. Gestion de la succession chronologique automatique

Algorithme utilisé par `computeAutomaticRange` :

1. Trier tous les fonds sélectionnés par `referenceYear` croissant.
2. Pour un fond donné, sa `temporalRange` de début est son `referenceYear`.
3. Sa `temporalRange` de fin est le `referenceYear` du fond suivant (bord exclusif), créant une continuité sans chevauchement.
4. Le dernier fond de la liste reçoit une durée par défaut (ex. +1000 ans) modifiable manuellement après import.

Ce mécanisme réutilise directement le moteur de filtrage temporel déjà présent dans `TimelineView.tsx`, sans modification du composant.

---

## 6. Retouche géométrique post-import

| Action | Implémentation |
|---|---|
| Simplifier le tracé | `simplifyTolerance` appliqué via `@turf/simplify` avant création de l'`Entity` |
| Édition manuelle | Les entités importées apparaissent immédiatement dans le panneau **Entités** existant, sélectionnables et éditables (déplacement, style, suppression) |
| Fusion avec entité existante | Recherche par `sourceMeta.originalName`, remplacement de la géométrie et conservation de l'`id` existant pour préserver les relations déjà créées |
| Résolution de conflits visuels | Avertissement UI si deux entités importées se recoupent sur la même période, sans blocage (superposition volontaire possible) |

---

## 7. Ergonomie multi-support

- **PC** : panneau intégré normalement dans la sidebar 320px, accordéons dépliables sans limite de hauteur (scroll interne).
- **Mobile/tablette** : la sous-liste des entités par fond s'ouvre en modal plein écran plutôt qu'en accordéon imbriqué dans le drawer.
- **Mode Stylet (Promethean)** : cases à cocher et boutons du panneau suivent la règle globale +50% de zone cliquable et police `1.15rem`.

---

## 8. Étapes de développement suggérées

1. Créer `core/schema/geopoliticaImport.ts` (types).
2. Créer `services/import/geopoliticaImporter.ts` (fonction de conversion).
3. Ajouter un registre statique ou dynamique des `GeopoliticaSourceFile` disponibles (déduit du dossier `../../data` de Géopolitica ou d'un manifeste JSON).
4. Créer le composant `GeopoliticaPanel.tsx` (UI décrite en section 2).
5. Brancher le panneau au store Zustand : nouvelle slice `geopoliticaImportConfig` + action `runImport()` appelant `importGeopoliticaLayer`.
6. Ajouter le masquage conditionnel du panneau en mode Tolkien (`if (mode !== 'braudel') return null`).
7. Tests avec le fichier `3-world_bc8000-4.geojson` (134 features, dont une part significative en `NAME: "Unknown"`) pour valider la résolution de noms et la simplification.

---

## 9. Limites et points de vigilance

- Les fonds contenant beaucoup d'entités `"Unknown"` produiront des libellés génériques par continent ; prévoir un renommage manuel facile après import.
- Le volume de features (jusqu'à plusieurs centaines par fond) impose la simplification par défaut pour préserver les performances de rendu MapLibre.
- La cohérence entre les `referenceYear` déduits des noms de fichiers et les bornes du projet (`startYear`/`endYear`) doit être vérifiée pour éviter des fonds hors-période affichés par erreur en mode automatique.

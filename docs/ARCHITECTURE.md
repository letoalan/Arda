# Architecture Générale - ARDA / Braudel / Tolkien

## Présentation Synthétique

Le projet **Braudel / Tolkien (ARDA)** est une application Web de cartographie historique, d'analyse temporelle et de modélisation de réseaux pour mondes réels et imaginaires. 

L'architecture s'appuie sur une modularité stricte (fichiers < 200 lignes), une persistance locale dans IndexedDB, un rendu vectoriel haute performance avec MapLibre GL, et une couche d'assistance IA (Ollama & vision locale).

---

## Carte des Secteurs Principaux

| Secteur | Emplacement | Rôle Principal | Doc |
|---|---|---|---|
| **`app/state/`** | `src/app/state/` | Gestion de l'état global Zustand (mondes, entités, calques, IA) | [state.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/app/state/state.md) |
| **`app/views/`** | `src/app/views/` | Composants UI principaux, vues cartographiques et panneaux de contrôle | [views.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/app/views/views.md) |
| **`app/components/`** | `src/app/components/` | Composants UI réutilisables (modales, listes, formulaires) | [components.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/app/components/components.md) |
| **`services/`** | `src/services/` | Services techniques transverses (cartographie, persistance, import, IA) | [services.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/services/services.md) |
| **`core/`** | `src/core/` | Modèles de données, schémas Zod, algorithmes réseau & filtres | [core.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/core/core.md) |
| **`acquisition/`** | `src/acquisition/` | Vectorisation, dessin à main levée, traitement d'images | [acquisition.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/acquisition/acquisition.md) |

---

## Diagramme des Dépendances de la Documentation Wiki-as-Code

Le graphe complet d'interconnexion entre la racine, les secteurs et les fiches individuelles `.md` est disponible dans [docs/wiki-graph.mmd](wiki-graph.mmd).

```mermaid
graph TD
    README["README.md"] --> ARCH["docs/ARCHITECTURE.md"]
    README --> SRC["src/src.md"]
    SRC --> APP["src/app/app.md"]
    SRC --> SERVICES["src/services/services.md"]
    SRC --> CORE["src/core/core.md"]
    SRC --> UTILS["src/utils/utils.md"]

    APP --> STATE["src/app/state/state.md"]
    APP --> VIEWS["src/app/views/views.md"]
    APP --> COMPONENTS["src/app/components/components.md"]

    SERVICES --> CARTO["src/services/cartography/cartography.md"]
    SERVICES --> PERSIST["src/services/persistence/persistence.md"]
    SERVICES --> IMPORT["src/services/import/import.md"]
    SERVICES --> IA["src/services/ia/ia.md"]
```

---

## Diagrammes des Flux Principaux

### 1. Flux d'Importation & Normalisation GeoJSON

```mermaid
graph TD
    A["GeopoliticaPanel.tsx"] -->|"1. Sélection lot/catalogue"| B["candidateIndexer.ts"]
    B -->|"2. Extraction candidats"| C["ImportPreviewModal.tsx"]
    C -->|"3. Confirmation & Filtrage"| D["geopoliticaImporter.ts"]
    D -->|"4. Création Entités & BatchId"| E["store.ts (Zustand)"]
    E -->|"5. Persistance local DB"| F["indexeddb.ts"]
    E -->|"6. Mise à jour calque"| G["mapGeojsonRenderer.ts / MapLibre"]
```

### 2. Flux de Rendu Cartographique & Filtrage Temporel

```mermaid
graph LR
    UI["TimelineView.tsx / Slider Date"] -->|"setCurrenTime(t)"| Store["store.ts"]
    Store -->|"updateEntities()"| MapService["map-service.ts"]
    MapService -->|"buildEntitiesGeoJSON()"| Renderer["mapGeojsonRenderer.ts"]
    Renderer -->|"setData('braudel-entities')"| MapLibre["MapLibre GL Canvas"]
```

---

### 3. Architecture des Trois Modes de Projections Cartographiques

Arda / Braudel supporte trois modes de projection cartographiques indépendants et complémentaires :
1. **Web Mercator (2D Conforme, `mercator`)** : Rendu cartographique standard préservant les angles, idéal pour la navigation locale et le carroyage régulier.
2. **Globe 3D (Sphérique Orthographique, `globe`)** : Perspective sphérique interactive MapLibre native avec relief DEM Terrarium 3D et rotation libre.
3. **Eckert IV (2D Équivalent & Pseudocylindrique, `eckert4` — `ESRI:54012`)** : Planisphère pédagogique officiel préservant fidèlement les surfaces relatives continentales sans anamorphose polaire.
   - Moteur runtime : PROJ 9 WebAssembly (`backproj` / `maplibre-proj` via Dirty Reprojector) assurant un débit vectoriel > 50 000 sommets/s.
   - Moteur de build & cache : Pré-déformation statique CLI (`scripts/preproject-eckert4.ts`) et découpage en tuiles vectorielles multi-échelles (`geojson-vt`).
   - Fonctions géographiques dédiées : Calculs de distances orthodromiques Haversine, dé-projection des entités sélectionnées et positionnement des marqueurs (`eckertGeoUtils.ts`).


---

## Fil d'Ariane & Navigation

[Projet Braudel (Racine)](../README.md) -> **ARCHITECTURE.md** -> [src/ (Code Source)](../braudel/src/src.md)

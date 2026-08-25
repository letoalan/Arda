# Fonctionnement des Couches GeoJSON, Fonds Géopolitica et Catalogue Téléchargeable

Ce document détaille le fonctionnement complet des couches GeoJSON dans l'application **Braudel**, incluant la collection de fonds historiques **Géopolitica**, le **Catalogue Unifié de fonds téléchargeables**, le processus d'interaction utilisateur et les mécanismes logiciels sous-jacents (parsing, conversion en entités, persistance et rendu cartographique).

---

## 1. Description des Couches GeoJSON

L'écosystème cartographique de Braudel s'appuie sur deux types majeurs de fonds GeoJSON :

### 1.1. Fonds Géopolitica (Fonds Historiques Intégrés)
* **Définition** : Une suite chronologique de **49 fichiers GeoJSON** retraçant les frontières politiques mondiales depuis l'antiquité (-123 000 av. J.-C.) jusqu'à nos jours (2024 apr. J.-C.).
* **Fichiers source** : Stockés localement dans le répertoire `/public/data/` (ex. `1-world_bc123000.geojson`, `6-world_bc3000.geojson`, `39-world_1800.geojson`, `49-world_2024.geojson`).
* **Format & Données** : Chaque fichier GeoJSON contient des polygones représentatifs de civilisations, d'empires ou d'États avec des métadonnées associées (`NAME`, `SUBJECTO`, `CONTINENT`, `BORDERPRECISION`, `PARTOF`).
* **Registre** : Déclaré et structuré dynamiquement dans [geopoliticaRegistry.ts](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/services/import/geopoliticaRegistry.ts) via `GEOPOLITICA_SOURCES`.

### 1.2. Catalogue Unifié (Couches Téléchargeables / Distantes)
* **Définition** : Un catalogue unifié offrant des fonds de cartes téléchargeables à la demande, organisés par catégories métier.
* **Fichiers & Liens** : Reliés à des fichiers locaux ou distants via HTTPS (ex. GitHub OpenData, INSEE/Etalab, PublicaMundi).
* **Classification par Familles** (`GeojsonFamily`) :
  1. **Historique (`historical`)** : ex. Monde antique -3000 av. J.-C., Empire Romain en 100 apr. J.-C., Europe du Congrès de Vienne 1815.
  2. **Contemporain (`contemporary`)** : ex. Frontières internationales contemporaines 2024 (Natural Earth).
  3. **Administratif (`administrative`)** : ex. Régions & Départements de France (INSEE/Etalab), États fédérés américains (US Census Bureau).
  4. **Maritime & Stratégique (`maritime`)** : ex. Zones Économiques Exclusives mondiales (ZEE / VLIZ Marine Regions).
* **Registre** : Déclaré dans [geojson-catalog-service.ts](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/services/import/geojson-catalog-service.ts) via `GEOJSON_CATALOG_REGISTRY`.

---

## 2. Expérience et Sélection par l'Utilisateur

L'interface de sélection s'intègre au panneau latéral via le composant React [GeopoliticaPanel.tsx](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/app/views/GeopoliticaPanel.tsx). L'utilisateur dispose de deux modes principaux d'interaction :

### 2.1. Sélection via le Catalogue Unifié
1. **Filtrage par Famille** : L'utilisateur peut filtrer la vue en sélectionnant des onglets (`Tous`, `Historique`, `Contemporain`, `Administratif`, `Maritime`).
2. **Recherche Textuelle** : Une barre de recherche permet de filtrer en temps réel les cartes par mots-clés (nom, identifiant, source).
3. **Import en Un Clic** : Chaque carte propose un bouton d'importation. L'utilisateur peut aussi préciser des fenêtres de dates personnalisées (début et fin de validité temporelle).

### 2.2. Sélection Sélective par Période (Géopolitica)
1. **Activation temporelle** : En cochant *"Activer la sélection par période"*, l'application calcule automatiquement les fonds Géopolitica qui s'inscrivent dans la plage temporelle du projet actuel (`startYear` à `endYear`).
2. **Lancement de l'import** : L'utilisateur clique sur le bouton *"Importer les périodes sélectionnées"*. L'importation s'exécute de façon asynchrone avec affichage de la progression en pourcentage (`importProgress`).

---

## 3. Processus Programme & Architecture Logicielle

Le diagramme séquentiel et les étapes ci-dessous résument l'exécution logicielle, de l'événement utilisateur jusqu'au rendu final sur la carte.

```
[UI React: GeopoliticaPanel]
       │
       ├─► (1) Téléchargement HTTP via fetch(url)
       │
       ├─► (2) Parsing JSON & Extraction des Features
       │
       ├─► (3) Normalisation en Entités Braudel (`Entity`)
       │
       ├─► (4) Persistance dans IndexedDB (`put('entities')`)
       │
       ├─► (5) Mise à jour réactive du Store Zustand (`useStore`)
       │
       └─► (6) Rendu cartographique MapLibre GL (`addLayerToMap`)
```

### 3.1. Parsing des Fichiers et Calcul Temporel
* **Géopolitica** : Le nom du fichier (ex. `14-world_bc3000.geojson`) est parsé avec une expression régulière `/\d+-world_(bc)?(\d+)\.geojson/` pour extraire l'année de référence (`referenceYear`).
* **Calcul Automatique des Plages Temporelles** : Dans [geopoliticaImporter.ts](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/services/import/geopoliticaImporter.ts), la fonction `computeAutomaticRange` trie les sources par année et définit la fin de validité (`validTo`) d'une couche au début de la couche suivante.

### 3.2. Normalisation des Entités (`Entity`)
Chaque entité GeoJSON `Feature` est transformée en une structure d'entité normalisée Braudel :
```typescript
const entity: Entity = {
  id: crypto.randomUUID(),
  worldId: activeWorldId,
  layerId: targetLayerId,
  type: 'place',
  name: resolveDisplayName(feature.properties),
  geometry: feature.geometry,
  temporalRange: { validFrom, validTo },
  properties: {
    sourceCatalogId: entry.id,
    source: entry.source,
    license: entry.license,
    fillOpacity: 0.4,
    strokeOpacity: 0.8,
    color: '#3B82F6'
  }
};
```

### 3.3. Traitement par Lots et Fluidité de l'UI (Batching & Async)
Pour éviter le gel de l'interface lors de l'importation de fichiers volumineux (comme `49-world_2024.geojson` de ~92 Mo) :
* Dans [store.ts](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/app/state/store.ts) (`importGeopolitica`), l'insertion dans le store se fait par **paquets de 50 entités** (`batchSize = 50`).
* L'utilisation de `setTimeout(insertNextBatch, 0)` rend la main à l'événement-loop entre chaque paquet, permettant la mise à jour réactive de la barre de progression UI.

### 3.4. Persistance et Intégration Cartographique
1. **IndexedDB** : Les entités générées sont sauvegardées dans la base locale IndexedDB via la fonction `put('entities', entity)` dans [indexeddb.ts](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/services/persistence/indexeddb.ts).
2. **State Store (Zustand)** : Le tableau `world.entities` est mis à jour.
3. **Moteur Cartographique (MapLibre GL)** : Le service cartographique ([maplibre.ts](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/services/cartography/maplibre.ts)) injecte les nouvelles géométries dans la source GeoJSON `source-${layer.id}` et applique les styles visuels (couleur, opacité, traits de frontières).

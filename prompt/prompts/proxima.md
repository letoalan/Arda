# État d'avancement du Projet Braudel (MVP & IA)

## 1. État actuel du projet principal (Braudel)
Le développement de l'application `braudel` a bien progressé et respecte l'architecture locale-first demandée :
- **Lots 1 à 7 (Noyau et UI) très avancés :**
  - **Lot 1 :** Les types de domaine et les schémas de validation stricts (Zod) sont en place (` core/schema`).
  - **Lot 2 & 3 :** La logique de sérialisation et le service de persistance locale via IndexedDB sont implémentés (`services/persistence/indexeddb.ts`).
  - **Lot 4 :** Le store applicatif central est opérationnel (`app/state/store.ts`).
  - **Lot 5 :** Le moteur cartographique (MapLibre GL JS) est intégré (`services/cartography`, `app/views/MapView.tsx`).
  - **Lot 6 & 7 :** Les interfaces d'édition (couches, entités, réseaux) et les panneaux temporels sont structurés dans `app/views`.

 Le socle technique et fonctionnel pour éditer et visualiser localement un monde est donc majoritairement en place.

## 2. Lot 8 (Braudel) - ✅ TERMINÉ
 Le **Lot 8** se concentre exclusivement sur la fonctionnalité d'**Export / Import JSON canonique**.

### Fonctionnalités implémentées :

#### Export complet vers JSON canonique (`services/export/index.ts`)
- `exportFromIndexedDB()` : Récupère toutes les collections (meta, world, layers, entities, relations, timelines, styles, imports, ai, views, history)
- `exportFromStore()` : Export du store applicatif avec métadonnées d'export
- `downloadJSON()` : Déclenche le téléchargement de fichier JSON
- `exportAndDownload()` : Workflow complet export → téléchargement
- Structure canonique avec `_meta` (version, timestamp, source)

#### Import défensif (`services/import/index.ts`)
- Validation stricte Zod avec rejet systématique des données non conformes
- Parsing défensif avec gestion détaillée des erreurs
- Vérifications de cohérence (références entités/couches/relations, format UUIDs)
- Synchronisation automatique avec IndexedDB et store applicatif
- Gestion des versions obsolètes avec avertissements

#### Interface UI améliorée (`app/views/DataPanel.tsx`)
- Export en un clic avec indicateur de progression
- Import par sélection ou drag & drop
- Affichage d'erreurs détaillées
- Historique d'actions dans le store

#### Tests unitaires complets (`tests/export-import.test.ts`)
- 9 tests tous passés ✅
- Validation des exports JSON canoniques
- Rejet des imports invalides (format, structure, contenu)
- Gestion des erreurs et cas limites

## 3. Lot 9 (Braudel) - Assistant IA LOCALE ✅ TERMINÉ
 Le **Lot 9** implémente le connecteur IA locale minimal avec validation stricte des propositions :

### Livrables réalisés :
- **Schéma Zod complet pour AI** (`core/schema/ai.ts`)
  - Validation stricte sessions, propositions et réponses IA
  - Enums fermés pour tâches, types de propositions et statuts
  
- **Interfaces TypeScript enrichies** (`types/ia.ts`)
  - Interfaces complètes pour requêtes/réponses IA
  - Typage strict des propositions et sessions
  
- **Adaptateur IA remplaçable** (`services/ia/mock.ts`)
  - Architecture modulaire configurable
  - Validation intégrée avec scores de confiance
  
- **Service IA complet** (`services/ia/ai-service.ts`)
  - Workflow proposition → validation utilisateur → persistance
  - Persistance IndexedDB automatique des sessions et propositions
  - Gestion acceptation/rejet avec traçabilité
  
- **IAPanel amélioré** (`app/views/IAPanel.tsx`)
  - Interface tri-tab : Génération, Propositions, Historique
  - Visualisation confiance (barre colorée)
  - Comparaison détaillée des propositions
  - Actions acceptation/rejet avec justification
  - Historique complet des sessions
  
- **Tests de validation** (`tests/ai-validation.test.ts`)
  - Tests adapter IA et validation réponses
  - Tests workflow proposition (acceptation, rejet)
  - Tests persistance IndexedDB
  - Tests sécurité (pas d'écriture directe sans validation utilisateur)

### Architecture mise en place :
```
services/ia/
├── ai-service.ts      # Service principal avec workflow
├── mock.ts            # Adaptateur IA remplaçable
└── index.ts           # Exports centralisés
```

## 4. Éléments à développer pour le Lot 1 de `braudel_ia`
Le pipeline `ia-braudel` a pour mission de générer du JSON strict répondant à l'ontologie Braudel, sans comportement de "chatbot libre".

Le **Lot 1** correspond à la mise en place des fondations ML engineering (actuellement initié dans le dossier `ontology`). Ses attendus sont :
1. **Taxonomies fermées et fichiers ontology :** Stabiliser les listes exhaustives (déjà ébauchées dans `entity_types.json`, `relation_types.json`, etc.).
2. **Schémas JSON et validateurs :** Implémenter en Python (ex: via Pydantic) les schémas stricts garantissant l'alignement avec les modèles de Braudel.
3. **Structure de projet minimale :** Mettre en place la hiérarchie de base : `../../data`, `schemas/`, `inference/validators/`, `tests/`, etc.
*Note : Aucun fine-tuning, ni runtime d'inférence avancé, ne doit être développé dans ce lot. L'objectif est purement la définition du contrat de données et des garde-fous.*

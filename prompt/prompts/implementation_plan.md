# Implementation Plan - Wiki-as-Code Documentation System

Mettre en place la documentation technique interconnectée "Wiki-as-Code" suite à la refonte et à la modularisation du code source (< 200 lignes par fichier), en suivant la démarche de [documentation-wiki-plan.md](file:///c:/Users/alano/WebstormProjects/braudel/documentation-wiki-plan.md).

## User Review Required

> [!IMPORTANT]
> **Règle Centrale Fondamentale (Wiki-as-Code en Temps Réel)** :
> 1. Toute création d'un nouveau fichier source **doit s'accompagner de la création de son fichier `.md` miroir**.
> 2. Toute modification ou ajout dans un fichier existant **doit être immédiatement répercuté(e)** dans son fichier `.md` associé ainsi que dans la fiche parent du sous-dossier/secteur.
> 3. La règle a été formellement ajoutée dans les règles de projet `c:\Users\alano\WebstormProjects\braudel\.agents\AGENTS.md`.

> [!NOTE]
> Un document maître de vue d'ensemble est disponible dans `../../docs/ARCHITECTURE.md` et relié à la racine dans `../../README.md`.

## Open Questions

Aucune question bloquante.

## Proposed Changes

### Configuration du Projet & Règles

#### [MODIFY] [AGENTS.md](file:///c:/Users/alano/WebstormProjects/braudel/.agents/AGENTS.md)
Ajout de la contrainte projet obligatoire **Wiki-as-Code & Continuous Documentation**.

---

### Documentation Architecture & Root

#### [NEW] [ARCHITECTURE.md](file:///c:/Users/alano/WebstormProjects/braudel/docs/ARCHITECTURE.md)
Cartographie globale des secteurs applicatifs, diagrammes Mermaid des flux principaux et tableau de navigation vers les sous-secteurs.

#### [MODIFY] [README.md](file:///c:/Users/alano/WebstormProjects/braudel/README.md)
Mise à jour du point d'entrée principal avec des liens directs vers `../../docs/ARCHITECTURE.md` et les dossiers majeurs.

---

### Secteur `src/` & `src/app/`

#### [NEW] [src.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/src.md)
Documentation du répertoire racine `src/`, listant les grands sous-systèmes (`app/`, `services/`, `core/`, `acquisition/`, `utils/`).

#### [NEW] [app.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/app/app.md)
Documentation du secteur `src/app/` (Interface utilisateur & État applicatif).

---

### Secteur `src/app/state/` (Gestion d'État & Slices)

#### [NEW] [state.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/app/state/state.md)
Fiche du secteur de gestion d'état centralisé avec Zustand.

#### [NEW] [store.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/app/state/store.md)
Documentation détaillée pour `store.ts` (store principal Zustand, orchestration des slices).

#### [NEW] [worldSlice.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/app/state/slices/worldSlice.md)
Fiche technique pour les opérations sur les mondes (`createRealWorld`, `createFictionalWorld`, `duplicateWorld`).

#### [NEW] [entitySlice.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/app/state/entitySlice.md)
Documentation de la gestion du CRUD d'entités temporelles.

#### [NEW] [layerSlice.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/app/state/layerSlice.md)
Documentation de la gestion des couches thématiques.

#### [NEW] [relationSlice.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/app/state/relationSlice.md)
Documentation de la gestion des graphes et relations d'entités.

#### [NEW] [aiSlice.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/app/state/aiSlice.md)
Documentation de la gestion des propositions et sessions IA.

---

### Secteur `src/app/views/` (Vues UI & Panneaux)

#### [NEW] [views.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/app/views/views.md)
Sommaire des composants de vue principale de l'application.

#### [NEW] [MapView.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/app/views/MapView.md)
Documentation de l'intégration de la carte 2D/3D et des calques visuels.

#### [NEW] [GeopoliticaPanel.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/app/views/GeopoliticaPanel.md)
Documentation du panneau d'import et de catalogue GeoJSON.

#### [NEW] [ContinentBuilderView.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/app/views/ContinentBuilderView.md)
Documentation de l'outil de création de continents et mondes imaginaires.

#### [NEW] [IAPanel.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/app/views/IAPanel.md)
Documentation du panneau d'assistance IA et Ollama.

#### [NEW] [NetworkGraphView.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/app/views/NetworkGraphView.md)
Documentation de la visualisation de graphe de réseau historique.

---

### Secteur `src/services/` (Services Techniques)

#### [NEW] [services.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/services/services.md)
Sommaire du sous-système de services (Cartographie, Persistance, Import, Vision, IA).

#### [NEW] [cartography.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/services/cartography/cartography.md)
Fiche du module de cartographie (`map-service.ts`, `mapStylesManager.ts`, `mapDrawingService.ts`, `mapGeojsonRenderer.ts`).

#### [NEW] [persistence.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/services/persistence/persistence.md)
Fiche du module de persistance locale (`indexeddb.ts`).

#### [NEW] [import.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/services/import/import.md)
Fiche du module d'importation GeoJSON et d'indexation de candidats (`candidateIndexer.ts`, `geopoliticaImporter.ts`, `sketch-parser.ts`).

#### [NEW] [ia.md](file:///c:/Users/alano/WebstormProjects/braudel/braudel/src/services/ia/ia.md)
Fiche du module d'intégration IA (`ai-service.ts`, `ollama-client.ts`, `ollama-adapter.ts`).

---

## Verification Plan

### Automated Verification
- Exécution du build (`npm run build`) et des tests (`npm test`).
- Vérification que la documentation couvre 100% des secteurs et fichiers clés.

### Manual Verification
- Navigation interactive dans la structure de documentation.

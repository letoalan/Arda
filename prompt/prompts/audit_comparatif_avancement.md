# Audit Comparatif — État d'Avancement du Projet Braudel

Cet audit compare l'avancement actuel de l'application `braudel` par rapport aux instructions de développement d'origine réparties en 16 lots dans le répertoire `../braudel` (de `user_lot1.md` à `user_lot16.md`).

---

## 1. Tableau Synthétique d'Avancement

| Fichier Lot | Description Thématique | Statut Réel dans le Code | Justification Technique / Fichiers |
| :--- | :--- | :--- | :--- |
| **user_lot1.md** | Schémas domaine, types TS, structure | **Terminé (100%)** | Zod schemas définis dans `core/schema/` |
| **user_lot2.md** | Persistance locale IndexedDB | **Terminé (100%)** | Implémenté dans `services/persistence/` |
| **user_lot3.md** | CRUD simple entités/couches (UI) | **Terminé (100%)** | Composants `LayerPanel.tsx`, `EntityPanel.tsx` |
| **user_lot4.md** | Workflow de création, timeline | **Terminé (100%)** | `WelcomeScreen.tsx`, timelines dans Zustand |
| **user_lot5.md** | Placement de points MapLibre, CRUD carte | **Terminé (100%)** | `MapService` avec MapboxDraw et intégration store |
| **user_lot6.md** | Assistant IA Locale (Mock + Ollama) | **Terminé (100%)** | `services/ia/` (adaptateurs mock et client Ollama) |
| **user_lot7.md** | Qualité globale, documentation, CI | **Terminé (100%)** | CI active, tests Jest/Vitest à 84/84 passes |
| **user_lot8.md** | Export/Import JSON canonique | **Terminé (100%)** | `services/export/`, `services/import/` et tests associés |
| **user_lot9.md** | Routage multi-mondes, IndexedDB avancé | **Terminé (100%)** | Intégration `react-router-dom`, cascades IndexedDB |
| **user_lot10.md** | Filtres de réseaux (temporels, poids, type) | **Terminé (100%)** | Implémenté dans `NetworkPanel.tsx` & Ego-Graph |
| **user_lot11.md** | Timelines avancées et pivots (V2) | **Terminé (100%)** | Timelines, granularité dans `TimePanel.tsx` |
| **user_lot12.md** | Imports complexes et pipelines GeoJSON | **Terminé (100%)** | Pipeline d'import avec statuts, imports registry |
| **user_lot13.md** | Rendu de styles avancés (sans WebGL) | **Terminé (100%)** | Presets étendu, configuration centralisée |
| **user_lot14.md** | Croquis d'image vers entités géométriques | **Restant (0%)** | Non implémenté dans le code courant |
| **user_lot15.md** | Connecteur WebGL optionnel | **Restant (0%)** | Non implémenté dans le code courant |
| **user_lot16.md** | Exportation multimédia (PDF, JPEG, HTML) | **Restant (0%)** | Non implémenté dans le code courant |

---

## 2. Analyse Détaillée par Lot restant

### Lot 14 : Croquis vers Structure (user_lot14.md)
*   **Objectif** : Interpréter des croquis dessinés à la main ou des images géoréférencées pour générer des propositions géométriques structurées (polygones, points, lignes) via l'assistant IA local, avec un panneau de revue et de validation utilisateur.
*   **Reste à faire** :
    1. Implémenter un service de traitement d'images (ou un mock de vision locale) pour extraire des coordonnées à partir d'un croquis.
    2. Ajouter un composant d'import d'images de croquis dans `ImportPanel.tsx`.
    3. Mettre en place l'UI de revue de ces propositions (superposées sur la carte sous forme de calques temporaires) avant validation définitive par l'utilisateur.

### Lot 15 : Connecteur WebGL Optionnel & Publication Immersive (user_lot15.md)
*   **Objectif** : Découpler le moteur cartographique pour permettre des effets WebGL immersifs de manière optionnelle via une interface abstraite, et ajouter des modules d'analyse spatio-temporelle avancés (calculs de densités, zones tampon, etc.) sans polluer le moteur principal.
*   **Reste à faire** :
    1. Créer une interface abstraite `IMapConnector` isolant les opérations basiques de carte (setStyle, setCenter, addSource, addLayer) des appels directs à MapLibre.
    2. Implémenter le connecteur MapLibre sous forme de module interchangeable.

### Lot 16 : Exportation Multimédia & Publication (user_lot16.md)
*   **Objectif** : Exporter et publier le contenu cartographique de manière autonome et locale-first.
*   **Reste à faire** :
    1. Implémenter l'export PDF (incluant la légende, le titre et l'échelle).
    2. Implémenter l'export JPEG à date unique et l'export en lot de séries chronologiques de JPEGs compressées en ZIP.
    3. Développer l'export HTML autonome interactif contenant la carte MapLibre et les données du monde embarquées pour une diffusion web directe.
    4. Ajouter l'interface d'export dans le panneau de données (`DataPanel`).

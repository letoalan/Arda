# Audit d'Avancement — Pipeline IA Braudel (`ia-braudel`)

Ce rapport réalise l'audit des fichiers et lots de conception définis dans [prompt/braudel_ia](file:///c:/Users/alano/WebstormProjects/braudel/prompt/braudel_ia/) par rapport à l'état actuel de l'implémentation dans le répertoire [`../../ia-braudel`](file:///c:/Users/alano/WebstormProjects/braudel/ia-braudel/).

---

## 1. Tableau Synthétique d'Avancement des Lots (IA Braudel)

| Fichier Lot | Objectif Thématique | Statut Réel | Éléments Présents / Manquants |
| :--- | :--- | :--- | :--- |
| **[user_lot1.md](file:///c:/Users/alano/WebstormProjects/braudel/prompt/braudel_ia/user_lot1.md)** | Structure initiale & Taxonomies fermées | **Partiel (50%)** | **Présents :** `ontology/` avec les types fermés (`entity_types.json`, `relation_types.json`, etc.) et `constants.py`. <br>**Manquants :** Arborescence complète (`schemas/`, `inference/`, etc.), tests de cohérence. |
| **[user_lot2.md](file:///c:/Users/alano/WebstormProjects/braudel/prompt/braudel_ia/user_lot2.md)** | Enveloppe commune & Sous-schémas strict par tâche | **Non démarré (0%)**| Aucun schéma de validation pour les tâches (`world_seed`, `entity_suggestions`, etc.) n'est défini. |
| **[user_lot3.md](file:///c:/Users/alano/WebstormProjects/braudel/prompt/braudel_ia/user_lot3.md)** | Validateurs Runtime (Structure & Métier) | **Non démarré (0%)**| Manque les validateurs de structure et de cohérence métier (Braudel/ANT). |
| **[user_lot4.md](file:///c:/Users/alano/WebstormProjects/braudel/prompt/braudel_ia/user_lot4.md)** | Moteur de réparation JSON locale défensif | **Non démarré (0%)**| Aucun parseur défensif ni logique de réparation. |
| **[user_lot5.md](file:///c:/Users/alano/WebstormProjects/braudel/prompt/braudel_ia/user_lot5.md)** | Gabarits de prompts et exemples (FR/EN) | **Non démarré (0%)**| Pas de templates de prompts structurés pour les tâches autorisées. |
| **[user_lot6.md](file:///c:/Users/alano/WebstormProjects/braudel/prompt/braudel_ia/user_lot6.md)** | Préparation du dataset (`prepare.py`, `build_dataset.py`)| **Non démarré (0%)**| Manque les pipelines de normalisation, déduplication et les répertoires `../../data`. |
| **[user_lot7.md](file:///c:/Users/alano/WebstormProjects/braudel/prompt/braudel_ia/user_lot7.md)** | Enrichissement du dataset (Cas complexes/adversariaux) | **Non démarré (0%)**| Pas d'exemples de refus ou d'ambiguïtés formalisés. |
| **[user_lot8.md](file:///c:/Users/alano/WebstormProjects/braudel/prompt/braudel_ia/user_lot8.md)** | Runtime local & Adaptateurs backend | **Non démarré (0%)**| Pas d'interface runtime Python locale pour exécuter des complétions. |
| **[user_lot9.md](file:///c:/Users/alano/WebstormProjects/braudel/prompt/braudel_ia/user_lot9.md)** | Module d'évaluation (`metrics.py`) | **Non démarré (0%)**| Aucune suite d'évaluation ou métrique automatisée. |
| **[user_lot10.md](file:///c:/Users/alano/WebstormProjects/braudel/prompt/braudel_ia/user_lot10.md)** | Script d'entraînement LoRA/QLoRA (`train_lora.py`)| **Non démarré (0%)**| Pas de scripts d'entraînement. |
| **[user_lot11.md](file:///c:/Users/alano/WebstormProjects/braudel/prompt/braudel_ia/user_lot11.md)** | Quantization & Model Card (`model_card.md`)| **Non démarré (0%)**| Pas de documentation d'export / quantization locale. |
| **[user_lot12.md](file:///c:/Users/alano/WebstormProjects/braudel/prompt/braudel_ia/user_lot12.md)** | Final integration avec Braudel App, contrat `IARequest` / `IAResponse` | **Non démarré (0%)**| Pas d'adaptateur d'intégration final ni de suite de tests. |

---

## 2. Analyse Détaillée de l'Existant (Lot 1)

Le répertoire [`../../ia-braudel/ontology`](file:///c:/Users/alano/WebstormProjects/braudel/ia-braudel/ontology/) contient les éléments suivants :

1. **`constants.py`** : Définit `SCHEMA_VERSION`, `CANONICAL_ROOTS` et expose un helper pour charger les JSON.
2. **`entity_types.json`** : Contient la liste restreinte `["place", "event", "actor", "concept"]`.
3. **`relation_types.json`** : Contient les relations fermées (`part_of`, `causes`, `ally`, `enemy`, `flows_to`, `influenced_by`, `located_in`).
4. **`timeline_types.json`** : Types temporels (`epoch`, `period`, `moment`).
5. **`style_types.json`** : Types de styles cartographiques (`relief`, `network`, `heatmap`, `choropleth`).
6. **`operation_types.json`** : Types d'opérations d'édition (`addEntity`, `addRelation`, `addLayer`, `updateEntity`, `updateRelation`, `updateStyle`).

### Manques pour finaliser le Lot 1 :
* L'arborescence complète n'est pas encore créée au niveau de `../../ia-braudel` (manque `schemas/`, `prompts/`, `training/`, `inference/`, `evaluation/`, `tests/`, etc.).
* Aucun script de test de cohérence initial (pour vérifier que les fichiers JSON d'ontologie sont correctement formés et chargés dans `constants.py`) n'a été implémenté.

---

## 3. Plan d'Action Recommandé

Pour lancer l'implémentation de la partie IA Braudel en respectant la méthode agile par lots :

1. **Étape 1 : Finaliser le Lot 1**
   - Créer l'arborescence des dossiers requis dans `../../ia-braudel`.
   - Créer un script de test unitaire rapide en Python (`tests/test_ontology.py`) pour valider le chargement et la cohérence de base de l'ontologie.
   
2. **Étape 2 : Lancer le Lot 2 (Schémas stricts)**
   - Définir les schémas JSON (avec `jsonschema` ou `pydantic` en Python) pour l'enveloppe commune et pour chaque tâche spécifique (`world_seed`, `entity_suggestions`, etc.).

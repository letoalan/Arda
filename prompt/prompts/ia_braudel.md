# IA Braudel — retour optimisé pour Qwen 3.5 Coder 80B via OpenCode

## 1. Diagnostic rapide

Le prolego-cont IA est intellectuellement cohérent et bien calibré sur la finalité du modèle local : transformer des instructions naturelles en sorties JSON alignées sur l'ontologie Braudel/ANT/cartographie.

Comme document de conception, il est solide. Comme contrat d'exécution pour un grand code model chargé de construire le pipeline d'entraînement, d'inférence et d'évaluation dans OpenCode, il reste toutefois trop descriptif et pas assez opératoire.

Le principal risque n'est pas l'absence d'idées, mais la dilution des priorités : le texte décrit les tâches du modèle, le corpus, le pipeline, la structure de projet, l'API locale, les critères d'évaluation et les garde-fous, sans forcer assez clairement l'ordre de réalisation, les artefacts attendus, les métriques minimales et les points de blocage.

## 2. Forces du prompt source

- Très bonne définition de mission : spécialisation locale, JSON strict, pas de prose libre.
- Les tâches cibles sont bien identifiées et couvrent le besoin produit.
- L'ontologie Braudel / ANT est explicite et utile.
- Les garde-fous sont pertinents : validation, listes fermées, refus hors domaine, pas d'appel distant.
- La structure de projet proposée est déjà exploitable.

## 3. Faiblesses principales

### A. Confusion entre trois objets différents
Le document mélange :
- la spécification du comportement du futur petit modèle ;
- la feuille de route d'entraînement ;
- le contrat de développement logiciel pour construire le pipeline.

Or Qwen 3.5 Coder 80B, dans OpenCode, travaille mieux si ces trois niveaux sont séparés.

### B. Sous-spécification des livrables techniques
Le texte dit qu'il faut un corpus builder, un ontology builder, du fine-tuning, de la quantization et de l'évaluation, mais il ne définit pas assez :
- les scripts prioritaires ;
- les entrées/sorties exactes par script ;
- les formats attendus ;
- les jeux d'essai minimaux ;
- les seuils d'acceptation.

### C. Schéma JSON encore trop générique
La structure de base `task/confidence/items/warnings` est bonne, mais insuffisante seule pour piloter un modèle spécialisé. Selon les tâches, le contenu de `items` devrait être discriminé par sous-schémas stricts, sinon le modèle d'implémentation risque de produire des validateurs trop lâches.

### D. Données d'entraînement insuffisamment contraintes
Le document évoque corpus brut, curé, synthétique et eval, mais il ne fixe pas :
- la politique de proportion synthétique / expert / augmentation ;
- les formes d'ambiguïté à injecter ;
- les cas négatifs ;
- les exemples de refus ;
- les exemples de JSON cassé à réparer ;
- la séparation stricte train / eval / adversarial.

### E. Évaluation trop conceptuelle
Les critères d'évaluation sont justes, mais pas encore traduits en protocole concret. Un code model a besoin de savoir quelles métriques coder et quels seuils calculer, sinon il produit facilement une évaluation décorative.

## 4. Ce qu'il faut ajouter pour OpenCode

### A. Un ordre de build obligatoire
1. Définir l'ontologie et les schémas.
2. Définir les sous-schémas par tâche.
3. Construire les validateurs et le moteur de réparation.
4. Construire les scripts de dataset.
5. Construire les scénarios d'évaluation.
6. Construire le runtime d'inférence.
7. Brancher ensuite l'entraînement et l'export.

### B. Des critères d'acceptation mesurables
Par exemple :
- taux de JSON valide ;
- taux de conformité au sous-schéma de tâche ;
- taux de types hors taxonomie ;
- taux de refus corrects ;
- score de cohérence couche Braudel ;
- score de distinction acteur / actant.

### C. Un mode de réponse OpenCode strict
Le modèle doit répondre par lots avec :
- plan ;
- fichiers ;
- code ;
- checks ;
- next.

### D. Un périmètre MVP de pipeline
Le MVP ne doit pas chercher à résoudre immédiatement toute la science du fine-tuning. Il doit d'abord produire un pipeline fiable de schémas, validation, dataset, évaluation et runtime local défensif.

## 5. Prompt réécrit recommandé

```md
# SYSTEM — IA Braudel / pipeline local / Qwen 3.5 Coder 80B / OpenCode

Tu es un agent de développement ML engineering et software engineering senior spécialisé en Python, structuration de datasets, validation JSON, pipelines d'inférence locale et fine-tuning léger de modèles open-weight.

Ta mission est de construire le pipeline MVP du modèle local IA Braudel.
Le but n'est pas de créer un chatbot généraliste, mais un système spécialisé qui transforme des instructions naturelles en JSON strict compatible avec l'ontologie Braudel.

## 1. Mission du système

Le système cible doit permettre :
- de préparer un corpus d'entraînement ;
- de définir et valider une ontologie métier fermée ;
- d'entraîner ou préparer un fine-tuning léger ;
- d'exécuter une inférence locale ;
- de réparer défensivement certaines sorties JSON ;
- d'évaluer automatiquement la validité structurelle et la cohérence métier.

## 2. Règles absolues

- Aucun service distant obligatoire.
- Aucune dépendance à une API propriétaire.
- Toutes les sorties du runtime doivent être JSON-validables.
- Le système doit rester compatible avec une exécution locale sur machine modeste.
- Le domaine est limité à Braudel / ANT / cartographie analytique.
- Le système doit refuser explicitement les demandes hors domaine.
- Ne pas construire de chatbot conversationnel libre.
- Ne pas produire de prose en sortie principale du runtime.

## 3. Périmètre MVP

Le MVP doit couvrir uniquement :
1. définition des taxonomies ;
2. sous-schémas JSON par tâche ;
3. validateurs ;
4. moteur de réparation locale simple ;
5. générateur / normalisateur de dataset ;
6. scénarios d'évaluation ;
7. runtime d'inférence local avec post-traitement défensif ;
8. documentation minimale d'entraînement et d'export.

Reporter hors MVP :
- optimisation avancée des performances GPU ;
- multi-modèle complexe ;
- croquis visuel avancé ;
- adaptation multilingue étendue au-delà du français et de l'anglais ;
- recherche automatique d'hyperparamètres.

## 4. Tâches supportées

Les tâches autorisées sont :
- world_seed
- entity_suggestions
- relation_suggestions
- timeline_suggestions
- style_suggestions
- import_interpretation
- edit_operations

Aucune autre tâche ne doit être acceptée sans extension explicite du schéma.

## 5. Exigences de schéma

Toute réponse runtime doit respecter une enveloppe commune :
```json
{
  "task": "string",
  "confidence": 0.0,
  "items": [],
  "warnings": []
}
```

Mais tu dois aussi définir des sous-schémas stricts par tâche pour `items`.
Exemples :
- `entity_suggestions.items[]` = entité valide avec type fermé, label, layer, propriétés ;
- `relation_suggestions.items[]` = relation valide avec source, target, type, networkKind, oriented ;
- `edit_operations.items[]` = opération atomique avec nom d'opération fermé et payload validé.

Ne jamais te contenter d'un schéma `object[]` vague.

## 6. Ontologie métier obligatoire

Tu dois encoder explicitement :
- couches Braudel : géophysique, géohistoire, géopolitique ;
- distinctions longue durée / conjoncture / événement ;
- distinction acteur / actant ;
- réseaux monotype / bitype ;
- taxonomies fermées pour types d'entités, relations, styles et opérations.

## 7. Structure de projet cible

ia-braudel/
  data/
    raw/
    curated/
    synthetic/
    eval/
  ontology/
  schemas/
  prompts/
  training/
  inference/
    validators/
    runtime/
    repair/
  evaluation/
  docs/
  tests/

Tu peux ajuster l'arborescence si tu améliores clairement la séparation des responsabilités.

## 8. Ordre obligatoire de construction

1. taxonomies fermées et fichiers ontology ;
2. schémas JSON et validateurs ;
3. sous-schémas par tâche ;
4. règles de réparation ;
5. scripts de préparation de dataset ;
6. cas d'évaluation ;
7. runtime local ;
8. scripts de fine-tuning / export documentés.

## 9. Invariants

Tu dois garantir :
- aucune tâche hors liste fermée ;
- aucun type d'entité hors taxonomie ;
- aucune sortie non parseable n'est acceptée comme valide ;
- tout exemple de dataset est validable avant écriture ;
- l'évaluation sépare clairement validité structurelle et cohérence métier ;
- les refus hors domaine suivent un format JSON contrôlé.

## 10. Évaluation minimale obligatoire

Implémente au minimum des métriques pour :
- parseabilité JSON ;
- conformité au schéma de tâche ;
- taux de types inconnus ;
- cohérence couche Braudel ;
- distinction acteur / actant ;
- exactitude des opérations atomiques ;
- robustesse sur ambiguïtés ;
- refus corrects hors domaine.

Définis des fixtures de test simples pour chaque métrique.

## 11. Runtime local

Le runtime doit :
- prendre `task`, `instruction`, `context` ;
- appeler un backend local remplaçable ;
- parser la sortie brute ;
- tenter une réparation locale limitée ;
- revalider ;
- retourner un JSON final ou un refus structuré.

Aucune prose libre ne doit sortir du runtime final.

## 12. Contraintes OpenCode

À chaque réponse :
- commence par `PLAN` ;
- liste `FILES` ;
- fournis `CODE` seulement pour le lot courant ;
- ajoute `CHECKS` avec ce qui est testable immédiatement ;
- termine par `NEXT`.

Ne génère pas tout le dépôt d'un seul coup.
Travaille par lots cohérents et vérifiables.

## 13. Règles de code

- Python explicite et modulaire.
- Typage quand utile.
- Fonctions courtes.
- Zéro logique métier cachée dans des scripts fourre-tout.
- Données de test séparées du code.
- Validation systématique avant persistance.
- Dépendances minimales.

## 14. Définition de done MVP

Le MVP est terminé si :
- les taxonomies et schémas existent ;
- un dataset minimal peut être préparé et validé ;
- un runtime local peut recevoir une requête et renvoyer un JSON conforme ou un refus structuré ;
- une suite d'évaluation simple mesure la qualité structurelle et métier ;
- la documentation permet de lancer préparation, évaluation et export sans ambiguïté.

## 15. Format de sortie requis

Toujours répondre dans cet ordre :
- PLAN
- FILES
- CODE
- CHECKS
- NEXT

Si une information manque, pose au maximum 3 questions bloquantes ; sinon prends l'option la plus simple compatible avec le MVP et explicite-la.
```

## 6. Recommandations d'usage

### Prompt système
Utiliser le bloc ci-dessus comme instruction système principale pour piloter Qwen 3.5 Coder 80B dans OpenCode.

### Prompt de démarrage
Ajouter ensuite une instruction courte du type :

```md
Construis le MVP du pipeline IA Braudel en respectant strictement le contrat système.
Commence par le lot 1 : taxonomies fermées, schémas JSON, validateurs et structure de projet minimale.
Ne génère pas encore le fine-tuning complet ni les optimisations avancées.
```

### Boucle de travail recommandée
- un lot = un artefact testable ;
- validation avant lot suivant ;
- corrections locales sans régénération globale ;
- extension aux scripts d'entraînement seulement après stabilisation du runtime et des schémas.

## 7. Retour ciblé final

Le prolego-cont IA est très bon comme document de doctrine de spécialisation du modèle, mais il n'est pas encore assez coercitif pour guider un code model dans la construction effective d'un pipeline ML fiable.

Pour Qwen 3.5 Coder 80B dans OpenCode, le gain principal vient d'une transformation du document en contrat d'orchestration : lots de build, sous-schémas stricts, métriques minimales, refus structurés, périmètre MVP dur et format de réponse imposé.

En bref : il faut moins de description générale du modèle cible, et davantage d'instructions sur ce que l'agent doit coder d'abord, comment il doit le valider, et quand il doit s'arrêter.

Construis le lot 8 du MVP Braudel.

Objectif :
- implémenter `IAPanel` en version minimale ;
- brancher le connecteur IA local mock ou remplaçable ;
- supporter les tâches de base prévues par l’API locale ;
- afficher proposition, comparaison, acceptation, rejet et fusion ;
- empêcher toute écriture directe sans validation utilisateur.

Contraintes :
- aucune API distante ;
- parsing défensif ;
- validation stricte des réponses ;
- journalisation de toutes les propositions ;
- refus ou réparation locale si sortie invalide.

Livrables attendus :
- `IAPanel` minimal ;
- adaptateur IA remplaçable ;
- workflow proposition → validation utilisateur → persistance ;
- stockage des sessions IA dans `ai` ;
- tests de validation des sorties IA.

Réponds strictement :
PLAN
FILES
CODE
CHECKS
NEXT
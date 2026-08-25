Construis le lot 8 du pipeline IA Braudel.

Objectif :
- implémenter un runtime local minimal ;
- définir un backend local remplaçable ;
- accepter `task`, `instruction`, `context` ;
- parser la sortie brute ;
- appliquer validation et réparation avant retour final.

Contraintes :
- aucune API distante ;
- aucune prose libre en sortie finale ;
- refus structuré si échec ou hors domaine ;
- conserver un adaptateur simple à remplacer ;
- ne pas coupler le runtime au fine-tuning.

Livrables attendus :
- interface du runtime ;
- adaptateur backend local ;
- pipeline d’inférence défensif ;
- structure de refus JSON ;
- tests de bout en bout sur quelques tâches ;
- documentation courte d’usage local.

Réponds strictement :
PLAN
FILES
CODE
CHECKS
NEXT
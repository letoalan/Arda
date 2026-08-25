Construis le lot 15 du projet Braudel, dernière phase V3.

Objectif :
- ajouter le connecteur WebGL optionnel derrière une interface abstraite ;
- préparer la publication immersive ;
- ajouter une première couche d’analyses avancées sans polluer le moteur principal ;
- finaliser les migrations, garde-fous et tests finaux ;
- garantir que le cœur reste fonctionnel sans le connecteur optionnel.

Contraintes :
- le connecteur doit être entièrement optionnel ;
- aucun couplage fort avec le moteur principal ;
- ne pas casser le rendu de base MapLibre ;
- ne pas introduire de dépendance obligatoire au mode immersif ;
- conserver l’extensibilité sans refactoring massif.

Livrables attendus :
- interface abstraite pour WebGL ;
- branchement optionnel ;
- premiers modules d’analyse avancée isolés ;
- suite finale de tests et de validation ;
- état final documenté du projet.

Réponds strictement :
PLAN
FILES
CODE
CHECKS
NEXT
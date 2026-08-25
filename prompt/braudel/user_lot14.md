Construis le lot 14 du projet Braudel.

Objectif :
- implémenter le flux “croquis vers structure” en appuyant le connecteur IA local ;
- permettre l’interprétation d’un croquis ou d’une image géoréférencée en propositions structurées ;
- intégrer cela à `ImportPanel` et `IAPanel` ;
- conserver un workflow de validation utilisateur avant persistance ;
- préparer un pipeline clair entre image, interprétation et entités/propositions.

Contraintes :
- pas d’écriture directe ;
- parsing défensif des propositions ;
- journalisation complète ;
- rester compatible avec le schéma `imports` et `ai` ;
- ne pas traiter cela comme une génération libre.

Livrables attendus :
- flux d’interprétation de croquis ;
- UI minimale de revue des propositions ;
- fusion contrôlée dans le monde courant ;
- règles de validation ;
- tests sur refus, acceptation et fusion.

Réponds strictement :
PLAN
FILES
CODE
CHECKS
NEXT
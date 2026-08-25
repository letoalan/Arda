Construis le lot 4 du pipeline IA Braudel.

Objectif :
- créer le moteur de réparation locale simple ;
- gérer les erreurs JSON courantes ;
- réparer certains champs manquants ou mal typés ;
- revalider systématiquement après réparation ;
- refuser proprement les sorties irréparables.

Contraintes :
- réparation limitée et explicable ;
- pas de correction silencieuse risquée ;
- journaliser les réparations ;
- ne jamais inventer un type hors taxonomie ;
- ne pas transformer le moteur de réparation en génération libre.

Livrables attendus :
- règles de réparation ;
- module de parsing défensif ;
- pipeline parse → repair → revalidate ;
- exemples minimaux de JSON cassé ;
- tests sur réussite et échec de réparation.

Réponds strictement :
PLAN
FILES
CODE
CHECKS
NEXT
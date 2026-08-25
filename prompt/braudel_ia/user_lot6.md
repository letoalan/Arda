Construis le lot 6 du pipeline IA Braudel.

Objectif :
- implémenter la préparation du dataset ;
- créer les scripts de nettoyage, normalisation, déduplication et annotation ;
- organiser `raw`, `curated`, `synthetic` et `eval` ;
- valider tous les exemples avant écriture ;
- distinguer clairement train, eval et cas adversariaux.

Contraintes :
- ne pas mélanger données brutes et curées ;
- validation obligatoire de chaque exemple ;
- préserver les champs instruction, context et response ;
- ne pas perdre les métadonnées utiles ;
- code reproductible.

Livrables attendus :
- `prepare.py` ;
- `build_dataset.py` ;
- formats d’entrée et sortie documentés ;
- pipeline de nettoyage ;
- pipeline de déduplication ;
- dataset minimal validé ;
- tests de validation du dataset.

Réponds strictement :
PLAN
FILES
CODE
CHECKS
NEXT
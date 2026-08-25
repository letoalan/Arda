Construis le lot 2 du pipeline IA Braudel.

Objectif :
- définir l’enveloppe JSON commune de sortie ;
- créer les sous-schémas stricts par tâche ;
- éviter tout `items: object[]` non spécialisé ;
- formaliser les invariants minimaux de validation ;
- préparer les schémas pour l’inférence et l’évaluation.

Contraintes :
- sortie finale toujours JSON valide ;
- `task` obligatoire ;
- `confidence` entre 0 et 1 ;
- `items` typé selon la tâche ;
- aucun champ non prévu sans extension contrôlée.

Livrables attendus :
- schéma commun de sortie ;
- sous-schémas pour `world_seed` ;
- sous-schémas pour `entity_suggestions` ;
- sous-schémas pour `relation_suggestions` ;
- sous-schémas pour `timeline_suggestions` ;
- sous-schémas pour `style_suggestions` ;
- sous-schémas pour `import_interpretation` ;
- sous-schémas pour `edit_operations` ;
- tests de conformité.

Réponds strictement :
PLAN
FILES
CODE
CHECKS
NEXT
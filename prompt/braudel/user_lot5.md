Construis le lot 5 du MVP Braudel.

Objectif :
- implémenter `TimePanel` en version simple ;
- ajouter un time slider minimal ;
- permettre le filtrage temporel des couches, entités et relations ;
- intégrer les bornes temporelles de base ;
- relier le contrôle temporel au rendu cartographique.

Contraintes :
- rester sur une temporalité simple de V1 ;
- ne pas implémenter encore les agrégations avancées ;
- garder les règles temporelles explicites et testables ;
- pas de raccourcis non validés sur les bornes ;
- conserver le découplage entre domaine, UI et carte.

Livrables attendus :
- `TimePanel` simple ;
- time slider fonctionnel ;
- filtres temporels branchés à la carte ;
- tests de comportement du filtre temporel ;
- vérification de cohérence sur `validFrom`, `validTo` et `temporalRange`.

Réponds strictement :
PLAN
FILES
CODE
CHECKS
NEXT
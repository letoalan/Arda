Construis le lot 6 du MVP Braudel.

Objectif :
- implémenter le relief minimal ;
- brancher `raster-dem`, `hillshade` et `color-relief` au moteur cartographique ;
- créer une première version de `StylePanel` ;
- permettre l’édition simple des styles de relief ;
- préparer des presets de base compatibles avec le schéma canonique.

Contraintes :
- rester dans les couches prévues par le document maître ;
- pas de styles artistiques avancés à ce stade ;
- ne pas casser le découplage avec un futur connecteur WebGL ;
- validation des styles avant persistance ;
- garder un rendu lisible et éditable.

Livrables attendus :
- service `relief` minimal ;
- intégration `hillshade` et `color-relief` ;
- édition simple des styles ;
- presets de base ;
- tests de non-régression sur les styles.

Réponds strictement :
PLAN
FILES
CODE
CHECKS
NEXT
Construis le lot 12 du projet Braudel.

Objectif :
- implémenter l’import réel enrichi ;
- prendre en charge un pipeline de tuiles avec étape secondaire vers GeoJSON ;
- améliorer `ImportPanel` ;
- stocker les métadonnées d’import, statuts et transformations ;
- garder une séparation claire entre import brut, traitement et conversion.

Contraintes :
- rester local-first ;
- ne pas dépendre d’un backend distant ;
- journaliser toutes les transformations ;
- respecter `imports[]` du schéma canonique ;
- ne pas produire de géométries finales sans validation.

Livrables attendus :
- pipeline d’import enrichi ;
- statut `raw / processed / converted` ;
- structure de transformation traçable ;
- UI simple de suivi d’import ;
- tests sur cohérence des imports.

Réponds strictement :
PLAN
FILES
CODE
CHECKS
NEXT
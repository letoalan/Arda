Construis le lot 7 du MVP Braudel.

Objectif :
- implémenter `ImportPanel` et `ExportPanel` en version MVP ;
- permettre l’export JSON canonique complet ;
- permettre la réimportation sans perte structurelle ;
- ajouter un import minimal de données simples ;
- journaliser les opérations d’import et d’export.

Contraintes :
- pas d’import réel enrichi à ce stade ;
- pas de dépendance serveur ;
- validation stricte avant import ;
- migration et version de schéma respectées ;
- garder l’export autoportant et réversible.

Livrables attendus :
- UI simple d’import/export ;
- sérialisation complète ;
- réimport contrôlé ;
- gestion de `meta.schemaVersion` ;
- tests export/import sans perte structurelle.

Réponds strictement :
PLAN
FILES
CODE
CHECKS
NEXT
Construis le lot 10 du pipeline IA Braudel.

Objectif :
- préparer le fine-tuning léger ;
- structurer le script d’entraînement LoRA ou QLoRA ;
- brancher les datasets préparés ;
- documenter les paramètres essentiels ;
- garder comme priorité la qualité de structure JSON.

Contraintes :
- rester compatible avec une exécution locale réaliste ;
- ne pas dépendre d’un cluster distant ;
- ne pas sur-ingénier l’entraînement ;
- garder la traçabilité des datasets et versions ;
- ne pas mêler entraînement et runtime.

Livrables attendus :
- `train_lora.py` ;
- configuration minimale d’entraînement ;
- chargement du dataset ;
- checkpoints ou conventions de sortie ;
- documentation des hyperparamètres essentiels ;
- hooks simples d’évaluation post-entraînement.

Réponds strictement :
PLAN
FILES
CODE
CHECKS
NEXT
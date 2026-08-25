import os
import json
import sys

# Add parent directory of training/ (which is ia-braudel/) to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from schemas.validation import validate_response, ValidationError
from inference.validators.business_validator import validate_business_rules

# Directories to create
DATA_DIRS = [
    "data/raw",
    "data/curated",
    "data/synthetic",
    "data/eval"
]

# Ensure data directories exist
base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
for d in DATA_DIRS:
    os.makedirs(os.path.join(base_dir, d), exist_ok=True)

# Dataset examples to build
RAW_EXAMPLES = [
    # 1. World Seed
    {
        "instruction": "Initialise un monde sur la Révolution française",
        "context": {},
        "response": {
            "task": "world_seed",
            "confidence": 0.95,
            "items": [
                {
                    "name": "Révolution Française",
                    "description": "Période de bouleversements sociaux et politiques majeurs en France de 1789 à 1799.",
                    "worldType": "real",
                    "basemapStyle": "modern",
                    "startYear": 1789,
                    "endYear": 1799
                }
            ],
            "warnings": []
        }
    },
    # 2. Entity suggestions
    {
        "instruction": "Suggère des entités pour la bataille de Waterloo en 1815",
        "context": {},
        "response": {
            "task": "entity_suggestions",
            "confidence": 0.98,
            "items": [
                {
                    "name": "Waterloo",
                    "type": "place",
                    "layer": "historical",
                    "description": "Plaine de la bataille décisive.",
                    "geometry": {"type": "Point", "coordinates": [4.4031, 50.6872]},
                    "temporalRange": {"validFrom": 1815, "validTo": 1815}
                },
                {
                    "name": "Napoléon Ier",
                    "type": "actor",
                    "layer": "political",
                    "description": "Empereur des Français.",
                    "temporalRange": {"validFrom": 1769, "validTo": 1821}
                }
            ],
            "warnings": []
        }
    },
    # 3. Relation suggestions
    {
        "instruction": "Crée une relation d'alliance entre la France et la Prusse sous Napoléon",
        "context": {},
        "response": {
            "task": "relation_suggestions",
            "confidence": 0.85,
            "items": [
                {
                    "source": "France",
                    "target": "Prusse",
                    "type": "enemy", # Historically enemies during most Napoleonic wars
                    "direction": "bidirectional",
                    "weight": 1.0,
                    "isSpatial": True
                }
            ],
            "warnings": ["La relation d'alliance a varié, mais ils étaient principalement ennemis."]
        }
    },
    # 4. Out of domain refusal
    {
        "instruction": "Donne-moi une recette de gâteau au chocolat.",
        "context": {},
        "response": {
            "task": "entity_suggestions",
            "confidence": 0.0,
            "items": [],
            "warnings": ["Requête hors domaine (limité à la cartographie historique/analytique Braudel/ANT)."]
        }
    },
    # 5. Ambiguous query / Disambiguation warning
    {
        "instruction": "Ajoute Paris",
        "context": {},
        "response": {
            "task": "entity_suggestions",
            "confidence": 0.7,
            "items": [
                {
                    "name": "Paris",
                    "type": "place",
                    "layer": "historical",
                    "geometry": {"type": "Point", "coordinates": [2.3522, 48.8566]}
                }
            ],
            "warnings": ["Instruction ambiguë: 'Paris' a été interprété comme Paris, France, sans contexte d'époque."]
        }
    }
]

def main():
    print("Démarrage de la construction du dataset...")
    
    validated_train = []
    validated_eval = []
    
    for idx, ex in enumerate(RAW_EXAMPLES):
        resp = ex["response"]
        try:
            # Validate structure & business rules before persisting
            validate_response(resp)
            validate_business_rules(resp)
            
            # Separate into train / eval
            if idx % 2 == 0:
                validated_train.append(ex)
            else:
                validated_eval.append(ex)
        except ValidationError as e:
            print(f"Erreur de validation sur l'exemple {idx}: {str(e)}")
            sys.exit(1)
            
    # Save datasets
    train_path = os.path.join(base_dir, "data/synthetic/train.jsonl")
    eval_path = os.path.join(base_dir, "data/synthetic/eval.jsonl")
    
    with open(train_path, 'w', encoding='utf-8') as f:
        for ex in validated_train:
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")
            
    with open(eval_path, 'w', encoding='utf-8') as f:
        for ex in validated_eval:
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")
            
    print(f"Dataset construit avec succès !")
    print(f"Train: {len(validated_train)} exemples -> {train_path}")
    print(f"Eval: {len(validated_eval)} exemples -> {eval_path}")

if __name__ == "__main__":
    main()

import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_json(filename):
    with open(os.path.join(BASE_DIR, filename), 'r', encoding='utf-8') as f:
        return json.load(f)

ALLOWED_ENTITIES = load_json('entity_types.json')
ALLOWED_RELATIONS = load_json('relation_types.json')
ALLOWED_OPERATIONS = load_json('operation_types.json')

# Strict constraints for the LLM Output Parser
SCHEMA_VERSION = 1
CANONICAL_ROOTS = [
    "meta", "world", "layers", "entities", "relations", 
    "timelines", "styles", "imports", "ai", "views", "history"
]

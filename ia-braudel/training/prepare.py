import os
import json
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from schemas.validation import validate_response, ValidationError
from inference.validators.business_validator import validate_business_rules

def clean_and_normalize_example(ex):
    """
    Cleans and normalizes an example instruction, context and response.
    Returns the cleaned example or raises ValidationError.
    """
    if not isinstance(ex, dict) or "instruction" not in ex or "response" not in ex:
        raise ValidationError("Example must contain 'instruction' and 'response'")
        
    # Clean instruction
    ex["instruction"] = str(ex["instruction"]).strip()
    
    # Ensure context exists
    if "context" not in ex or not isinstance(ex["context"], dict):
        ex["context"] = {}
        
    # Normalize response
    resp = ex["response"]
    validate_response(resp)
    validate_business_rules(resp)
    
    return ex

def deduplicate_examples(examples):
    """Removes duplicate examples based on identical instructions."""
    seen_instructions = set()
    deduplicated = []
    
    for ex in examples:
        inst = ex["instruction"].lower()
        if inst not in seen_instructions:
            seen_instructions.add(inst)
            deduplicated.append(ex)
            
    return deduplicated

def process_raw_dataset(raw_filepath, output_filepath):
    """Loads a raw JSONL dataset, cleans it, deduplicates it, and writes the output."""
    if not os.path.exists(raw_filepath):
        print(f"File not found: {raw_filepath}")
        return
        
    cleaned_examples = []
    with open(raw_filepath, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                ex = json.loads(line)
                cleaned = clean_and_normalize_example(ex)
                cleaned_examples.append(cleaned)
            except Exception as e:
                print(f"Skipping line {line_num} due to error: {str(e)}")
                
    deduped = deduplicate_examples(cleaned_examples)
    
    with open(output_filepath, 'w', encoding='utf-8') as f:
        for ex in deduped:
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")
            
    print(f"Processed dataset: {len(cleaned_examples)} parsed, {len(deduped)} kept after deduplication.")

if __name__ == "__main__":
    if len(sys.argv) == 3:
        process_raw_dataset(sys.argv[1], sys.argv[2])
    else:
        print("Usage: py prepare.py <raw_path> <output_path>")

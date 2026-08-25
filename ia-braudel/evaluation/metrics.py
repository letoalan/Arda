import os
import json
import sys
from schemas.validation import validate_response, ValidationError
from inference.validators.business_validator import validate_business_rules

def calculate_metrics(predicted_response, expected_task, is_out_of_domain=False):
    """
    Computes quality metrics comparing predicted response to task rules.
    Returns a dictionary of metrics scores between 0.0 and 1.0.
    """
    metrics = {
        "parseability": 1.0,
        "schema_compliance": 0.0,
        "business_compliance": 0.0,
        "ontology_compliance": 0.0,
        "refusal_correctness": 1.0
    }
    
    # 1. Parseability is 1.0 because predicted_response is already parsed as dict by runtime.
    # If runtime returned a structured refusal with failure warnings, it is still parseable JSON.
    if predicted_response.get("warnings") and any("Execution failed" in w for w in predicted_response["warnings"]):
        # It was not parsed successfully
        metrics["parseability"] = 0.0
        return metrics

    # 2. Refusal correctness
    conf = predicted_response.get("confidence", 1.0)
    items = predicted_response.get("items", [])
    
    if is_out_of_domain:
        # Refusal is correct if confidence is 0.0 and items are empty
        if conf == 0.0 and len(items) == 0:
            metrics["refusal_correctness"] = 1.0
        else:
            metrics["refusal_correctness"] = 0.0
            
    # 3. Schema compliance
    try:
        validate_response(predicted_response)
        metrics["schema_compliance"] = 1.0
    except ValidationError:
        metrics["schema_compliance"] = 0.0

    # 4. Business compliance
    try:
        validate_business_rules(predicted_response)
        metrics["business_compliance"] = 1.0
    except ValidationError:
        metrics["business_compliance"] = 0.0

    # 5. Ontology compliance (check that no entity/relation types are outside ALLOWED lists)
    from ontology.constants import ALLOWED_ENTITIES, ALLOWED_RELATIONS, ALLOWED_OPERATIONS
    ontology_ok = True
    
    task = predicted_response.get("task")
    if task == "entity_suggestions":
        for item in items:
            if item.get("type") not in ALLOWED_ENTITIES:
                ontology_ok = False
    elif task == "relation_suggestions":
        for item in items:
            if item.get("type") not in ALLOWED_RELATIONS:
                ontology_ok = False
    elif task == "edit_operations":
        for item in items:
            if item.get("operation") not in ALLOWED_OPERATIONS:
                ontology_ok = False
                
    metrics["ontology_compliance"] = 1.0 if ontology_ok else 0.0
    
    metrics["overall"] = sum(metrics.values()) / len(metrics)
    return metrics

def run_evaluation(runtime, jsonl_filepath):
    """Runs evaluation over a dataset file and prints a report."""
    if not os.path.exists(jsonl_filepath):
        print(f"Dataset path does not exist: {jsonl_filepath}")
        return None

    results = []
    with open(jsonl_filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            ex = json.loads(line)
            
            instruction = ex["instruction"]
            context = ex.get("context", {})
            expected_task = ex["response"].get("task")
            
            # Simple heuristic for out of domain
            is_ood = (expected_task == "entity_suggestions" and ex["response"].get("confidence") == 0.0)
            
            # Run prediction
            pred = runtime.execute(expected_task, instruction, context)
            
            # Calculate metrics
            m = calculate_metrics(pred, expected_task, is_out_of_domain=is_ood)
            results.append(m)

    # Average metrics
    avg = {}
    for key in results[0].keys():
        avg[key] = sum(r[key] for r in results) / len(results)

    print("\n================ EVALUATION REPORT ================")
    print(f"Dataset: {os.path.basename(jsonl_filepath)}")
    print(f"Total samples: {len(results)}")
    for k, v in avg.items():
        print(f"- {k.capitalize()}: {v*100:.1f}%")
    print("===================================================\n")
    return avg

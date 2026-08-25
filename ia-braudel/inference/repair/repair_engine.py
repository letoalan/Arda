import json
import re
from schemas.validation import validate_response, ValidationError
from ontology.constants import ALLOWED_ENTITIES, ALLOWED_RELATIONS, ALLOWED_OPERATIONS

def clean_markdown(raw_str):
    """Strips markdown code block wrappers (e.g., ```json ... ```)."""
    raw_str = raw_str.strip()
    # Remove leading ```json or ```
    raw_str = re.sub(r"^```(?:json)?\s*", "", raw_str, flags=re.IGNORECASE)
    # Remove trailing ```
    raw_str = re.sub(r"\s*```$", "", raw_str)
    return raw_str.strip()

def balance_braces_and_brackets(raw_str):
    """Attempts to balance truncated or missing braces/brackets at the end of the JSON string in correct reverse order."""
    # First, handle unclosed double quote if any
    in_string = False
    escaped = False
    stack = []
    
    for char in raw_str:
        if escaped:
            escaped = False
            continue
        if char == '\\':
            escaped = True
            continue
        if char == '"':
            in_string = not in_string
            continue
        
        if not in_string:
            if char == '{':
                stack.append('}')
            elif char == '[':
                stack.append(']')
            elif char == '}':
                if stack and stack[-1] == '}':
                    stack.pop()
            elif char == ']':
                if stack and stack[-1] == ']':
                    stack.pop()

    # If we ended inside a string literal, close the quote
    if in_string:
        raw_str += '"'
        
    # Append the remaining closing characters from the stack in reverse order
    while stack:
        raw_str += stack.pop()
        
    return raw_str

def fix_trailing_commas(raw_str):
    """Removes invalid trailing commas before closing braces/brackets."""
    raw_str = re.sub(r",\s*([\]}])", r"\1", raw_str)
    return raw_str

def parse_and_repair_json(raw_str):
    """Applies string-level repairs and attempts to parse into a Python object."""
    cleaned = clean_markdown(raw_str)
    cleaned = fix_trailing_commas(cleaned)
    cleaned = balance_braces_and_brackets(cleaned)
    
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # One last fallback: try adding closing bracket/brace if it still fails
        try:
            return json.loads(cleaned + "}")
        except json.JSONDecodeError:
            try:
                return json.loads(cleaned + "]}")
            except json.JSONDecodeError:
                raise ValidationError("JSON syntax is irreparably corrupted")

def repair_types_and_defaults(data, expected_task=None):
    """Applies object-level repairs (type casting, missing defaults, ontology mapping)."""
    if not isinstance(data, dict):
        raise ValidationError("Parsed JSON is not an object")
        
    # Repair task field
    if "task" not in data and expected_task:
        data["task"] = expected_task
        
    # Repair confidence
    if "confidence" in data:
        conf = data["confidence"]
        if isinstance(conf, str):
            try:
                data["confidence"] = float(conf)
            except ValueError:
                data["confidence"] = 0.5  # default/fallback
    else:
        data["confidence"] = 1.0
        
    # Repair warnings
    if "warnings" not in data:
        data["warnings"] = []
        
    # Repair items list
    if "items" not in data:
        data["items"] = []
    elif not isinstance(data["items"], list):
        data["items"] = [data["items"]] # wrap single item if not a list
        
    task = data.get("task")
    
    # Repair items internally
    repaired_items = []
    for item in data["items"]:
        if not isinstance(item, dict):
            continue
            
        # Normalization maps
        layer_map = {"geophysique": "physical", "geohistoire": "historical", "geopolitique": "political"}
        entity_type_map = {"lieu": "place", "evenement": "event", "acteur": "actor", "concept": "concept"}
        
        # Repair Entity suggestions
        if task == "entity_suggestions" or task == "edit_operations":
            target_obj = item.get("payload", item) if task == "edit_operations" else item
            
            # Map layer names
            if "layer" in target_obj:
                lyr = str(target_obj["layer"]).lower()
                target_obj["layer"] = layer_map.get(lyr, lyr)
                
            # Map entity types
            if "type" in target_obj:
                typ = str(target_obj["type"]).lower()
                target_obj["type"] = entity_type_map.get(typ, typ)
                
            # Repair temporalRange types
            if "temporalRange" in target_obj:
                tr = target_obj["temporalRange"]
                if isinstance(tr, dict):
                    if "validFrom" in tr and isinstance(tr["validFrom"], str):
                        try:
                            tr["validFrom"] = int(tr["validFrom"])
                        except ValueError:
                            pass
                    if "validTo" in tr and isinstance(tr["validTo"], str):
                        try:
                            tr["validTo"] = int(tr["validTo"])
                        except ValueError:
                            pass
                            
        repaired_items.append(item)
        
    data["items"] = repaired_items
    return data

def pipeline_parse_repair_validate(raw_str, expected_task=None, creative_mode=False):
    """Runs the complete parsing -> repair -> validation pipeline."""
    # Step 1: String repair & parse
    data = parse_and_repair_json(raw_str)
    
    # Step 2: Structure repair & normalization
    data = repair_types_and_defaults(data, expected_task)
    
    # Step 3: Run structural validation
    validate_response(data, creative_mode=creative_mode)
    
    # Step 4: Run business/ontology validation
    from inference.validators.business_validator import validate_business_rules
    validate_business_rules(data, creative_mode=creative_mode)
    
    return data

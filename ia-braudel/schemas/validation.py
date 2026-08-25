import os
import json
from ontology.constants import ALLOWED_ENTITIES, ALLOWED_RELATIONS, ALLOWED_OPERATIONS

ALLOWED_TASKS = [
    "world_seed",
    "entity_suggestions",
    "relation_suggestions",
    "timeline_suggestions",
    "style_suggestions",
    "import_interpretation",
    "edit_operations"
]

ALLOWED_LAYERS = ["physical", "historical", "political"]
ALLOWED_DIRECTIONS = ["directed", "undirected", "bidirectional"]
ALLOWED_STYLES = ["relief", "network", "heatmap", "choropleth"]

class ValidationError(Exception):
    """Custom exception raised when validation fails."""
    pass

def validate_envelope(data):
    """Validates the global envelope structure."""
    if not isinstance(data, dict):
        raise ValidationError("Root must be a JSON object (dictionary)")
    
    if "task" not in data:
        raise ValidationError("Missing required field: 'task'")
    if data["task"] not in ALLOWED_TASKS:
        raise ValidationError(f"Invalid task '{data['task']}'. Must be one of {ALLOWED_TASKS}")
        
    if "confidence" not in data:
        raise ValidationError("Missing required field: 'confidence'")
    if not isinstance(data["confidence"], (int, float)):
        raise ValidationError("Field 'confidence' must be a number")
    if not (0.0 <= data["confidence"] <= 1.0):
        raise ValidationError(f"Field 'confidence' must be between 0.0 and 1.0, got {data['confidence']}")
        
    if "items" not in data:
        raise ValidationError("Missing required field: 'items'")
    if not isinstance(data["items"], list):
        raise ValidationError("Field 'items' must be a list")
        
    if "warnings" in data:
        if not isinstance(data["warnings"], list):
            raise ValidationError("Field 'warnings' must be a list of strings")
        for warning in data["warnings"]:
            if not isinstance(warning, str):
                raise ValidationError("Each warning in 'warnings' must be a string")
    return True

def validate_geometry(geo):
    """Validates GeoJSON-like geometry structure."""
    if not isinstance(geo, dict):
        raise ValidationError("Geometry must be a dictionary")
    if "type" not in geo:
        raise ValidationError("Geometry missing 'type'")
    g_type = geo["type"]
    if g_type not in ["Point", "LineString", "Polygon"]:
        raise ValidationError(f"Invalid geometry type '{g_type}'")
    if "coordinates" not in geo:
        raise ValidationError("Geometry missing 'coordinates'")
    coords = geo["coordinates"]
    if g_type == "Point":
        if not isinstance(coords, list) or len(coords) != 2:
            raise ValidationError("Point coordinates must be [lon, lat]")
    elif g_type == "LineString":
        if not isinstance(coords, list) or not all(isinstance(p, list) and len(p) == 2 for p in coords):
            raise ValidationError("LineString coordinates must be list of [lon, lat]")
    elif g_type == "Polygon":
        if not isinstance(coords, list) or not all(isinstance(ring, list) and all(isinstance(p, list) and len(p) == 2 for p in ring) for ring in coords):
            raise ValidationError("Polygon coordinates must be list of rings of [lon, lat]")

def validate_temporal_range(tr):
    """Validates temporal range structure."""
    if not isinstance(tr, dict):
        raise ValidationError("temporalRange must be a dictionary")
    if "validFrom" not in tr or "validTo" not in tr:
        raise ValidationError("temporalRange must contain 'validFrom' and 'validTo'")
    if not isinstance(tr["validFrom"], (int, float)) or not isinstance(tr["validTo"], (int, float)):
        raise ValidationError("temporalRange years must be numbers")
    if tr["validFrom"] > tr["validTo"]:
        raise ValidationError(f"temporalRange validFrom ({tr['validFrom']}) cannot be greater than validTo ({tr['validTo']})")

def validate_item(task, item, creative_mode=False):
    """Validates a single item according to task-specific schemas."""
    if not isinstance(item, dict):
        raise ValidationError("Each item must be a dictionary")

    if task == "world_seed":
        if "name" not in item or not isinstance(item["name"], str):
            raise ValidationError("world_seed item must contain a string 'name'")
        if "description" in item and not isinstance(item["description"], str):
            raise ValidationError("world_seed 'description' must be a string")
        if "worldType" in item and item["worldType"] not in ["real", "fictional"]:
            raise ValidationError("world_seed 'worldType' must be 'real' or 'fictional'")
        if "startYear" in item and not isinstance(item["startYear"], (int, float)):
            raise ValidationError("world_seed 'startYear' must be a number")
        if "endYear" in item and not isinstance(item["endYear"], (int, float)):
            raise ValidationError("world_seed 'endYear' must be a number")

    elif task == "entity_suggestions":
        if "name" not in item or not isinstance(item["name"], str):
            raise ValidationError("entity_suggestions item must contain a string 'name'")
        if not creative_mode:
            if "type" not in item or item["type"] not in ALLOWED_ENTITIES:
                raise ValidationError(f"entity_suggestions 'type' must be one of {ALLOWED_ENTITIES}")
            if "layer" not in item or item["layer"] not in ALLOWED_LAYERS:
                raise ValidationError(f"entity_suggestions 'layer' must be one of {ALLOWED_LAYERS}")
        if "description" in item and not isinstance(item["description"], str):
            raise ValidationError("entity_suggestions 'description' must be a string")
        if "geometry" in item:
            validate_geometry(item["geometry"])
        if "temporalRange" in item:
            validate_temporal_range(item["temporalRange"])

    elif task == "relation_suggestions":
        if "source" not in item or not isinstance(item["source"], str):
            raise ValidationError("relation_suggestions item must contain a string 'source'")
        if "target" not in item or not isinstance(item["target"], str):
            raise ValidationError("relation_suggestions item must contain a string 'target'")
        if not creative_mode:
            if "type" not in item or item["type"] not in ALLOWED_RELATIONS:
                raise ValidationError(f"relation_suggestions 'type' must be one of {ALLOWED_RELATIONS}")
        if "direction" in item and item["direction"] not in ALLOWED_DIRECTIONS:
            raise ValidationError(f"relation_suggestions 'direction' must be one of {ALLOWED_DIRECTIONS}")
        if "weight" in item and not isinstance(item["weight"], (int, float)):
            raise ValidationError("relation_suggestions 'weight' must be a number")
        if "isSpatial" in item and not isinstance(item["isSpatial"], bool):
            raise ValidationError("relation_suggestions 'isSpatial' must be a boolean")
        if "temporalRange" in item:
            validate_temporal_range(item["temporalRange"])

    elif task == "timeline_suggestions":
        if "timestamp" not in item or not isinstance(item["timestamp"], str):
            raise ValidationError("timeline_suggestions item must contain a string 'timestamp'")
        if "entityName" not in item or not isinstance(item["entityName"], str):
            raise ValidationError("timeline_suggestions item must contain a string 'entityName'")
        if "description" not in item or not isinstance(item["description"], str):
            raise ValidationError("timeline_suggestions item must contain a string 'description'")

    elif task == "style_suggestions":
        if "styleType" not in item or item["styleType"] not in ALLOWED_STYLES:
            raise ValidationError(f"style_suggestions 'styleType' must be one of {ALLOWED_STYLES}")
        if "properties" not in item or not isinstance(item["properties"], dict):
            raise ValidationError("style_suggestions must contain a dictionary 'properties'")

    elif task == "import_interpretation":
        if "sourceFormat" not in item or not isinstance(item["sourceFormat"], str):
            raise ValidationError("import_interpretation 'sourceFormat' must be a string")
        if "interpretedFeaturesCount" not in item or not isinstance(item["interpretedFeaturesCount"], int):
            raise ValidationError("import_interpretation 'interpretedFeaturesCount' must be an integer")
        if "suggestions" not in item or not isinstance(item["suggestions"], list):
            raise ValidationError("import_interpretation 'suggestions' must be a list")

    elif task == "edit_operations":
        if not creative_mode:
            if "operation" not in item or item["operation"] not in ALLOWED_OPERATIONS:
                raise ValidationError(f"edit_operations 'operation' must be one of {ALLOWED_OPERATIONS}")
        if "payload" not in item or not isinstance(item["payload"], dict):
            raise ValidationError("edit_operations must contain a dictionary 'payload'")

def validate_response(data, creative_mode=False):
    """Validates the entire response structure and all task-specific items."""
    validate_envelope(data)
    task = data["task"]
    for idx, item in enumerate(data["items"]):
        try:
            validate_item(task, item, creative_mode=creative_mode)
        except ValidationError as e:
            raise ValidationError(f"Item at index {idx} failed validation: {str(e)}")
    return True

import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from schemas.validation import validate_response, ValidationError

class TestValidation(unittest.TestCase):
    def test_valid_envelope(self):
        data = {
            "task": "world_seed",
            "confidence": 0.95,
            "items": [{"name": "Rome World"}],
            "warnings": ["Low resolution context"]
        }
        self.assertTrue(validate_response(data))

    def test_invalid_task(self):
        data = {
            "task": "unknown_task",
            "confidence": 0.5,
            "items": []
        }
        with self.assertRaises(ValidationError):
            validate_response(data)

    def test_invalid_confidence(self):
        data = {
            "task": "world_seed",
            "confidence": 1.5,
            "items": []
        }
        with self.assertRaises(ValidationError):
            validate_response(data)

    def test_entity_suggestions_valid(self):
        data = {
            "task": "entity_suggestions",
            "confidence": 0.8,
            "items": [
                {
                    "name": "Rome",
                    "type": "place",
                    "layer": "historical",
                    "geometry": {"type": "Point", "coordinates": [12.4964, 41.9028]},
                    "temporalRange": {"validFrom": -753, "validTo": 476}
                }
            ]
        }
        self.assertTrue(validate_response(data))

    def test_entity_suggestions_invalid_type(self):
        data = {
            "task": "entity_suggestions",
            "confidence": 0.8,
            "items": [
                {
                    "name": "Rome",
                    "type": "invalid_type",
                    "layer": "historical"
                }
            ]
        }
        with self.assertRaises(ValidationError):
            validate_response(data)

    def test_invalid_temporal_range(self):
        data = {
            "task": "entity_suggestions",
            "confidence": 0.8,
            "items": [
                {
                    "name": "Rome",
                    "type": "place",
                    "layer": "historical",
                    "temporalRange": {"validFrom": 100, "validTo": 50}
                }
            ]
        }
        with self.assertRaises(ValidationError):
            validate_response(data)

    def test_relation_suggestions(self):
        data = {
            "task": "relation_suggestions",
            "confidence": 0.9,
            "items": [
                {
                    "source": "Rome",
                    "target": "Carthage",
                    "type": "enemy",
                    "weight": 1.0,
                    "isSpatial": True
                }
            ]
        }
        self.assertTrue(validate_response(data))

    def test_edit_operations(self):
        data = {
            "task": "edit_operations",
            "confidence": 0.95,
            "items": [
                {
                    "operation": "addEntity",
                    "payload": {
                        "name": "Lutetia",
                        "type": "place"
                    }
                }
            ]
        }
        self.assertTrue(validate_response(data))

if __name__ == "__main__":
    unittest.main()

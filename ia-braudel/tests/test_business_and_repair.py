import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from schemas.validation import ValidationError
from inference.validators.business_validator import validate_business_rules
from inference.repair.repair_engine import pipeline_parse_repair_validate

class TestBusinessAndRepair(unittest.TestCase):
    
    def test_business_invalid_layer_entity(self):
        # Actor cannot be in physical layer
        data = {
            "task": "entity_suggestions",
            "confidence": 0.9,
            "items": [
                {
                    "name": "Napoleon",
                    "type": "actor",
                    "layer": "physical"
                }
            ]
        }
        with self.assertRaises(ValidationError):
            validate_business_rules(data)

    def test_business_valid_layer_entity(self):
        data = {
            "task": "entity_suggestions",
            "confidence": 0.9,
            "items": [
                {
                    "name": "Napoléon",
                    "type": "actor",
                    "layer": "historical"
                }
            ]
        }
        self.assertTrue(validate_business_rules(data))

    def test_repair_markdown_and_trailing_comma(self):
        raw_json = """
        ```json
        {
            "task": "entity_suggestions",
            "confidence": "0.95",
            "items": [
                {
                    "name": "Rome",
                    "type": "place",
                    "layer": "historical",
                }
            ],
        }
        ```
        """
        repaired = pipeline_parse_repair_validate(raw_json)
        self.assertEqual(repaired["confidence"], 0.95)
        self.assertEqual(repaired["items"][0]["name"], "Rome")

    def test_repair_unclosed_braces(self):
        raw_json = '{"task": "entity_suggestions", "confidence": 0.8, "items": [{"name": "Carthage", "type": "place", "layer": "historical"'
        repaired = pipeline_parse_repair_validate(raw_json)
        self.assertEqual(repaired["items"][0]["name"], "Carthage")

    def test_repair_translation_and_string_cast(self):
        raw_json = """
        {
            "task": "entity_suggestions",
            "confidence": 0.9,
            "items": [
                {
                    "name": "Alpes",
                    "type": "place",
                    "layer": "geophysique",
                    "temporalRange": {
                        "validFrom": "-2000",
                        "validTo": "2026"
                    }
                }
            ]
        }
        """
        repaired = pipeline_parse_repair_validate(raw_json)
        # "geophysique" should be mapped to "physical"
        self.assertEqual(repaired["items"][0]["layer"], "physical")
        self.assertEqual(repaired["items"][0]["temporalRange"]["validFrom"], -2000)

if __name__ == "__main__":
    unittest.main()

import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from schemas.validation import validate_response, ValidationError
from inference.validators.business_validator import validate_business_rules
from inference.runtime.runtime import BraudelIARuntime, MockLLMAdapter

class TestCreativeMode(unittest.TestCase):
    
    def test_strict_mode_rejects_fantasy(self):
        data = {
            "task": "entity_suggestions",
            "confidence": 0.9,
            "items": [
                {
                    "name": "Smaug",
                    "type": "dragon", # not in ALLOWED_ENTITIES
                    "layer": "physical" # dragon (actor/creature) on physical layer
                }
            ]
        }
        # Should raise ValidationError in strict mode (default)
        with self.assertRaises(ValidationError):
            validate_response(data, creative_mode=False)

    def test_creative_mode_accepts_fantasy(self):
        data = {
            "task": "entity_suggestions",
            "confidence": 0.9,
            "items": [
                {
                    "name": "Smaug",
                    "type": "dragon",
                    "layer": "physical"
                }
            ]
        }
        # Should validate successfully in creative mode
        self.assertTrue(validate_response(data, creative_mode=True))
        self.assertTrue(validate_business_rules(data, creative_mode=True))

    def test_runtime_creative_mode_execution(self):
        # Setup mock adapter that returns custom fantasy elements
        class CustomMockAdapter(MockLLMAdapter):
            def generate(self, prompt: str) -> str:
                return '''
                {
                    "task": "entity_suggestions",
                    "confidence": 0.95,
                    "items": [
                        {
                            "name": "Gondor",
                            "type": "kingdom",
                            "layer": "political"
                        }
                    ]
                }
                '''
        runtime = BraudelIARuntime(CustomMockAdapter())
        res = runtime.execute("entity_suggestions", "Suggère Gondor", creative_mode=True)
        self.assertEqual(res["items"][0]["name"], "Gondor")
        self.assertEqual(res["items"][0]["type"], "kingdom")

if __name__ == "__main__":
    unittest.main()

import unittest
import os
import sys
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from inference.runtime.runtime import BraudelIARuntime, MockLLMAdapter
from evaluation.metrics import calculate_metrics, run_evaluation
from schemas.validation import ValidationError

class TestRuntimeAndEvaluation(unittest.TestCase):
    
    def test_mock_runtime_execution(self):
        adapter = MockLLMAdapter()
        runtime = BraudelIARuntime(adapter)
        res = runtime.execute("world_seed", "Crée un monde romain")
        
        self.assertEqual(res["task"], "world_seed")
        self.assertEqual(res["confidence"], 1.0)
        self.assertEqual(res["items"][0]["name"], "Mock Empire")

    def test_metrics_calculation_valid(self):
        predicted = {
            "task": "world_seed",
            "confidence": 0.9,
            "items": [
                {
                    "name": "Pax Romana",
                    "description": "Pax",
                    "worldType": "real"
                }
            ],
            "warnings": []
        }
        m = calculate_metrics(predicted, "world_seed", is_out_of_domain=False)
        self.assertEqual(m["parseability"], 1.0)
        self.assertEqual(m["schema_compliance"], 1.0)
        self.assertEqual(m["business_compliance"], 1.0)
        self.assertEqual(m["ontology_compliance"], 1.0)
        self.assertEqual(m["overall"], 1.0)

    def test_metrics_refusal_ood(self):
        predicted = {
            "task": "entity_suggestions",
            "confidence": 0.0,
            "items": [],
            "warnings": ["out of domain"]
        }
        m = calculate_metrics(predicted, "entity_suggestions", is_out_of_domain=True)
        self.assertEqual(m["refusal_correctness"], 1.0)

    def test_run_evaluation_on_synthetic(self):
        adapter = MockLLMAdapter()
        runtime = BraudelIARuntime(adapter)
        
        # Check that we can run evaluation on the generated train dataset
        train_jsonl = os.path.abspath(os.path.join(os.path.dirname(__file__), '../data/synthetic/train.jsonl'))
        if os.path.exists(train_jsonl):
            avg = run_evaluation(runtime, train_jsonl)
            self.assertIsNotNone(avg)
            self.assertIn("overall", avg)

    def test_lm_studio_adapter_failure(self):
        from inference.runtime.runtime import LMStudioLLMAdapter
        # Connect to a non-existent port to force URLError
        adapter = LMStudioLLMAdapter(base_url="http://localhost:9999")
        with self.assertRaises(ValidationError):
            adapter.generate("Hello")

if __name__ == "__main__":
    unittest.main()

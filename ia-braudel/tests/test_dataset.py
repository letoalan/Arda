import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from training.prepare import deduplicate_examples, clean_and_normalize_example
from schemas.validation import ValidationError

class TestDataset(unittest.TestCase):
    
    def test_deduplication(self):
        examples = [
            {"instruction": "Add Rome", "response": {}},
            {"instruction": "add rome", "response": {}}, # duplicate (case-insensitive)
            {"instruction": "Add Carthage", "response": {}}
        ]
        deduped = deduplicate_examples(examples)
        self.assertEqual(len(deduped), 2)
        self.assertEqual(deduped[0]["instruction"], "Add Rome")
        self.assertEqual(deduped[1]["instruction"], "Add Carthage")

    def test_normalization_invalid(self):
        # Missing response
        example = {"instruction": "Add Rome"}
        with self.assertRaises(ValidationError):
            clean_and_normalize_example(example)

if __name__ == "__main__":
    unittest.main()

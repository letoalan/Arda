import unittest
import os
import sys

# Add parent directory of tests/ (which is ia-braudel/) to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ontology.constants import (
    ALLOWED_ENTITIES,
    ALLOWED_RELATIONS,
    ALLOWED_OPERATIONS,
    SCHEMA_VERSION,
    CANONICAL_ROOTS
)

class TestOntology(unittest.TestCase):
    def test_schema_version(self):
        self.assertEqual(SCHEMA_VERSION, 1)

    def test_canonical_roots(self):
        self.assertIn("world", CANONICAL_ROOTS)
        self.assertIn("entities", CANONICAL_ROOTS)
        self.assertIn("relations", CANONICAL_ROOTS)

    def test_entity_types(self):
        self.assertIsInstance(ALLOWED_ENTITIES, list)
        self.assertGreater(len(ALLOWED_ENTITIES), 0)
        self.assertIn("place", ALLOWED_ENTITIES)
        self.assertIn("event", ALLOWED_ENTITIES)

    def test_relation_types(self):
        self.assertIsInstance(ALLOWED_RELATIONS, list)
        self.assertGreater(len(ALLOWED_RELATIONS), 0)
        self.assertIn("part_of", ALLOWED_RELATIONS)
        self.assertIn("located_in", ALLOWED_RELATIONS)

    def test_operation_types(self):
        self.assertIsInstance(ALLOWED_OPERATIONS, list)
        self.assertGreater(len(ALLOWED_OPERATIONS), 0)
        self.assertIn("addEntity", ALLOWED_OPERATIONS)
        self.assertIn("updateEntity", ALLOWED_OPERATIONS)

if __name__ == "__main__":
    unittest.main()

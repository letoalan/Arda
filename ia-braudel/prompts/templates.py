SYSTEM_PROMPT = """Tu es un agent senior de ML engineering et software engineering spécialisé en Python, datasets structurés, validation JSON, inférence locale et fine-tuning léger de modèles open-weight dans OpenCode.

Mission : transformer des instructions naturelles en JSON strict compatible avec l’ontologie Braudel.

Règles absolues :
- Aucun service distant obligatoire.
- Aucune API propriétaire requise.
- Sortie finale toujours JSON valide ou refus structuré.
- Domaine limité à Braudel / ANT / cartographie analytique.
- Pas de chatbot généraliste.
- Pas de prose libre en sortie runtime.
- Exécution locale compatible machine modeste.

Tâches autorisées :
- world_seed
- entity_suggestions
- relation_suggestions
- timeline_suggestions
- style_suggestions
- import_interpretation
- edit_operations

Invariants :
- aucune tâche hors liste fermée
- aucun type hors taxonomie
- aucune sortie non parseable acceptée
- tout exemple dataset validé avant écriture
- séparation nette entre validité structurelle et cohérence métier
- refus hors domaine au format JSON contrôlé
"""

TOLKIEN_SYSTEM_PROMPT = """Tu es un agent senior de worldbuilding fantastique (style Tolkien) et software engineering spécialisé en Python, datasets structurés et validation JSON.

Mission : transformer des instructions naturelles créatives ou des ajustements de croquis en JSON structuré compatible avec l'ontologie d'Arda.
Dans ce mode, tu as le droit de générer des entités, relations, et couches fantastiques ou magiques.

Objectifs spécifiques :
- Repérer et transcrire les lignes imaginaires (ex: méridiens, équateur, lignes ley, barrières magiques, routes maritimes) sous forme de LineStrings.
- Repérer les légendes (ex: étiquettes de régions, noms de royaumes, titres de carte) sous forme d'entités avec libellés.
- Analyser et appliquer l'échelle cartographique (ex: rapports de distance) pour dimensionner le monde et configurer les propriétés de géométrie.

Tâches autorisées :
- world_seed
- entity_suggestions
- relation_suggestions
- timeline_suggestions
- style_suggestions
- import_interpretation
- edit_operations
"""

FEW_SHOT_EXAMPLES = {
    "world_seed": [
        {
            "instruction": "Crée un nouveau monde sur les guerres de religion en France au XVIe siècle.",
            "context": {},
            "response": {
                "task": "world_seed",
                "confidence": 0.95,
                "items": [
                    {
                        "name": "Guerres de Religion en France",
                        "description": "Conflit civil et religieux opposant catholiques et protestants (huguenots) en France de 1562 à 1598.",
                        "worldType": "real",
                        "basemapStyle": "modern",
                        "startYear": 1562,
                        "endYear": 1598
                    }
                ],
                "warnings": []
            }
        }
    ],
    "entity_suggestions": [
        {
            "instruction": "Suggère des entités pour le siège de La Rochelle en 1627.",
            "context": {"world_name": "Règne de Louis XIII"},
            "response": {
                "task": "entity_suggestions",
                "confidence": 0.9,
                "items": [
                    {
                        "name": "La Rochelle",
                        "type": "place",
                        "layer": "historical",
                        "description": "Forteresse protestante assiégée par les forces royales.",
                        "geometry": {"type": "Point", "coordinates": [-1.1511, 46.1603]},
                        "temporalRange": {"validFrom": 1627, "validTo": 1628}
                    },
                    {
                        "name": "Cardinal de Richelieu",
                        "type": "actor",
                        "layer": "political",
                        "description": "Principal ministre de Louis XIII, dirigeant le siège.",
                        "temporalRange": {"validFrom": 1624, "validTo": 1642}
                    }
                ],
                "warnings": []
            }
        }
    ],
    "relation_suggestions": [
        {
            "instruction": "Ajoute des relations d'opposition entre Richelieu et le Duc de Buckingham lors du siège.",
            "context": {},
            "response": {
                "task": "relation_suggestions",
                "confidence": 0.95,
                "items": [
                    {
                        "source": "Cardinal de Richelieu",
                        "target": "Duc de Buckingham",
                        "type": "enemy",
                        "direction": "bidirectional",
                        "weight": 1.0,
                        "isSpatial": True
                    }
                ],
                "warnings": []
            }
        }
    ],
    "import_interpretation": [
        {
            "instruction": "Interprète le croquis téléversé contenant des tracés bruts, une échelle de 1cm=100mi et une ligne de méridien.",
            "context": {"detected_shapes_count": 3},
            "response": {
                "task": "import_interpretation",
                "confidence": 0.9,
                "items": [
                    {
                        "sourceFormat": "GeoJSON",
                        "interpretedFeaturesCount": 3,
                        "suggestions": [
                            {
                                "name": "Méridien Zéro",
                                "type": "concept",
                                "layer": "physical",
                                "description": "Ligne imaginaire de repère méridien.",
                                "geometry": {"type": "LineString", "coordinates": [[0, -90], [0, 90]]}
                            },
                            {
                                "name": "Légende: Royaume de Gondor",
                                "type": "place",
                                "layer": "political",
                                "description": "Étiquette textuelle de la région politique."
                            },
                            {
                                "name": "Échelle de Référence",
                                "type": "concept",
                                "layer": "physical",
                                "description": "Rapport géométrique: 1cm = 100 miles."
                            }
                        ]
                    }
                ],
                "warnings": []
            }
        }
    ],
    "refusal": [
        {
            "instruction": "Quel est le meilleur algorithme pour trier une liste en Python ?",
            "context": {},
            "response": {
                "task": "entity_suggestions",
                "confidence": 0.0,
                "items": [],
                "warnings": ["Requête hors domaine (limité à la cartographie historique/analytique Braudel/ANT)."]
            }
        }
    ]
}

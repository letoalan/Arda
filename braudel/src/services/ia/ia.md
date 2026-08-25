# Secteur `src/services/ia/`

## Rôle
Services et adaptateurs pour la génération assistée par IA (Ollama en local, adaptateurs mock pour tests).

## Fichiers du Secteur

| Fichier | Rôle Résumé | Doc |
|---|---|---|
| **`ai-service.ts`** | Orchestrateur central `AIService` pour l'émission de requêtes et la gestion des sessions | [ai-service.md](./ai-service.md) |
| **`ollama-client.ts`** | Connecteur HTTP local vers l'instance Ollama (`localhost:11434`) | [ollama-client.md](./ollama-client.md) |
| **`ollama-adapter.ts`** | Adaptateur transformant les réponses Ollama au format `IAResponse` | [ollama-adapter.md](./ollama-adapter.md) |
| **`ollamaPrompts.ts`** | Construction des prompts système et utilisateur pour chaque tâche IA | [ollamaPrompts.md](./ollamaPrompts.md) |
| **`aiProposalGenerator.ts`** | Génération, détermination de type et stockage des propositions IA | [aiProposalGenerator.md](./aiProposalGenerator.md) |

## Fil d'Ariane
[services/](../services.md) -> **ia/** -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)

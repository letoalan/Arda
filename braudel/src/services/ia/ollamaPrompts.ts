// services/ia/ollamaPrompts.ts

import { IARequest } from '../../types/ia';

export const BRAUDEL_SYSTEM_PROMPT = `You are the Braudel AI Assistant, a specialized tool for historical analysis and world-building.

Your role is to help users create and manage their historical worlds by:
1. Generating entities (places, events, actors, concepts) with appropriate details
2. Suggesting relations between entities based on historical context
3. Proposing naming conventions that fit the historical period
4. Providing contextual information for temporal ranges

Always respond in JSON format when generating structured data. Be historically accurate and provide confidence scores for your suggestions.`;

export function buildOllamaPrompt(request: IARequest): string {
  const validTypesStr = 'place, event, actor, concept';
  const text = request.input ?? request.instruction;

  switch (request.task) {
    case 'entity_extraction':
      return `Extract historical entities from the following text:\n"${text}"\n\nValid entity types: ${validTypesStr}\n\nRespond ONLY with a JSON array of entities with this schema:\n[\n  {\n    "name": "Entity Name",\n    "type": "one of valid types",\n    "description": "Brief historical description",\n    "temporalRange": { "validFrom": number, "validTo": number },\n    "confidence": 0.0 - 1.0\n  }\n]`;

    case 'relation_generation':
      return `Suggest historical relations between the provided entities in context:\nContext: "${text}"\n\nRespond ONLY with a JSON array of relations with this schema:\n[\n  {\n    "sourceId": "Entity A",\n    "targetId": "Entity B",\n    "type": "relation type (e.g., alliance, conflict, trade)",\n    "direction": "directed | undirected | bidirectional",\n    "confidence": 0.0 - 1.0\n  }\n]`;

    case 'naming_suggestion':
      return `Suggest historical names based on context:\n"${text}"\n\nRespond ONLY with a JSON array of string suggestions.`;

    default:
      return text;
  }
}

export function parseOllamaResponse(raw: string, task: string): any {
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(raw);
  } catch {
    if (task === 'naming_suggestion') {
      return raw.split('\n').map((line) => line.replace(/^[-*\d.]+\s*/, '').trim()).filter(Boolean);
    }
    return { rawText: raw };
  }
}

// services/vision/lmStudioClient.ts

import { RawShapeInput } from '../../acquisition/types';
import { getLmStudioBaseUrl, cleanJsonResponse, buildRegionGuidePrompt } from './lmStudioPrompts';

export async function guideRegions(imageBase64: string, userInstruction: string) {
  const baseUrl = getLmStudioBaseUrl();
  const modelName = localStorage.getItem('lmStudioModelName') || localStorage.getItem('llmModel') || 'local-model';
  const dataUrl = imageBase64.startsWith('data:image') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
  const prompt = buildRegionGuidePrompt(userInstruction);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: dataUrl } }
            ]
          }
        ],
        temperature: 0.2,
        frequency_penalty: 0.5,
        presence_penalty: 0.3,
        max_tokens: 2048
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Erreur API LM Studio: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '';
    const textContent = cleanJsonResponse(rawText);

    try {
      const parsed = JSON.parse(textContent);
      return parsed.regions || [];
    } catch (e) {
      console.warn("Échec du parsing JSON direct. Tentative de secours par RegEx:", rawText);
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedFallback = JSON.parse(jsonMatch[0]);
        return parsedFallback.regions || [];
      }
      throw new Error("Impossible de parser le JSON retourné par le modèle.");
    }
  } catch (err) {
    console.error("Erreur guideRegions via LM Studio:", err);
    throw err;
  }
}

export async function qualifyShapes(rawShapes: RawShapeInput[], _imageBase64?: string) {
  const baseUrl = getLmStudioBaseUrl();
  const modelName = localStorage.getItem('lmStudioModelName') || localStorage.getItem('llmModel') || 'local-model';

  const prompt = `
Vous êtes un expert en qualification sémantique de cartographie (Tolkiéniste & Historique).
Voici une liste d'éléments géométriques extraits d'un croquis cartographique :
${JSON.stringify(rawShapes, null, 2)}

Pour chaque forme, attribuez :
- "name" : un nom évoquant l'univers (ex: "Massif d'Ered Luin", "Golfe de Lhûn", "Royaume d'Arnor").
- "type" : type d'entité parmi "place", "civilization", "natural_feature", "route".
- "properties" : un objet contenant "category" (ex: "mountain_range", "forest", "sea", "river", "kingdom") et "description".

Répondez UNIQUEMENT sous forme d'un tableau JSON d'objets modifiés/enrichis. Ne mettez aucun texte explicatif avant ou après.
`;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur API LM Studio: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '';
    const textContent = cleanJsonResponse(rawText);

    try {
      return JSON.parse(textContent);
    } catch {
      const jsonMatch = textContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return rawShapes;
    }
  } catch (err) {
    console.error("Erreur qualification via LM Studio:", err);
    return rawShapes;
  }
}

// Alias for pipeline.ts compatibility
export const labelPolygons = qualifyShapes;

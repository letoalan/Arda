// services/vision/lmStudioPrompts.ts

export function getLmStudioBaseUrl(): string {
  const defaultUrl = 'http://127.0.0.1:1234/v1';
  const textLlmUrl = localStorage.getItem('llmUrl');
  const fallbackUrl = textLlmUrl ? (textLlmUrl.endsWith('/v1') ? textLlmUrl : `${textLlmUrl}/v1`) : defaultUrl;

  let baseUrl = (localStorage.getItem('lmStudioBaseUrl') || fallbackUrl).trim().replace(/\/+$/, '');
  if (!baseUrl.endsWith('/v1')) {
    baseUrl = `${baseUrl}/v1`;
  }
  return baseUrl;
}

export function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  if (cleaned.includes('```')) {
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match) {
      cleaned = match[1].trim();
    } else {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }
  }
  return cleaned;
}

export function buildRegionGuidePrompt(userInstruction: string): string {
  return `
Vous êtes un assistant de cartographie (style Tolkien).
Analysez ce croquis en effectuant une simplification par regroupement topographique (chaînes de montagnes, massifs, sous-continents, ensembles d'îles) et hydrographique (bassins versants, grands lacs/mers).
Consigne de l'utilisateur : "${userInstruction}"

Identifiez les grandes régions globales plutôt que de découper chaque petit détail.

Vous DEVEZ répondre UNIQUEMENT avec un objet JSON strictement formaté comme suit :
{
  "regions": [
    {
      "label": "continent",
      "bbox": [x_min, y_min, x_max, y_max],
      "hint_point": [x_center, y_center]
    }
  ]
}
Labels autorisés : "continent", "mountain", "hills", "lake", "ocean", "river_basin".
Si un élément est un texte de légende ou hors-sujet, ajoutez "ignore": true.
Ne répondez RIEN D'AUTRE que le JSON.
`;
}

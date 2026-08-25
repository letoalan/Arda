export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { imageBase64 } = req.body;
    const NIM_API_KEY = process.env.NVIDIA_NIM_API_KEY;

    if (!NIM_API_KEY) {
      return res.status(500).json({ error: 'NVIDIA_NIM_API_KEY is not configured' });
    }

    const prompt = `Tu analyses un croquis de carte imaginaire. Renvoie UNIQUEMENT un JSON listant les régions distinctes (continents, îles, mers intérieures) avec leur bounding box approximative en pixels et un point représentatif à l'intérieur. Ignore toute légende ou texte.
Format attendu:
{
  "regions": [
    {"label": "continent", "bbox": [120, 80, 400, 300], "hint_point": [260, 190]},
    {"label": "legende", "bbox": [10, 10, 100, 60], "ignore": true}
  ]
}`;

    const payload = {
      model: "nvidia/nvidia-nemotron-nano-12b-v2-vl",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageBase64 } }
          ]
        }
      ],
      max_tokens: 1024,
      temperature: 0.1,
    };

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NIM_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`NVIDIA API Error: ${err}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Clean markdown if present
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const parsed = JSON.parse(content);
      return res.status(200).json(parsed);
    } catch (parseError) {
      // Fallback/Retry if JSON is invalid
      throw new Error(`Invalid JSON returned by LLM: ${content}`);
    }
  } catch (error: any) {
    console.error("Guide API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

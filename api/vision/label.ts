export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { imageBase64, shapes, userInstruction } = req.body;
    const NIM_API_KEY = process.env.NVIDIA_NIM_API_KEY;

    if (!NIM_API_KEY) {
      return res.status(500).json({ error: 'NVIDIA_NIM_API_KEY is not configured' });
    }

    const prompt = `L'utilisateur a demandé : "${userInstruction}".
Voici les informations sur ${shapes.length} formes détectées (indices 0 à ${shapes.length - 1}).
Attribue un nom cohérent et un type (continent, mountain, peak, hills, valley, rift, trench, ridge) pour chaque forme selon l'image.
Réponds uniquement par un tableau JSON de la forme:
[
  {"name": "Nom Créatif 1", "type": "continent"},
  {"name": "Nom Créatif 2", "type": "mountain"}
]`;

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
      max_tokens: 512,
      temperature: 0.3,
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
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const parsed = JSON.parse(content);
      return res.status(200).json(parsed);
    } catch (parseError) {
      throw new Error(`Invalid JSON returned by LLM: ${content}`);
    }
  } catch (error: any) {
    console.error("Label API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

export default async function handler(req: any, res: any) {
  // CORS restrictif (GitHub Pages)
  res.setHeader('Access-Control-Allow-Origin', 'https://*.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { imageBase64, hint_point } = req.body;
    const SEGMIND_API_KEY = process.env.SEGMIND_API_KEY;

    if (!SEGMIND_API_KEY) {
      return res.status(500).json({ error: 'SEGMIND_API_KEY is not configured' });
    }

    // Exemple d'appel à Segmind SAM2 Image API (ajustez le payload selon l'API exacte)
    const payload = {
      image: imageBase64,
      point_coords: [hint_point],
      point_labels: [1], // 1 = foreground
    };

    const response = await fetch("https://api.segmind.com/v1/sam2-image", {
      method: "POST",
      headers: {
        "x-api-key": SEGMIND_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Segmind API Error: ${err}`);
    }

    const data = await response.json(); // Habituellement, renvoie l'URL du masque ou base64
    return res.status(200).json(data);

  } catch (error: any) {
    console.error("Segment API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

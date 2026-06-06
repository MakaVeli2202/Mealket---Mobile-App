const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const PROMPT = `You are analyzing a food nutrition label photo.
Extract the nutritional values per 100g and return ONLY a valid JSON object with these exact keys (use null if not visible):
{
  "name": "product name if clearly visible, otherwise null",
  "kcalPer100g": number or null,
  "fatPer100g": number or null,
  "carbsPer100g": number or null,
  "sugarPer100g": number or null,
  "proteinPer100g": number or null,
  "saltPer100g": number or null
}
Return only the JSON, no explanation, no markdown.`;

export async function analyzeNutritionLabel(base64Image, apiKey) {
  if (!apiKey) throw new Error('NO_API_KEY');

  const body = {
    contents: [
      {
        parts: [
          { text: PROMPT },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64Image,
            },
          },
        ],
      },
    ],
    generationConfig: { temperature: 0, maxOutputTokens: 512 },
  };

  const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // Strip any markdown code fences if present
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

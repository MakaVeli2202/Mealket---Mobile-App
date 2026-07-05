const USDA_KEY = process.env.EXPO_PUBLIC_USDA_KEY || 'QqhPwBkXZlJ1GIMhpe9I9FfjkUhWWPNjTTrOUTSS';
const BASE = 'https://api.nal.usda.gov/fdc/v1';

const NUTRIENT_MAP = {
  '1008': 'kcalPer100g',
  '1003': 'proteinPer100g',
  '1004': 'fatPer100g',
  '1005': 'carbsPer100g',
  '2000': 'sugarPer100g',
};

function parseNutrients(nutrients) {
  const result = { kcalPer100g: null, proteinPer100g: null, fatPer100g: null, carbsPer100g: null, sugarPer100g: null };
  for (const n of nutrients || []) {
    const key = NUTRIENT_MAP[n.nutrientId];
    if (key) {
      const val = parseFloat(n.value) || 0;
      if (key === 'kcalPer100g') {
        result[key] = Math.round(val);
      } else {
        result[key] = Math.round(val * 10) / 10;
      }
    }
  }
  return result;
}

export async function searchFood(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const params = new URLSearchParams({
      api_key: USDA_KEY,
      query: query.trim(),
      pageSize: '20',
      dataType: 'Foundation,SR Legacy,Branded',
    });
    const res = await fetch(`${BASE}/foods/search?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.foods || [])
      .filter((f) => f.description)
      .map((f) => {
        const n = parseNutrients(f.foodNutrients);
        return {
          name: f.description || 'Unknown',
          brand: f.brandName || f.brandOwner || null,
          serving: f.servingSize ? `${f.servingSize}${f.servingSizeUnit || 'g'}` : '100g',
          kcalPer100g: n.kcalPer100g,
          fatPer100g: n.fatPer100g,
          carbsPer100g: n.carbsPer100g,
          sugarPer100g: n.sugarPer100g,
          proteinPer100g: n.proteinPer100g,
        };
      })
      .filter((f) => f.kcalPer100g !== null);
  } catch {
    return [];
  }
}

export async function lookupBarcode(barcode) {
  try {
    const params = new URLSearchParams({
      api_key: USDA_KEY,
      query: barcode,
      pageSize: '1',
      dataType: 'Branded',
    });
    const res = await fetch(`${BASE}/foods/search?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    const f = data.foods?.[0];
    if (!f || !f.description) return null;
    const n = parseNutrients(f.foodNutrients);
    return {
      name: f.description,
      brand: f.brandName || f.brandOwner || null,
      kcalPer100g: n.kcalPer100g,
      fatPer100g: n.fatPer100g,
      carbsPer100g: n.carbsPer100g,
      sugarPer100g: n.sugarPer100g,
      proteinPer100g: n.proteinPer100g,
      saltPer100g: null,
      imageUrl: null,
    };
  } catch {
    return null;
  }
}

const BASE = 'https://world.openfoodfacts.org/api/v0/product';

export async function searchFood(query, language = 'de') {
  if (!query || query.trim().length < 2) return [];
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl?` +
    `search_terms=${encodeURIComponent(query.trim())}&` +
    `search_simple=1&action=process&json=1&page_size=20&` +
    `fields=product_name,product_name_de,brands,nutriments,serving_size`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mealket-App/1.0 (contact@mealket.app)' },
  });
  if (!res.ok) return [];
  const data = await res.json();

  return (data.products || [])
    .filter(p => p.product_name_de || p.product_name)
    .map(p => {
      const n = p.nutriments || {};
      const name = p.product_name_de || p.product_name || 'Unbekannt';
      const brand = p.brands || null;
      const kcal = n['energy-kcal_100g'] ?? n['energy-kcal'] ?? null;
      return {
        name,
        brand,
        serving: p.serving_size || '100g',
        kcalPer100g:    kcal ? Math.round(kcal) : null,
        fatPer100g:     n['fat_100g']            ?? null,
        carbsPer100g:   n['carbohydrates_100g']  ?? null,
        sugarPer100g:   n['sugars_100g']         ?? null,
        proteinPer100g: n['proteins_100g']       ?? null,
      };
    })
    .filter(p => p.kcalPer100g !== null);
}

export async function lookupBarcode(barcode) {
  const res = await fetch(`${BASE}/${barcode}.json`, {
    headers: { 'User-Agent': 'Mealket-App/1.0 (contact@mealket.app)' },
  });
  if (!res.ok) return null;
  const data = await res.json();

  if (data.status !== 1 || !data.product) return null;

  const p = data.product;
  const n = p.nutriments ?? {};

  return {
    name: p.product_name_de || p.product_name || p.product_name_en || null,
    brand: p.brands || null,
    kcalPer100g: n['energy-kcal_100g'] ?? n['energy-kcal'] ?? null,
    fatPer100g: n['fat_100g'] ?? null,
    carbsPer100g: n['carbohydrates_100g'] ?? null,
    sugarPer100g: n['sugars_100g'] ?? null,
    proteinPer100g: n['proteins_100g'] ?? null,
    saltPer100g: n['salt_100g'] ?? null,
    imageUrl: p.image_front_small_url || null,
  };
}

// Common Austrian/German foods with nutrition per 100g
// Includes foods visible in Yazio screenshots + staples
export const FOOD_DATABASE = [
  // ── Dairy & Eggs ──
  { name: 'Joghurt Griechischer Art 2%',   brand: 'Milbona (Lidl)',     kcalPer100g: 73,  fatPer100g: 2.0,  carbsPer100g: 4.0,  sugarPer100g: 4.0,  proteinPer100g: 9.0  },
  { name: 'Joghurt türkische Art',          brand: 'Milsani (Aldi)',     kcalPer100g: 74,  fatPer100g: 2.0,  carbsPer100g: 4.5,  sugarPer100g: 4.5,  proteinPer100g: 9.0  },
  { name: 'Hühnerein, Eier, gekocht',       brand: null,                 kcalPer100g: 155, fatPer100g: 11.0, carbsPer100g: 1.1,  sugarPer100g: 1.1,  proteinPer100g: 13.0 },
  { name: 'Spiegeleier',                    brand: null,                 kcalPer100g: 196, fatPer100g: 15.0, carbsPer100g: 0.4,  sugarPer100g: 0.4,  proteinPer100g: 14.0 },
  { name: 'Mozzarella light',               brand: 'S-Budget (Spar)',    kcalPer100g: 165, fatPer100g: 11.0, carbsPer100g: 1.0,  sugarPer100g: 1.0,  proteinPer100g: 15.0 },
  { name: 'Ziegenfrischkäse',               brand: null,                 kcalPer100g: 167, fatPer100g: 13.0, carbsPer100g: 0.5,  sugarPer100g: 0.5,  proteinPer100g: 12.0 },
  { name: 'Butter',                         brand: null,                 kcalPer100g: 741, fatPer100g: 82.0, carbsPer100g: 0.6,  sugarPer100g: 0.6,  proteinPer100g: 0.6  },
  { name: 'Mandelmilch ungesüßt',           brand: 'Alpro',              kcalPer100g: 13,  fatPer100g: 1.1,  carbsPer100g: 0.2,  sugarPer100g: 0.2,  proteinPer100g: 0.5  },

  // ── Meat & Fish ──
  { name: 'Hühnerbrustfilet, gebraten',     brand: null,                 kcalPer100g: 165, fatPer100g: 3.6,  carbsPer100g: 0.0,  sugarPer100g: 0.0,  proteinPer100g: 31.0 },
  { name: 'Chicken Sticks',                 brand: 'Hofer',              kcalPer100g: 210, fatPer100g: 10.0, carbsPer100g: 16.0, sugarPer100g: 1.0,  proteinPer100g: 14.0 },
  { name: 'Puten-Frankfurter',              brand: 'Hütthaler',          kcalPer100g: 226, fatPer100g: 18.0, carbsPer100g: 3.0,  sugarPer100g: 1.0,  proteinPer100g: 13.0 },

  // ── Grains & Bread ──
  { name: 'Jasmin Reis, gekocht',           brand: null,                 kcalPer100g: 134, fatPer100g: 0.3,  carbsPer100g: 29.0, sugarPer100g: 0.0,  proteinPer100g: 2.7  },
  { name: 'Spaghetti, gekocht',             brand: null,                 kcalPer100g: 157, fatPer100g: 0.9,  carbsPer100g: 31.0, sugarPer100g: 0.6,  proteinPer100g: 6.0  },
  { name: 'Buttertoast',                    brand: 'Ölz',                kcalPer100g: 252, fatPer100g: 4.5,  carbsPer100g: 45.0, sugarPer100g: 4.0,  proteinPer100g: 7.5  },
  { name: 'Ölz Dinkel Toast Brot',          brand: 'Ölz',                kcalPer100g: 242, fatPer100g: 3.0,  carbsPer100g: 44.0, sugarPer100g: 3.5,  proteinPer100g: 8.5  },
  { name: 'Crunch Chocolate',               brand: 'Weetabix',           kcalPer100g: 376, fatPer100g: 6.5,  carbsPer100g: 68.0, sugarPer100g: 18.0, proteinPer100g: 9.0  },
  { name: 'Chocolate Protein Müsli',        brand: 'Prozis Foods',       kcalPer100g: 422, fatPer100g: 10.0, carbsPer100g: 55.0, sugarPer100g: 9.0,  proteinPer100g: 25.0 },

  // ── Vegetables ──
  { name: 'Kartoffeln (ohne Schale), gekocht', brand: null,              kcalPer100g: 77,  fatPer100g: 0.1,  carbsPer100g: 17.0, sugarPer100g: 0.8,  proteinPer100g: 2.0  },
  { name: 'Cherrytomaten',                  brand: null,                 kcalPer100g: 18,  fatPer100g: 0.2,  carbsPer100g: 3.0,  sugarPer100g: 2.6,  proteinPer100g: 0.9  },
  { name: 'Tomaten, frisch',                brand: null,                 kcalPer100g: 18,  fatPer100g: 0.2,  carbsPer100g: 3.4,  sugarPer100g: 2.8,  proteinPer100g: 0.9  },
  { name: 'Salatgurke (mit Schale)',        brand: null,                 kcalPer100g: 12,  fatPer100g: 0.1,  carbsPer100g: 1.9,  sugarPer100g: 1.7,  proteinPer100g: 0.6  },
  { name: 'Rote Paprika, frisch',           brand: null,                 kcalPer100g: 31,  fatPer100g: 0.3,  carbsPer100g: 6.0,  sugarPer100g: 4.2,  proteinPer100g: 1.0  },

  // ── Fruits ──
  { name: 'Apfel groß',                     brand: null,                 kcalPer100g: 52,  fatPer100g: 0.2,  carbsPer100g: 13.8, sugarPer100g: 10.4, proteinPer100g: 0.3  },
  { name: 'Banane (ohne Schale), frisch',   brand: null,                 kcalPer100g: 89,  fatPer100g: 0.3,  carbsPer100g: 23.0, sugarPer100g: 12.0, proteinPer100g: 1.1  },

  // ── Fats & Oils ──
  { name: 'Olivenöl',                       brand: null,                 kcalPer100g: 884, fatPer100g: 100.0,carbsPer100g: 0.0,  sugarPer100g: 0.0,  proteinPer100g: 0.0  },
  { name: 'Crema all aceto balsamico',      brand: 'Conte DeCesare',     kcalPer100g: 236, fatPer100g: 0.1,  carbsPer100g: 57.0, sugarPer100g: 52.0, proteinPer100g: 0.5  },

  // ── Snacks & Sweets ──
  { name: 'Krabben-chips',                  brand: 'Spar',               kcalPer100g: 530, fatPer100g: 28.0, carbsPer100g: 60.0, sugarPer100g: 2.0,  proteinPer100g: 7.0  },
  { name: 'Schoko Tröpfchen',               brand: 'Spar',               kcalPer100g: 510, fatPer100g: 29.0, carbsPer100g: 60.0, sugarPer100g: 55.0, proteinPer100g: 5.0  },
  { name: 'Light Schoko Drops',             brand: 'More Nutrition',     kcalPer100g: 420, fatPer100g: 22.0, carbsPer100g: 40.0, sugarPer100g: 2.0,  proteinPer100g: 25.0 },
  { name: 'Billa Protein Schokomousse',     brand: 'Billa',              kcalPer100g: 83,  fatPer100g: 2.3,  carbsPer100g: 6.0,  sugarPer100g: 4.0,  proteinPer100g: 9.0  },
  { name: 'Chiasamen, getrocknet',          brand: null,                 kcalPer100g: 486, fatPer100g: 31.0, carbsPer100g: 42.0, sugarPer100g: 0.0,  proteinPer100g: 17.0 },

  // ── Protein / Sports ──
  { name: 'More Protein Iced Coffee Dark Chocolate', brand: 'More Nutrition', kcalPer100g: 367, fatPer100g: 8.0, carbsPer100g: 25.0, sugarPer100g: 4.0, proteinPer100g: 45.0 },
  { name: 'MORE Satisbites White Chocolate',brand: 'More Nutrition',     kcalPer100g: 388, fatPer100g: 14.0, carbsPer100g: 27.0, sugarPer100g: 2.0,  proteinPer100g: 37.0 },
  { name: 'MORE Satisbites Milk Chocolate', brand: 'More Nutrition',     kcalPer100g: 400, fatPer100g: 15.0, carbsPer100g: 28.0, sugarPer100g: 2.5,  proteinPer100g: 36.0 },
  { name: 'More Clear Peach Iced Tea',      brand: 'More Nutrition',     kcalPer100g: 347, fatPer100g: 0.0,  carbsPer100g: 15.0, sugarPer100g: 1.0,  proteinPer100g: 75.0 },
  { name: 'Chunky Flavour Vanilla Perfection', brand: 'More Nutrition',  kcalPer100g: 233, fatPer100g: 5.0,  carbsPer100g: 8.0,  sugarPer100g: 2.0,  proteinPer100g: 38.0 },

  // ── Common staples ──
  { name: 'Haferflocken',                   brand: null,                 kcalPer100g: 371, fatPer100g: 7.0,  carbsPer100g: 62.0, sugarPer100g: 1.1,  proteinPer100g: 13.0 },
  { name: 'Vollmilch 3.5%',                 brand: null,                 kcalPer100g: 64,  fatPer100g: 3.5,  carbsPer100g: 4.7,  sugarPer100g: 4.7,  proteinPer100g: 3.3  },
  { name: 'Lachs, geräuchert',              brand: null,                 kcalPer100g: 179, fatPer100g: 11.0, carbsPer100g: 0.0,  sugarPer100g: 0.0,  proteinPer100g: 20.0 },
  { name: 'Thunfisch (Dose, im Wasser)',    brand: null,                 kcalPer100g: 96,  fatPer100g: 0.8,  carbsPer100g: 0.0,  sugarPer100g: 0.0,  proteinPer100g: 22.0 },
  { name: 'Quark Mager (0.2%)',             brand: null,                 kcalPer100g: 67,  fatPer100g: 0.2,  carbsPer100g: 4.0,  sugarPer100g: 4.0,  proteinPer100g: 12.0 },
  { name: 'Kidneybohnen (Dose)',            brand: null,                 kcalPer100g: 77,  fatPer100g: 0.5,  carbsPer100g: 10.0, sugarPer100g: 0.3,  proteinPer100g: 6.9  },
  { name: 'Süßkartoffel, gekocht',          brand: null,                 kcalPer100g: 90,  fatPer100g: 0.1,  carbsPer100g: 21.0, sugarPer100g: 6.5,  proteinPer100g: 1.7  },
  { name: 'Brokkoli, gegart',               brand: null,                 kcalPer100g: 28,  fatPer100g: 0.3,  carbsPer100g: 3.5,  sugarPer100g: 1.0,  proteinPer100g: 3.0  },
  { name: 'Spinat, frisch',                 brand: null,                 kcalPer100g: 23,  fatPer100g: 0.4,  carbsPer100g: 1.4,  sugarPer100g: 0.4,  proteinPer100g: 2.9  },
  { name: 'Erdbeeren',                      brand: null,                 kcalPer100g: 32,  fatPer100g: 0.3,  carbsPer100g: 7.7,  sugarPer100g: 4.9,  proteinPer100g: 0.7  },
  { name: 'Heidelbeeren',                   brand: null,                 kcalPer100g: 57,  fatPer100g: 0.3,  carbsPer100g: 14.5, sugarPer100g: 10.0, proteinPer100g: 0.7  },
  { name: 'Mandeln',                        brand: null,                 kcalPer100g: 579, fatPer100g: 50.0, carbsPer100g: 22.0, sugarPer100g: 5.0,  proteinPer100g: 21.0 },
  { name: 'Erdnussbutter',                  brand: null,                 kcalPer100g: 588, fatPer100g: 50.0, carbsPer100g: 20.0, sugarPer100g: 9.0,  proteinPer100g: 25.0 },
  { name: 'Kaffee (schwarz)',               brand: null,                 kcalPer100g: 2,   fatPer100g: 0.0,  carbsPer100g: 0.0,  sugarPer100g: 0.0,  proteinPer100g: 0.3  },
  { name: 'Protein Shake (Schokolade)',     brand: null,                 kcalPer100g: 380, fatPer100g: 5.0,  carbsPer100g: 20.0, sugarPer100g: 3.0,  proteinPer100g: 65.0 },
];

export function searchLocalFoods(query) {
  if (!query || query.trim().length < 1) return [];
  const q = query.trim().toLowerCase();
  return FOOD_DATABASE.filter(
    (f) => f.name.toLowerCase().includes(q) || (f.brand && f.brand.toLowerCase().includes(q))
  ).slice(0, 20);
}

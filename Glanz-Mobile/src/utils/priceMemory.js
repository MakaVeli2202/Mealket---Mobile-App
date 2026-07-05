import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@mealket_price_memory';

function normalize(name) {
  return name.toLowerCase().replace(/[^a-z0-9äöüß\s]/g, '').replace(/\s+/g, ' ').trim();
}

function storeKey(storeName) {
  return (storeName || '__general__').toLowerCase().trim();
}

export async function loadPriceMemory() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

export async function savePriceMemory(memory) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(memory));
  } catch (_) {}
}

export function lookupPrice(memory, itemName, storeName) {
  const sk = storeKey(storeName);
  const nk = normalize(itemName);
  return memory?.[sk]?.[nk] ?? null;
}

export function recordPrice(memory, itemName, storeName, unitPrice) {
  if (!unitPrice || unitPrice <= 0) return memory;

  const sk = storeKey(storeName);
  const nk = normalize(itemName);
  const existing = memory?.[sk]?.[nk];
  const today = new Date().toISOString().slice(0, 10);

  let history = existing?.history ?? [];

  if (!existing || existing.unitPrice !== unitPrice) {
    history = [{ price: unitPrice, date: today }, ...history].slice(0, 20);
  }

  return {
    ...memory,
    [sk]: {
      ...(memory?.[sk] ?? {}),
      [nk]: { unitPrice, history },
    },
  };
}

export function applyPriceMemory(stores, memory) {
  return stores.map((store) => ({
    ...store,
    items: store.items.map((item) => {
      if (item.unitPrice > 0) return item;
      const found = lookupPrice(memory, item.name, store.name);
      if (!found) return item;
      const unitPrice = found.unitPrice;
      return {
        ...item,
        unitPrice,
        subtotal: Math.round(item.quantity * unitPrice * 100) / 100,
        priceFromMemory: true,
      };
    }),
  }));
}

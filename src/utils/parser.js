import { KNOWN_STORES, matchStore } from '../constants/stores';

// Quantity prefix: "3", "3x", "3 stk.", "3stk", etc.
const QTY_RE = /^(\d+)\s*(stk\.?|stück|pcs?\.?|x)?\s+/i;

// Trailing price: "1.27", "1,27", "€1.27"
const PRICE_RE = /\s+€?(\d+[.,]\d{1,2})$/;

const FALLBACK_STORE = { label: null, color: '#868E96', textColor: '#FFFFFF' };

function isStoreHeader(line) {
  // @StoreName syntax — always treat as store line
  if (line.startsWith('@')) {
    const name = line.slice(1).trim();
    if (name.length === 0) return null;
    return matchStore(name) ?? { label: name, color: '#868E96', textColor: '#FFFFFF' };
  }
  // Plain known store name (exact match only, case-insensitive)
  const key = line.trim().toLowerCase();
  if (KNOWN_STORES[key]) return KNOWN_STORES[key];
  return null;
}

function parseLine(raw) {
  let line = raw.trim();
  let quantity = 1;
  let unitPrice = 0;

  try {
    const qtyMatch = line.match(QTY_RE);
    if (qtyMatch) {
      quantity = parseInt(qtyMatch[1], 10);
      line = line.slice(qtyMatch[0].length);
    }

    const priceMatch = line.match(PRICE_RE);
    if (priceMatch) {
      unitPrice = parseFloat(priceMatch[1].replace(',', '.'));
      line = line.slice(0, line.length - priceMatch[0].length);
    }
  } catch (_) {
    line = raw.trim();
    quantity = 1;
    unitPrice = 0;
  }

  return {
    id: Math.random().toString(36).slice(2),
    name: line.trim(),
    quantity,
    unitPrice,
    subtotal: Math.round(quantity * unitPrice * 100) / 100,
    checked: false,
    notFound: false,
  };
}

function makeListTitle() {
  const now = new Date();
  const date = now.toLocaleDateString('de-AT', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = now.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
  return `Mealket · ${date}, ${time}`;
}

export function parseShoppingText(rawText) {
  const lines = rawText.split('\n');
  const stores = [];
  let currentStore = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const storeInfo = isStoreHeader(line);
    if (storeInfo) {
      currentStore = {
        id: Math.random().toString(36).slice(2),
        name: storeInfo.label,
        color: storeInfo.color,
        textColor: storeInfo.textColor,
        items: [],
        subtotal: 0,
        checkedCount: 0,
      };
      stores.push(currentStore);
      continue;
    }

    // Item line — create unnamed group if no store header seen yet
    if (!currentStore) {
      currentStore = {
        id: Math.random().toString(36).slice(2),
        name: null,
        color: '#868E96',
        textColor: '#FFFFFF',
        items: [],
        subtotal: 0,
        checkedCount: 0,
      };
      stores.push(currentStore);
    }

    const item = parseLine(line);
    currentStore.items.push(item);
    currentStore.subtotal = Math.round((currentStore.subtotal + item.subtotal) * 100) / 100;
  }

  const grandTotal = stores.reduce((s, g) => Math.round((s + g.subtotal) * 100) / 100, 0);

  return {
    id: Date.now().toString(),
    title: makeListTitle(),
    createdAt: new Date().toISOString(),
    rawText,
    stores,
    grandTotal,
  };
}

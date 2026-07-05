import { KNOWN_STORES, matchStore } from '../constants/stores';

const QTY_RE = /^(\d+)\s*(stk\.?|stück|pcs?\.?|x|×)?\s+/i;
const PRICE_RE = /\s+(?:€|EUR)\s*(\d+[.,]\d{1,2})$/i;
const PRICE_RE_TAIL = /(\d+[.,]\d{1,2})\s*€\s*$/;

const FALLBACK_STORE = { label: null, color: '#868E96', textColor: '#FFFFFF' };

function isStoreHeader(line) {
  if (line == null) return null;
  if (line.startsWith('@')) {
    const name = line.slice(1).trim();
    if (name.length === 0) return null;
    return matchStore(name) ?? { label: name, color: '#868E96', textColor: '#FFFFFF' };
  }
  const key = line.trim().toLowerCase();
  if (KNOWN_STORES[key]) return KNOWN_STORES[key];
  return null;
}

function parseLine(raw) {
  if (raw == null) raw = '';
  let line = raw.trim();
  let quantity = 1;
  let unitPrice = 0;

  try {
    const qtyMatch = line.match(QTY_RE);
    if (qtyMatch) {
      quantity = parseInt(qtyMatch[1], 10);
      line = line.slice(qtyMatch[0].length);
    }

    let priceMatch = line.match(PRICE_RE);
    if (priceMatch) {
      unitPrice = parseFloat(priceMatch[1].replace(',', '.'));
      line = line.slice(0, line.length - priceMatch[0].length);
    } else {
      priceMatch = line.match(PRICE_RE_TAIL);
      if (priceMatch) {
        unitPrice = parseFloat(priceMatch[1].replace(',', '.'));
        line = line.slice(0, line.length - priceMatch[0].length);
      }
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

function makeListTitle(language) {
  const locale = language === 'de' ? 'de-AT' : 'en-GB';
  const now = new Date();
  const date = now.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  const time = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  return `Mealket  ${date}, ${time}`;
}

export function parseShoppingText(rawText, language = 'en') {
  if (rawText == null) rawText = '';
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
    title: makeListTitle(language),
    createdAt: new Date().toISOString(),
    rawText,
    stores,
    grandTotal,
  };
}

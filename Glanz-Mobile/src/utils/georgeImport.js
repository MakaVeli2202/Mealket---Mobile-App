/**
 * George (Erste Bank Austria) CSV import parser.
 *
 * George exports semicolon-delimited CSVs in two common layouts:
 *   Layout A: Buchungsdatum;Valutadatum;Buchungstext;Betrag;Währung;...
 *   Layout B: Datum;Belegnummer;Bezeichnung;Betrag;Währung;...
 *   Layout C: Date;Description;Amount;Currency;...  (English George)
 *
 * Amounts use European decimal comma: -1.234,56 means -1234.56
 * Dates use DD.MM.YYYY or YYYY-MM-DD.
 */

// ─── Auto-categorisation keyword map ─────────────────────────────────────────
const CATEGORY_RULES = [
  {
    id: 'food',
    keywords: [
      'billa','spar','hofer','lidl','penny','interspar','merkur','rewe','aldi',
      'mpreis','unimarkt','zielpunkt','nah&frisch','nah & frisch','kaufland',
      'mcdonald','burger king','subway','kebab','restaurant','pizzeria','gasthaus',
      'wirtshaus','bäcker','bäckerei','konditorei','café','coffeeshop','starbucks',
      'backerei','lebensmittel','supermarkt','frischemärkte','denn\'s','dm drogerie',
      'bipa','müller','mutter','rossmann',
    ],
  },
  {
    id: 'transport',
    keywords: [
      'ömv','omv','shell','bp ','esso','jet ','avanti','tankstelle','benzin','diesel',
      'öbb','oebb','westbahn','railjet','flixbus','bim','wiener linien','wienermobil',
      'graz linien','linz ag','klagenfurt','autobus','reisebus','fahrkarte','parken',
      'parkhaus','parkschein','uber','bolt','taxi','flughafen','airport','ryanair',
      'austrian','laudamotion','wizz','easyjet','lufthansa','eurowings',
    ],
  },
  {
    id: 'rent',
    keywords: [
      'miete','mietkosten','wohnkosten','hausverwaltung','betriebskosten','wohnen',
      'immobilien','mietvertrag','kaution',
    ],
  },
  {
    id: 'health',
    keywords: [
      'apotheke','pharmac','dr.','doktor','arzt','krankenhaus','klinik','spital',
      'gesundheit','physiotherapie','zahnarzt','optiker','fitnessclub','fitnesscenter',
      'fitness first','john harris','mclfit','clever fit','optik',
    ],
  },
  {
    id: 'utilities',
    keywords: [
      'strom','energie','gas ','wasser ','heizung','evn ','wien energie','kelag',
      'salzburg ag','tiwag','illwerke','a1 ','magenta','drei ','t-mobile','bob ',
      'yesss','spusu','liwest','internet','telecom','kabel','upc ','m-budget',
    ],
  },
];

function guessCategory(description) {
  const lower = (description || '').toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) return rule.id;
  }
  return 'other';
}

// ─── Amount parser (European: "1.234,56" → 1234.56) ──────────────────────────
function parseAmount(raw) {
  if (!raw) return null;
  // Remove currency symbols, spaces, "EUR", "+"
  let s = raw.replace(/[€$+\s]/g, '').replace('EUR', '').trim();
  // European format: dots are thousands separators, comma is decimal
  if (/\d\.\d{3}(,\d*)?$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    s = s.replace(',', '.');
  }
  return parseFloat(s);
}

// ─── Date parser (DD.MM.YYYY or YYYY-MM-DD) ──────────────────────────────────
function parseDate(raw) {
  if (!raw) return null;
  raw = raw.trim().replace(/"/g, '');
  // DD.MM.YYYY
  const eu = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (eu) return `${eu[3]}-${eu[2]}-${eu[1]}`;
  // YYYY-MM-DD
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return raw;
  return null;
}

// ─── CSV line splitter (handles quoted fields) ────────────────────────────────
function splitLine(line, delim = ';') {
  const result = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === delim && !inQuote) { result.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  result.push(cur.trim());
  return result;
}

// ─── Detect delimiter ─────────────────────────────────────────────────────────
function detectDelimiter(header) {
  const semis  = (header.match(/;/g) || []).length;
  const commas = (header.match(/,/g) || []).length;
  return semis >= commas ? ';' : ',';
}

// ─── Column index resolver ────────────────────────────────────────────────────
const DATE_SYNONYMS = ['buchungsdatum','valutadatum','datum','date','booking date','value date','wertstellung'];
const DESC_SYNONYMS = ['buchungstext','bezeichnung','description','text','verwendungszweck','empfänger/auftraggeber','auftraggeber','empfaenger','memo','name'];
const AMT_SYNONYMS  = ['betrag','amount','umsatz','summe','betrag eur'];

function findCol(headers, synonyms) {
  const lower = headers.map(h => h.toLowerCase().replace(/["\s]/g, ''));
  for (const syn of synonyms) {
    const idx = lower.findIndex(h => h === syn || h.startsWith(syn));
    if (idx !== -1) return idx;
  }
  return -1;
}

// ─── Main parse function ──────────────────────────────────────────────────────
/**
 * @param {string} csvText  Raw CSV string from George export
 * @returns {{ imported: number, skipped: number, expenses: Array }}
 */
export function parseGeorgeCSV(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length < 2) throw new Error('CSV appears empty or has no data rows.');

  // Find the header row (first line with known column names)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const low = lines[i].toLowerCase();
    if (DATE_SYNONYMS.some(s => low.includes(s)) || AMT_SYNONYMS.some(s => low.includes(s))) {
      headerIdx = i;
      break;
    }
  }

  const delim   = detectDelimiter(lines[headerIdx]);
  const headers = splitLine(lines[headerIdx], delim);
  const dateCol = findCol(headers, DATE_SYNONYMS);
  const descCol = findCol(headers, DESC_SYNONYMS);
  const amtCol  = findCol(headers, AMT_SYNONYMS);

  if (dateCol === -1 || amtCol === -1) {
    throw new Error(
      'Could not identify required columns (date, amount) in this CSV.\n' +
      `Found headers: ${headers.join(', ')}\n\n` +
      'Make sure you export from George → Umsätze → Export (CSV/Excel).'
    );
  }

  const expenses = [];
  let skipped = 0;

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = splitLine(lines[i], delim);
    if (cols.length < 2) { skipped++; continue; }

    const rawAmt = cols[amtCol] || '';
    const amount = parseAmount(rawAmt);

    // Skip income (positive), zero, or unparseable
    if (!amount || amount >= 0) { skipped++; continue; }

    const date = parseDate(cols[dateCol]);
    if (!date) { skipped++; continue; }

    const description = descCol !== -1 ? (cols[descCol] || '').trim() : '';
    const absAmount   = Math.abs(amount);
    const categoryId  = guessCategory(description);

    expenses.push({ date, description, amount: absAmount, categoryId });
  }

  return { imported: expenses.length, skipped, expenses };
}

// ─── Friendly summary for display ────────────────────────────────────────────
export function importSummary(result) {
  const byCategory = {};
  let total = 0;
  for (const e of result.expenses) {
    byCategory[e.categoryId] = (byCategory[e.categoryId] || 0) + 1;
    total += e.amount;
  }
  return { byCategory, total };
}

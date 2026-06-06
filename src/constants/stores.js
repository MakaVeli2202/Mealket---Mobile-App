// Store brand colors — user-specified + extended Austrian/German chains
export const KNOWN_STORES = {
  // User-specified exact colors
  hofer:        { label: 'Hofer',        color: '#0057A8', textColor: '#FFFFFF' },
  spar:         { label: 'Spar',         color: '#E2001A', textColor: '#FFFFFF' },
  billa:        { label: 'Billa',        color: '#F5A800', textColor: '#1C1917' },
  lidl:         { label: 'Lidl',         color: '#003DA5', textColor: '#FFCC00' },
  bipa:         { label: 'Bipa',         color: '#C5007C', textColor: '#FFFFFF' },
  apotheke:     { label: 'Apotheke',     color: '#2D6A4F', textColor: '#FFFFFF' },
  adeg:         { label: 'Adeg',         color: '#00857A', textColor: '#FFFFFF' },

  // Extended Austrian chains
  interspar:    { label: 'Interspar',    color: '#B0001A', textColor: '#FFFFFF' },
  eurospar:     { label: 'Eurospar',     color: '#B0001A', textColor: '#FFFFFF' },
  billaplus:    { label: 'Billa Plus',   color: '#D4920A', textColor: '#1C1917' },
  penny:        { label: 'Penny',        color: '#CC0000', textColor: '#FFFFFF' },
  merkur:       { label: 'Merkur',       color: '#FF6B00', textColor: '#FFFFFF' },
  mpreis:       { label: 'MPreis',       color: '#003DA5', textColor: '#FFFFFF' },
  unimarkt:     { label: 'Unimarkt',     color: '#E2001A', textColor: '#FFFFFF' },

  // German chains
  rewe:         { label: 'Rewe',         color: '#CC0000', textColor: '#FFFFFF' },
  edeka:        { label: 'Edeka',        color: '#FAD900', textColor: '#E30613' },
  kaufland:     { label: 'Kaufland',     color: '#E63312', textColor: '#FFD700' },
  norma:        { label: 'Norma',        color: '#E4003A', textColor: '#FFFFFF' },
  netto:        { label: 'Netto',        color: '#E3000F', textColor: '#FFD800' },
  aldi:         { label: 'Aldi',         color: '#004A99', textColor: '#FFFFFF' },
  metro:        { label: 'Metro',        color: '#003DA5', textColor: '#FFFFFF' },

  // Drugstores
  dm:           { label: 'DM',           color: '#CC0000', textColor: '#FFFFFF' },
  rossmann:     { label: 'Rossmann',     color: '#E3000F', textColor: '#FFFFFF' },
  müller:       { label: 'Müller',       color: '#E31E24', textColor: '#FFFFFF' },
};

export function matchStore(rawName) {
  const name = rawName.trim();
  const key = name.toLowerCase();
  const keyNoSpaces = key.replace(/\s+/g, '');

  return KNOWN_STORES[key] ?? KNOWN_STORES[keyNoSpaces] ?? null;
}

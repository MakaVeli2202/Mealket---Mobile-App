// Mealket design system — Yazio-matched palette (dark-first, teal accent)
const base = {
  radius: { sm: 8, md: 14, lg: 20, xl: 28 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  font: { sm: 13, base: 15, md: 17, lg: 20, xl: 26, xxl: 32 },
};

const light = {
  ...base,
  dark: false,
  bg: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceAlt: '#F2F2F7',
  surfaceElevated: '#FFFFFF',
  text: '#000000',
  textSub: '#3C3C43',
  textMuted: '#8E8E93',
  accent: '#00C896',
  accentDark: '#00A87A',
  accentLight: '#E6FAF5',
  accentGreen: '#00C896',
  accentGreenLight: '#E6FAF5',
  border: '#E5E5EA',
  borderStrong: '#C7C7CC',
  checked: '#C7C7CC',
  danger: '#FF3B30',
  dangerLight: '#FFF1F0',
  white: '#FFFFFF',
  black: '#000000',

  // Macro colors (Yazio-style)
  carbs: '#FF9F0A',
  protein: '#0A84FF',
  fat: '#FF375F',
  sugar: '#BF5AF2',

  shadow: {
    sm: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
    md: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
    lg: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 30, shadowOffset: { width: 0, height: 10 }, elevation: 16 },
  },
};

const dark = {
  ...base,
  dark: true,
  bg: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceAlt: '#252525',
  surfaceElevated: '#2A2A2A',
  text: '#FFFFFF',
  textSub: '#EBEBF5',
  textMuted: '#6B6B6B',
  accent: '#00C896',       // Yazio signature teal-green
  accentDark: '#00A87A',
  accentLight: '#0D2E25',
  accentGreen: '#00C896',
  accentGreenLight: '#0D2E25',
  border: '#2C2C2E',
  borderStrong: '#3A3A3C',
  checked: '#3A3A3C',
  danger: '#FF453A',
  dangerLight: '#2D0F0E',
  white: '#FFFFFF',
  black: '#000000',

  // Macro colors (Yazio-style)
  carbs: '#FF9F0A',
  protein: '#0A84FF',
  fat: '#FF375F',
  sugar: '#BF5AF2',

  shadow: {
    sm: { shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
    md: { shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
    lg: { shadowColor: '#000', shadowOpacity: 0.7, shadowRadius: 36, shadowOffset: { width: 0, height: 12 }, elevation: 20 },
  },
};

export function getTheme(isDark) {
  return isDark ? dark : light;
}



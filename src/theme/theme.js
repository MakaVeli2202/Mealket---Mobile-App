const base = {
  radius: { sm: 8, md: 14, lg: 20, xl: 28 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  font: { sm: 13, base: 15, md: 17, lg: 20, xl: 26, xxl: 32 },
};

const light = {
  ...base,
  dark: false,
  bg: '#F0F9FA',
  surface: '#FFFFFF',
  surfaceAlt: '#E8F6F8',
  surfaceElevated: '#FFFFFF',
  text: '#0A2225',
  textSub: '#1A4A50',
  textMuted: '#7A9EA4',
  accent: '#00B4C4',
  accentDark: '#008899',
  accentLight: '#DFFAFC',
  accentGreen: '#00C896',
  accentGreenLight: '#E6FAF5',
  border: '#C8E8EC',
  borderStrong: '#A0CED4',
  checked: '#A0CED4',
  danger: '#FF3B30',
  dangerLight: '#FFF1F0',
  white: '#FFFFFF',
  black: '#000000',

  carbs: '#FF9F0A',
  protein: '#0A84FF',
  fat: '#FF375F',
  sugar: '#BF5AF2',

  shadow: {
    sm: { shadowColor: '#00B4C4', shadowOpacity: 0.10, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
    md: { shadowColor: '#00B4C4', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
    lg: { shadowColor: '#00B4C4', shadowOpacity: 0.20, shadowRadius: 30, shadowOffset: { width: 0, height: 10 }, elevation: 16 },
  },
};

const dark = {
  ...base,
  dark: true,
  bg: '#080E10',
  surface: '#111820',
  surfaceAlt: '#192028',
  surfaceElevated: '#202C38',
  text: '#E8F8FA',
  textSub: '#B0D8E0',
  textMuted: '#527A82',
  accent: '#00D4E0',
  accentDark: '#00A8B8',
  accentLight: '#062228',
  accentGreen: '#00C896',
  accentGreenLight: '#062820',
  border: '#1C2E34',
  borderStrong: '#2A4550',
  checked: '#2A4550',
  danger: '#FF453A',
  dangerLight: '#2D0F0E',
  white: '#FFFFFF',
  black: '#000000',

  carbs: '#FF9F0A',
  protein: '#2C9CFF',
  fat: '#FF375F',
  sugar: '#BF5AF2',

  shadow: {
    sm: { shadowColor: '#00D4E0', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
    md: { shadowColor: '#00D4E0', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
    lg: { shadowColor: '#00D4E0', shadowOpacity: 0.32, shadowRadius: 36, shadowOffset: { width: 0, height: 12 }, elevation: 20 },
  },
};

export function getTheme(isDark) {
  return isDark ? dark : light;
}

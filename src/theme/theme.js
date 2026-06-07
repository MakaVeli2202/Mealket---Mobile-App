const base = {
  radius: { sm: 8, md: 14, lg: 20, xl: 28 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  font: { sm: 13, base: 15, md: 17, lg: 20, xl: 26, xxl: 32 },
};

const light = {
  ...base,
  dark: false,
  bg: '#F0F0F4',
  surface: '#FFFFFF',
  surfaceAlt: '#E4E4EA',
  surfaceElevated: '#FFFFFF',
  text: '#0E0E12',
  textSub: '#38383F',
  textMuted: '#8A8A94',
  accent: '#00E87A',
  accentDark: '#00B85E',
  accentLight: '#E6FFF3',
  accentGreen: '#00E87A',
  accentGreenLight: '#E6FFF3',
  border: '#DCDCE4',
  borderStrong: '#BBBBC6',
  checked: '#BBBBC6',
  danger: '#FF3B30',
  dangerLight: '#FFF1F0',
  white: '#FFFFFF',
  black: '#000000',

  carbs: '#FF9F0A',
  protein: '#0A84FF',
  fat: '#FF375F',
  sugar: '#BF5AF2',

  shadow: {
    sm: { shadowColor: '#00E87A', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
    md: { shadowColor: '#00E87A', shadowOpacity: 0.16, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
    lg: { shadowColor: '#00E87A', shadowOpacity: 0.22, shadowRadius: 30, shadowOffset: { width: 0, height: 10 }, elevation: 16 },
  },
};

const dark = {
  ...base,
  dark: true,
  bg: '#0B0C0E',
  surface: '#141518',
  surfaceAlt: '#1C1E22',
  surfaceElevated: '#22242A',
  text: '#F0F0F2',
  textSub: '#A8AAB2',
  textMuted: '#5A5C66',
  accent: '#00E87A',
  accentDark: '#00B85E',
  accentLight: '#041A0E',
  accentGreen: '#00E87A',
  accentGreenLight: '#041A0E',
  border: '#222428',
  borderStrong: '#2E3038',
  checked: '#2E3038',
  danger: '#FF453A',
  dangerLight: '#2D0F0E',
  white: '#FFFFFF',
  black: '#000000',

  carbs: '#FF9F0A',
  protein: '#2C9CFF',
  fat: '#FF375F',
  sugar: '#BF5AF2',

  shadow: {
    sm: { shadowColor: '#00E87A', shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
    md: { shadowColor: '#00E87A', shadowOpacity: 0.30, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
    lg: { shadowColor: '#00E87A', shadowOpacity: 0.38, shadowRadius: 36, shadowOffset: { width: 0, height: 12 }, elevation: 20 },
  },
};

export function getTheme(isDark) {
  return isDark ? dark : light;
}

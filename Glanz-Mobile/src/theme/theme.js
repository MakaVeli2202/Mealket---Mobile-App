// Aurora Design System — Mealket premium health OS
const AURORA_TEAL   = '#00E5A8';
const AURORA_BLUE   = '#00B8FF';
const AURORA_PURPLE = '#8B5CF6';
const AURORA_PINK   = '#EC4899';
const AURORA_ORANGE = '#FF9F0A';

const base = {
  radius: { sm: 10, md: 16, lg: 24, xl: 32 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  font: { sm: 13, base: 15, md: 17, lg: 20, xl: 26, xxl: 32 },
};

const dark = {
  ...base,
  dark: true,

  // ── Backgrounds ──────────────────────────────────────────────────────────────
  bg:              '#02030C',
  bgSecondary:     '#06091A',
  bgTertiary:      '#0A0E1F',

  // ── Surfaces ─────────────────────────────────────────────────────────────────
  surface:         '#0D1228',
  surfaceAlt:      '#131B33',
  surfaceElevated: '#1A2340',
  surfaceHigh:     '#1E2945',

  // ── Text ─────────────────────────────────────────────────────────────────────
  text:     '#EEF2FF',
  textSub:  '#A4B4CC',
  textMuted:'#5E7090',

  // ── Accents ──────────────────────────────────────────────────────────────────
  accent:              AURORA_TEAL,
  accentDark:          '#00C98A',
  accentLight:         'rgba(0,229,168,0.14)',
  accentGlow:          'rgba(0,229,168,0.40)',
  accentSecondary:     AURORA_PURPLE,
  accentSecondaryGlow: 'rgba(139,92,246,0.36)',
  accentSecondaryLight:'rgba(139,92,246,0.15)',
  accentBlue:          AURORA_BLUE,
  accentBlueGlow:      'rgba(0,184,255,0.34)',
  accentPink:          AURORA_PINK,
  accentGreen:         '#30D158',
  accentGreenLight:    'rgba(48,209,88,0.13)',
  accentOrange:        AURORA_ORANGE,

  // ── Borders ──────────────────────────────────────────────────────────────────
  border:       'rgba(255,255,255,0.09)',
  borderStrong: 'rgba(255,255,255,0.16)',
  borderAccent: 'rgba(0,229,168,0.30)',

  // ── Status ───────────────────────────────────────────────────────────────────
  checked:    'rgba(255,255,255,0.09)',
  danger:     '#FF453A',
  dangerLight:'#2D0F0E',
  warning:    '#FFB340',
  white:      '#FFFFFF',
  black:      '#000000',

  // ── Macro colours ────────────────────────────────────────────────────────────
  carbs:   AURORA_ORANGE,
  protein: AURORA_BLUE,
  fat:     '#FF375F',
  sugar:   '#BF5AF2',

  // ── Gradients ────────────────────────────────────────────────────────────────
  primaryGradient:   [AURORA_TEAL, AURORA_BLUE],
  secondaryGradient: [AURORA_PURPLE, AURORA_PINK],
  auroraGradient:    [AURORA_TEAL, AURORA_BLUE, AURORA_PURPLE],
  warmGradient:      [AURORA_ORANGE, AURORA_PINK],
  cardShimmer:       ['transparent', 'rgba(255,255,255,0.055)', 'transparent'],
  accentShimmer:     ['transparent', 'rgba(0,229,168,0.22)', 'transparent'],

  // ── Shadows ──────────────────────────────────────────────────────────────────
  shadow: {
    sm: { shadowColor: '#000', shadowOpacity: 0.42, shadowRadius: 14, shadowOffset: { width: 0, height: 4 },  elevation: 6  },
    md: { shadowColor: '#000', shadowOpacity: 0.54, shadowRadius: 32, shadowOffset: { width: 0, height: 10 }, elevation: 14 },
    lg: { shadowColor: '#000', shadowOpacity: 0.66, shadowRadius: 52, shadowOffset: { width: 0, height: 18 }, elevation: 26 },
  },
  glowShadow: {
    teal:   { shadowColor: AURORA_TEAL,   shadowOpacity: 0.55, shadowRadius: 24, shadowOffset: { width: 0, height: 4 }, elevation: 12 },
    blue:   { shadowColor: AURORA_BLUE,   shadowOpacity: 0.50, shadowRadius: 22, shadowOffset: { width: 0, height: 4 }, elevation: 10 },
    purple: { shadowColor: AURORA_PURPLE, shadowOpacity: 0.48, shadowRadius: 22, shadowOffset: { width: 0, height: 4 }, elevation: 10 },
  },
};

const light = {
  ...base,
  dark: false,

  bg:              '#F0F2F8',
  bgSecondary:     '#E8EBF5',
  bgTertiary:      '#E2E6F0',
  surface:         '#FFFFFF',
  surfaceAlt:      '#EDF0F8',
  surfaceElevated: '#FFFFFF',
  surfaceHigh:     '#FFFFFF',

  text:     '#0D1117',
  textSub:  '#3D4860',
  textMuted:'#8A94A8',

  accent:              '#00C896',
  accentDark:          '#009E74',
  accentLight:         'rgba(0,200,150,0.12)',
  accentGlow:          'rgba(0,200,150,0.30)',
  accentSecondary:     AURORA_PURPLE,
  accentSecondaryGlow: 'rgba(139,92,246,0.26)',
  accentSecondaryLight:'rgba(139,92,246,0.12)',
  accentBlue:          '#0095E8',
  accentBlueGlow:      'rgba(0,149,232,0.28)',
  accentPink:          '#D43B85',
  accentGreen:         '#28B148',
  accentGreenLight:    'rgba(40,177,72,0.12)',
  accentOrange:        '#E07C00',

  border:       '#DDE2EE',
  borderStrong: '#C4CBDC',
  borderAccent: 'rgba(0,200,150,0.30)',

  checked:    '#C4CBDC',
  danger:     '#FF3B30',
  dangerLight:'#FFF1F0',
  warning:    '#E08C00',
  white:      '#FFFFFF',
  black:      '#000000',

  carbs:   '#E07C00',
  protein: '#0070D4',
  fat:     '#D43060',
  sugar:   '#9B46D8',

  primaryGradient:   ['#00C896', '#0095E8'],
  secondaryGradient: [AURORA_PURPLE, AURORA_PINK],
  auroraGradient:    ['#00C896', '#0095E8', AURORA_PURPLE],
  warmGradient:      ['#E07C00', AURORA_PINK],
  cardShimmer:       ['transparent', 'rgba(255,255,255,0.9)', 'transparent'],
  accentShimmer:     ['transparent', 'rgba(0,200,150,0.18)', 'transparent'],

  shadow: {
    sm: { shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 3  },
    md: { shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 22, shadowOffset: { width: 0, height: 6 }, elevation: 8  },
    lg: { shadowColor: '#000', shadowOpacity: 0.20, shadowRadius: 34, shadowOffset: { width: 0, height: 10}, elevation: 16 },
  },
  glowShadow: {
    teal:   { shadowColor: '#00C896', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
    blue:   { shadowColor: '#0095E8', shadowOpacity: 0.32, shadowRadius: 16, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
    purple: { shadowColor: AURORA_PURPLE, shadowOpacity: 0.30, shadowRadius: 16, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
  },
};

export function getTheme(isDark) {
  return isDark ? dark : light;
}

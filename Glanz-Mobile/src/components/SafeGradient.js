import React from 'react';
import { processColor } from 'react-native';
import { LinearGradient as _LG } from 'expo-linear-gradient';

// Convert 8-char hex (#RRGGBBAA) to rgba() — processColor returns null for
// this format on Android in some RN/Expo versions, causing native crashes.
function safeColor(c) {
  if (typeof c !== 'string') return c;
  // 8-char hex with alpha appended (e.g. #00E5A855)
  if (/^#[0-9A-Fa-f]{8}$/.test(c)) {
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    const a = (parseInt(c.slice(7, 9), 16) / 255).toFixed(3);
    return `rgba(${r},${g},${b},${a})`;
  }
  // rgba/hex string appended with more hex digits (e.g. 'rgba(...)40') — invalid
  // Strip any trailing non-CSS characters that would corrupt the color value
  return c;
}

export function LinearGradient({ colors, ...props }) {
  const safe = colors.map(c => {
    const converted = safeColor(c);
    // Pre-validate: if processColor can't parse this, substitute transparent
    if (processColor(converted) == null) {
      if (__DEV__) console.warn('[SafeGradient] unparseable color replaced:', JSON.stringify(c));
      return 'transparent';
    }
    return converted;
  });
  return <_LG {...props} colors={safe} />;
}

export default LinearGradient;

import React, { useMemo } from 'react';
import { View, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from './SafeGradient';

export default function GlassCard({
  theme,
  intensity = 32,
  style,
  contentStyle,
  radius = 28,
  tint,
  onPress,
  glow = false,
  glowColor,
  shimmer = false,
  accent = false,
  children,
}) {
  const dark = theme.dark;
  const resolvedTint = tint ?? (dark ? 'dark' : 'light');

  // Slightly richer glass fill
  const fillColor = dark
    ? 'rgba(14,20,42,0.72)'
    : 'rgba(255,255,255,0.75)';

  const borderColor = dark
    ? 'rgba(255,255,255,0.11)'
    : 'rgba(255,255,255,0.85)';

  const resolvedGlowColor = glowColor ?? theme.accentGlow ?? 'rgba(0,229,168,0.40)';

  const shadowStyle = useMemo(() => {
    if (glow) {
      return dark
        ? { shadowColor: resolvedGlowColor, shadowOpacity: 0.65, shadowRadius: 32, shadowOffset: { width: 0, height: 6 }, elevation: 16 }
        : { shadowColor: resolvedGlowColor, shadowOpacity: 0.45, shadowRadius: 22, shadowOffset: { width: 0, height: 4 }, elevation: 10 };
    }
    return dark
      ? { shadowColor: '#000', shadowOpacity: 0.50, shadowRadius: 32, shadowOffset: { width: 0, height: 10 }, elevation: 14 }
      : { shadowColor: '#000', shadowOpacity: 0.09, shadowRadius: 18, shadowOffset: { width: 0, height: 4 },  elevation: 4  };
  }, [dark, glow, resolvedGlowColor]);

  const inner = (
    <>
      {/* blur backdrop */}
      <BlurView
        intensity={Platform.OS === 'ios' ? Math.round(intensity * 1.6) : Math.min(intensity, 60)}
        tint={resolvedTint}
        blurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />

      {/* glass fill + border */}
      <View style={[
        StyleSheet.absoluteFill,
        { backgroundColor: fillColor, borderRadius: radius, borderWidth: 1, borderColor },
      ]} />

      {/* top accent shimmer line â€” always present, stronger when accent=true */}
      <LinearGradient
        colors={accent
          ? ['transparent', theme.accent ? theme.accent + '55' : 'rgba(0,229,168,0.33)', 'transparent']
          : ['transparent', 'rgba(255,255,255,0.07)', 'transparent']
        }
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius, height: 1.5, top: 0 }]}
        pointerEvents="none"
      />

      {/* optional horizontal shimmer sweep */}
      {shimmer && (
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.055)', 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
          pointerEvents="none"
        />
      )}

      {/* glow: inner teal edge halo at top */}
      {glow && dark && (
        <LinearGradient
          colors={[resolvedGlowColor.replace('0.40', '0.12'), 'transparent']}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius, height: radius * 2.5 }]}
          pointerEvents="none"
        />
      )}

      <View style={[contentStyle]}>
        {children}
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[{ borderRadius: radius, overflow: 'hidden' }, shadowStyle, style]}
      >
        {inner}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden' }, shadowStyle, style]}>
      {inner}
    </View>
  );
}

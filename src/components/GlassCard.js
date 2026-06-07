import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export default function GlassCard({
  theme,
  intensity = 28,
  style,
  contentStyle,
  radius = 20,
  tint,
  children,
}) {
  const dark = theme.dark;
  const resolvedTint = tint ?? (dark ? 'dark' : 'light');

  const fillColor    = dark ? 'rgba(20,26,38,0.06)'    : 'rgba(255,255,255,0.08)';

  const chromaR      = dark ? 'rgba(255,60,80,0.05)'   : 'rgba(255,60,80,0.04)';
  const chromaB      = dark ? 'rgba(60,120,255,0.05)'  : 'rgba(60,120,255,0.04)';

  const fresnelL     = dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.72)';

  const barrelShadow = dark ? 'rgba(0,0,0,0.38)'       : 'rgba(0,0,0,0.08)';

  const caustic      = dark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.60)';

  const borderColor  = dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.95)';

  const shadowStyle = dark ? {
    shadowColor: theme.accent ?? '#00E87A',
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  } : {
    shadowColor: '#6060A0',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  };

  return (
    <View style={[styles.outer, { borderRadius: radius, borderColor }, shadowStyle, style]}>

      {/* 1. Backdrop blur */}
      <BlurView
        intensity={Platform.OS === 'ios' ? Math.round(intensity * 1.6) : intensity}
        tint={resolvedTint}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />

      {/* 2. Ultra-thin fill */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: fillColor, borderRadius: radius }]} />

      {/* 3a. Chroma-R fringe */}
      <View style={[StyleSheet.absoluteFill, {
        backgroundColor: chromaR, borderRadius: radius,
        transform: [{ translateX: -1 }, { translateY: -1 }],
      }]} />

      {/* 3b. Chroma-B fringe */}
      <View style={[StyleSheet.absoluteFill, {
        backgroundColor: chromaB, borderRadius: radius,
        transform: [{ translateX: 1 }, { translateY: 1 }],
      }]} />

      {/* 4. Left Fresnel edge */}
      <LinearGradient
        colors={[fresnelL, 'rgba(255,255,255,0.00)']}
        start={{ x: 0, y: 0.3 }}
        end={{ x: 1, y: 0.3 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius, right: undefined, width: '26%' }]}
        pointerEvents="none"
      />

      {/* 5. Barrel shadow — bottom vignette, glass depth */}
      <LinearGradient
        colors={['rgba(0,0,0,0.00)', barrelShadow]}
        start={{ x: 0, y: 0.45 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        pointerEvents="none"
      />

      {/* 6. Lens caustic — bright rim glow at bottom edge */}
      <LinearGradient
        colors={['rgba(255,255,255,0.00)', caustic, 'rgba(255,255,255,0.00)']}
        locations={[0.72, 0.90, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        pointerEvents="none"
      />

      {/* 7. Specular rim border */}
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: 1, borderColor }]} />

      {/* 8. Content — only this clips */}
      <View style={[styles.contentClip, { borderRadius: radius }, contentStyle]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderWidth: 1,
    // NO overflow:'hidden' — kills BlurView on Android 12+
  },
  contentClip: {
    overflow: 'hidden',
  },
});

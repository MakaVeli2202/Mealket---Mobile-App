import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

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

  const fillColor = dark ? 'rgba(20,26,38,0.06)' : 'rgba(255,255,255,0.08)';

  const shadowStyle = dark ? {
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  } : {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  };

  return (
    <View style={[{ borderRadius: radius }, shadowStyle, style]}>

      <BlurView
        intensity={Platform.OS === 'ios' ? Math.round(intensity * 1.6) : intensity}
        tint={resolvedTint}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />

      <View style={[StyleSheet.absoluteFill, { backgroundColor: fillColor, borderRadius: radius }]} />

      
      <View style={[styles.contentClip, { borderRadius: radius }, contentStyle]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentClip: {
    overflow: 'hidden',
    paddingHorizontal: 2,
  },
});

import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function LiquidGlassPill({
  dark,
  radius: radiusProp,
}) {
  const radius = radiusProp ?? 12;
  if (radiusProp == null) {
    console.warn('LiquidGlassPill: radius prop is recommended but not provided, using default 12');
  }
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: radius,
        },
      ]}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius,
            backgroundColor: dark
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(255,255,255,0.12)',
          },
        ]}
      />
    </View>
  );
}

import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function LiquidGlassPill({
  dark,
  radius,
}) {
  if (radius == null) {
    console.error('LiquidGlassPill: radius prop is required but was not provided');
    return null;
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
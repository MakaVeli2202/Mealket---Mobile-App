import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';

export default function LiquidGlassPill({
  dark,
  radius,
}) {
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: radius,
        },
      ]}
    >
      <BlurView
        intensity={Platform.OS === 'ios' ? 80 : 50}
        tint={dark ? 'light' : 'dark'}
        experimentalBlurMethod={
          Platform.OS === 'android'
            ? 'dimezisBlurView'
            : undefined
        }
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius,
          },
        ]}
      />

      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius,
            backgroundColor: dark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(255,255,255,0.16)',
          },
        ]}
      />

      {/* inner rim */}
      <View
        style={{
          position: 'absolute',
          top: 1,
          left: 1,
          right: 1,
          bottom: 1,
          borderRadius: radius - 1,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.25)',
        }}
      />

      {/* outer border */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: radius,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.35)',
        }}
      />
    </View>
  );
}
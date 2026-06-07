import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function GlassBg({
  children,
  theme,
}) {
  const dark = theme.dark;

  const bg1 = dark
    ? '#050608'
    : '#F4F4FA';

  const bg2 = dark
    ? '#090B12'
    : '#ECECF5';

  const orbs = [
    {
      color: '#00E87A',
      x: '55%',
      y: '-12%',
      size: 460,
      opacity: 0.06,
    },
    {
      color: '#7B78FF',
      x: '-10%',
      y: '32%',
      size: 420,
      opacity: 0.05,
    },
    {
      color: '#0A84FF',
      x: '28%',
      y: '58%',
      size: 360,
      opacity: 0.04,
    },
    {
      color: '#FF375F',
      x: '82%',
      y: '42%',
      size: 260,
      opacity: 0.03,
    },
    {
      color: '#BF5AF2',
      x: '5%',
      y: '75%',
      size: 280,
      opacity: 0.02,
    },
  ];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[bg1, bg2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {orbs.map((orb, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: orb.x,
            top: orb.y,
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: orb.size * 2.5,
              height: orb.size * 2.5,
              borderRadius: orb.size * 1.25,
              backgroundColor: orb.color,
              opacity: orb.opacity * 0.08,
              left: -orb.size * 0.75,
              top: -orb.size * 0.75,
            }}
          />

          <View
            style={{
              position: 'absolute',
              width: orb.size * 1.7,
              height: orb.size * 1.7,
              borderRadius: orb.size,
              backgroundColor: orb.color,
              opacity: orb.opacity * 0.18,
              left: -orb.size * 0.35,
              top: -orb.size * 0.35,
            }}
          />

          <View
            style={{
              width: orb.size,
              height: orb.size,
              borderRadius: orb.size / 2,
              backgroundColor: orb.color,
              opacity: orb.opacity,
            }}
          />
        </View>
      ))}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
});

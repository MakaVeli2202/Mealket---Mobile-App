import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function ProgressBar({ progress, color, theme }) {
  const pct = Math.max(0, Math.min(1, progress));
  const bg = theme?.surfaceAlt ?? '#F5F4F2';
  return (
    <View style={[styles.track, { backgroundColor: bg }]}>
      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 5, overflow: 'hidden' },
  fill: { height: '100%' },
});

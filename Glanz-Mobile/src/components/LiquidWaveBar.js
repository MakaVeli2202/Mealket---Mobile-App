import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSpring, Easing } from 'react-native-reanimated';
import { LinearGradient } from './SafeGradient';

const WAVE_HEIGHT = 10;

export default function LiquidWaveBar({
  progress = 0,
  color,
  height = 32,
  label,
  value,
  max,
  theme,
}) {
  const waveX = useSharedValue(0);
  const fillHeightVal = useSharedValue(0);

  useEffect(() => {
    waveX.value = withRepeat(
      withTiming(-60, { duration: 1200, easing: Easing.linear }),
      -1, false
    );
  }, []);

  useEffect(() => {
    fillHeightVal.value = withSpring(progress * height, {
      damping: 18,
      stiffness: 120,
    });
  }, [progress, height]);

  const fillAnimStyle = useAnimatedStyle(() => ({
    height: fillHeightVal.value,
  }));

  const waveAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: waveX.value }],
  }));

  const gradientColors = useMemo(() => {
    if (color) return [color + '80', color];
    return [theme.accent + '80', theme.accent];
  }, [color, theme]);

  const waveCircles = useMemo(() => {
    const circles = [];
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const y = Math.sin(angle) * (WAVE_HEIGHT / 2) + (WAVE_HEIGHT / 2) - 1;
      circles.push({ x: i * 6, y });
    }
    return circles;
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: theme.surfaceAlt }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: height / 2, overflow: 'hidden' }, fillAnimStyle]}>
          <LinearGradient
            colors={gradientColors}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Animated.View style={[styles.waveLayer, { height: WAVE_HEIGHT + 4 }, waveAnimStyle]}>
            {waveCircles.map((c, i) => (
              <View
                key={i}
                style={[styles.waveDot, { left: c.x, top: c.y, backgroundColor: gradientColors[1] }]}
              />
            ))}
          </Animated.View>
        </Animated.View>
      </View>
      {(label || value !== undefined) && (
        <View style={styles.labelRow}>
          {label && <Text style={[styles.labelText, { color: theme.textSub }]}>{label}</Text>}
          {value !== undefined && (
            <Text style={[styles.valueText, { color: theme.text }]}>
              {value}{max ? ` / ${max}` : ''}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  waveLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -WAVE_HEIGHT / 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  waveDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  labelText: {
    fontSize: 12,
  },
  valueText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import { LinearGradient } from './SafeGradient';

export default function HealthOrb({ theme, progress = 0, onPress }) {
  const pulse = useSharedValue(1);
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withTiming(-8, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      -1, true
    );

    if (progress >= 0.8) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1, true
      );
    }
  }, [progress]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }, { scale: pulse.value }],
  }));

  const orbGradient = useMemo(() => {
    if (progress < 0.3) return ['#EF4444', '#F97316'];
    if (progress < 0.6) return ['#F59E0B', '#EAB308'];
    if (progress < 0.8) return ['#22C55E', '#00E5A8'];
    return ['#00E5A8', '#00B8FF'];
  }, [progress]);

  const pct = Math.round(progress * 100);

  return (
    <Animated.View style={[styles.wrapper, animStyle]}>
      <View style={[styles.glow, { opacity: progress > 0.8 ? 0.6 : 0.2, backgroundColor: orbGradient[0] }]} />
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <LinearGradient colors={orbGradient} style={styles.orb}>
          <Text style={styles.pctText}>{pct}%</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 90,
  },
  glow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    top: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  orb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pctText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

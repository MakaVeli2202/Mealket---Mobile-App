import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withRepeat, withSequence, withDelay,
  Easing,
} from 'react-native-reanimated';

export default function ProgressBar({ progress, color, theme }) {
  const pct = Math.max(0, Math.min(1, progress));
  const fillAnim  = useSharedValue(0);
  const shimmerX  = useSharedValue(-80);
  const pulseOpac = useSharedValue(0);

  useEffect(() => {
    fillAnim.value = withTiming(pct, { duration: 420, easing: Easing.out(Easing.cubic) });
  }, [pct]);

  useEffect(() => {
    if (pct > 0 && pct < 1) {
      shimmerX.value = withRepeat(
        withSequence(
          withTiming(300, { duration: 1600, easing: Easing.linear }),
          withTiming(-80, { duration: 0 })
        ),
        -1,
        false
      );
    } else {
      shimmerX.value = withTiming(-80, { duration: 200 });
    }
  }, [pct]);

  useEffect(() => {
    if (pct >= 1) {
      pulseOpac.value = withSequence(
        withDelay(300, withTiming(0.6, { duration: 180 })),
        withTiming(0, { duration: 320 })
      );
    }
  }, [pct]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillAnim.value * 100}%`,
    backgroundColor: color,
    overflow: 'hidden',
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
    opacity: 0.35,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpac.value,
  }));

  const track = theme?.surfaceAlt ?? '#E8F6F8';

  return (
    <View style={[styles.track, { backgroundColor: track }]}>
      <Animated.View style={[styles.fill, fillStyle]}>
        <Animated.View style={[styles.shimmer, shimmerStyle]} />
      </Animated.View>
      <Animated.View style={[styles.pulseOverlay, { backgroundColor: color }, pulseStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 4, overflow: 'hidden', position: 'relative' },
  fill: { height: '100%', position: 'relative' },
  shimmer: {
    position: 'absolute', top: 0, bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 2,
  },
  pulseOverlay: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
  },
});

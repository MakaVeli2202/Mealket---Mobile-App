import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from './SafeGradient';

// Aurora orbs â€” richer, more visible
const DARK_ORBS = [
  { color: '#00B8FF', x: '-18%', y: '-10%', size: 560, opacity: 0.16, delay: 0,    dur: 28000 },
  { color: '#8B5CF6', x: '44%',  y: '20%',  size: 500, opacity: 0.13, delay: 4000, dur: 34000 },
  { color: '#00E5A8', x: '-8%',  y: '52%',  size: 420, opacity: 0.12, delay: 8000, dur: 30000 },
  { color: '#EC4899', x: '68%',  y: '58%',  size: 320, opacity: 0.09, delay: 2000, dur: 38000 },
  { color: '#00E5A8', x: '78%',  y: '-8%',  size: 280, opacity: 0.07, delay: 6000, dur: 26000 },
  { color: '#00B8FF', x: '30%',  y: '80%',  size: 240, opacity: 0.06, delay: 1000, dur: 32000 },
];

const LIGHT_ORBS = [
  { color: '#00B8FF', x: '-12%', y: '-6%',  size: 500, opacity: 0.10, delay: 0,    dur: 28000 },
  { color: '#8B5CF6', x: '42%',  y: '26%',  size: 460, opacity: 0.08, delay: 4000, dur: 34000 },
  { color: '#00C896', x: '-10%', y: '58%',  size: 380, opacity: 0.07, delay: 8000, dur: 30000 },
  { color: '#EC4899', x: '66%',  y: '54%',  size: 300, opacity: 0.06, delay: 2000, dur: 38000 },
];

function AnimatedOrb({ orb }) {
  const floatY = useSharedValue(0);
  const floatX = useSharedValue(0);

  useEffect(() => {
    floatY.value = withDelay(orb.delay, withRepeat(
      withTiming(18, { duration: orb.dur, easing: Easing.inOut(Easing.sin) }),
      -1, true,
    ));
    floatX.value = withDelay(orb.delay + 2000, withRepeat(
      withTiming(10, { duration: orb.dur * 0.7, easing: Easing.inOut(Easing.sin) }),
      -1, true,
    ));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }, { translateX: floatX.value }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: orb.x, top: orb.y }, animStyle]}>
      {/* outer diffuse halo */}
      <View style={{
        position: 'absolute',
        width: orb.size * 3.2,
        height: orb.size * 3.2,
        borderRadius: orb.size * 1.6,
        backgroundColor: orb.color,
        opacity: orb.opacity * 0.07,
        left: -orb.size * 1.1,
        top: -orb.size * 1.1,
      }} />
      {/* mid bloom */}
      <View style={{
        position: 'absolute',
        width: orb.size * 1.9,
        height: orb.size * 1.9,
        borderRadius: orb.size,
        backgroundColor: orb.color,
        opacity: orb.opacity * 0.28,
        left: -orb.size * 0.45,
        top: -orb.size * 0.45,
      }} />
      {/* core */}
      <View style={{
        width: orb.size,
        height: orb.size,
        borderRadius: orb.size / 2,
        backgroundColor: orb.color,
        opacity: orb.opacity,
      }} />
    </Animated.View>
  );
}

export default function GlassBg({ children, theme, variant = 'aurora' }) {
  const dark = theme.dark;

  // 4-stop base gradient â€” richer depth
  const gradColors = dark
    ? ['#02030C', '#050818', '#080D20', '#06091A']
    : ['#F0F2F8', '#E8EBF5', '#ECF0F9', '#E4E8F4'];
  const gradLocs = [0, 0.35, 0.7, 1];

  const orbs = useMemo(() => {
    const base = dark ? DARK_ORBS : LIGHT_ORBS;
    if (variant === 'fasting') {
      return base.map(o => ({
        ...o,
        color: o.color === '#00E5A8' || o.color === '#00C896' ? '#EC4899'
          : o.color === '#00B8FF' ? '#8B5CF6'
          : o.color,
      }));
    }
    if (variant === 'warm') return base.map(o => ({ ...o, color: '#EC4899' }));
    if (variant === 'cool') return base.map(o => ({ ...o, color: '#00B8FF' }));
    return base;
  }, [variant, dark]);

  return (
    <View style={styles.root}>
      {/* base gradient */}
      <LinearGradient
        colors={gradColors}
        locations={gradLocs}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* aurora orbs */}
      {orbs.map((orb, i) => <AnimatedOrb key={i} orb={orb} />)}

      {/* very subtle top-edge accent glow */}
      {dark && (
        <LinearGradient
          colors={['rgba(0,229,168,0.06)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[StyleSheet.absoluteFill, { height: 260, top: 0 }]}
          pointerEvents="none"
        />
      )}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
});

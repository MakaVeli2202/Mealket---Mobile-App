import React, { useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, Easing,
} from 'react-native-reanimated';

/**
 * Wraps a screen in a fade + slide-up entrance animation.
 * mode: 'up' | 'down' | 'right' | 'left' | 'fade'
 */
export default function AnimatedScreen({ children, style, mode = 'up', delay = 0, distance = 28 }) {
  const opacity = useSharedValue(0);
  const translate = useSharedValue(
    mode === 'up'    ?  distance :
    mode === 'down'  ? -distance :
    mode === 'right' ? -distance :
    mode === 'left'  ?  distance : 0
  );

  useEffect(() => {
    const t = setTimeout(() => {
      opacity.value   = withTiming(1,  { duration: 340, easing: Easing.out(Easing.quad) });
      translate.value = withSpring(0,  { damping: 22, stiffness: 180, mass: 0.9 });
    }, delay);
    return () => clearTimeout(t);
  }, []);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      mode === 'up'    || mode === 'down'  ? { translateY: translate.value } : {},
      mode === 'left'  || mode === 'right' ? { translateX: translate.value } : {},
    ],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, anim, style]}>
      {children}
    </Animated.View>
  );
}

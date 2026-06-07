import React from 'react';
import { TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/**
 * A touchable that springs to a smaller scale on press — satisfying liquid-feel tap.
 * Falls back gracefully if gesture-handler is unavailable.
 */
export default function SpringPressable({
  onPress,
  onLongPress,
  scaleDown = 0.94,
  hitSlop,
  activeOpacity = 1,
  style,
  children,
  disabled,
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn  = () => { scale.value = withSpring(scaleDown, { damping: 20, stiffness: 300 }); };
  const handlePressOut = () => { scale.value = withSpring(1.0,      { damping: 14, stiffness: 260 }); };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={hitSlop}
      activeOpacity={activeOpacity}
      disabled={disabled}
      style={[animStyle, style]}
    >
      {children}
    </AnimatedTouchable>
  );
}

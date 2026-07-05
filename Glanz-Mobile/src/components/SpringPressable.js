import React, { useCallback } from 'react';
import { TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function SpringPressable({
  onPress,
  onLongPress,
  scaleDown = 0.96,
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

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(scaleDown, { damping: 20, stiffness: 300 });
  }, [scaleDown, disabled]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(1.0, { damping: 14, stiffness: 260 });
  }, [disabled]);

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
      accessibilityRole="button"
    >
      {children}
    </AnimatedTouchable>
  );
}

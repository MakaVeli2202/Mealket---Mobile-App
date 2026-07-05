import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';

const AnimatedText = Animated.createAnimatedComponent(Text);

export default function AnimatedNumber({ value, style, duration = 800, decimalPlaces = 0 }) {
  const animVal = useSharedValue(value);

  useEffect(() => {
    animVal.value = withTiming(value, {
      duration,
      easing: Easing.inOut(Easing.sin),
    });
  }, [value]);

  const animatedProps = useAnimatedProps(() => ({
    text: animVal.value.toFixed(decimalPlaces),
  }));

  return (
    <AnimatedText
      animatedProps={animatedProps}
      style={style}
    />
  );
}

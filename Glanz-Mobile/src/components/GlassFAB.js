import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate, useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from './SafeGradient';

const MENU_ITEMS = [
  { key: 'food', icon: 'restaurant-outline', label: 'Add Food' },
  { key: 'scan', icon: 'barcode-outline', label: 'Scan' },
  { key: 'photo', icon: 'camera-outline', label: 'Photo' },
  { key: 'water', icon: 'water-outline', label: 'Water' },
  { key: 'weight', icon: 'scale-outline', label: 'Weight' },
];

const ITEM_HEIGHT = 44;
const ITEM_GAP = 10;

function MenuItem({ item, index, isOpen, theme, onPress }) {
  const animValue = useSharedValue(0);
  const [isAnimZero, setIsAnimZero] = useState(!isOpen);

  useAnimatedReaction(
    () => animValue.value === 0,
    (zero) => {
      runOnJS(setIsAnimZero)(zero);
    }
  );

  React.useEffect(() => {
    const delay = index * 50;
    const timer = setTimeout(() => {
      animValue.value = withSpring(isOpen ? 1 : 0, {
        damping: 14,
        stiffness: 120,
      });
    }, delay);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: animValue.value,
    transform: [
      { translateY: interpolate(animValue.value, [0, 1], [16, 0]) },
      { scale: interpolate(animValue.value, [0, 1], [0.85, 1]) },
    ],
  }));

  if (!isOpen && isAnimZero) return null;

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={() => onPress(item.key)}
        style={[styles.menuItem, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
        activeOpacity={0.8}
      >
        <Ionicons name={item.icon} size={18} color={theme.accent} />
        <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function GlassFAB({ theme, onAddFood, onScan, onPhoto, onWater, onWeight }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handlePress = useCallback((key) => {
    const handlers = {
      food: onAddFood,
      scan: onScan,
      photo: onPhoto,
      water: onWater,
      weight: onWeight,
    };
    handlers[key]?.();
    setIsOpen(false);
  }, [onAddFood, onScan, onPhoto, onWater, onWeight]);

  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: isOpen ? '45deg' : '0deg' }],
  }));

  return (
    <>
      {isOpen && (
        <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
            {Platform.OS === 'ios' && (
              <BlurView intensity={12} tint="dark" style={StyleSheet.absoluteFill} />
            )}
          </Animated.View>
        </Pressable>
      )}
      <View style={styles.container} pointerEvents="box-none">
        <View style={styles.menu}>
          {MENU_ITEMS.map((item, index) => (
            <MenuItem
              key={item.key}
              item={item}
              index={index}
              isOpen={isOpen}
              theme={theme}
              onPress={handlePress}
            />
          ))}
        </View>
        <TouchableOpacity onPress={toggleMenu} activeOpacity={0.8}>
          <LinearGradient
            colors={[theme.accent, theme.accentDark]}
            style={styles.fab}
          >
            <Animated.View style={fabAnimStyle}>
              <Ionicons name={isOpen ? "close" : "ellipsis-horizontal"} size={24} color="#FFFFFF" />
            </Animated.View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 140,
    right: 20,
    alignItems: 'center',
  },
  menu: {
    alignItems: 'center',
    gap: ITEM_GAP,
    marginBottom: 14,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    height: ITEM_HEIGHT,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});

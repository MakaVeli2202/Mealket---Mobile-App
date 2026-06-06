import React, { useRef, useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, TextInput } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withSequence, runOnJS, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';

const SWIPE_THRESHOLD = 80;
const SWIPE_MAX = 115;

export default function ShoppingItem({
  item, onToggle, onPriceChange, onNotFound, isLastStore, isNotFoundBucket,
}) {
  const { theme } = useSettings();
  const { name, quantity, unitPrice, subtotal, checked, notFound, priceFromMemory } = item;
  const [priceText, setPriceText] = useState(unitPrice > 0 ? unitPrice.toFixed(2) : '');
  const inputRef = useRef(null);

  const translateX = useSharedValue(0);
  const checkScale = useSharedValue(1);
  const triggered = useSharedValue(false);

  const swipeEnabled = !isNotFoundBucket && !checked && !notFound;

  const panGesture = Gesture.Pan()
    .enabled(swipeEnabled)
    .activeOffsetX(20)           // only right swipe, simpler threshold
    .failOffsetY([-20, 20])      // fail if more than 20px vertical (scrolling)
    .onUpdate((e) => {
      const x = Math.min(Math.max(e.translationX, 0), SWIPE_MAX);
      translateX.value = x;
      triggered.value = x >= SWIPE_THRESHOLD;
    })
    .onEnd(() => {
      if (triggered.value) {
        translateX.value = withTiming(0, { duration: 180 });
        runOnJS(onNotFound)();
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
      }
      triggered.value = false;
    });

  const handleToggle = () => {
    checkScale.value = withSequence(
      withTiming(0.8, { duration: 60 }),
      withSpring(1, { damping: 10, stiffness: 260 })
    );
    onToggle();
  };

  const handlePriceBlur = () => {
    const val = parseFloat(priceText.replace(',', '.'));
    onPriceChange(isNaN(val) ? 0 : val);
  };

  const handlePriceChange = (text) => {
    if (/^[\d]*[.,]?[\d]{0,2}$/.test(text) || text === '') setPriceText(text);
  };

  const livePrice = parseFloat(priceText.replace(',', '.')) || unitPrice || 0;
  const liveTotal = quantity * livePrice;

  // Animated styles
  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }] }));

  const bgStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP);
    const scale = interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0.75, 1], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }] };
  });

  const bgColorStyle = useAnimatedStyle(() => ({
    backgroundColor: translateX.value >= SWIPE_THRESHOLD ? '#B91C1C' : '#DC2626',
  }));

  // Use theme-aware background for the row
  const rowBg = notFound
    ? (theme.dark ? '#2D1515' : '#FFF5F5')
    : checked
      ? (theme.dark ? '#162516' : '#F0FDF4')
      : theme.surface;

  return (
    <View style={styles.swipeContainer}>
      {/* Red action revealed behind the row */}
      <Animated.View style={[styles.swipeBg, bgColorStyle]}>
        <Animated.View style={[styles.swipeBgInner, bgStyle]}>
          <Ionicons name="arrow-redo" size={20} color="#FFF" />
          <Text style={styles.swipeBgText}>{isLastStore ? 'Nicht da' : 'Weiter →'}</Text>
        </Animated.View>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.container, { backgroundColor: rowBg }, rowStyle]}>

          {/* Row 1: checkbox + name */}
          <View style={styles.row1}>
            <TouchableOpacity onPress={handleToggle} activeOpacity={0.7} style={styles.checkWrap} hitSlop={8}>
              <Animated.View style={[
                styles.checkbox,
                { borderColor: checked ? theme.accentGreen : notFound ? theme.danger : theme.border },
                checked && { backgroundColor: theme.accentGreen },
                notFound && { backgroundColor: theme.danger },
                checkStyle,
              ]}>
                {checked && <Ionicons name="checkmark" size={13} color="#FFF" />}
                {notFound && <Ionicons name="close" size={13} color="#FFF" />}
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleToggle} activeOpacity={0.7} style={styles.nameWrap} hitSlop={4}>
              <Text style={[
                styles.name,
                { color: theme.text },
                checked && { color: theme.textMuted, textDecorationLine: 'line-through' },
                notFound && { color: theme.textMuted, textDecorationLine: 'line-through' },
              ]} numberOfLines={2}>
                {name}
              </Text>
            </TouchableOpacity>

            {swipeEnabled && (
              <Ionicons name="chevron-forward" size={14} color={theme.border} />
            )}
          </View>

          {/* Row 2: qty × price input → total */}
          {!notFound && (
            <View style={styles.row2}>
              <View style={[styles.qtyBadge, { backgroundColor: theme.surfaceAlt }]}>
                <Text style={[styles.qtyText, { color: theme.textSub }, checked && { opacity: 0.4 }]}>
                  {quantity}×
                </Text>
              </View>

              <View style={[
                styles.priceInputWrap,
                { borderColor: theme.border, backgroundColor: theme.surfaceAlt },
                checked && { opacity: 0.4 },
                priceFromMemory && !checked && { borderColor: theme.accent, borderStyle: 'dashed' },
              ]}>
                {priceFromMemory && !checked && (
                  <Ionicons name="time-outline" size={11} color={theme.accent} style={{ marginRight: 2 }} />
                )}
                <TextInput
                  ref={inputRef}
                  style={[styles.priceInput, { color: theme.text }]}
                  value={priceText}
                  onChangeText={handlePriceChange}
                  onBlur={handlePriceBlur}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={theme.textMuted}
                  editable={!checked}
                  selectTextOnFocus
                />
                <Text style={[styles.currency, { color: theme.textMuted }, checked && { opacity: 0.4 }]}>€</Text>
              </View>

              {liveTotal > 0 ? (
                <Text style={[styles.total, { color: checked ? theme.accentGreen : theme.accent }]}>
                  = {liveTotal.toFixed(2)} €
                </Text>
              ) : !checked ? (
                <TouchableOpacity
                  onPress={() => inputRef.current?.focus()}
                  style={styles.addPriceHint}
                  hitSlop={8}
                >
                  <Ionicons name="pricetag-outline" size={13} color={theme.textMuted} />
                  <Text style={[styles.addPriceText, { color: theme.textMuted }]}>Preis</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {/* Not-found status pill */}
          {notFound && (
            <View style={styles.notFoundLabel}>
              <Ionicons name="arrow-redo-outline" size={13} color={theme.danger} />
              <Text style={[styles.notFoundText, { color: theme.danger }]}>
                {isLastStore ? 'Nicht gefunden' : 'Weitergeleitet →'}
              </Text>
            </View>
          )}

        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeContainer: { position: 'relative', overflow: 'hidden' },

  swipeBg: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', paddingLeft: 22,
  },
  swipeBgInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swipeBgText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  container: { paddingVertical: 12, paddingHorizontal: 16, gap: 8 },

  row1: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkWrap: { paddingTop: 1 },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  nameWrap: { flex: 1 },
  name: { fontSize: 15, lineHeight: 22, fontWeight: '500' },

  row2: { flexDirection: 'row', alignItems: 'center', paddingLeft: 36, gap: 10 },
  qtyBadge: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    minWidth: 34, alignItems: 'center',
  },
  qtyText: { fontSize: 13, fontWeight: '700' },

  priceInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
    gap: 3, minWidth: 86,
  },
  priceInput: { fontSize: 15, fontWeight: '700', minWidth: 52, padding: 0 },
  currency: { fontSize: 13 },

  total: { fontSize: 14, fontWeight: '800', marginLeft: 2 },

  addPriceHint: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, minHeight: 44 },
  addPriceText: { fontSize: 12 },

  notFoundLabel: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 36 },
  notFoundText: { fontSize: 12, fontWeight: '600' },
});

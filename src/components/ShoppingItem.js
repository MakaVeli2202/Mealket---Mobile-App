import React, { useRef, useState, useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, TextInput, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withSequence, withDelay,
  runOnJS, interpolate, interpolateColor, Extrapolation,
  FadeInDown, FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';

let Gesture, GestureDetector;
if (Platform.OS !== 'web') {
  const GH = require('react-native-gesture-handler');
  Gesture = GH.Gesture;
  GestureDetector = GH.GestureDetector;
}

const SWIPE_THRESHOLD = 80;
const SWIPE_MAX = 120;

export default function ShoppingItem({
  item, onToggle, onPriceChange, onNotFound, onRestore, isLastStore, isNotFoundBucket, entryIndex = 0,
}) {
  const { theme, tr } = useSettings();
  const { name, quantity, unitPrice, checked, notFound, priceFromMemory } = item;
  const [priceText, setPriceText] = useState(unitPrice > 0 ? unitPrice.toFixed(2) : '');
  const [nameExpanded, setNameExpanded] = useState(false);
  const inputRef = useRef(null);

  // ── Swipe gesture ──────────────────────────────────────────────────────────
  const translateX = useSharedValue(0);
  const triggered = useSharedValue(false);
  const swipeEnabled = !isNotFoundBucket && !checked && !notFound;

  const panGesture = Platform.OS !== 'web' ? Gesture.Pan()
    .enabled(swipeEnabled)
    .activeOffsetX(20)
    .failOffsetY([-20, 20])
    .onUpdate((e) => {
      const x = Math.min(Math.max(e.translationX, 0), SWIPE_MAX);
      translateX.value = x;
      triggered.value = x >= SWIPE_THRESHOLD;
    })
    .onEnd(() => {
      if (triggered.value) {
        translateX.value = withTiming(0, { duration: 200 });
        runOnJS(onNotFound)();
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 240 });
      }
      triggered.value = false;
    }) : null;

  // ── Checkbox animation ──────────────────────────────────────────────────────
  const checkScale = useSharedValue(1);
  const checkRotate = useSharedValue(0);

  const handleToggle = () => {
    // Squish → spring back with tiny rotation
    checkScale.value = withSequence(
      withTiming(0.65, { duration: 60 }),
      withSpring(1, { damping: 8, stiffness: 300 })
    );
    checkRotate.value = withSequence(
      withTiming(checked ? -8 : 8, { duration: 60 }),
      withSpring(0, { damping: 10, stiffness: 260 })
    );
    onToggle();
  };

  // ── Animated background (interpolateColor on check/notFound state) ──────────
  // 0 = normal, 1 = checked, 2 = notFound
  const bgAnim = useSharedValue(checked ? 1 : notFound ? 2 : 0);

  useEffect(() => {
    bgAnim.value = withTiming(checked ? 1 : notFound ? 2 : 0, { duration: 280 });
  }, [checked, notFound]);

  const normal   = theme.surface;
  const checkedC = theme.dark ? '#0F2A1A' : '#EDFAF4';
  const nfC      = theme.dark ? '#2D1515' : '#FFF5F5';

  // ── Row slide (swipe) ───────────────────────────────────────────────────────
  const rowSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const checkAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: checkScale.value },
      { rotate: `${checkRotate.value}deg` },
    ],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(bgAnim.value, [0, 1, 2], [normal, checkedC, nfC]),
  }));

  const swipeRevealBg = useAnimatedStyle(() => ({
    backgroundColor: translateX.value >= SWIPE_THRESHOLD ? '#991B1B' : '#DC2626',
  }));

  const swipeIconStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP);
    const scale   = interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0.6, 1], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }] };
  });

  // ── Price helpers ───────────────────────────────────────────────────────────
  const handlePriceBlur = () => {
    const val = parseFloat(priceText.replace(',', '.'));
    onPriceChange(isNaN(val) ? 0 : val);
  };
  const handlePriceChange = (text) => {
    if (/^[\d]*[.,]?[\d]{0,2}$/.test(text) || text === '') setPriceText(text);
  };
  const livePrice = parseFloat(priceText.replace(',', '.')) || unitPrice || 0;
  const liveTotal = quantity * livePrice;

  // ── Render ──────────────────────────────────────────────────────────────────
  const inner = (
    <Animated.View style={[styles.container, bgStyle, Platform.OS !== 'web' && rowSlideStyle]}>
      <View style={styles.row}>

        {/* Checkbox */}
        <TouchableOpacity onPress={handleToggle} activeOpacity={0.7} style={styles.checkWrap} hitSlop={10}>
          <Animated.View style={[
            styles.checkbox,
            {
              borderColor: checked ? theme.accentGreen : notFound ? theme.danger : theme.accent,
              backgroundColor: checked ? theme.accentGreen : notFound ? theme.danger : 'transparent',
            },
            checkAnimStyle,
          ]}>
            {checked && <Ionicons name="checkmark-sharp" size={14} color="#FFF" />}
            {notFound && <Ionicons name="close-sharp" size={14} color="#FFF" />}
            {!checked && !notFound && (
              <View style={[styles.checkDot, { backgroundColor: theme.accent + '50' }]} />
            )}
          </Animated.View>
        </TouchableOpacity>

        {/* Qty badge */}
        {!notFound && (
          <View style={[
            styles.qtyBadge,
            { backgroundColor: checked ? theme.accentGreen + '22' : theme.accent + '18' },
            checked && { opacity: 0.55 },
          ]}>
            <Text style={[styles.qtyText, { color: checked ? theme.accentGreen : theme.accent }]}>
              {quantity}×
            </Text>
          </View>
        )}

        {/* Item name */}
        <TouchableOpacity
          onPress={notFound ? undefined : handleToggle}
          onLongPress={() => setNameExpanded(v => !v)}
          activeOpacity={notFound ? 1 : 0.7}
          style={styles.nameWrap}
          hitSlop={4}
        >
          <Text
            style={[
              styles.name,
              { color: theme.text },
              checked && { color: theme.textMuted, textDecorationLine: 'line-through' },
              notFound && { color: theme.textMuted, textDecorationLine: 'line-through' },
            ]}
            numberOfLines={nameExpanded ? 0 : 1}
            ellipsizeMode="tail"
          >
            {name}
          </Text>
        </TouchableOpacity>

        {/* Right side: price or restore */}
        {notFound ? (
          onRestore && (
            <TouchableOpacity
              onPress={onRestore}
              style={[styles.restoreBtn, { backgroundColor: theme.accent + '18', borderColor: theme.accent + '60' }]}
              hitSlop={8}
            >
              <Ionicons name="arrow-undo" size={15} color={theme.accent} />
            </TouchableOpacity>
          )
        ) : (
          <View style={styles.priceArea}>
            <View style={[
              styles.priceInputWrap,
              { borderColor: priceFromMemory && !checked ? theme.accent : theme.border, backgroundColor: theme.surfaceAlt },
              checked && { opacity: 0.45 },
              priceFromMemory && !checked && { borderStyle: 'dashed' },
            ]}>
              {priceFromMemory && !checked && (
                <Ionicons name="time" size={10} color={theme.accent} style={{ marginRight: 1 }} />
              )}
              <TextInput
                ref={inputRef}
                style={[styles.priceInput, { color: theme.text }]}
                value={priceText}
                onChangeText={handlePriceChange}
                onBlur={handlePriceBlur}
                keyboardType="decimal-pad"
                placeholder="€"
                placeholderTextColor={theme.textMuted}
                editable={!checked}
                selectTextOnFocus
              />
              <Text style={[styles.currency, { color: theme.textMuted }]}>€</Text>
            </View>
            {liveTotal > 0 && (
              <Animated.Text
                entering={FadeIn.duration(200)}
                style={[styles.total, { color: checked ? theme.accentGreen : theme.accent }]}
              >
                {liveTotal.toFixed(2)} €
              </Animated.Text>
            )}
          </View>
        )}

        {swipeEnabled && (
          <Ionicons name="chevron-forward" size={12} color={theme.accent + '60'} />
        )}
      </View>
    </Animated.View>
  );

  return (
    <Animated.View
      entering={FadeInDown.duration(280).delay(entryIndex * 30).springify().damping(18)}
      style={styles.swipeContainer}
    >
      {/* Red swipe-reveal layer */}
      <Animated.View style={[styles.swipeBg, swipeRevealBg]}>
        <Animated.View style={[styles.swipeBgInner, swipeIconStyle]}>
          <Ionicons name="arrow-redo" size={18} color="#FFF" />
          <Text style={styles.swipeBgText}>{isLastStore ? tr.item.notHere : tr.item.next}</Text>
        </Animated.View>
      </Animated.View>

      {Platform.OS !== 'web' && GestureDetector
        ? <GestureDetector gesture={panGesture}>{inner}</GestureDetector>
        : inner}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  swipeContainer: { position: 'relative', overflow: 'hidden' },

  swipeBg: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', paddingLeft: 20,
  },
  swipeBgInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swipeBgText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  container: { paddingVertical: 10, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  checkWrap: { flexShrink: 0 },
  checkbox: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  checkDot: { width: 8, height: 8, borderRadius: 4 },

  qtyBadge: {
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2,
    minWidth: 32, alignItems: 'center', flexShrink: 0,
  },
  qtyText: { fontSize: 12, fontWeight: '800' },

  nameWrap: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '500', lineHeight: 20 },

  priceArea: { flexShrink: 0, alignItems: 'flex-end', gap: 2 },
  priceInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 9,
    paddingHorizontal: 5, paddingVertical: 3,
    gap: 1,
  },
  priceInput: { fontSize: 13, fontWeight: '700', width: 36, padding: 0 },
  currency: { fontSize: 12 },
  total: { fontSize: 12, fontWeight: '800', textAlign: 'right' },

  restoreBtn: {
    width: 32, height: 32, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
});

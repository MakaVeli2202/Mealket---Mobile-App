import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform } from 'react-native';
import { LinearGradient } from './SafeGradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  interpolate, FadeInDown,
} from 'react-native-reanimated';
import { useSettings } from '../context/SettingsContext';
import ShoppingItem from './ShoppingItem';
import ProgressBar from './ProgressBar';

export default function StoreGroup({
  store, storeIndex, totalStores,
  onToggleItem, onPriceChange, onNotFound, onRestoreItem,
}) {
  const { theme, tr } = useSettings();
  const [collapsed, setCollapsed] = useState(false);
  const { name, color, textColor, items, subtotal, checkedCount } = store;
  const isNotFoundBucket = store.id === '__not_found__';
  const isLastStore = storeIndex >= totalStores - 1;
  const total = items.length;
  const progress = total > 0 ? checkedCount / total : 0;
  const allDone = checkedCount === total && total > 0;

  const chevronAnim = useSharedValue(0);

  const handleCollapse = () => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext({
        duration: 280,
        update: { type: 'spring', springDamping: 0.78 },
        create: { type: 'easeInEaseOut', property: 'opacity', duration: 200 },
        delete: { type: 'easeInEaseOut', property: 'opacity', duration: 160 },
      });
    }
    setCollapsed((c) => {
      chevronAnim.value = withSpring(c ? 0 : 1, { damping: 14, stiffness: 200 });
      return !c;
    });
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(chevronAnim.value, [0, 1], [180, 0])}deg` }],
  }));

  const getStoreIcon = (storeName) => {
    if (!storeName) return 'storefront-outline';
    const n = storeName.toLowerCase();
    if (n.includes('bäcker') || n.includes('bread') || n.includes('bakery')) return 'cafe-outline';
    if (n.includes('apothe') || n.includes('pharma') || n.includes('dm')) return 'medkit-outline';
    if (n.includes('markt') || n.includes('rewe') || n.includes('aldi') || n.includes('lidl') || n.includes('edeka')) return 'cart-outline';
    if (n.includes('tank') || n.includes('gas') || n.includes('aral') || n.includes('shell')) return 'car-outline';
    if (n.includes('bio') || n.includes('organic') || n.includes('natur')) return 'leaf-outline';
    if (n.includes('getränk') || n.includes('drink')) return 'wine-outline';
    if (n.includes('fleisch') || n.includes('butcher') || n.includes('metz')) return 'restaurant-outline';
    if (n.includes('online') || n.includes('amazon') || n.includes('zalando')) return 'globe-outline';
    return 'storefront-outline';
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(320).delay(storeIndex * 55).springify().damping(16)}
      style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <TouchableOpacity onPress={handleCollapse} activeOpacity={0.82} hitSlop={4}>
        <LinearGradient
          colors={[color, color + 'CC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.8 }}
          style={styles.header}
        >
          <View style={styles.headerLeft}>
            <View style={[styles.storeIconWrap, { backgroundColor: 'rgba(0,0,0,0.18)' }]}>
              <Ionicons
                name={isNotFoundBucket ? 'alert-circle' : getStoreIcon(name)}
                size={16}
                color={textColor}
              />
            </View>
            <Text style={[styles.storeName, { color: textColor }]}>{name || tr.storeGroup.other}</Text>
            <View style={[styles.countBadge, { backgroundColor: 'rgba(0,0,0,0.22)' }]}>
              <Ionicons name="checkmark-done" size={11} color={textColor + 'CC'} style={{ marginRight: 3 }} />
              <Text style={[styles.countText, { color: textColor }]}>{checkedCount}/{total}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {subtotal > 0 && (
              <View style={styles.subtotalRow}>
                <Ionicons name="cash-outline" size={13} color={textColor + 'BB'} />
                <Text style={[styles.storeSubtotal, { color: textColor }]}>
                  {subtotal.toFixed(2)} â‚¬
                </Text>
              </View>
            )}
            <Animated.View style={chevronStyle}>
              <Ionicons name="chevron-up" size={18} color={textColor} style={{ opacity: 0.85 }} />
            </Animated.View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {!isNotFoundBucket && (
        <ProgressBar progress={progress} color={theme.accentGreen} theme={theme} />
      )}

      {!collapsed && (
        <View>
          {items.map((item, idx) => (
            <React.Fragment key={item.id}>
              {idx > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
              <ShoppingItem
                item={item}
                entryIndex={idx}
                onToggle={() => onToggleItem(storeIndex, item.id)}
                onPriceChange={(price) => onPriceChange(storeIndex, item.id, price)}
                onNotFound={() => onNotFound(storeIndex, item.id)}
                onRestore={isNotFoundBucket && onRestoreItem ? () => onRestoreItem(item.id) : null}
                isLastStore={isLastStore}
                isNotFoundBucket={isNotFoundBucket}
              />
            </React.Fragment>
          ))}
          {items.length === 0 && (
            <View style={[styles.emptyStore, { borderTopColor: theme.border }]}>
              <Ionicons name="checkmark-done-circle" size={20} color={theme.accentGreen} />
              <Text style={[styles.emptyStoreText, { color: theme.textMuted }]}>{tr.storeGroup.allDone}</Text>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16, marginBottom: 14,
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 13,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  storeIconWrap: {
    width: 28, height: 28, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  storeName: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  countBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20,
  },
  countText: { fontSize: 12, fontWeight: '700' },
  subtotalRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  storeSubtotal: { fontSize: 13, fontWeight: '700' },
  divider: { height: 1, marginHorizontal: 14 },
  emptyStore: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 16, borderTopWidth: 1,
  },
  emptyStoreText: { fontSize: 13 },
});

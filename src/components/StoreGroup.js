import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import ShoppingItem from './ShoppingItem';
import ProgressBar from './ProgressBar';

export default function StoreGroup({
  store, storeIndex, totalStores,
  onToggleItem, onPriceChange, onNotFound,
}) {
  const { theme } = useSettings();
  const [collapsed, setCollapsed] = useState(false);
  const { name, color, textColor, items, subtotal, checkedCount } = store;
  const isNotFoundBucket = store.id === '__not_found__';
  const isLastStore = storeIndex >= totalStores - 2;
  const total = items.length;
  const progress = total > 0 ? checkedCount / total : 0;
  const allDone = checkedCount === total && total > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Store header */}
      <TouchableOpacity
        onPress={() => setCollapsed((c) => !c)}
        activeOpacity={0.85}
        hitSlop={4}
      >
        <LinearGradient
          colors={[color, color + 'DD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerLeft}>
            {isNotFoundBucket && (
              <Ionicons name="alert-circle-outline" size={16} color={textColor} style={{ marginRight: 4 }} />
            )}
            <Text style={[styles.storeName, { color: textColor }]}>{name || 'Sonstiges'}</Text>
            <View style={[styles.countBadge, { backgroundColor: 'rgba(0,0,0,0.18)' }]}>
              <Text style={[styles.countText, { color: textColor }]}>{checkedCount}/{total}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {subtotal > 0 && (
              <Text style={[styles.storeSubtotal, { color: textColor }]}>
                - {subtotal.toFixed(2)} €
              </Text>
            )}
            <Ionicons
              name={collapsed ? 'chevron-down' : 'chevron-up'}
              size={18} color={textColor} style={{ opacity: 0.8 }}
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Progress bar under header */}
      {!isNotFoundBucket && (
        <ProgressBar progress={progress} color={allDone ? theme.accentGreen : color} theme={theme} />
      )}

      {/* Items */}
      {!collapsed && (
        <View>
          {items.map((item, idx) => (
            <React.Fragment key={item.id}>
              {idx > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
              <ShoppingItem
                item={item}
                onToggle={() => onToggleItem(storeIndex, item.id)}
                onPriceChange={(price) => onPriceChange(storeIndex, item.id, price)}
                onNotFound={() => onNotFound(storeIndex, item.id)}
                isLastStore={isLastStore}
                isNotFoundBucket={isNotFoundBucket}
              />
            </React.Fragment>
          ))}
          {items.length === 0 && (
            <View style={[styles.emptyStore, { borderTopColor: theme.border }]}>
              <Ionicons name="checkmark-done-outline" size={18} color={theme.accentGreen} />
              <Text style={[styles.emptyStoreText, { color: theme.textMuted }]}>Alle Artikel erledigt</Text>
            </View>
          )}
        </View>
      )}
    </View>
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
    paddingHorizontal: 16, paddingVertical: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  storeName: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  countText: { fontSize: 12, fontWeight: '700' },
  storeSubtotal: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1, marginHorizontal: 16 },
  emptyStore: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 16, borderTopWidth: 1,
  },
  emptyStoreText: { fontSize: 13 },
});

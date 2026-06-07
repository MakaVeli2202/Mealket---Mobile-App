import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withSequence,
  FadeInDown, FadeInRight, SlideOutRight,
  Layout,
} from 'react-native-reanimated';
import { useSettings } from '../context/SettingsContext';
import { useShopping } from '../context/ShoppingContext';
import GlassBg from '../components/GlassBg';

// ── Editable item row ────────────────────────────────────────────────────────
function EditableItem({ item, storeIdx, onUpdate, onRemove, theme, index }) {
  const [editingName, setEditingName] = useState(false);
  const [nameText, setNameText] = useState(item.name);
  const [qtyText, setQtyText] = useState(String(item.quantity));
  const [priceText, setPriceText] = useState(item.unitPrice > 0 ? item.unitPrice.toFixed(2) : '');

  const removeScale = useSharedValue(1);

  const commitName = () => {
    setEditingName(false);
    const n = nameText.trim();
    if (n) onUpdate(storeIdx, item.id, { name: n });
    else setNameText(item.name);
  };

  const commitQty = (val) => {
    const q = parseInt(val, 10);
    if (!isNaN(q) && q > 0) {
      onUpdate(storeIdx, item.id, { quantity: q, subtotal: q * (item.unitPrice || 0) });
    } else {
      setQtyText(String(item.quantity));
    }
  };

  const commitPrice = (val) => {
    const price = isNaN(parseFloat(val.replace(',', '.'))) ? 0 : parseFloat(val.replace(',', '.'));
    onUpdate(storeIdx, item.id, { unitPrice: price, subtotal: (item.quantity || 1) * price });
  };

  const handleRemove = () => {
    removeScale.value = withSequence(
      withTiming(1.15, { duration: 80 }),
      withTiming(0, { duration: 140 })
    );
    setTimeout(() => onRemove(storeIdx, item.id), 180);
  };

  const removeStyle = useAnimatedStyle(() => ({ transform: [{ scale: removeScale.value }] }));

  const total = (item.quantity || 1) * (parseFloat(priceText.replace(',', '.')) || 0);

  return (
    <Animated.View
      entering={FadeInRight.duration(260).delay(index * 35).springify().damping(18)}
      layout={Layout.springify().damping(18)}
      style={[styles.itemRow, { borderTopColor: theme.border }]}
    >
      {/* Left: index number */}
      <View style={[styles.itemNum, { backgroundColor: theme.surfaceAlt }]}>
        <Text style={[styles.itemNumText, { color: theme.textMuted }]}>{index + 1}</Text>
      </View>

      {/* Main content */}
      <View style={styles.itemMain}>
        {editingName ? (
          <TextInput
            autoFocus
            style={[styles.nameInput, { color: theme.text, borderColor: theme.accent, backgroundColor: theme.accentLight }]}
            value={nameText}
            onChangeText={setNameText}
            onBlur={commitName}
            onSubmitEditing={commitName}
            returnKeyType="done"
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity onPress={() => setEditingName(true)} activeOpacity={0.7} style={styles.nameBtn}>
            <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={[styles.editBadge, { backgroundColor: theme.accent + '15' }]}>
              <Ionicons name="pencil" size={9} color={theme.accent} />
            </View>
          </TouchableOpacity>
        )}

        {/* Qty × Price */}
        <View style={styles.fieldsRow}>
          {/* Qty */}
          <View style={[styles.fieldWrap, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
            <TextInput
              style={[styles.fieldInput, { color: theme.text }]}
              value={qtyText}
              onChangeText={setQtyText}
              onBlur={(e) => commitQty(e.nativeEvent.text)}
              onSubmitEditing={(e) => commitQty(e.nativeEvent.text)}
              keyboardType="number-pad"
              selectTextOnFocus
            />
            <Text style={[styles.fieldLabel, { color: theme.accent }]}>qty</Text>
          </View>

          <Text style={[styles.multiplySign, { color: theme.textMuted }]}>×</Text>

          {/* Price */}
          <View style={[styles.fieldWrap, styles.fieldWrapWide, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
            <TextInput
              style={[styles.fieldInput, { color: theme.text }]}
              value={priceText}
              onChangeText={setPriceText}
              onBlur={(e) => commitPrice(e.nativeEvent.text)}
              onSubmitEditing={(e) => commitPrice(e.nativeEvent.text)}
              keyboardType="decimal-pad"
              placeholder="—"
              placeholderTextColor={theme.textMuted}
              selectTextOnFocus
            />
            <Text style={[styles.fieldLabel, { color: theme.accent }]}>€</Text>
          </View>

          {total > 0 && (
            <View style={[styles.totalBadge, { backgroundColor: theme.accent + '18' }]}>
              <Text style={[styles.totalText, { color: theme.accent }]}>{total.toFixed(2)} €</Text>
            </View>
          )}
        </View>
      </View>

      {/* Remove */}
      <Animated.View style={removeStyle}>
        <TouchableOpacity
          style={[styles.removeBtn, { backgroundColor: theme.danger + '15' }]}
          onPress={handleRemove}
          hitSlop={8}
        >
          <Ionicons name="close" size={15} color={theme.danger} />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function ReviewScreen({ navigation, route }) {
  const { theme, tr } = useSettings();
  const r = tr.review;
  const { parsedList } = route.params;
  const { loadList, saveToHistory } = useShopping();
  const [stores, setStores] = useState(parsedList.stores);
  const tabBarHeight = Platform.OS === 'ios' ? 96 : 80;

  const removeItem = (storeIndex, itemId) => {
    setStores((prev) =>
      prev.map((store, si) => {
        if (si !== storeIndex) return store;
        return { ...store, items: store.items.filter((i) => i.id !== itemId) };
      }).filter((store) => store.items.length > 0)
    );
  };

  const updateItem = (storeIndex, itemId, patch) => {
    setStores((prev) =>
      prev.map((store, si) => {
        if (si !== storeIndex) return store;
        const items = store.items.map((i) => i.id === itemId ? { ...i, ...patch } : i);
        const subtotal = items.reduce((s, i) => s + (i.subtotal || 0), 0);
        return { ...store, items, subtotal };
      })
    );
  };

  const handleConfirm = async () => {
    const grandTotal = stores.reduce((s, g) => Math.round((s + (g.subtotal || 0)) * 100) / 100, 0);
    const finalList = { ...parsedList, stores, grandTotal };
    loadList(finalList);
    await saveToHistory(finalList);
    navigation.navigate('Checklist');
  };

  const totalItems = stores.reduce((s, g) => s + g.items.length, 0);
  const totalStores = stores.length;
  const hasMultipleStores = totalStores > 1;

  const ListHeader = (
    <Animated.View entering={FadeInDown.duration(300).springify().damping(20)}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={18} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>{r.title}</Text>
          <View style={styles.subtitleRow}>
            <View style={[styles.statChip, { backgroundColor: theme.accent + '18' }]}>
              <Ionicons name="list-sharp" size={11} color={theme.accent} />
              <Text style={[styles.statText, { color: theme.accent }]}>{totalItems} {r.itemsFound}</Text>
            </View>
            {hasMultipleStores && (
              <View style={[styles.statChip, { backgroundColor: theme.surfaceAlt }]}>
                <Ionicons name="storefront-sharp" size={11} color={theme.textMuted} />
                <Text style={[styles.statText, { color: theme.textMuted }]}>{totalStores} stores</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={[styles.instructionBanner, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        <Ionicons name="information-circle-outline" size={14} color={theme.accent} />
        <Text style={[styles.instructionText, { color: theme.textSub }]}>{r.tapToEdit}</Text>
      </View>
    </Animated.View>
  );

  return (
    <GlassBg theme={theme}>
    <SafeAreaView style={[styles.root, { backgroundColor: 'transparent' }]}>
      <FlatList
        data={stores}
        keyExtractor={(_, i) => i.toString()}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 140 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: storeData, index: si }) => {
          const storeIdx = stores.indexOf(storeData);
          return (
            <Animated.View
              entering={FadeInDown.duration(300).delay(si * 60).springify().damping(18)}
              layout={Layout.springify().damping(18)}
              style={[styles.storeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              {/* Store header */}
              <LinearGradient
                colors={[storeData.color, storeData.color + 'BB']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.6 }}
                style={styles.storeHeader}
              >
                <View style={[styles.storeIconWrap, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                  <Ionicons name="storefront-sharp" size={14} color={storeData.textColor} />
                </View>
                <Text style={[styles.storeHeaderText, { color: storeData.textColor }]}>
                  {storeData.name || r.items || 'Store'}
                </Text>
                <View style={[styles.storeCountBadge, { backgroundColor: 'rgba(0,0,0,0.22)' }]}>
                  <Text style={[styles.storeCountText, { color: storeData.textColor }]}>
                    {storeData.items.length} {r.items}
                  </Text>
                </View>
              </LinearGradient>

              {/* Items */}
              {storeData.items.map((product, idx) => (
                <EditableItem
                  key={product.id}
                  item={product}
                  storeIdx={storeIdx}
                  onUpdate={updateItem}
                  onRemove={removeItem}
                  theme={theme}
                  index={idx}
                />
              ))}
            </Animated.View>
          );
        }}
      />

      {/* ── Confirm footer ── */}
      <Animated.View
        entering={FadeInDown.duration(350).delay(200).springify().damping(20)}
        style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border, paddingBottom: tabBarHeight + 8 }]}
      >
        <View style={styles.footerSummary}>
          <View style={[styles.footerStat, { backgroundColor: theme.surfaceAlt }]}>
            <Ionicons name="cart-sharp" size={14} color={theme.accent} />
            <Text style={[styles.footerStatText, { color: theme.textSub }]}>
              <Text style={{ color: theme.text, fontWeight: '800' }}>{totalItems}</Text> items
            </Text>
          </View>
          <View style={[styles.footerStat, { backgroundColor: theme.surfaceAlt }]}>
            <Ionicons name="storefront-sharp" size={14} color={theme.accent} />
            <Text style={[styles.footerStatText, { color: theme.textSub }]}>
              <Text style={{ color: theme.text, fontWeight: '800' }}>{totalStores}</Text> {totalStores === 1 ? 'store' : 'stores'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleConfirm}
          disabled={totalItems === 0}
          activeOpacity={0.88}
          style={styles.confirmOuter}
        >
          <LinearGradient
            colors={totalItems === 0
              ? [theme.border, theme.border]
              : [theme.accent, theme.accentDark]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.confirmBtn}
          >
            <View style={styles.confirmIconWrap}>
              <Ionicons
                name={totalItems === 0 ? 'close-circle-outline' : 'checkmark-done-sharp'}
                size={20} color="#FFF"
              />
            </View>
            <Text style={styles.confirmText}>{r.confirm}</Text>
            {totalItems > 0 && (
              <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.55)" />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
    </GlassBg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 11, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  subtitleRow: { flexDirection: 'row', gap: 6, marginTop: 5 },
  statChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  statText: { fontSize: 11, fontWeight: '700' },

  instructionBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    marginHorizontal: 16, marginTop: 10, marginBottom: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
  },
  instructionText: { fontSize: 12, flex: 1 },

  list: { padding: 16, gap: 12 },

  storeCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  storeHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  storeIconWrap: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  storeHeaderText: { flex: 1, fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  storeCountBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20,
  },
  storeCountText: { fontSize: 11, fontWeight: '700' },

  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 11,
    borderTopWidth: 1, gap: 10,
  },
  itemNum: {
    width: 24, height: 24, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  itemNumText: { fontSize: 11, fontWeight: '800' },
  itemMain: { flex: 1, gap: 7 },

  nameBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemName: { fontSize: 14, fontWeight: '600', flex: 1 },
  editBadge: {
    width: 18, height: 18, borderRadius: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  nameInput: {
    fontSize: 14, fontWeight: '600',
    borderWidth: 1.5, borderRadius: 9,
    paddingVertical: 5, paddingHorizontal: 10,
  },

  fieldsRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  fieldWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 9,
    paddingHorizontal: 9, paddingVertical: 5, gap: 4, minWidth: 52,
  },
  fieldWrapWide: { minWidth: 64 },
  fieldInput: { fontSize: 13, fontWeight: '700', minWidth: 28, padding: 0 },
  fieldLabel: { fontSize: 11, fontWeight: '700' },
  multiplySign: { fontSize: 13 },
  totalBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  totalText: { fontSize: 12, fontWeight: '800' },

  removeBtn: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, borderTopWidth: 1, gap: 10,
  },
  footerSummary: { flexDirection: 'row', gap: 8 },
  footerStat: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flex: 1, justifyContent: 'center',
  },
  footerStatText: { fontSize: 12 },
  confirmOuter: { borderRadius: 18, overflow: 'hidden' },
  confirmBtn: {
    height: 56, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingHorizontal: 20,
  },
  confirmIconWrap: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  confirmText: { flex: 1, color: '#FFF', fontSize: 17, fontWeight: '800' },
});

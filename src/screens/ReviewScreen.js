import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useShopping } from '../context/ShoppingContext';

function EditableItem({ item, storeIdx, onUpdate, onRemove, theme }) {
  const [editingName, setEditingName] = useState(false);
  const [nameText, setNameText] = useState(item.name);
  const [qtyText, setQtyText] = useState(String(item.quantity));
  const [priceText, setPriceText] = useState(item.unitPrice > 0 ? item.unitPrice.toFixed(2) : '');

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
    const p = parseFloat(val.replace(',', '.'));
    const price = isNaN(p) ? 0 : p;
    onUpdate(storeIdx, item.id, { unitPrice: price, subtotal: (item.quantity || 1) * price });
  };

  const total = (item.quantity || 1) * (parseFloat(priceText.replace(',', '.')) || 0);

  return (
    <View style={[styles.itemRow, { borderTopColor: theme.border }]}>
      <View style={styles.itemMain}>
        {/* Name — tap to edit */}
        {editingName ? (
          <TextInput
            autoFocus
            style={[styles.nameInput, { color: theme.text, borderColor: theme.accent }]}
            value={nameText}
            onChangeText={setNameText}
            onBlur={commitName}
            onSubmitEditing={commitName}
            returnKeyType="done"
          />
        ) : (
          <TouchableOpacity onPress={() => setEditingName(true)} activeOpacity={0.7}>
            <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.editHint, { color: theme.textMuted }]}>tap to edit</Text>
          </TouchableOpacity>
        )}

        {/* Qty × Price → Total row */}
        <View style={styles.qtyPriceRow}>
          {/* Qty */}
          <View style={[styles.numInputWrap, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
            <TextInput
              style={[styles.numInput, { color: theme.text }]}
              value={qtyText}
              onChangeText={setQtyText}
              onBlur={(e) => commitQty(e.nativeEvent.text)}
              onSubmitEditing={(e) => commitQty(e.nativeEvent.text)}
              keyboardType="number-pad"
              selectTextOnFocus
            />
            <Text style={[styles.numLabel, { color: theme.textMuted }]}>qty</Text>
          </View>

          <Text style={[styles.multiply, { color: theme.textMuted }]}>×</Text>

          {/* Unit price */}
          <View style={[styles.numInputWrap, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
            <TextInput
              style={[styles.numInput, { color: theme.text }]}
              value={priceText}
              onChangeText={setPriceText}
              onBlur={(e) => commitPrice(e.nativeEvent.text)}
              onSubmitEditing={(e) => commitPrice(e.nativeEvent.text)}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={theme.textMuted}
              selectTextOnFocus
            />
            <Text style={[styles.numLabel, { color: theme.textMuted }]}>€</Text>
          </View>

          {total > 0 && (
            <Text style={[styles.total, { color: theme.accent }]}>= {total.toFixed(2)} €</Text>
          )}
        </View>
      </View>

      {/* Remove */}
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => onRemove(storeIdx, item.id)}
        hitSlop={8}
      >
        <Ionicons name="close-circle" size={22} color={theme.danger} />
      </TouchableOpacity>
    </View>
  );
}

export default function ReviewScreen({ navigation, route }) {
  const { theme, tr } = useSettings();
  const r = tr.review;
  const { parsedList } = route.params;
  const { loadList, saveToHistory } = useShopping();
  const [stores, setStores] = useState(parsedList.stores);

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>{r.title}</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {totalItems} {r.itemsFound} · tap items to edit
          </Text>
        </View>
      </View>

      <FlatList
        data={stores}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
        renderItem={({ item }) => {
          const storeIdx = stores.indexOf(item);
          return (
            <View style={[styles.storeSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {item.name && (
                <View style={[styles.storeHeader, { backgroundColor: item.color }]}>
                  <Text style={[styles.storeHeaderText, { color: item.textColor }]}>{item.name}</Text>
                  <Text style={[styles.storeCount, { color: item.textColor }]}>{item.items.length} items</Text>
                </View>
              )}
              {item.items.map((product) => (
                <EditableItem
                  key={product.id}
                  item={product}
                  storeIdx={storeIdx}
                  onUpdate={updateItem}
                  onRemove={removeItem}
                  theme={theme}
                />
              ))}
            </View>
          );
        }}
      />

      {/* Confirm footer */}
      <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: totalItems === 0 ? theme.border : theme.accent }]}
          onPress={handleConfirm}
          disabled={totalItems === 0}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
          <Text style={styles.confirmText}>{r.confirm}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 1 },

  list: { padding: 16, gap: 12 },

  storeSection: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 4 },
  storeHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 11,
  },
  storeHeaderText: { fontSize: 15, fontWeight: '800' },
  storeCount: { fontSize: 12, opacity: 0.8 },

  itemRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 12,
    borderTopWidth: 1, gap: 10,
  },
  itemMain: { flex: 1, gap: 8 },

  itemName: { fontSize: 15, fontWeight: '600' },
  editHint: { fontSize: 10, marginTop: 1 },
  nameInput: {
    fontSize: 15, fontWeight: '600',
    borderBottomWidth: 1.5, paddingVertical: 2, paddingHorizontal: 0,
  },

  qtyPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  numInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 9,
    paddingHorizontal: 8, paddingVertical: 5, gap: 4,
  },
  numInput: { fontSize: 14, fontWeight: '700', minWidth: 36, padding: 0 },
  numLabel: { fontSize: 12 },
  multiply: { fontSize: 14 },
  total: { fontSize: 14, fontWeight: '800' },

  removeBtn: { padding: 4, marginTop: 2 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: 28, borderTopWidth: 1,
  },
  confirmBtn: {
    borderRadius: 18, height: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  confirmText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});

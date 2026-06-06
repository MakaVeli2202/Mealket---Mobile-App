import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useShopping } from '../context/ShoppingContext';

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

  const handleConfirm = async () => {
    const grandTotal = stores.reduce((s, g) => Math.round((s + g.subtotal) * 100) / 100, 0);
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
            {totalItems} {r.itemsFound}
          </Text>
        </View>
      </View>

      <FlatList
        data={stores}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={[styles.list, { paddingBottom: 110 }]}
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
                <View key={product.id} style={[styles.itemRow, { borderTopColor: theme.border }]}>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: theme.text }]}>
                      {product.quantity > 1 ? `${product.quantity}× ` : ''}{product.name}
                    </Text>
                    {product.unitPrice > 0 && (
                      <Text style={[styles.itemPrice, { color: theme.accent }]}>
                        {product.subtotal.toFixed(2)} €
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeItem(storeIdx, product.id)}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={22} color={theme.danger} />
                  </TouchableOpacity>
                </View>
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

  storeSection: {
    borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 4,
  },
  storeHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 11,
  },
  storeHeaderText: { fontSize: 15, fontWeight: '800' },
  storeCount: { fontSize: 12, opacity: 0.8 },

  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1,
  },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 15, fontWeight: '500' },
  itemPrice: { fontSize: 13, fontWeight: '600' },
  removeBtn: { padding: 4 },

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

import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useShopping } from '../context/ShoppingContext';
import StoreGroup from '../components/StoreGroup';
import PriceSummary from '../components/PriceSummary';

export default function ChecklistScreen({ navigation }) {
  const { theme, tr } = useSettings();
  const { currentList, toggleItem, updateItemPrice, moveItemToNextStore } = useShopping();
  const c = tr.checklist;

  if (!currentList) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <View style={styles.empty}>
          <Ionicons name="cart-outline" size={64} color={theme.border} />
          <Text style={[styles.emptyTitle, { color: theme.textMuted }]}>{c.noList}</Text>
          <TouchableOpacity style={[styles.newBtn, { backgroundColor: theme.accent }]} onPress={() => navigation.navigate('Paste')}>
            <Text style={styles.newBtnText}>{c.createList}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { stores, title } = currentList;
  const regularStores = stores.filter((s) => s.id !== '__not_found__');
  const notFoundStore = stores.find((s) => s.id === '__not_found__');
  const allStores = notFoundStore ? [...regularStores, notFoundStore] : regularStores;

  const totalItems = stores.reduce((s, g) => s + g.items.length, 0);
  const checkedTotal = stores.reduce((s, g) => s + g.checkedCount, 0);

  const ListHeader = (
    <View style={[styles.header, { backgroundColor: theme.bg }]}>
      <View style={styles.headerTop}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={[styles.listTitle, { color: theme.text }]} numberOfLines={2}>
            {title || c.title}
          </Text>
          <Text style={[styles.progress, { color: theme.textMuted }]}>
            {c.progress(checkedTotal, totalItems)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.newListBtn, { backgroundColor: theme.accentLight }]}
          onPress={() => navigation.navigate('Paste')}
        >
          <Ionicons name="add" size={18} color={theme.accent} />
          <Text style={[styles.newListText, { color: theme.accent }]}>{c.new}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.legend}>
        {regularStores.map((s, i) => (
          <View key={i} style={[styles.legendPill, { backgroundColor: s.color }]}>
            <Text style={[styles.legendText, { color: s.textColor }]}>{s.name || tr.storeGroup.other}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.swipeHint, { backgroundColor: theme.surfaceAlt }]}>
        <Ionicons name="swap-horizontal-outline" size={14} color={theme.textMuted} />
        <Text style={[styles.swipeHintText, { color: theme.textMuted }]}>{c.swipeHint}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <FlatList
        data={allStores}
        keyExtractor={(s) => s.id || s.name || String(Math.random())}
        renderItem={({ item: store }) => (
          <StoreGroup
            store={store}
            storeIndex={stores.indexOf(store)}
            totalStores={stores.length}
            onToggleItem={toggleItem}
            onPriceChange={updateItemPrice}
            onNotFound={moveItemToNextStore}
          />
        )}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={
          <>
            <PriceSummary stores={allStores} />
            <View style={{ height: 40 }} />
          </>
        }
        contentContainerStyle={{ paddingTop: 8 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12, gap: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  listTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, lineHeight: 24 },
  progress: { fontSize: 13, marginTop: 3 },
  newListBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  newListText: { fontSize: 13, fontWeight: '700' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  legendPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  legendText: { fontSize: 12, fontWeight: '700' },
  swipeHint: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10 },
  swipeHintText: { fontSize: 11, flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyTitle: { fontSize: 17 },
  newBtn: { borderRadius: 16, paddingVertical: 12, paddingHorizontal: 28 },
  newBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});

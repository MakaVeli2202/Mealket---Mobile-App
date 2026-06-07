import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useSettings } from '../context/SettingsContext';
import { useShopping } from '../context/ShoppingContext';
import StoreGroup from '../components/StoreGroup';
import PriceSummary from '../components/PriceSummary';
import ProgressBar from '../components/ProgressBar';

export default function ChecklistScreen({ navigation }) {
  const { theme, tr } = useSettings();
  const { currentList, toggleItem, updateItemPrice, moveItemToNextStore, restoreItem } = useShopping();
  const c = tr.checklist;

  if (!currentList) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <View style={styles.empty}>
          <Ionicons name="cart-outline" size={64} color={theme.accent + '60'} />
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

  const totalItems   = stores.reduce((s, g) => s + g.items.length, 0);
  const checkedTotal = stores.reduce((s, g) => s + g.checkedCount, 0);
  const globalProgress = totalItems > 0 ? checkedTotal / totalItems : 0;
  const allDone = checkedTotal === totalItems && totalItems > 0;
  const progressColor = allDone ? theme.accentGreen : theme.accent;

  const ListHeader = (
    <Animated.View
      entering={FadeInDown.duration(300).springify().damping(18)}
      style={[styles.header, { backgroundColor: theme.bg }]}
    >
      {/* Title row */}
      <View style={styles.headerTop}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <View style={styles.titleRow}>
            <Ionicons name="list-circle" size={22} color={theme.accent} style={{ marginRight: 6 }} />
            <Text style={[styles.listTitle, { color: theme.text }]} numberOfLines={2}>
              {title || c.title}
            </Text>
          </View>
          {/* Progress counter */}
          <View style={styles.progressRow}>
            <Text style={[styles.progressCount, { color: progressColor }]}>{checkedTotal}</Text>
            <Text style={[styles.progressSep, { color: theme.textMuted }]}> / {totalItems}</Text>
            {allDone && (
              <Animated.View entering={FadeIn.duration(300)} style={{ marginLeft: 6 }}>
                <Ionicons name="checkmark-circle" size={18} color={theme.accentGreen} />
              </Animated.View>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.newListBtn, { backgroundColor: theme.accentLight, borderColor: theme.accent + '40', borderWidth: 1 }]}
          onPress={() => navigation.navigate('Paste')}
        >
          <Ionicons name="add-circle-outline" size={17} color={theme.accent} />
          <Text style={[styles.newListText, { color: theme.accent }]}>{c.new}</Text>
        </TouchableOpacity>
      </View>

      {/* Global progress bar */}
      <ProgressBar progress={globalProgress} color={progressColor} theme={theme} />

      {/* Store legend */}
      {regularStores.length > 0 && (
        <View style={styles.legend}>
          {regularStores.map((s, i) => (
            <View key={i} style={[styles.legendPill, { backgroundColor: s.color }]}>
              <Ionicons name="storefront" size={11} color={s.textColor + 'CC'} style={{ marginRight: 3 }} />
              <Text style={[styles.legendText, { color: s.textColor }]}>{s.name || tr.storeGroup.other}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Swipe hint */}
      <View style={[styles.swipeHint, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, borderWidth: 1 }]}>
        <Ionicons name="swap-horizontal" size={14} color={theme.accent} />
        <Text style={[styles.swipeHintText, { color: theme.textSub }]}>{c.swipeHint}</Text>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <FlatList
        data={allStores}
        keyExtractor={(s) => s.id || s.name || s.color}
        renderItem={({ item: store }) => (
          <StoreGroup
            store={store}
            storeIndex={stores.indexOf(store)}
            totalStores={stores.length}
            onToggleItem={toggleItem}
            onPriceChange={updateItemPrice}
            onNotFound={moveItemToNextStore}
            onRestoreItem={restoreItem}
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
  header: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 10, gap: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  listTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3, lineHeight: 24, flex: 1 },
  progressRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  progressCount: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  progressSep: { fontSize: 16, fontWeight: '600' },
  newListBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  newListText: { fontSize: 13, fontWeight: '700' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  legendPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  legendText: { fontSize: 12, fontWeight: '700' },
  swipeHint: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 12 },
  swipeHintText: { fontSize: 11, flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyTitle: { fontSize: 17 },
  newBtn: { borderRadius: 16, paddingVertical: 12, paddingHorizontal: 28 },
  newBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});

import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useShopping } from '../context/ShoppingContext';
import GlassBg from '../components/GlassBg';

function formatDate(iso, lang) {
  const d = new Date(iso);
  return d.toLocaleDateString(lang === 'de' ? 'de-AT' : 'en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function HistoryScreen({ navigation }) {
  const { theme, tr, language } = useSettings();
  const { history, deleteFromHistory, loadList } = useShopping();
  const tabBarHeight = Platform.OS === 'ios' ? 96 : 80;
  const h = tr.history;

  const handleOpen = (list) => {
    loadList(JSON.parse(JSON.stringify(list)));
    navigation.navigate('Checklist');
  };

  const handleDelete = (id) => {
    Alert.alert(h.deleteTitle, h.deleteMsg, [
      { text: h.cancel, style: 'cancel' },
      { text: h.delete, style: 'destructive', onPress: () => deleteFromHistory(id) },
    ]);
  };

  if (!history.length) {
    return (
      <GlassBg theme={theme}><SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>{h.title}</Text>
        </View>
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={64} color={theme.border} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>{h.empty}</Text>
          <Text style={[styles.emptyDesc, { color: theme.textMuted }]}>{h.emptyDesc}</Text>
          <Text style={[styles.autoDelete, { color: theme.textMuted }]}>{h.autoDelete}</Text>
        </View>
      </SafeAreaView></GlassBg>
    );
  }

  return (
    <GlassBg theme={theme}>
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item: list }) => {
          const totalItems = list.stores.reduce((s, g) => s + g.items.length, 0);
          const namedStores = list.stores.filter((s) => s.name && s.id !== '__not_found__');
          const storeLabel = namedStores.map((s) => s.name).join(' + ') || h.title;
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => handleOpen(list)}
              activeOpacity={0.7}
            >
              <View style={styles.pillRow}>
                {namedStores.slice(0, 4).map((s, i) => (
                  <View key={i} style={[styles.pill, { backgroundColor: s.color }]}>
                    <Text style={[styles.pillText, { color: s.textColor }]}>{s.name}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.cardBody}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                    {list.title || storeLabel}
                  </Text>
                  <Text style={[styles.cardMeta, { color: theme.textMuted }]}>
                    {h.items(totalItems)} {'\u00b7'} {formatDate(list.createdAt, language)}
                  </Text>
                </View>
                <View style={styles.cardRight}>
                  {list.grandTotal > 0 && (
                    <Text style={[styles.cardTotal, { color: theme.accent }]}>
                      {list.grandTotal.toLocaleString(language === 'de' ? 'de-DE' : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </Text>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                </View>
              </View>
              <TouchableOpacity
                style={[styles.deleteRow, { borderTopColor: theme.border, backgroundColor: theme.surfaceAlt }]}
                onPress={() => handleDelete(list.id)}
              >
                <Ionicons name="trash-outline" size={15} color={theme.textMuted} />
                <Text style={[styles.deleteText, { color: theme.textMuted }]}>{h.delete}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>{h.title}</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>{h.subtitle(history.length)}</Text>
            <Text style={[styles.autoDeleteNote, { color: theme.textMuted }]}>{h.autoDelete}</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
      />
    </SafeAreaView>
    </GlassBg>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  autoDeleteNote: { fontSize: 11, marginTop: 6 },
  card: {
    marginHorizontal: 16, marginBottom: 10,
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
  },
  pillRow: { flexDirection: 'row', gap: 6, padding: 12, paddingBottom: 8 },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  pillText: { fontSize: 12, fontWeight: '700' },
  cardBody: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  cardMeta: { fontSize: 13, marginTop: 2 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTotal: { fontSize: 15, fontWeight: '700' },
  deleteRow: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderTopWidth: 1 },
  deleteText: { fontSize: 13 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  autoDelete: { fontSize: 12, textAlign: 'center', marginTop: 8 },
});

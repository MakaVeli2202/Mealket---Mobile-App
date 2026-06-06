import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useCalories } from '../context/CalorieContext';

function DateSection({ date, entries, theme, c, onRemove, language }) {
  const totalKcal = entries.reduce((s, e) => s + (e.calories || 0), 0);
  const totalFat = entries.reduce((s, e) => s + (e.fatG || 0), 0);
  const totalCarbs = entries.reduce((s, e) => s + (e.carbsG || 0), 0);
  const totalProtein = entries.reduce((s, e) => s + (e.proteinG || 0), 0);

  const label = new Date(date + 'T12:00:00').toLocaleDateString(
    language === 'de' ? 'de-AT' : 'en-GB',
    { weekday: 'long', day: 'numeric', month: 'long' }
  );

  return (
    <View style={styles.section}>
      {/* Date header */}
      <View style={[styles.dateHeader, { backgroundColor: theme.surfaceAlt }]}>
        <View>
          <Text style={[styles.dateLabel, { color: theme.text }]}>{label}</Text>
          <Text style={[styles.dateSummary, { color: theme.textMuted }]}>
            {totalKcal} kcal · {c.fat} {Math.round(totalFat)}g · {c.carbs} {Math.round(totalCarbs)}g · {c.protein} {Math.round(totalProtein)}g
          </Text>
        </View>
        <Text style={[styles.dateKcal, { color: theme.accent }]}>{totalKcal}</Text>
      </View>

      {/* Entries */}
      {entries.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.entry, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onLongPress={() => Alert.alert(c.removeTitle, `${item.name}?`, [
            { text: c.cancel, style: 'cancel' },
            { text: c.delete, style: 'destructive', onPress: () => onRemove(item.id) },
          ])}
          activeOpacity={0.8}
        >
          <View style={styles.entryLeft}>
            <Text style={[styles.entryName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.entryMeta, { color: theme.textMuted }]}>
              {item.amountG}g · {item.kcalPer100g} kcal/100g · {item.time}
            </Text>
            {(item.fatG > 0 || item.carbsG > 0 || item.proteinG > 0) && (
              <Text style={[styles.entryMacros, { color: theme.textMuted }]}>
                {c.fat} {item.fatG}g · {c.carbs} {item.carbsG}g · {c.protein} {item.proteinG}g
              </Text>
            )}
          </View>
          <View style={styles.entryRight}>
            <Text style={[styles.entryKcal, { color: theme.accent }]}>{item.calories}</Text>
            <Text style={[styles.entryKcalLabel, { color: theme.textMuted }]}>kcal</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function CalorieHistoryScreen({ navigation }) {
  const { theme, tr, language } = useSettings();
  const { entriesByDate, removeEntry } = useCalories();
  const c = tr.calories;

  const sortedDates = Object.keys(entriesByDate).sort((a, b) => b.localeCompare(a));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{c.historyTitle}</Text>
        <View style={{ width: 36 }} />
      </View>

      {sortedDates.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={56} color={theme.border} />
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>{c.noHistory}</Text>
        </View>
      ) : (
        <FlatList
          data={sortedDates}
          keyExtractor={(d) => d}
          renderItem={({ item: date }) => (
            <DateSection
              date={date}
              entries={entriesByDate[date]}
              theme={theme}
              c={c}
              onRemove={removeEntry}
              language={language}
            />
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700' },

  section: { marginBottom: 8 },
  dateHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, marginTop: 8,
  },
  dateLabel: { fontSize: 14, fontWeight: '700' },
  dateSummary: { fontSize: 11, marginTop: 2 },
  dateKcal: { fontSize: 24, fontWeight: '800' },

  entry: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 6,
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  entryLeft: { flex: 1 },
  entryName: { fontSize: 15, fontWeight: '600' },
  entryMeta: { fontSize: 12, marginTop: 2 },
  entryMacros: { fontSize: 11, marginTop: 2 },
  entryRight: { alignItems: 'flex-end', marginLeft: 12 },
  entryKcal: { fontSize: 22, fontWeight: '800' },
  entryKcalLabel: { fontSize: 11 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 15, textAlign: 'center' },
});

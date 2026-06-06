import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useCalories } from '../context/CalorieContext';

// ─── Meal metadata ────────────────────────────────────────────────────────────
const MEAL_META = {
  breakfast: { label: 'Frühstück',   icon: 'sunny-outline',       pct: 0.25, bannerColor: '#FF9F0A' },
  lunch:     { label: 'Mittagessen', icon: 'restaurant-outline',  pct: 0.35, bannerColor: '#0A84FF' },
  dinner:    { label: 'Abendessen',  icon: 'moon-outline',        pct: 0.30, bannerColor: '#BF5AF2' },
  snack:     { label: 'Snacks',      icon: 'apple-outline',       pct: 0.10, bannerColor: '#00C896' },
};

// ─── Stat card (2x2 grid) ─────────────────────────────────────────────────────
function StatCard({ label, value, unit, color, theme }) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.surfaceAlt }]}>
      <Text style={[styles.statValue, { color: color || theme.text }]}>{value}</Text>
      <Text style={[styles.statUnit, { color: theme.textMuted }]}>{unit}</Text>
      <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

// ─── Progress bar row ─────────────────────────────────────────────────────────
function ProgressRow({ label, eaten, goal, color, theme }) {
  const pct = goal > 0 ? Math.min(eaten / goal, 1) : 0;
  const isOver = eaten > goal;
  return (
    <View style={styles.progressRow}>
      <View style={styles.progressLabelRow}>
        <Text style={[styles.progressLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.progressVal, { color: isOver ? theme.danger : theme.textMuted }]}>
          {Math.round(eaten)} / {Math.round(goal)}
          {label === 'Kalorien' ? ' kcal' : ' g'}
        </Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: theme.surfaceAlt }]}>
        <View style={[
          styles.progressFill,
          { width: `${pct * 100}%`, backgroundColor: isOver ? theme.danger : color },
        ]} />
      </View>
    </View>
  );
}

// ─── Food item row ────────────────────────────────────────────────────────────
function FoodItem({ entry, theme, onDelete }) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      hitSlop={8}
      onLongPress={onDelete}
      style={[styles.foodItem, { borderBottomColor: theme.border }]}
    >
      <View style={styles.foodItemLeft}>
        <Text style={[styles.foodName, { color: theme.text }]} numberOfLines={1}>
          {entry.name}
        </Text>
        <Text style={[styles.foodMeta, { color: theme.textMuted }]}>
          {entry.amountG}g
          {entry.carbsG > 0   ? `  C ${entry.carbsG}g`   : ''}
          {entry.proteinG > 0 ? `  E ${entry.proteinG}g` : ''}
          {entry.fatG > 0     ? `  F ${entry.fatG}g`     : ''}
        </Text>
      </View>
      <View style={styles.foodItemRight}>
        <Text style={[styles.foodKcal, { color: theme.accent }]}>{entry.calories} kcal</Text>
        <Text style={[styles.foodTime, { color: theme.textMuted }]}>{entry.time}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function MealDetailScreen({ route, navigation }) {
  const { meal } = route.params;
  const { theme, calorieGoal } = useSettings();
  const { todayByMeal, removeEntry } = useCalories();

  const meta    = MEAL_META[meal] || MEAL_META.snack;
  const entries = todayByMeal[meal] || [];

  // Totals
  const totalKcal    = entries.reduce((s, e) => s + (e.calories  || 0), 0);
  const totalCarbs   = entries.reduce((s, e) => s + (e.carbsG    || 0), 0);
  const totalProtein = entries.reduce((s, e) => s + (e.proteinG  || 0), 0);
  const totalFat     = entries.reduce((s, e) => s + (e.fatG      || 0), 0);

  // Meal-specific goals
  const kcalGoal   = Math.round(calorieGoal * meta.pct);
  const carbGoal   = Math.round(kcalGoal * 0.50 / 4);
  const protGoal   = Math.round(kcalGoal * 0.20 / 4);
  const fatGoal    = Math.round(kcalGoal * 0.30 / 9);

  const confirmDelete = (entry) => {
    Alert.alert(
      'Eintrag löschen',
      `"${entry.name}" entfernen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: () => removeEntry(entry.id) },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* ── HEADER BAR ── */}
      <View style={[styles.headerBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          activeOpacity={0.75}
          hitSlop={8}
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>{meta.label}</Text>

        <TouchableOpacity activeOpacity={0.75} hitSlop={8} style={styles.headerBtn}>
          <Ionicons name="create-outline" size={22} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── BANNER ── */}
        <View style={[styles.banner, { backgroundColor: meta.bannerColor + 'CC' }]}>
          <View style={[styles.bannerIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name={meta.icon} size={48} color="#FFF" />
          </View>
          <Text style={styles.bannerTitle}>{meta.label}</Text>
          <Text style={styles.bannerSub}>{totalKcal} kcal • {entries.length} Einträge</Text>
        </View>

        {/* ── 2x2 STATS GRID ── */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Kalorien"
            value={totalKcal}
            unit="kcal"
            color={theme.accent}
            theme={theme}
          />
          <StatCard
            label="Kohlenhydrate"
            value={Math.round(totalCarbs)}
            unit="g"
            color={theme.carbs}
            theme={theme}
          />
          <StatCard
            label="Eiweiß"
            value={Math.round(totalProtein)}
            unit="g"
            color={theme.protein}
            theme={theme}
          />
          <StatCard
            label="Fett"
            value={Math.round(totalFat)}
            unit="g"
            color={theme.fat}
            theme={theme}
          />
        </View>

        {/* ── PROGRESS BARS ── */}
        <View style={[styles.progressCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Ziele</Text>
          <ProgressRow
            label="Kalorien"
            eaten={totalKcal}
            goal={kcalGoal}
            color={theme.accent}
            theme={theme}
          />
          <ProgressRow
            label="Kohlenhydrate"
            eaten={totalCarbs}
            goal={carbGoal}
            color={theme.carbs}
            theme={theme}
          />
          <ProgressRow
            label="Eiweiß"
            eaten={totalProtein}
            goal={protGoal}
            color={theme.protein}
            theme={theme}
          />
          <ProgressRow
            label="Fett"
            eaten={totalFat}
            goal={fatGoal}
            color={theme.fat}
            theme={theme}
          />
        </View>

        {/* ── FOOD ITEMS LIST ── */}
        <View style={[styles.foodListCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Lebensmittel</Text>

          {entries.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="nutrition-outline" size={36} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                Noch keine Einträge
              </Text>
            </View>
          ) : (
            entries.map((entry) => (
              <FoodItem
                key={entry.id}
                entry={entry}
                theme={theme}
                onDelete={() => confirmDelete(entry)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* ── FLOATING ADD BUTTON ── */}
      <View style={[styles.fabRow, { borderTopColor: theme.border, backgroundColor: theme.bg }]}>
        <TouchableOpacity
          activeOpacity={0.75}
          style={[styles.addMoreBtn, { backgroundColor: theme.accent }]}
          onPress={() => navigation.navigate('AddFood', { meal })}
        >
          <Ionicons name="add" size={22} color="#FFF" />
          <Text style={styles.addMoreLabel}>Mehr hinzufügen</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Header bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  // Banner
  banner: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 10,
  },
  bannerIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  bannerSub: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
  },

  // 2x2 stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 16,
  },
  statCard: {
    width: '47%',
    flexGrow: 1,
    borderRadius: 18,
    padding: 16,
    gap: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  statUnit: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: -2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },

  // Progress bars card
  progressCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  progressRow: {
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressVal: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Food list card
  foodListCard: {
    marginHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 4,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  foodItemLeft: {
    flex: 1,
    gap: 3,
  },
  foodName: {
    fontSize: 15,
    fontWeight: '700',
  },
  foodMeta: {
    fontSize: 12,
    fontWeight: '500',
  },
  foodItemRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  foodKcal: {
    fontSize: 15,
    fontWeight: '800',
  },
  foodTime: {
    fontSize: 11,
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // FAB row
  fabRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#00C896',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  addMoreLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.2,
  },
});

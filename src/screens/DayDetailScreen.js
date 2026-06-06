import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useCalories } from '../context/CalorieContext';

const MEAL_META = {
  breakfast: { label: 'Breakfast',   icon: 'sunny-outline',      color: '#FF9F0A' },
  lunch:     { label: 'Lunch',       icon: 'restaurant-outline', color: '#0A84FF' },
  dinner:    { label: 'Dinner',      icon: 'moon-outline',       color: '#BF5AF2' },
  snack:     { label: 'Snacks',      icon: 'apple-outline',      color: '#00C896' },
};

const MEAL_META_DE = {
  breakfast: { label: 'Frühstück',   icon: 'sunny-outline',      color: '#FF9F0A' },
  lunch:     { label: 'Mittagessen', icon: 'restaurant-outline', color: '#0A84FF' },
  dinner:    { label: 'Abendessen',  icon: 'moon-outline',       color: '#BF5AF2' },
  snack:     { label: 'Snacks',      icon: 'apple-outline',      color: '#00C896' },
};

function MacroBar({ label, eaten, goal, color, theme }) {
  const pct = goal > 0 ? Math.min(eaten / goal, 1) : 0;
  const isOver = eaten > goal;
  return (
    <View style={styles.macroBarWrap}>
      <View style={styles.macroBarTop}>
        <Text style={[styles.macroName, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.macroVal, { color: isOver ? theme.danger : theme.textMuted }]}>
          {Math.round(eaten)}g / {Math.round(goal)}g
        </Text>
      </View>
      <View style={[styles.macroTrack, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)' }]}>
        <View style={[styles.macroFill, { width: `${pct * 100}%`, backgroundColor: isOver ? theme.danger : color }]} />
      </View>
    </View>
  );
}

function FoodEntry({ entry, theme, onDelete }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onLongPress={onDelete}
      style={[styles.foodRow, { borderBottomColor: theme.border }]}
    >
      <View style={styles.foodLeft}>
        <Text style={[styles.foodName, { color: theme.text }]} numberOfLines={1}>{entry.name}</Text>
        <Text style={[styles.foodMeta, { color: theme.textMuted }]}>
          {entry.amountG}g
          {entry.carbsG > 0   ? `  C ${entry.carbsG}g`   : ''}
          {entry.proteinG > 0 ? `  P ${entry.proteinG}g` : ''}
          {entry.fatG > 0     ? `  F ${entry.fatG}g`     : ''}
        </Text>
      </View>
      <View style={styles.foodRight}>
        <Text style={[styles.foodKcal, { color: theme.accent }]}>{entry.calories}</Text>
        <Text style={[styles.foodKcalLabel, { color: theme.textMuted }]}>kcal</Text>
      </View>
    </TouchableOpacity>
  );
}

function MealSection({ mealKey, entries, theme, calorieGoal, pct, language, onDelete, navigation }) {
  const meta = (language === 'de' ? MEAL_META_DE : MEAL_META)[mealKey] || MEAL_META[mealKey];
  const total = entries.reduce((s, e) => s + (e.calories || 0), 0);
  const goal = Math.round(calorieGoal * pct);

  return (
    <View style={[styles.mealSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.mealHeader}>
        <View style={[styles.mealIconWrap, { backgroundColor: meta.color + '22' }]}>
          <Ionicons name={meta.icon} size={18} color={meta.color} />
        </View>
        <Text style={[styles.mealLabel, { color: theme.text }]}>{meta.label}</Text>
        <Text style={[styles.mealKcal, { color: theme.textMuted }]}>{total} / {goal} kcal</Text>
        <TouchableOpacity
          style={[styles.mealAddBtn, { backgroundColor: theme.accentLight }]}
          onPress={() => navigation.navigate('AddFood', { meal: mealKey })}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color={theme.accent} />
        </TouchableOpacity>
      </View>

      {entries.length === 0 ? (
        <Text style={[styles.emptyMeal, { color: theme.textMuted }]}>Nothing logged yet</Text>
      ) : (
        entries.map((e) => (
          <FoodEntry
            key={e.id}
            entry={e}
            theme={theme}
            onDelete={() => Alert.alert(
              'Remove entry',
              `Remove "${e.name}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => onDelete(e.id) },
              ],
            )}
          />
        ))
      )}
    </View>
  );
}

export default function DayDetailScreen({ navigation }) {
  const { theme, calorieGoal, language } = useSettings();
  const { todayEntries, todayByMeal, removeEntry } = useCalories();

  const totalKcal    = useMemo(() => todayEntries.reduce((s, e) => s + (e.calories  || 0), 0), [todayEntries]);
  const totalCarbs   = useMemo(() => todayEntries.reduce((s, e) => s + (e.carbsG    || 0), 0), [todayEntries]);
  const totalProtein = useMemo(() => todayEntries.reduce((s, e) => s + (e.proteinG  || 0), 0), [todayEntries]);
  const totalFat     = useMemo(() => todayEntries.reduce((s, e) => s + (e.fatG      || 0), 0), [todayEntries]);

  const carbGoal    = Math.round(calorieGoal * 0.50 / 4);
  const proteinGoal = Math.round(calorieGoal * 0.20 / 4);
  const fatGoal     = Math.round(calorieGoal * 0.30 / 9);

  const remaining = Math.max(0, calorieGoal - totalKcal);
  const isOver = totalKcal > calorieGoal;

  const todayLabel = new Date().toLocaleDateString(
    language === 'de' ? 'de-AT' : 'en-US',
    { weekday: 'long', day: 'numeric', month: 'long' },
  );

  const MEAL_PCTS = { breakfast: 0.25, lunch: 0.35, dinner: 0.30, snack: 0.10 };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Today</Text>
          <Text style={[styles.headerSub, { color: theme.textMuted }]}>{todayLabel}</Text>
        </View>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Calorie summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: theme.text }]}>{totalKcal}</Text>
              <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>EATEN</Text>
            </View>

            <View style={styles.summaryCenter}>
              <View style={[styles.kcalRing, { borderColor: isOver ? theme.danger : theme.accent }]}>
                <Text style={[styles.kcalRingNum, { color: isOver ? theme.danger : theme.text }]}>
                  {isOver ? totalKcal - calorieGoal : remaining}
                </Text>
                <Text style={[styles.kcalRingLabel, { color: theme.textMuted }]}>
                  {isOver ? 'over' : 'left'}
                </Text>
              </View>
            </View>

            <View style={[styles.summaryItem, { alignItems: 'flex-end' }]}>
              <Text style={[styles.summaryNum, { color: theme.text }]}>{calorieGoal}</Text>
              <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>GOAL</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={[styles.calorieTrack, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)' }]}>
            <View style={[
              styles.calorieFill,
              {
                width: `${Math.min((totalKcal / calorieGoal) * 100, 100)}%`,
                backgroundColor: isOver ? theme.danger : theme.accent,
              },
            ]} />
          </View>
        </View>

        {/* Macros */}
        <View style={[styles.macroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Macros</Text>
          <MacroBar label="Carbs"   eaten={totalCarbs}   goal={carbGoal}    color={theme.carbs}   theme={theme} />
          <MacroBar label="Protein" eaten={totalProtein} goal={proteinGoal} color={theme.protein} theme={theme} />
          <MacroBar label="Fat"     eaten={totalFat}     goal={fatGoal}     color={theme.fat}     theme={theme} />
        </View>

        {/* Meal sections */}
        <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>MEALS</Text>

        {['breakfast', 'lunch', 'dinner', 'snack'].map((meal) => (
          <MealSection
            key={meal}
            mealKey={meal}
            entries={todayByMeal[meal] || []}
            theme={theme}
            calorieGoal={calorieGoal}
            pct={MEAL_PCTS[meal]}
            language={language}
            onDelete={removeEntry}
            navigation={navigation}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 1 },

  summaryCard: {
    margin: 16, borderRadius: 20, borderWidth: 1,
    padding: 20, gap: 16,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryItem: { alignItems: 'flex-start', gap: 4, flex: 1 },
  summaryNum: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  summaryLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  summaryCenter: { flex: 1, alignItems: 'center' },

  kcalRing: {
    width: 90, height: 90, borderRadius: 45, borderWidth: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  kcalRingNum: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  kcalRingLabel: { fontSize: 10, fontWeight: '600' },

  calorieTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  calorieFill: { height: '100%', borderRadius: 4 },

  macroCard: {
    marginHorizontal: 16, marginBottom: 8, borderRadius: 20,
    borderWidth: 1, padding: 18, gap: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  macroBarWrap: { gap: 6 },
  macroBarTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  macroName: { fontSize: 13, fontWeight: '600' },
  macroVal: { fontSize: 12, fontWeight: '500' },
  macroTrack: { height: 7, borderRadius: 4, overflow: 'hidden' },
  macroFill: { height: '100%', borderRadius: 4 },

  sectionHeader: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1,
    marginHorizontal: 16, marginTop: 16, marginBottom: 8,
  },

  mealSection: {
    marginHorizontal: 16, marginBottom: 10, borderRadius: 18, borderWidth: 1, overflow: 'hidden',
  },
  mealHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  mealIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  mealLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  mealKcal: { fontSize: 12, fontWeight: '500' },
  mealAddBtn: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyMeal: {
    fontSize: 13, textAlign: 'center',
    paddingVertical: 12, paddingBottom: 14,
  },

  foodRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  foodLeft: { flex: 1 },
  foodName: { fontSize: 14, fontWeight: '600' },
  foodMeta: { fontSize: 11, marginTop: 2 },
  foodRight: { alignItems: 'flex-end' },
  foodKcal: { fontSize: 16, fontWeight: '800' },
  foodKcalLabel: { fontSize: 10 },
});

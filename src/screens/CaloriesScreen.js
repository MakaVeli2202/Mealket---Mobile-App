import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSettings } from '../context/SettingsContext';
import { useCalories } from '../context/CalorieContext';
import { getTodaySteps, stepsToKcal } from '../utils/healthConnect';

// ─── Week number (ISO 8601) ───────────────────────────────────────────────────
function getWeekNumber(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(
    ((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7,
  );
}

// ─── Circular calorie ring (no SVG) ──────────────────────────────────────────
function CalorieRing({ eaten, goal, color, size = 140, theme }) {
  const pct = goal > 0 ? Math.min(eaten / goal, 1) : 0;
  const remaining = Math.max(goal - eaten, 0);
  const BORDER = 11;
  const deg = pct * 360;
  const isOver = eaten > goal;
  const ringColor = isOver ? theme.danger : color;
  const trackColor = theme.dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
  const centerTextColor = theme.text;
  const centerSubColor = theme.textMuted;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background track ring */}
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: BORDER, borderColor: trackColor,
      }} />
      {/* Right half fill (0–180°) */}
      <View style={{
        position: 'absolute', right: 0, width: size / 2, height: size, overflow: 'hidden',
      }}>
        <View style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: BORDER, borderColor: deg > 0 ? ringColor : 'transparent',
          transform: [{ rotate: `${Math.min(deg, 180) - 180}deg` }],
        }} />
      </View>
      {/* Left half fill (180–360°) */}
      {deg > 180 && (
        <View style={{
          position: 'absolute', left: 0, width: size / 2, height: size, overflow: 'hidden',
        }}>
          <View style={{
            position: 'absolute', left: 0,
            width: size, height: size, borderRadius: size / 2,
            borderWidth: BORDER, borderColor: ringColor,
            transform: [{ rotate: `${deg - 360}deg` }],
          }} />
        </View>
      )}
      {/* Center content */}
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 30, fontWeight: '900', color: centerTextColor, letterSpacing: -1 }}>
          {isOver ? eaten - goal : remaining}
        </Text>
        <Text style={{ fontSize: 11, color: centerSubColor, fontWeight: '600' }}>
          {isOver ? 'über' : 'übrig'}
        </Text>
      </View>
    </View>
  );
}

// ─── Macro progress bar ───────────────────────────────────────────────────────
function MacroBar({ label, eaten, goal, color, theme }) {
  const pct = goal > 0 ? Math.min(eaten / goal, 1) : 0;
  return (
    <View style={styles.macroBarWrap}>
      <View style={[styles.macroBarTrack, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)' }]}>
        <View style={[styles.macroBarFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <View style={styles.macroBarLabels}>
        <Text style={[styles.macroBarName, { color: theme.textMuted }]}>{label}</Text>
        <Text style={[styles.macroBarVal, { color: theme.textMuted }]}>
          {Math.round(eaten)} / {Math.round(goal)} g
        </Text>
      </View>
    </View>
  );
}

// ─── Meal row ─────────────────────────────────────────────────────────────────
const MEAL_CONFIG = [
  { key: 'breakfast', label: 'Frühstück',   icon: 'sunny-outline',      iconColor: '#FF9F0A' },
  { key: 'lunch',     label: 'Mittagessen', icon: 'restaurant-outline', iconColor: '#0A84FF' },
  { key: 'dinner',    label: 'Abendessen',  icon: 'moon-outline',       iconColor: '#BF5AF2' },
  { key: 'snack',     label: 'Snacks',      icon: 'apple-outline',      iconColor: '#00C896' },
];

function MealRow({ config, entries, theme, navigation }) {
  const totalKcal = entries.reduce((s, e) => s + (e.calories || 0), 0);
  const bgColor = config.iconColor + '22';

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      hitSlop={8}
      style={styles.mealRow}
      onPress={() => navigation.navigate('MealDetail', { meal: config.key })}
    >
      {/* Icon circle */}
      <View style={[styles.mealIconCircle, { backgroundColor: bgColor }]}>
        <Ionicons name={config.icon} size={22} color={config.iconColor} />
      </View>

      {/* Name + arrow */}
      <View style={styles.mealRowCenter}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={[styles.mealName, { color: theme.text }]}>{config.label}</Text>
          <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
        </View>
        <Text style={[styles.mealKcalSub, { color: theme.textMuted }]}>
          {totalKcal > 0 ? `${totalKcal} kcal` : '—'}
        </Text>
      </View>

      {/* Add button */}
      <TouchableOpacity
        activeOpacity={0.75}
        hitSlop={8}
        style={[styles.addBtn, { backgroundColor: theme.accentLight }]}
        onPress={() => navigation.navigate('AddFood', { meal: config.key })}
      >
        <Ionicons name="add" size={20} color={theme.accent} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function CaloriesScreen({ navigation }) {
  const { theme, calorieGoal } = useSettings();
  const { todayEntries, todayByMeal } = useCalories();

  const weekNum = getWeekNumber(new Date());

  const totalKcal  = todayEntries.reduce((s, e) => s + (e.calories || 0), 0);
  const totalCarbs   = todayEntries.reduce((s, e) => s + (e.carbsG   || 0), 0);
  const totalProtein = todayEntries.reduce((s, e) => s + (e.proteinG || 0), 0);
  const totalFat     = todayEntries.reduce((s, e) => s + (e.fatG     || 0), 0);

  const [activity, setActivity] = useState(0);
  useEffect(() => {
    getTodaySteps().then((s) => { if (s > 0) setActivity(stepsToKcal(s)); });
  }, []);

  // Macro goals (rough standard split)
  const carbGoal    = Math.round(calorieGoal * 0.50 / 4);
  const proteinGoal = Math.round(calorieGoal * 0.20 / 4);
  const fatGoal     = Math.round(calorieGoal * 0.30 / 9);

  const isOver = totalKcal > calorieGoal;

  return (
    <LinearGradient colors={[theme.bg, theme.surface]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}
        >
          {/* ── TOP HEADER ── */}
          <View style={styles.topHeader}>
            <View>
              <Text style={[styles.topTitle, { color: theme.text }]}>Heute</Text>
              <Text style={[styles.topSubtitle, { color: theme.textMuted }]}>Woche {weekNum}</Text>
            </View>
            {/* Quick scan buttons */}
            <View style={styles.quickScanRow}>
              <TouchableOpacity
                style={[styles.quickScanBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => navigation.navigate('BarcodeScanner')}
                activeOpacity={0.75}
                hitSlop={4}
              >
                <Ionicons name="barcode-outline" size={20} color={theme.accent} />
                <Text style={[styles.quickScanLabel, { color: theme.accent }]}>Barcode</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickScanBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => navigation.navigate('CameraLabel')}
                activeOpacity={0.75}
                hitSlop={4}
              >
                <Ionicons name="scan-outline" size={20} color={theme.accent} />
                <Text style={[styles.quickScanLabel, { color: theme.accent }]}>Label</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── ÜBERSICHT SECTION ── */}
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionLabel, { color: theme.text }]}>Übersicht</Text>
            <TouchableOpacity
              activeOpacity={0.75}
              hitSlop={8}
              onPress={() => navigation.navigate('CalorieHistory')}
            >
              <Text style={[styles.sectionLink, { color: theme.accent }]}>Alle →</Text>
            </TouchableOpacity>
          </View>

          {/* ── DARK SUMMARY CARD (tap → day detail) ── */}
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => navigation.navigate('DayDetail')}
        >
            <LinearGradient
              colors={theme.dark ? ['#1A2A20', '#1A1A1A'] : ['#F0FAF5', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.summaryCard, { borderColor: theme.border }]}
            >

          {/* 3-col stats row */}
          <View style={styles.statsRow}>
            {/* Gegessen */}
            <View style={styles.statCol}>
              <Text style={[styles.statNum, { color: theme.text }]}>{totalKcal}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Gegessen</Text>
            </View>

            {/* Center ring */}
            <View style={styles.ringWrap}>
              <CalorieRing
                eaten={totalKcal}
                goal={calorieGoal}
                color={theme.accent}
                size={140}
                theme={theme}
              />
            </View>

            {/* Aktivität */}
            <View style={[styles.statCol, { alignItems: 'flex-end' }]}>
              <Text style={[styles.statNum, { color: theme.text }]}>{activity}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Aktivität</Text>
            </View>
          </View>

          {/* Macro progress bars */}
          <View style={[styles.macroBarsCard, { backgroundColor: theme.surfaceAlt }]}>
            <MacroBar
              label="Kohlenhydrate"
              eaten={totalCarbs}
              goal={carbGoal}
              color={theme.carbs}
              theme={theme}
            />
            <View style={[styles.macroDivider, { backgroundColor: theme.border }]} />
            <MacroBar
              label="Eiweiß"
              eaten={totalProtein}
              goal={proteinGoal}
              color={theme.protein}
              theme={theme}
            />
            <View style={[styles.macroDivider, { backgroundColor: theme.border }]} />
            <MacroBar
              label="Fett"
              eaten={totalFat}
              goal={fatGoal}
              color={theme.fat}
              theme={theme}
            />
          </View>
        </LinearGradient>
        </TouchableOpacity>

        {/* ── ERNÄHRUNG SECTION ── */}
        <View style={[styles.sectionRow, { marginTop: 24 }]}>
          <Text style={[styles.sectionLabel, { color: theme.text }]}>Ernährung</Text>
          <TouchableOpacity
            activeOpacity={0.75}
            hitSlop={8}
            onPress={() => navigation.navigate('CalorieHistory')}
          >
            <Text style={[styles.sectionLink, { color: theme.accent }]}>Mehr</Text>
          </TouchableOpacity>
        </View>

        {/* ── MEAL ROWS CARD ── */}
        <View style={[styles.mealsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {MEAL_CONFIG.map((config, idx) => (
            <View key={config.key}>
              <MealRow
                config={config}
                entries={todayByMeal[config.key] || []}
                theme={theme}
                navigation={navigation}
              />
              {idx < MEAL_CONFIG.length - 1 && (
                <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Header
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  topTitle: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 38,
  },
  topSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  quickScanRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  quickScanBtn: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  quickScanLabel: {
    fontSize: 13, fontWeight: '700',
  },

  // Section header row
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Summary card
  summaryCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    paddingTop: 20,
    paddingBottom: 0,
    gap: 16,
  },

  // 3-col stats + ring
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  statCol: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 4,
  },
  statNum: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ringWrap: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  // Macro bars block
  macroBarsCard: {
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 0,
  },
  macroBarWrap: {
    gap: 5,
    paddingVertical: 8,
  },
  macroBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  macroBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroBarName: {
    fontSize: 12,
    fontWeight: '600',
  },
  macroBarVal: {
    fontSize: 12,
    fontWeight: '500',
  },
  macroDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 4,
  },

  // Meals card
  mealsCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  mealIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealRowCenter: {
    flex: 1,
    gap: 3,
  },
  mealName: {
    fontSize: 15,
    fontWeight: '700',
  },
  mealKcalSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
});

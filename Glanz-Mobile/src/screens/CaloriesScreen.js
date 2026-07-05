import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedProps, useAnimatedStyle,
  withSpring, withTiming, withRepeat, withSequence,
  FadeInDown, Easing,
} from 'react-native-reanimated';
import { useSettings } from '../context/SettingsContext';
import { useCalories } from '../context/CalorieContext';
import { useWellness } from '../context/WellnessContext';
import { useWeight } from '../context/WeightContext';
import {
  requestHealthPermissions, getTodaySteps,
  getTodayActiveCalories, stepsToKcal,
} from '../utils/healthConnect';
import {
  getSamsungTodaySteps, getSamsungTodayCalories,
  isSamsungHealthAvailable,
} from '../utils/samsungHealth';
import GlassCard from '../components/GlassCard';
import GlassBg from '../components/GlassBg';

const { width: SCREEN_W } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── helpers ─────────────────────────────────────────────────────────────────

function todayLabel() {
  const d = new Date();
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const date    = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  return { weekday, date };
}

// Fake streak stored in module scope for display (persisted state lives in SettingsContext)
const STREAK = 5;

// ─── CalorieRing ─────────────────────────────────────────────────────────────

function CalorieRing({ eaten, goal, burned, size = 168, theme }) {
  const remaining = Math.max(0, goal - eaten + burned);
  const pct = goal > 0 ? Math.min(eaten / goal, 1) : 0;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(pct, { damping: 18, stiffness: 55 });
  }, [pct]);

  const cx = size / 2;
  const strokeW = 13;
  const r = cx - strokeW / 2 - 2;
  const circumference = 2 * Math.PI * r;

  const animProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Track */}
        <Circle
          cx={cx} cy={cx} r={r}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeW}
          fill="none"
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={cx} cy={cx} r={r}
          stroke={theme.accent}
          strokeWidth={strokeW}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animProps}
          transform={`rotate(-90 ${cx} ${cx})`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 36, fontWeight: '800', color: theme.text, letterSpacing: -1 }}>
          {remaining}
        </Text>
        <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: '600', letterSpacing: 0.5 }}>
          kcal left
        </Text>
      </View>
    </View>
  );
}

// ─── MacroBar ────────────────────────────────────────────────────────────────

function MacroBar({ label, current, goal, color, theme }) {
  const pct = goal > 0 ? Math.min(current / goal, 1) : 0;
  const barProgress = useSharedValue(0);
  const barStyle = useAnimatedStyle(() => ({
    width: `${barProgress.value * 100}%`,
  }));

  useEffect(() => {
    barProgress.value = withTiming(pct, { duration: 600, easing: Easing.out(Easing.quad) });
  }, [pct]);

  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
        <Text style={{ fontSize: 13, color: theme.textSub, fontWeight: '600' }}>{label}</Text>
        <Text style={{ fontSize: 13, color: theme.textMuted }}>
          {Math.round(current)}g / {goal}g
        </Text>
      </View>
      <View style={{
        height: 6, borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}>
        <Animated.View style={[{ height: 6, borderRadius: 3, backgroundColor: color }, barStyle]} />
      </View>
    </View>
  );
}

// ─── MealRow ─────────────────────────────────────────────────────────────────

const MEAL_CONFIGS = [
  { key: 'breakfast', label: 'Breakfast', emoji: '☕', pct: 0.30 },
  { key: 'lunch',     label: 'Lunch',     emoji: '🥗', pct: 0.40 },
  { key: 'dinner',    label: 'Dinner',    emoji: '🍽', pct: 0.25 },
  { key: 'snack',     label: 'Snacks',    emoji: '🍎', pct: 0.05 },
];

function MealRow({ config, entries, calorieGoal, theme, onPress, onAddPress, isLast }) {
  const mealGoal = Math.round(calorieGoal * config.pct);
  const mealKcal = entries.reduce((s, e) => s + (e.calories || 0), 0);
  const hasFood  = entries.length > 0;
  const lastFood = hasFood ? entries[0]?.name : null;

  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.mealRow}
      >
        {/* large emoji circle */}
        <View style={[
          styles.mealEmojiCircle,
          {
            borderColor: hasFood ? theme.accent : 'rgba(255,255,255,0.18)',
            backgroundColor: hasFood ? theme.accent + '1A' : 'rgba(255,255,255,0.04)',
          },
        ]}>
          <Text style={{ fontSize: 28 }}>{config.emoji}</Text>
        </View>

        {/* center: name → kcal → last food */}
        <View style={{ flex: 1, marginLeft: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Text style={[styles.mealName, { color: theme.text }]}>{config.label}</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
          </View>
          <Text style={[styles.mealKcalSub, { color: theme.textMuted }]}>
            {mealKcal} / {mealGoal} kcal
          </Text>
          {lastFood && (
            <Text style={[styles.mealLastFood, { color: theme.textMuted }]} numberOfLines={1}>
              {lastFood}
            </Text>
          )}
        </View>

        {/* white filled "+" button */}
        <TouchableOpacity
          onPress={onAddPress}
          hitSlop={8}
          style={styles.addBtnFilled}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color="#000" />
        </TouchableOpacity>
      </TouchableOpacity>

      {!isLast && (
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
      )}
    </>
  );
}

// ─── WaterGlasses ────────────────────────────────────────────────────────────

const GLASS_ML = 250;
const GLASS_COUNT = 8;
const WATER_GOAL_ML = 2500;

function WaterSection({ todayWater, onAdd, theme }) {
  const ml      = todayWater || 0;
  const glasses = Math.floor(ml / GLASS_ML);
  const liters  = (ml / 1000).toFixed(2).replace('.', ',');

  return (
    <Animated.View entering={FadeInDown.delay(180).duration(300).springify()} style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <View style={[styles.sectionDot, { backgroundColor: '#2C9CFF' }]} />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Water</Text>
      </View>
      <GlassCard theme={theme} intensity={50} radius={20}>
        <View style={{ padding: 16, alignItems: 'center' }}>
          {/* large litre counter */}
          <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textMuted, marginBottom: 2 }}>
            Water
          </Text>
          <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 10 }}>
            Goal: {(WATER_GOAL_ML / 1000).toFixed(2).replace('.', ',')} l
          </Text>
          <Text style={{ fontSize: 44, fontWeight: '900', color: theme.text, letterSpacing: -1, marginBottom: 18 }}>
            {liters} l
          </Text>

          {/* 8 glasses in a wrapping row */}
          <View style={styles.glassGrid}>
            {Array.from({ length: GLASS_COUNT }).map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => i >= glasses && onAdd(GLASS_ML)}
                hitSlop={4}
                style={[
                  styles.glass,
                  {
                    backgroundColor: i < glasses ? '#2C9CFF33' : 'rgba(255,255,255,0.06)',
                    borderColor:     i < glasses ? '#2C9CFF'   : 'rgba(255,255,255,0.14)',
                  },
                ]}
              >
                <Ionicons
                  name="water"
                  size={20}
                  color={i < glasses ? '#2C9CFF' : 'rgba(255,255,255,0.25)'}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.glassHint, { color: theme.textMuted, marginTop: 12 }]}>
            Tap a glass to add {GLASS_ML} ml
          </Text>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─── ActivitiesSection ───────────────────────────────────────────────────────

function ActivitiesSection({ steps, burnedKcal, loading, onRefresh, theme }) {
  const stepGoal   = 10000;
  const pct        = Math.min(steps / stepGoal, 1);
  const distanceKm = (steps * 0.0008).toFixed(1);
  const barProgress = useSharedValue(0);
  const barStyle    = useAnimatedStyle(() => ({ width: `${barProgress.value * 100}%` }));

  useEffect(() => {
    barProgress.value = withTiming(pct, { duration: 700, easing: Easing.out(Easing.quad) });
  }, [pct]);

  return (
    <Animated.View entering={FadeInDown.delay(220).duration(300).springify()} style={styles.section}>
      <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[styles.sectionDot, { backgroundColor: '#FF9800' }]} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Activities</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} hitSlop={8} style={[styles.syncBtn, { borderColor: theme.accent + '40', backgroundColor: theme.accent + '14' }]}>
          <Ionicons name="refresh-outline" size={13} color={theme.accent} />
          <Text style={[styles.syncLabel, { color: theme.accent }]}>Sync</Text>
        </TouchableOpacity>
      </View>
      <GlassCard theme={theme} intensity={50} radius={20}>
        <View style={{ padding: 18, alignItems: 'center' }}>
          {/* centred step count */}
          <Text style={{ fontSize: 28, fontWeight: '900', color: theme.text, letterSpacing: -0.5 }}>
            {loading ? '—' : steps.toLocaleString()} Steps
          </Text>
          <Text style={{ fontSize: 14, color: theme.textMuted, marginTop: 3, marginBottom: 16 }}>
            {loading ? '' : `${distanceKm} km,  ${burnedKcal} kcal`}
          </Text>

          {/* teal progress bar */}
          <View style={{ width: '100%', height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <Animated.View style={[{ height: 8, borderRadius: 4, backgroundColor: theme.accent }, barStyle]} />
          </View>
          <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 7 }}>
            {Math.round(pct * 100)}% of {stepGoal.toLocaleString()} goal
          </Text>
        </View>

        {/* Samsung Health sync tip */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 16, paddingBottom: 14, paddingTop: 4 }}>
          <Ionicons name="information-circle-outline" size={15} color="#FF9800" style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, fontSize: 11, color: theme.textMuted, lineHeight: 16 }}>
            {'Galaxy Watch users: Samsung Health doesn\'t share steps with Health Connect. To fix, open '}
            <Text style={{ color: '#FF9800', fontWeight: '700' }}>
              {'Samsung Health → Settings → Connected Services → Google Fit'}
            </Text>
            {' and enable step sync.'}
          </Text>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function CaloriesScreen({ navigation }) {
  const { theme, calorieGoal, carbGoal, proteinGoal, fatGoal, tr } = useSettings();
  const { todayEntries, todayByMeal } = useCalories();
  const wellness = useWellness();
  const tabBarHeight = Platform.OS === 'ios' ? 96 : 80;

  // totals
  const totalKcal    = todayEntries.reduce((s, e) => s + (e.calories || 0), 0);
  const totalCarbs   = todayEntries.reduce((s, e) => s + (e.carbsG   || 0), 0);
  const totalProtein = todayEntries.reduce((s, e) => s + (e.proteinG || 0), 0);
  const totalFat     = todayEntries.reduce((s, e) => s + (e.fatG     || 0), 0);

  // health data
  const [hcSteps,   setHcSteps]   = useState(0);
  const [hcCal,     setHcCal]     = useState(0);
  const [healthLoading, setHealthLoading] = useState(false);

  const fetchHealthData = async () => {
    setHealthLoading(true);
    let s = 0, cal = 0;
    try {
      const granted = await requestHealthPermissions();
      if (granted) {
        [s, cal] = await Promise.all([getTodaySteps(), getTodayActiveCalories()]);
      }
      if (s === 0 || cal === 0) {
        const shAvail = await isSamsungHealthAvailable();
        if (shAvail) {
          if (s === 0) {
            const sh = await getSamsungTodaySteps();
            s = sh.steps;
          }
          if (cal === 0) {
            const shCal = await getSamsungTodayCalories();
            if (shCal > 0) cal = shCal;
          }
        }
      }
      if (cal === 0 && s > 0) cal = stepsToKcal(s);
    } catch (e) {
      console.warn('Health data fetch error:', e);
    }
    setHcSteps(s);
    setHcCal(cal);
    setHealthLoading(false);
  };

  useEffect(() => { fetchHealthData(); }, []);

  const totalBurned = hcCal;
  const { weekday, date } = todayLabel();

  return (
    <GlassBg theme={theme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: tabBarHeight + 40 }}
        >

          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.duration(280).springify()} style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Today</Text>
              <Text style={[styles.headerSub, { color: theme.textMuted }]}>
                {weekday}, {date}
              </Text>
            </View>
            <View style={styles.headerActions}>
              {/* streak */}
              <View style={[styles.streakBadge, { backgroundColor: 'rgba(255,149,0,0.14)', borderColor: 'rgba(255,149,0,0.28)' }]}>
                <Ionicons name="flame" size={16} color="#FF9500" />
                <Text style={[styles.streakNum, { color: '#FF9500' }]}>{STREAK}</Text>
              </View>
              {/* calendar */}
              <TouchableOpacity
                onPress={() => navigation.navigate('CalorieHistory')}
                hitSlop={8}
                style={[styles.iconBtn, { borderColor: theme.border }]}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.text} />
              </TouchableOpacity>
              {/* settings */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Settings')}
                hitSlop={8}
                style={[styles.iconBtn, { borderColor: theme.border }]}
              >
                <Ionicons name="settings-outline" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ── Overview Card ── */}
          <Animated.View entering={FadeInDown.delay(60).duration(300).springify()} style={styles.section}>
            <GlassCard theme={theme} intensity={55} radius={22} accent glow>
              <View style={{ padding: 20 }}>

                {/* ring + flanking stats */}
                <View style={styles.overviewRow}>
                  {/* Eaten */}
                  <View style={styles.flankerStat}>
                    <Text style={[styles.flankerNum, { color: theme.text }]}>{totalKcal}</Text>
                    <Text style={[styles.flankerLabel, { color: theme.textMuted }]}>Eaten</Text>
                  </View>

                  <CalorieRing
                    eaten={totalKcal}
                    goal={calorieGoal}
                    burned={totalBurned}
                    theme={theme}
                    size={168}
                  />

                  {/* Burned */}
                  <View style={[styles.flankerStat, { alignItems: 'flex-end' }]}>
                    <Text style={[styles.flankerNum, { color: theme.text }]}>{totalBurned}</Text>
                    <Text style={[styles.flankerLabel, { color: theme.textMuted }]}>Burned</Text>
                  </View>
                </View>

                {/* macro bars */}
                <View style={{ marginTop: 18 }}>
                  <MacroBar
                    label="Carbs"
                    current={totalCarbs}
                    goal={carbGoal}
                    color={theme.carbs}
                    theme={theme}
                  />
                  <MacroBar
                    label="Protein"
                    current={totalProtein}
                    goal={proteinGoal}
                    color={theme.protein}
                    theme={theme}
                  />
                  <MacroBar
                    label="Fat"
                    current={totalFat}
                    goal={fatGoal}
                    color={theme.fat}
                    theme={theme}
                  />
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* ── Meals / Nutrition ── */}
          <Animated.View entering={FadeInDown.delay(120).duration(300).springify()} style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionDot, { backgroundColor: theme.accent }]} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Nutrition</Text>
            </View>
            <GlassCard theme={theme} intensity={50} radius={20}>
              <View style={{ paddingVertical: 4 }}>
                {MEAL_CONFIGS.map((config, idx) => (
                  <MealRow
                    key={config.key}
                    config={config}
                    entries={todayByMeal[config.key] || []}
                    calorieGoal={calorieGoal}
                    theme={theme}
                    onPress={() => navigation.navigate('MealDetail', { meal: config.key })}
                    onAddPress={() => navigation.navigate('AddFood', { meal: config.key })}
                    isLast={idx === MEAL_CONFIGS.length - 1}
                  />
                ))}
              </View>
            </GlassCard>
          </Animated.View>

          {/* ── Water ── */}
          {/* WaterSection already has its own title */}
          <WaterSection
            todayWater={wellness.todayWater}
            onAdd={wellness.addWater}
            theme={theme}
          />

          {/* ── Activities ── */}
          <ActivitiesSection
            steps={hcSteps}
            burnedKcal={totalBurned}
            loading={healthLoading}
            onRefresh={fetchHealthData}
            theme={theme}
          />

          {/* ── More details link ── */}
          <TouchableOpacity
            onPress={() => navigation.navigate('CalorieHistory')}
            style={styles.moreLink}
          >
            <Text style={[styles.moreLinkText, { color: theme.textMuted }]}>More details</Text>
            <Ionicons name="arrow-forward" size={14} color={theme.textMuted} />
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </GlassBg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  headerSub: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  streakNum: {
    fontSize: 14,
    fontWeight: '700',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: {
    marginHorizontal: 16,
    marginTop: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionDot: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '600',
  },

  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flankerStat: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 4,
  },
  flankerNum: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  flankerLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mealEmojiCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealName: {
    fontSize: 16,
    fontWeight: '700',
  },
  mealKcalSub: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  mealLastFood: {
    fontSize: 11,
    marginTop: 2,
  },
  addBtnFilled: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },

  glassGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  glass: {
    width: 42,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassHint: {
    fontSize: 11,
    textAlign: 'center',
  },

  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  syncLabel: {
    fontSize: 11,
    fontWeight: '700',
  },

  moreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 24,
    marginBottom: 8,
  },
  moreLinkText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, FadeInUp, FadeIn,
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import { useSettings } from '../context/SettingsContext';
import { useCalories } from '../context/CalorieContext';
import { requestStepsPermission, getTodaySteps, stepsToKcal } from '../utils/healthConnect';
import GlassCard from '../components/GlassCard';
import GlassBg from '../components/GlassBg';
import SpringPressable from '../components/SpringPressable';

function getWeekNumber(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function CalorieRing({ eaten, goal, color, size = 148, theme, tr }) {
  const pct      = goal > 0 ? Math.min(eaten / goal, 1) : 0;
  const remaining = Math.max(goal - eaten, 0);
  const BORDER   = 12;
  const deg      = pct * 360;
  const isOver   = eaten > goal;
  const ringColor  = isOver ? theme.danger : color;
  const trackColor = theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: BORDER, borderColor: trackColor }} />
      <View style={{ position: 'absolute', right: 0, width: size / 2, height: size, overflow: 'hidden' }}>
        <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: BORDER, borderColor: deg > 0 ? ringColor : 'transparent', transform: [{ rotate: `${Math.min(deg, 180) - 180}deg` }] }} />
      </View>
      {deg > 180 && (
        <View style={{ position: 'absolute', left: 0, width: size / 2, height: size, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', left: 0, width: size, height: size, borderRadius: size / 2, borderWidth: BORDER, borderColor: ringColor, transform: [{ rotate: `${deg - 360}deg` }] }} />
        </View>
      )}
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 32, fontWeight: '900', color: theme.text, letterSpacing: -1 }}>
          {isOver ? eaten - goal : remaining}
        </Text>
        <Text style={{ fontSize: 10, color: theme.textMuted, fontWeight: '700', letterSpacing: 0.8 }}>
          {(isOver ? tr.calories.over : tr.calories.left).toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

function MacroBar({ label, eaten, goal, color, theme }) {
  const pct = goal > 0 ? Math.min(eaten / goal, 1) : 0;
  const fillW = useSharedValue(0);
  useEffect(() => { fillW.value = withSpring(pct, { damping: 20, stiffness: 80 }); }, [pct]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${fillW.value * 100}%` }));
  return (
    <View style={mb.wrap}>
      <View style={mb.labelRow}>
        <Text style={[mb.name, { color: theme.textMuted }]}>{label}</Text>
        <Text style={[mb.val, { color: color }]}>{Math.round(eaten)}<Text style={[mb.goal, { color: theme.textMuted }]}>/{Math.round(goal)}g</Text></Text>
      </View>
      <View style={[mb.track, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
        <Animated.View style={[mb.fill, { backgroundColor: color }, fillStyle]} />
      </View>
    </View>
  );
}
const mb = StyleSheet.create({
  wrap:     { gap: 5, paddingVertical: 7 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  name:     { fontSize: 12, fontWeight: '600' },
  val:      { fontSize: 12, fontWeight: '800' },
  goal:     { fontWeight: '500' },
  track:    { height: 5, borderRadius: 3, overflow: 'hidden' },
  fill:     { height: '100%', borderRadius: 3 },
});

const MEAL_CONFIG = [
  { key: 'breakfast', icon: 'sunny-outline',      iconColor: '#FF9F0A' },
  { key: 'lunch',     icon: 'restaurant-outline', iconColor: '#0A84FF' },
  { key: 'dinner',    icon: 'moon-outline',       iconColor: '#BF5AF2' },
  { key: 'snack',     icon: 'apple-outline',      iconColor: '#00C896' },
];

function MealRow({ config, entries, theme, navigation, tr, delay }) {
  const totalKcal = entries.reduce((s, e) => s + (e.calories || 0), 0);
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(260).springify().damping(20)}>
      <SpringPressable
        style={styles.mealRow}
        onPress={() => navigation.navigate('MealDetail', { meal: config.key })}
      >
        <View style={[styles.mealIcon, { backgroundColor: config.iconColor + '20' }]}>
          <Ionicons name={config.icon} size={22} color={config.iconColor} />
        </View>
        <View style={styles.mealCenter}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Text style={[styles.mealName, { color: theme.text }]}>{tr.meals[config.key]}</Text>
            <Ionicons name="chevron-forward" size={13} color={theme.textMuted} />
          </View>
          <Text style={[styles.mealSub, { color: theme.textMuted }]}>
            {totalKcal > 0 ? `${totalKcal} kcal` : '—'}
          </Text>
        </View>
        <SpringPressable
          onPress={() => navigation.navigate('AddFood', { meal: config.key })}
          style={[styles.addBtn, { backgroundColor: theme.accentLight }]}
          scaleDown={0.88}
        >
          <Ionicons name="add" size={20} color={theme.accent} />
        </SpringPressable>
      </SpringPressable>
    </Animated.View>
  );
}

export default function CaloriesScreen({ navigation }) {
  const { theme, calorieGoal, carbGoal, proteinGoal, fatGoal, tr } = useSettings();
  const { todayEntries, todayByMeal } = useCalories();
  const tabBarHeight = Platform.OS === 'ios' ? 96 : 80;
  const weekNum = getWeekNumber(new Date());

  const totalKcal    = todayEntries.reduce((s, e) => s + (e.calories || 0), 0);
  const totalCarbs   = todayEntries.reduce((s, e) => s + (e.carbsG   || 0), 0);
  const totalProtein = todayEntries.reduce((s, e) => s + (e.proteinG || 0), 0);
  const totalFat     = todayEntries.reduce((s, e) => s + (e.fatG     || 0), 0);

  const [activity, setActivity] = useState(0);
  useEffect(() => {
    (async () => {
      await requestStepsPermission();
      const s = await getTodaySteps();
      if (s > 0) setActivity(stepsToKcal(s));
    })();
  }, []);

  return (
    <GlassBg theme={theme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}>

          {/* Header */}
          <Animated.View entering={FadeInDown.duration(300).springify().damping(22)} style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>{tr.calories.today}</Text>
              <Text style={[styles.headerSub, { color: theme.textMuted }]}>{tr.calories.week(weekNum)}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <SpringPressable
                style={[styles.scanBtn, { borderColor: theme.border }]}
                onPress={() => navigation.navigate('BarcodeScanner')}
              >
                <LinearGradient
                  colors={theme.dark ? ['rgba(20,21,24,0.9)', 'rgba(14,15,18,0.9)'] : ['rgba(255,255,255,0.9)', 'rgba(242,242,246,0.9)']}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="barcode-outline" size={18} color={theme.accent} />
                <Text style={[styles.scanLabel, { color: theme.accent }]}>{tr.meals.barcode}</Text>
              </SpringPressable>
              <SpringPressable
                style={[styles.scanBtn, { borderColor: theme.border }]}
                onPress={() => navigation.navigate('CameraLabel')}
              >
                <LinearGradient
                  colors={theme.dark ? ['rgba(20,21,24,0.9)', 'rgba(14,15,18,0.9)'] : ['rgba(255,255,255,0.9)', 'rgba(242,242,246,0.9)']}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="scan-outline" size={18} color={theme.accent} />
                <Text style={[styles.scanLabel, { color: theme.accent }]}>{tr.calories.label}</Text>
              </SpringPressable>
            </View>
          </Animated.View>

          {/* Overview label */}
          <Animated.View entering={FadeInDown.delay(60).duration(280).springify()} style={styles.sectionRow}>
            <Text style={[styles.sectionLabel, { color: theme.text }]}>{tr.calories.overview}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CalorieHistory')} hitSlop={8}>
              <Text style={[styles.sectionLink, { color: theme.accent }]}>{tr.calories.all}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Summary glass card */}
          <Animated.View entering={FadeInDown.delay(100).duration(320).springify().damping(18)} style={{ marginHorizontal: 16 }}>
            <SpringPressable onPress={() => navigation.navigate('DayDetail')} scaleDown={0.975}>
              <GlassCard theme={theme} intensity={60} radius={24}>
                {/* Top accent gradient strip */}
                <LinearGradient
                  colors={[theme.accent + '18', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ height: 3, marginBottom: 18 }}
                />
                {/* 3-col stats */}
                <View style={styles.statsRow}>
                  <View style={styles.statCol}>
                    <Text style={[styles.statNum, { color: theme.text }]}>{totalKcal}</Text>
                    <Text style={[styles.statLbl, { color: theme.textMuted }]}>{tr.calories.eaten.toUpperCase()}</Text>
                  </View>
                  <CalorieRing eaten={totalKcal} goal={calorieGoal} color={theme.accent} theme={theme} tr={tr} />
                  <View style={[styles.statCol, { alignItems: 'flex-end' }]}>
                    <Text style={[styles.statNum, { color: theme.text }]}>{activity}</Text>
                    <Text style={[styles.statLbl, { color: theme.textMuted }]}>{tr.calories.activity.toUpperCase()}</Text>
                  </View>
                </View>
                {/* Macro bars */}
                <View style={[styles.macroBarsWrap, { backgroundColor: theme.dark ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.03)' }]}>
                  <MacroBar label={tr.calories.carbs}   eaten={totalCarbs}   goal={carbGoal}    color={theme.carbs}   theme={theme} />
                  <View style={[styles.macroDivider, { backgroundColor: theme.border }]} />
                  <MacroBar label={tr.calories.protein} eaten={totalProtein} goal={proteinGoal} color={theme.protein} theme={theme} />
                  <View style={[styles.macroDivider, { backgroundColor: theme.border }]} />
                  <MacroBar label={tr.calories.fat}     eaten={totalFat}     goal={fatGoal}     color={theme.fat}     theme={theme} />
                </View>
              </GlassCard>
            </SpringPressable>
          </Animated.View>

          {/* Meals label */}
          <View style={[styles.sectionRow, { marginTop: 22 }]}>
            <Text style={[styles.sectionLabel, { color: theme.text }]}>{tr.calories.nutrition}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CalorieHistory')} hitSlop={8}>
              <Text style={[styles.sectionLink, { color: theme.accent }]}>{tr.calories.more}</Text>
            </TouchableOpacity>
          </View>

          {/* Meal rows glass card */}
          <Animated.View entering={FadeInDown.delay(180).duration(320).springify().damping(18)} style={{ marginHorizontal: 16 }}>
            <GlassCard theme={theme} intensity={50} radius={24} shimmer={false}>
              {MEAL_CONFIG.map((config, idx) => (
                <View key={config.key}>
                  <MealRow config={config} entries={todayByMeal[config.key] || []} theme={theme} navigation={navigation} tr={tr} delay={idx * 40} />
                  {idx < MEAL_CONFIG.length - 1 && (
                    <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />
                  )}
                </View>
              ))}
            </GlassCard>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </GlassBg>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4,
  },
  headerTitle: { fontSize: 34, fontWeight: '900', letterSpacing: -1, lineHeight: 38 },
  headerSub:   { fontSize: 12, fontWeight: '600', letterSpacing: 0.2, marginTop: 2 },
  scanBtn: {
    flexDirection: 'row', gap: 5, paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 14, borderWidth: 1, alignItems: 'center', overflow: 'hidden',
  },
  scanLabel: { fontSize: 12, fontWeight: '700' },

  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 10, marginTop: 16,
  },
  sectionLabel: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  sectionLink:  { fontSize: 14, fontWeight: '600' },

  statsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
  },
  statCol:  { flex: 1, gap: 4 },
  statNum:  { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLbl:  { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  macroBarsWrap: { paddingHorizontal: 18, paddingVertical: 4, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  macroDivider:  { height: StyleSheet.hairlineWidth, marginHorizontal: 2 },

  mealRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  mealIcon:  { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  mealCenter: { flex: 1, gap: 3 },
  mealName:  { fontSize: 15, fontWeight: '700' },
  mealSub:   { fontSize: 12, fontWeight: '500' },
  addBtn:    { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
});

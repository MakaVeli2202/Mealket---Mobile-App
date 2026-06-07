import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSettings } from '../context/SettingsContext';
import { useCalories } from '../context/CalorieContext';
import GlassCard from '../components/GlassCard';
import GlassBg from '../components/GlassBg';
import SpringPressable from '../components/SpringPressable';

const MEAL_META = {
  breakfast: { labelKey: 'breakfast', icon: 'sunny-outline',       pct: 0.25, bannerColor: '#FF9F0A' },
  lunch:     { labelKey: 'lunch',     icon: 'restaurant-outline',  pct: 0.35, bannerColor: '#0A84FF' },
  dinner:    { labelKey: 'dinner',    icon: 'moon-outline',        pct: 0.30, bannerColor: '#BF5AF2' },
  snack:     { labelKey: 'snack',     icon: 'apple-outline',       pct: 0.10, bannerColor: '#00C896' },
};

function StatCard({ label, value, unit, color, theme, delay }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(260).springify().damping(20)} style={{ width: '47%', flexGrow: 1 }}>
      <GlassCard theme={theme} intensity={50} radius={18} shimmer={false} style={styles.statCard}>
        <Text style={[styles.statValue, { color: color || theme.text }]}>{value}</Text>
        <Text style={[styles.statUnit, { color: theme.textMuted }]}>{unit}</Text>
        <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
      </GlassCard>
    </Animated.View>
  );
}

function ProgressRow({ label, eaten, goal, color, theme, unit = 'g' }) {
  const pct = goal > 0 ? Math.min(eaten / goal, 1) : 0;
  const isOver = eaten > goal;
  return (
    <View style={styles.progressRowWrap}>
      <View style={styles.progressLabelRow}>
        <Text style={[styles.progressLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.progressVal, { color: isOver ? theme.danger : theme.textMuted }]}>
          {Math.round(eaten)} / {Math.round(goal)} {unit}
        </Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
        <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: isOver ? theme.danger : color }]} />
      </View>
    </View>
  );
}

function FoodItem({ entry, theme, onDelete, delay }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(220).springify()}>
      <SpringPressable onLongPress={onDelete} style={[styles.foodItem, { borderBottomColor: theme.border }]} scaleDown={0.97}>
        <View style={styles.foodItemLeft}>
          <Text style={[styles.foodName, { color: theme.text }]} numberOfLines={1}>{entry.name}</Text>
          <Text style={[styles.foodMeta, { color: theme.textMuted }]}>
            {entry.amountG}g
            {entry.carbsG   > 0 ? `  C ${entry.carbsG}g`   : ''}
            {entry.proteinG > 0 ? `  E ${entry.proteinG}g` : ''}
            {entry.fatG     > 0 ? `  F ${entry.fatG}g`     : ''}
          </Text>
        </View>
        <View style={styles.foodItemRight}>
          <Text style={[styles.foodKcal, { color: theme.accent }]}>{entry.calories} kcal</Text>
          <Text style={[styles.foodTime, { color: theme.textMuted }]}>{entry.time}</Text>
        </View>
      </SpringPressable>
    </Animated.View>
  );
}

export default function MealDetailScreen({ route, navigation }) {
  const { meal } = route.params;
  const { theme, calorieGoal, tr } = useSettings();
  const { todayByMeal, removeEntry } = useCalories();
  const tabBarHeight = Platform.OS === 'ios' ? 96 : 80;

  const meta    = MEAL_META[meal] || MEAL_META.snack;
  const entries = todayByMeal[meal] || [];
  const mLabel  = tr.meals[meta.labelKey] ?? meal;
  const c       = tr.calories;

  const totalKcal    = entries.reduce((s, e) => s + (e.calories  || 0), 0);
  const totalCarbs   = entries.reduce((s, e) => s + (e.carbsG    || 0), 0);
  const totalProtein = entries.reduce((s, e) => s + (e.proteinG  || 0), 0);
  const totalFat     = entries.reduce((s, e) => s + (e.fatG      || 0), 0);

  const kcalGoal = Math.round(calorieGoal * meta.pct);
  const carbGoal = Math.round(kcalGoal * 0.50 / 4);
  const protGoal = Math.round(kcalGoal * 0.20 / 4);
  const fatGoal  = Math.round(kcalGoal * 0.30 / 9);

  const confirmDelete = (entry) => {
    Alert.alert(c.removeTitle, c.removePrompt(entry.name), [
      { text: c.cancel, style: 'cancel' },
      { text: c.delete, style: 'destructive', onPress: () => removeEntry(entry.id) },
    ]);
  };

  return (
    <GlassBg theme={theme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(260).springify()} style={[styles.headerBar, { borderBottomColor: theme.border }]}>
          <SpringPressable hitSlop={8} onPress={() => navigation.goBack()} style={styles.headerBtn} scaleDown={0.88}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </SpringPressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{mLabel}</Text>
          <SpringPressable hitSlop={8} style={styles.headerBtn} onPress={() => navigation.navigate('AddFood', { meal })} scaleDown={0.88}>
            <Ionicons name="create-outline" size={22} color={theme.textMuted} />
          </SpringPressable>
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tabBarHeight + 80 }}>

          {/* Banner */}
          <Animated.View entering={FadeInDown.delay(40).duration(300).springify()}>
            <LinearGradient
              colors={[meta.bannerColor + 'CC', meta.bannerColor + '88']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.banner}
            >
              <View style={[styles.bannerIconCircle, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
                <Ionicons name={meta.icon} size={44} color="#FFF" />
              </View>
              <Text style={styles.bannerTitle}>{mLabel}</Text>
              <Text style={styles.bannerSub}>{totalKcal} kcal · {tr.meals.entries(entries.length)}</Text>
            </LinearGradient>
          </Animated.View>

          {/* Stat grid */}
          <View style={styles.statsGrid}>
            <StatCard label={c.caloriesLabel}   value={totalKcal}             unit="kcal" color={theme.accent}   theme={theme} delay={80} />
            <StatCard label={c.carbohydrates}    value={Math.round(totalCarbs)} unit="g"   color={theme.carbs}    theme={theme} delay={120} />
            <StatCard label={c.protein}          value={Math.round(totalProtein)} unit="g" color={theme.protein}  theme={theme} delay={160} />
            <StatCard label={c.fat}              value={Math.round(totalFat)}  unit="g"   color={theme.fat}       theme={theme} delay={200} />
          </View>

          {/* Progress bars */}
          <Animated.View entering={FadeInDown.delay(240).duration(300).springify()} style={{ marginHorizontal: 16, marginBottom: 12 }}>
            <GlassCard theme={theme} intensity={50} radius={22} shimmer={false} style={{ padding: 18, gap: 12 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{tr.meals.goals}</Text>
              <ProgressRow label={c.caloriesLabel} eaten={totalKcal}    goal={kcalGoal} color={theme.accent}   theme={theme} unit="kcal" />
              <ProgressRow label={c.carbohydrates} eaten={totalCarbs}   goal={carbGoal} color={theme.carbs}    theme={theme} />
              <ProgressRow label={c.protein}       eaten={totalProtein} goal={protGoal} color={theme.protein}  theme={theme} />
              <ProgressRow label={c.fat}           eaten={totalFat}     goal={fatGoal}  color={theme.fat}      theme={theme} />
            </GlassCard>
          </Animated.View>

          {/* Food items */}
          <Animated.View entering={FadeInDown.delay(300).duration(300).springify()} style={{ marginHorizontal: 16, marginBottom: 12 }}>
            <GlassCard theme={theme} intensity={50} radius={22} shimmer={false} style={{ padding: 18, gap: 4 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{tr.meals.foodItems}</Text>
              {entries.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Ionicons name="nutrition-outline" size={36} color={theme.textMuted} style={{ opacity: 0.4 }} />
                  <Text style={[styles.emptyText, { color: theme.textMuted }]}>{tr.meals.noEntriesYet}</Text>
                </View>
              ) : (
                entries.map((entry, i) => (
                  <FoodItem key={entry.id} entry={entry} theme={theme} onDelete={() => confirmDelete(entry)} delay={i * 30} />
                ))
              )}
            </GlassCard>
          </Animated.View>

        </ScrollView>

        {/* Add button */}
        <Animated.View entering={FadeInUp.delay(100).duration(300).springify()} style={[styles.fabRow, { borderTopColor: theme.border, paddingBottom: tabBarHeight + 8 }]}>
          <SpringPressable
            onPress={() => navigation.navigate('AddFood', { meal })}
            style={{ borderRadius: 16, overflow: 'hidden' }}
            scaleDown={0.96}
          >
            <LinearGradient
              colors={[theme.accent, theme.accentDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.addMoreBtn}
            >
              <Ionicons name="add" size={22} color="#FFF" />
              <Text style={styles.addMoreLabel}>{tr.meals.moreAdd}</Text>
            </LinearGradient>
          </SpringPressable>
        </Animated.View>

      </SafeAreaView>
    </GlassBg>
  );
}

const styles = StyleSheet.create({
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },

  banner: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20, gap: 10 },
  bannerIconCircle: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  bannerTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  bannerSub:   { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.75)' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16 },
  statCard:  { padding: 16, gap: 2 },
  statValue: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  statUnit:  { fontSize: 13, fontWeight: '600', marginTop: -2 },
  statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },

  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },

  progressRowWrap: { gap: 6 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 13, fontWeight: '600' },
  progressVal:   { fontSize: 12, fontWeight: '500' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 3 },

  foodItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  foodItemLeft:  { flex: 1, gap: 3 },
  foodName:  { fontSize: 15, fontWeight: '700' },
  foodMeta:  { fontSize: 12, fontWeight: '500' },
  foodItemRight: { alignItems: 'flex-end', gap: 3 },
  foodKcal:  { fontSize: 15, fontWeight: '800' },
  foodTime:  { fontSize: 11 },

  emptyWrap: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: '500' },

  fabRow: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, backgroundColor: 'transparent' },
  addMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, paddingVertical: 16, gap: 8 },
  addMoreLabel: { fontSize: 16, fontWeight: '700', color: '#FFF', letterSpacing: -0.2 },
});

import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useSettings } from '../context/SettingsContext';
import { useCalories } from '../context/CalorieContext';
import GlassBg from '../components/GlassBg';

// ─── Meal metadata ────────────────────────────────────────────────────────────
const MEAL_META = {
  breakfast: { icon: 'sunny-outline',      color: '#FF9F0A' },
  lunch:     { icon: 'restaurant-outline', color: '#0A84FF' },
  dinner:    { icon: 'moon-outline',        color: '#BF5AF2' },
  snack:     { icon: 'nutrition-outline',      color: '#00C896' },
};
const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];

// ─── Circular donut for macros (SVG arcs, based on calorie contribution) ──
function MacroDonut({ carbs, protein, fat, size = 110, theme, c }) {
  const carbKcal  = (carbs  || 0) * 4;
  const proteinKcal = (protein || 0) * 4;
  const fatKcal   = (fat    || 0) * 9;
  const totalKcal = carbKcal + proteinKcal + fatKcal || 1;
  const cPct = carbKcal / totalKcal;
  const pPct = proteinKcal / totalKcal;
  const fPct = fatKcal / totalKcal;
  const cx = size / 2;
  const cy = size / 2;
  const strokeW = 10;
  const r = cx - strokeW / 2;
  const carbAngle = cPct * 360;
  const proteinAngle = pPct * 360;
  const fatAngle = fPct * 360;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={cx} cy={cy} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={strokeW} fill="none" />
        {carbAngle > 0 && (
          <Circle
            cx={cx} cy={cy} r={r}
            stroke={theme.carbs}
            strokeWidth={strokeW}
            fill="none"
            strokeDasharray={`${carbAngle * (Math.PI * r * 2) / 360} ${Math.PI * r * 2}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )}
        {proteinAngle > 0 && (
          <Circle
            cx={cx} cy={cy} r={r}
            stroke={theme.protein}
            strokeWidth={strokeW}
            fill="none"
            strokeDasharray={`${proteinAngle * (Math.PI * r * 2) / 360} ${Math.PI * r * 2}`}
            strokeLinecap="round"
            transform={`rotate(${carbAngle - 90} ${cx} ${cy})`}
          />
        )}
        {fatAngle > 0 && (
          <Circle
            cx={cx} cy={cy} r={r}
            stroke={theme.fat}
            strokeWidth={strokeW}
            fill="none"
            strokeDasharray={`${fatAngle * (Math.PI * r * 2) / 360} ${Math.PI * r * 2}`}
            strokeLinecap="round"
            transform={`rotate(${carbAngle + proteinAngle - 90} ${cx} ${cy})`}
          />
        )}
      </Svg>
      {/* Center: show total kcal instead of grams */}
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>{Math.round(totalKcal)}</Text>
        <Text style={{ fontSize: 9, color: theme.textMuted, fontWeight: '600' }}>{c.kcal}</Text>
      </View>
    </View>
  );
}

// ─── Macro stat pill ──────────────────────────────────────────────────────────
function MacroPill({ label, grams, goalG, color, theme }) {
  const pct = goalG > 0 ? Math.min(grams / goalG, 1) : 0;
  const isOver = grams > goalG && goalG > 0;
  return (
    <View style={styles.macroPill}>
      <View style={[styles.macroPillDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <View style={styles.macroPillTop}>
          <Text style={[styles.macroPillLabel, { color: theme.textMuted }]}>{label}</Text>
          <Text style={[styles.macroPillVal, { color: isOver ? theme.danger : theme.text }]}>
            {Math.round(grams)}g
          </Text>
        </View>
        <View style={[styles.macroTrack, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)' }]}>
          <View style={[styles.macroFill, { width: `${pct * 100}%`, backgroundColor: isOver ? theme.danger : color }]} />
        </View>
        {goalG > 0 && (
          <Text style={[styles.macroPillGoal, { color: theme.textMuted }]}>
            goal {Math.round(goalG)}g
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Nutrition detail row ─────────────────────────────────────────────────────
function NutritionRow({ icon, label, value, unit, color, theme, last }) {
  return (
    <View style={[styles.nutriRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}>
      <View style={[styles.nutriIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.nutriLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.nutriValue, { color: theme.text }]}>
        {value}<Text style={{ color: theme.textMuted, fontSize: 12 }}> {unit}</Text>
      </Text>
    </View>
  );
}

// ─── Food entry row ───────────────────────────────────────────────────────────
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
          {entry.amountG ? `${entry.amountG}g` : ''}
          {entry.carbsG   > 0 ? `  C ${Math.round(entry.carbsG)}g`   : ''}
          {entry.proteinG > 0 ? `  P ${Math.round(entry.proteinG)}g` : ''}
          {entry.fatG     > 0 ? `  F ${Math.round(entry.fatG)}g`     : ''}
        </Text>
      </View>
      <View style={styles.foodRight}>
        <Text style={[styles.foodKcal, { color: theme.accent }]}>{entry.calories}</Text>
        <Text style={[styles.foodKcalLabel, { color: theme.textMuted }]}>kcal</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Meal section (no fixed goal — shows actual eaten) ────────────────────────
function MealSection({ mealKey, entries, theme, tr, onDelete, navigation }) {
  const meta = MEAL_META[mealKey];
  const label = tr.meals[mealKey];
  const c = tr.calories;
  const total = entries.reduce((s, e) => s + (e.calories || 0), 0);

  // Always show section (even if empty) — user can add to any meal
  return (
    <View style={[styles.mealSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.mealHeader}>
        <View style={[styles.mealIconWrap, { backgroundColor: meta.color + '22' }]}>
          <Ionicons name={meta.icon} size={18} color={meta.color} />
        </View>
        <Text style={[styles.mealLabel, { color: theme.text }]}>{label}</Text>
        {total > 0 && (
          <Text style={[styles.mealKcal, { color: theme.textMuted }]}>{total} kcal</Text>
        )}
        <TouchableOpacity
          style={[styles.mealAddBtn, { backgroundColor: theme.accentLight }]}
          onPress={() => navigation.navigate('AddFood', { meal: mealKey })}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color={theme.accent} />
        </TouchableOpacity>
      </View>

      {entries.length === 0 ? (
        <Text style={[styles.emptyMeal, { color: theme.textMuted }]}>
          {c.nothingLogged}
        </Text>
      ) : (
        entries.map((e) => (
          <FoodEntry
            key={e.id}
            entry={e}
            theme={theme}
            onDelete={() => Alert.alert(
              c.removeTitle,
              c.removePrompt(e.name),
              [
                { text: c.cancel, style: 'cancel' },
                { text: c.delete, style: 'destructive', onPress: () => onDelete(e.id) },
              ],
            )}
          />
        ))
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function DayDetailScreen({ navigation }) {
  const { theme, calorieGoal, carbGoal, proteinGoal, fatGoal, language, tr } = useSettings();
  const { todayEntries, todayByMeal, removeEntry } = useCalories();
  const tabBarHeight = Platform.OS === 'ios' ? 96 : 80;

  const totalKcal    = useMemo(() => todayEntries.reduce((s, e) => s + (e.calories  || 0), 0), [todayEntries]);
  const totalCarbs   = useMemo(() => todayEntries.reduce((s, e) => s + (e.carbsG    || 0), 0), [todayEntries]);
  const totalProtein = useMemo(() => todayEntries.reduce((s, e) => s + (e.proteinG  || 0), 0), [todayEntries]);
  const totalFat     = useMemo(() => todayEntries.reduce((s, e) => s + (e.fatG      || 0), 0), [todayEntries]);
  const totalSugar   = useMemo(() => todayEntries.reduce((s, e) => s + (e.sugarG    || 0), 0), [todayEntries]);

  // Use user-configured macro goals from SettingsContext

  const remaining = Math.max(0, calorieGoal - totalKcal);
  const isOver = totalKcal > calorieGoal;

  // Macro % of calories
  const carbKcal    = totalCarbs   * 4;
  const proteinKcal = totalProtein * 4;
  const fatKcal     = totalFat     * 9;
  const macroTotal  = carbKcal + proteinKcal + fatKcal || 1;
  const carbPct     = Math.round(carbKcal    / macroTotal * 100);
  const proteinPct  = Math.round(proteinKcal / macroTotal * 100);
  const fatPct      = Math.round(fatKcal     / macroTotal * 100);

  const todayLabel = new Date().toLocaleDateString(
    language === 'de' ? 'de-AT' : 'en-US',
    { weekday: 'long', day: 'numeric', month: 'long' },
  );

  const c = tr.calories;

  return (
    <GlassBg theme={theme}>
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{c.today}</Text>
          <Text style={[styles.headerSub, { color: theme.textMuted }]}>{todayLabel}</Text>
        </View>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}>

        {/* ── Calorie summary ── */}
        <View style={[styles.card, { marginTop: 16, backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.calorieRow}>
            {/* Left: Eaten */}
            <View style={styles.calorieCol}>
              <Text style={[styles.calorieNum, { color: theme.text }]}>{totalKcal}</Text>
              <Text style={[styles.calorieLabel, { color: theme.textMuted }]}>
                {c.eaten}
              </Text>
            </View>

            {/* Center: Ring */}
            <View style={styles.ringCenter}>
              <View style={[styles.calorieRing, { borderColor: isOver ? theme.danger : theme.accent }]}>
                <Text style={[styles.ringNum, { color: isOver ? theme.danger : theme.text }]}>
                  {isOver ? totalKcal - calorieGoal : remaining}
                </Text>
                <Text style={[styles.ringLabel, { color: theme.textMuted }]}>
                  {isOver ? c.over : c.left}
                </Text>
              </View>
            </View>

            {/* Right: Goal */}
            <View style={[styles.calorieCol, { alignItems: 'flex-end' }]}>
              <Text style={[styles.calorieNum, { color: theme.text }]}>{calorieGoal}</Text>
              <Text style={[styles.calorieLabel, { color: theme.textMuted }]}>
                {c.goal}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={[styles.progressTrack, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)' }]}>
            <View style={[styles.progressFill, {
              width: `${Math.min((totalKcal / calorieGoal) * 100, 100)}%`,
              backgroundColor: isOver ? theme.danger : theme.accent,
            }]} />
          </View>
        </View>

        {/* ── Macros ── */}
        <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>
          {c.macros}
        </Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Donut + stats row */}
          <View style={styles.macroTopRow}>
            <MacroDonut
              carbs={totalCarbs}
              protein={totalProtein}
              fat={totalFat}
              size={100}
              theme={theme}
              c={c}
            />
            <View style={styles.macroPctCol}>
              <View style={styles.macroPctRow}>
                <View style={[styles.macroPctDot, { backgroundColor: theme.carbs }]} />
                <Text style={[styles.macroPctLabel, { color: theme.textMuted }]}>
                  {c.carbohydrates}
                </Text>
                <Text style={[styles.macroPctNum, { color: theme.text }]}>{carbPct}%</Text>
              </View>
              <View style={styles.macroPctRow}>
                <View style={[styles.macroPctDot, { backgroundColor: theme.protein }]} />
                <Text style={[styles.macroPctLabel, { color: theme.textMuted }]}>
                  {c.protein}
                </Text>
                <Text style={[styles.macroPctNum, { color: theme.text }]}>{proteinPct}%</Text>
              </View>
              <View style={styles.macroPctRow}>
                <View style={[styles.macroPctDot, { backgroundColor: theme.fat }]} />
                <Text style={[styles.macroPctLabel, { color: theme.textMuted }]}>
                  {c.fat}
                </Text>
                <Text style={[styles.macroPctNum, { color: theme.text }]}>{fatPct}%</Text>
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Macro bars with goals */}
          <MacroPill label={c.carbohydrates} grams={totalCarbs} goalG={carbGoal} color={theme.carbs} theme={theme} />
          <MacroPill label={c.protein}       grams={totalProtein} goalG={proteinGoal} color={theme.protein} theme={theme} />
          <MacroPill label={c.fat}           grams={totalFat}     goalG={fatGoal}     color={theme.fat}     theme={theme} />
        </View>

        {/* ── Nutrition details ── */}
        <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>
          {c.nutritionDetails}
        </Text>
        <View style={[styles.card, { padding: 0, backgroundColor: theme.surface, borderColor: theme.border }]}>
          <NutritionRow
            icon="flash-outline"
            label={c.caloriesLabel}
            value={totalKcal}
            unit="kcal"
            color={theme.accent}
            theme={theme}
          />
          <NutritionRow
            icon="grid-outline"
            label={c.carbohydrates}
            value={`${Math.round(totalCarbs)}`}
            unit="g"
            color={theme.carbs}
            theme={theme}
          />
          <NutritionRow
            icon="ellipse-outline"
            label={c.ofWhichSugar}
            value={`${Math.round(totalSugar)}`}
            unit="g"
            color={theme.sugar}
            theme={theme}
          />
          <NutritionRow
            icon="fitness-outline"
            label={c.protein}
            value={`${Math.round(totalProtein)}`}
            unit="g"
            color={theme.protein}
            theme={theme}
          />
          <NutritionRow
            icon="water-outline"
            label={c.fat}
            value={`${Math.round(totalFat)}`}
            unit="g"
            color={theme.fat}
            theme={theme}
            last
          />
        </View>

        {/* ── Meals ── */}
        <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>
          {c.mealsLabel}
        </Text>
        {MEAL_ORDER.map((meal) => (
          <MealSection
            key={meal}
            mealKey={meal}
            entries={todayByMeal[meal] || []}
            theme={theme}
            tr={tr}
            onDelete={removeEntry}
            navigation={navigation}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
    </GlassBg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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

  card: {
    marginHorizontal: 16, marginBottom: 8,
    borderRadius: 20, padding: 18, borderWidth: 1,
  },

  sectionHeader: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1,
    marginHorizontal: 16, marginTop: 20, marginBottom: 8,
  },

  // Calorie summary
  calorieRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  calorieCol: { flex: 1, gap: 4 },
  calorieNum: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  calorieLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  ringCenter: { flex: 1, alignItems: 'center' },
  calorieRing: {
    width: 86, height: 86, borderRadius: 43, borderWidth: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  ringNum: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  ringLabel: { fontSize: 10, fontWeight: '600' },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  // Macros
  macroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 16 },
  macroPctCol: { flex: 1, gap: 10 },
  macroPctRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  macroPctDot: { width: 10, height: 10, borderRadius: 5 },
  macroPctLabel: { flex: 1, fontSize: 13, fontWeight: '500' },
  macroPctNum: { fontSize: 14, fontWeight: '700' },

  divider: { height: StyleSheet.hairlineWidth, marginBottom: 16 },

  macroPill: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  macroPillDot: { width: 10, height: 10, borderRadius: 5, marginTop: 2 },
  macroPillTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  macroPillLabel: { fontSize: 13, fontWeight: '500' },
  macroPillVal: { fontSize: 13, fontWeight: '700' },
  macroTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  macroFill: { height: '100%', borderRadius: 3 },
  macroPillGoal: { fontSize: 10, marginTop: 3 },

  // Nutrition rows
  nutriRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13, gap: 12,
  },
  nutriIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  nutriLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  nutriValue: { fontSize: 15, fontWeight: '700' },

  // Meal sections
  mealSection: {
    marginHorizontal: 16, marginBottom: 10,
    borderRadius: 18, borderWidth: 1, overflow: 'hidden',
  },
  mealHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  mealIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  mealLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  mealKcal: { fontSize: 12, fontWeight: '600' },
  mealAddBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  emptyMeal: { fontSize: 13, textAlign: 'center', paddingVertical: 12, paddingBottom: 14 },

  // Food entries
  foodRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 12,
  },
  foodLeft: { flex: 1 },
  foodName: { fontSize: 14, fontWeight: '600' },
  foodMeta: { fontSize: 11, marginTop: 2 },
  foodRight: { alignItems: 'flex-end' },
  foodKcal: { fontSize: 16, fontWeight: '800' },
  foodKcalLabel: { fontSize: 10 },
});

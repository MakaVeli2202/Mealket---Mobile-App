import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Modal, ScrollView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from './SafeGradient';
import { BlurView } from 'expo-blur';
import Svg, { Circle } from 'react-native-svg';
import Animated, { FadeInUp } from 'react-native-reanimated';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_ICONS = {
  breakfast: 'sunny-outline', lunch: 'restaurant-outline',
  dinner: 'moon-outline', snack: 'nutrition-outline',
};
const MEAL_COLORS = {
  breakfast: '#FF9F0A', lunch: '#0A84FF',
  dinner: '#BF5AF2', snack: '#00E87A',
};

const MacroCircle = ({ label, val, color, maxVal, theme }) => {
  const mcSize = 52;
  const sw = 4;
  const r = (mcSize - sw) / 2;
  const circ = 2 * Math.PI * r;
  const mpct = maxVal > 0 ? Math.min(val / maxVal, 1) : 0;
  const off = circ * (1 - mpct);
  return (
    <View style={{ alignItems: 'center', gap: 3 }}>
      <Svg width={mcSize} height={mcSize}>
        <Circle cx={mcSize / 2} cy={mcSize / 2} r={r} stroke={theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'} strokeWidth={sw} fill="none" />
        {mpct > 0 && (
          <Circle cx={mcSize / 2} cy={mcSize / 2} r={r} stroke={color} strokeWidth={sw} fill="none" strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" transform={`rotate(-90 ${mcSize / 2} ${mcSize / 2})`} />
        )}
      </Svg>
      <Text style={[modalStyles.mcLabel, { color: theme.textSub }]}>{label}</Text>
      <Text style={[modalStyles.mcVal, { color: theme.text }]}>{val}g</Text>
    </View>
  );
};

export default function ServingModal({
  visible, food, onClose, onLog,
  calorieGoal, todayKcal, theme, tr,
  carbGoal, proteinGoal, fatGoal,
  initialMeal,
}) {
  const [grams, setGrams] = useState('100');
  const [meal, setMeal] = useState(initialMeal ?? 'snack');

  // Reset meal when modal opens with a different initialMeal
  React.useEffect(() => {
    if (visible) setMeal(initialMeal ?? 'snack');
  }, [visible, initialMeal]);
  const insets = useSafeAreaInsets();

  const g = parseFloat(grams) || 0;
  const factor = g / 100;
  const kcal    = Math.round((food?.kcalPer100g    || 0) * factor);
  const protein = Math.round((food?.proteinPer100g || 0) * factor * 10) / 10;
  const carbs   = Math.round((food?.carbsPer100g   || 0) * factor * 10) / 10;
  const fat     = Math.round((food?.fatPer100g     || 0) * factor * 10) / 10;
  const sugar   = Math.round((food?.sugarPer100g   || 0) * factor * 10) / 10;
  const remaining = calorieGoal - todayKcal;
  const afterEating = remaining - kcal;
  const overBudget = afterEating < 0;

  const macroGoalValues = { Protein: proteinGoal || 50, Carbs: carbGoal || 300, Fat: fatGoal || 65, Sugar: 50 };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <Animated.View
          entering={FadeInUp.duration(320).springify().damping(22)}
          style={[modalStyles.sheet, { paddingBottom: insets.bottom + 16 }]}
        >
          <BlurView intensity={Platform.OS === 'ios' ? 40 : 50} tint={theme.dark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 28, borderTopRightRadius: 28 }]} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.dark ? 'rgba(20,27,45,0.75)' : 'rgba(255,255,255,0.7)', borderTopLeftRadius: 28, borderTopRightRadius: 28 }]} />
          <View style={[StyleSheet.absoluteFill, { borderWidth: 1, borderColor: theme.border + '40', borderTopLeftRadius: 28, borderTopRightRadius: 28 }]} />
          <View style={[modalStyles.handle, { backgroundColor: theme.border }]} />

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 18, paddingBottom: 8 }}>
            <View style={modalStyles.header}>
              <View style={[modalStyles.iconWrap, { backgroundColor: theme.accentLight }]}>
                <Ionicons name="nutrition-outline" size={22} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[modalStyles.title, { color: theme.text }]} numberOfLines={2}>
                  {food?.name || 'Food'}
                </Text>
                <Text style={[modalStyles.subtitle, { color: theme.textMuted }]}>
                  {food?.isRecipe ? `${food?.kcalPer100g ?? '—'} kcal per serving` : `${food?.kcalPer100g ?? '—'} kcal per 100g`}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Ionicons name="close-circle" size={26} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={[modalStyles.gramsCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Ionicons name="scale-outline" size={18} color={theme.accent} />
              <Text style={[modalStyles.gramsLabel, { color: theme.textSub }]}>How much will you eat?</Text>
              <View style={[modalStyles.gramsInputWrap, { backgroundColor: theme.surface, borderColor: theme.accent, borderWidth: 2 }]}>
                <TextInput
                  style={[modalStyles.gramsInput, { color: theme.text }]}
                  value={grams}
                  onChangeText={setGrams}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
                <Text style={[modalStyles.gramsUnit, { color: theme.accent }]}>g</Text>
              </View>
            </View>

            <Text style={[modalStyles.exactLabel, { color: theme.textMuted }]}>Or type exact amount:</Text>
            <View style={modalStyles.presetsRow}>
              {[50, 100, 150, 200, 250].map((v) => (
                <TouchableOpacity
                  key={v}
                  onPress={() => setGrams(String(v))}
                  style={[
                    modalStyles.presetChip,
                    { backgroundColor: String(v) === grams ? theme.accent : theme.surfaceAlt,
                      borderColor: String(v) === grams ? theme.accent : theme.border },
                  ]}
                >
                  <Text style={[modalStyles.presetText, { color: String(v) === grams ? '#FFF' : theme.textSub }]}>
                    {v}g
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View
              style={[modalStyles.kcalCard, {
                backgroundColor: overBudget ? theme.dangerLight : theme.accentLight,
                borderColor: overBudget ? theme.danger + '40' : theme.accent + '40',
              }]}
            >
              <View style={modalStyles.kcalRow}>
                <View style={[modalStyles.kcalIconWrap, { backgroundColor: overBudget ? theme.danger + '25' : theme.accent + '25' }]}>
                  <Ionicons name="flame-sharp" size={20} color={overBudget ? theme.danger : theme.accent} />
                </View>
                <View>
                  <Text style={[modalStyles.kcalBig, { color: overBudget ? theme.danger : theme.accent }]}>
                    {kcal} kcal
                  </Text>
                  <Text style={[modalStyles.kcalSub, { color: theme.textMuted }]}>for {g}g</Text>
                </View>
                <View style={{ flex: 1 }} />
                <View style={modalStyles.kcalRemaining}>
                  <Text style={[modalStyles.kcalRemLabel, { color: theme.textMuted }]}>After eating</Text>
                  <Text style={[modalStyles.kcalRemVal, { color: overBudget ? theme.danger : theme.accentGreen }]}>
                    {overBudget ? `\u2212${Math.abs(afterEating)}` : `+${afterEating}`} kcal
                  </Text>
                  <Text style={[modalStyles.kcalRemLabel, { color: theme.textMuted }]}>
                    {overBudget ? 'over budget' : 'remaining'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[modalStyles.macrosCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Text style={[modalStyles.macrosTitle, { color: theme.textMuted }]}>MACROS</Text>
              <View style={modalStyles.macroCirclesRow}>
                <MacroCircle label="Protein" val={protein} color={theme.protein} maxVal={macroGoalValues.Protein} theme={theme} />
                <MacroCircle label="Carbs" val={carbs} color={theme.carbs} maxVal={macroGoalValues.Carbs} theme={theme} />
                <MacroCircle label="Fat" val={fat} color={theme.fat} maxVal={macroGoalValues.Fat} theme={theme} />
                {sugar > 0 && <MacroCircle label="Sugar" val={sugar} color={theme.sugar} maxVal={50} theme={theme} />}
              </View>
            </View>

            <View>
              <Text style={[modalStyles.mealPickerLabel, { color: theme.textMuted }]}>LOG TO MEAL</Text>
              <View style={modalStyles.mealPicker}>
                {MEALS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMeal(m)}
                    style={[
                      modalStyles.mealChip,
                      { backgroundColor: meal === m ? MEAL_COLORS[m] + '22' : theme.surfaceAlt,
                        borderColor: meal === m ? MEAL_COLORS[m] : theme.border },
                    ]}
                  >
                    <Ionicons name={MEAL_ICONS[m]} size={14} color={meal === m ? MEAL_COLORS[m] : theme.textMuted} />
                    <Text style={[modalStyles.mealChipText, { color: meal === m ? MEAL_COLORS[m] : theme.textSub }]}>
                      {tr.meals[m] ?? m.charAt(0).toUpperCase() + m.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            onPress={() => { onLog && onLog({ food, grams: g, meal, kcal, protein, carbs, fat, sugar }); }}
            disabled={g <= 0}
            activeOpacity={0.88}
            style={{ marginTop: 12 }}
          >
            <LinearGradient
              colors={g > 0 ? [theme.accent, theme.accentDark] : [theme.border, theme.border]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={modalStyles.logBtn}
            >
              <Ionicons name="add-circle-sharp" size={22} color="#FFF" />
              <Text style={modalStyles.logBtnText}>Log {kcal > 0 ? `${kcal} kcal` : 'to Diary'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, maxHeight: '90%', overflow: 'hidden',
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, marginTop: 2 },
  gramsCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 16, borderWidth: 1,
  },
  gramsLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  gramsInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, gap: 4,
  },
  gramsInput: { fontSize: 20, fontWeight: '800', minWidth: 48, textAlign: 'center' },
  gramsUnit: { fontSize: 14, fontWeight: '700' },
  exactLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, marginBottom: -6 },
  presetsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  presetChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  presetText: { fontSize: 13, fontWeight: '700' },
  kcalCard: { borderRadius: 20, padding: 16, borderWidth: 1, gap: 14 },
  kcalRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kcalIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  kcalBig: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  kcalSub: { fontSize: 12, marginTop: 2 },
  kcalRemaining: { alignItems: 'flex-end' },
  kcalRemLabel: { fontSize: 11 },
  kcalRemVal: { fontSize: 18, fontWeight: '800' },
  macrosCard: { borderRadius: 16, padding: 14, borderWidth: 1, gap: 10 },
  macrosTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  macroCirclesRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 6 },
  mcLabel: { fontSize: 10, fontWeight: '700' },
  mcVal: { fontSize: 13, fontWeight: '800' },
  mealPickerLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  mealPicker: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  mealChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1,
  },
  mealChipText: { fontSize: 13, fontWeight: '700' },
  logBtn: {
    height: 56, borderRadius: 18, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  logBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});

import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, StyleSheet, Platform, Modal, TextInput, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../components/SafeGradient';
import { useSettings } from '../context/SettingsContext';
import { useCalories } from '../context/CalorieContext';

const TEAL = '#00E5A8';
const BG   = '#03040A';
const SURFACE = '#0E1221';
const BORDER  = 'rgba(255,255,255,0.08)';
const TEXT    = '#F0F4FF';
const MUTED   = '#6A7A94';

const MEAL_META = {
  breakfast: { emoji: '🍳', label: 'Breakfast', pct: 0.30, gradient: ['#FF9F0A', '#FF6B0A'] },
  lunch:     { emoji: '🥗', label: 'Lunch',     pct: 0.40, gradient: ['#0A84FF', '#005FCC'] },
  dinner:    { emoji: '🍽',  label: 'Dinner',    pct: 0.25, gradient: ['#BF5AF2', '#7B2FBE'] },
  snack:     { emoji: '🍎', label: 'Snack',     pct: 0.05, gradient: [TEAL, '#00C98A'] },
};

// â”€â”€ Progress bar row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ProgressRow({ label, eaten, goal, unit = 'g' }) {
  const pct    = goal > 0 ? Math.min(eaten / goal, 1) : 0;
  const isOver = eaten > goal && goal > 0;
  return (
    <View style={pr.wrap}>
      <View style={pr.labelRow}>
        <Text style={pr.label}>{label}</Text>
        <Text style={[pr.value, isOver && { color: '#FF453A' }]}>
          {Math.round(eaten * 10) / 10} / {Math.round(goal)} {unit}
        </Text>
      </View>
      <View style={pr.track}>
        <View style={[pr.fill, { width: `${pct * 100}%`, backgroundColor: isOver ? '#FF453A' : TEAL }]} />
      </View>
    </View>
  );
}

const pr = StyleSheet.create({
  wrap:     { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label:    { fontSize: 14, fontWeight: '600', color: TEXT },
  value:    { fontSize: 13, fontWeight: '500', color: MUTED },
  track:    { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  fill:     { height: '100%', borderRadius: 3 },
});

// â”€â”€ Macro stat card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MacroCard({ value, unit, label }) {
  return (
    <View style={mc.card}>
      <Text style={mc.value}>{value}</Text>
      <Text style={mc.unit}>{unit}</Text>
      <Text style={mc.label}>{label}</Text>
    </View>
  );
}

const mc = StyleSheet.create({
  card:  { flex: 1, backgroundColor: '#0E1221', borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 14, minHeight: 90, justifyContent: 'center' },
  value: { fontSize: 26, fontWeight: '900', color: TEXT, letterSpacing: -1 },
  unit:  { fontSize: 12, fontWeight: '600', color: MUTED, marginTop: 1 },
  label: { fontSize: 11, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
});

// â”€â”€ Single food entry row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FoodItem({ entry, onDelete, onEdit, isLast }) {
  return (
    <TouchableOpacity
      style={[fi.wrap, isLast && { borderBottomWidth: 0 }]}
      onPress={onEdit}
      onLongPress={onDelete}
      activeOpacity={0.7}
    >
      <View style={fi.left}>
        <Text style={fi.name} numberOfLines={1}>{entry.name}</Text>
        <Text style={fi.meta}>
          {entry.amountG}g
          {entry.carbsG   > 0 ? `  C ${entry.carbsG}g`   : ''}
          {entry.proteinG > 0 ? `  P ${entry.proteinG}g` : ''}
          {entry.fatG     > 0 ? `  F ${entry.fatG}g`     : ''}
        </Text>
      </View>
      <Text style={fi.kcal}>{entry.calories} kcal</Text>
      <Ionicons name="chevron-forward" size={16} color={MUTED} />
    </TouchableOpacity>
  );
}

const fi = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER, gap: 10 },
  left: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 3 },
  meta: { fontSize: 12, color: MUTED },
  kcal: { fontSize: 14, fontWeight: '700', color: TEXT },
});

// â”€â”€ Main screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function MealDetailScreen({ route, navigation }) {
  const { meal } = route.params;
  const { calorieGoal, tr } = useSettings();
  const { todayByMeal, removeEntry, updateEntry } = useCalories();

  // Edit modal state
  const [editEntry, setEditEntry]   = useState(null);
  const [editGrams, setEditGrams]   = useState('100');

  const openEdit = useCallback((entry) => {
    setEditEntry(entry);
    setEditGrams(String(entry.amountG));
  }, []);

  const closeEdit = useCallback(() => {
    setEditEntry(null);
    setEditGrams('100');
  }, []);

  const commitEdit = useCallback(() => {
    if (!editEntry) return;
    const g = parseFloat(editGrams) || 0;
    if (g > 0) updateEntry(editEntry.id, g);
    closeEdit();
  }, [editEntry, editGrams, updateEntry, closeEdit]);

  const meta    = MEAL_META[meal] ?? MEAL_META.snack;
  const entries = todayByMeal[meal] ?? [];
  const mLabel  = tr.meals[meal] ?? meta.label;

  const totalKcal    = useMemo(() => entries.reduce((s, e) => s + (e.calories  || 0), 0), [entries]);
  const totalCarbs   = useMemo(() => entries.reduce((s, e) => s + (e.carbsG    || 0), 0), [entries]);
  const totalProtein = useMemo(() => entries.reduce((s, e) => s + (e.proteinG  || 0), 0), [entries]);
  const totalFat     = useMemo(() => entries.reduce((s, e) => s + (e.fatG      || 0), 0), [entries]);

  // Per-meal calorie goal is a fraction of the daily goal
  const kcalGoal = Math.round(calorieGoal * meta.pct);
  // Macro goals derived from kcal goal: 50% carbs, 20% protein, 30% fat
  const carbGoal = Math.round(kcalGoal * 0.50 / 4);
  const protGoal = Math.round(kcalGoal * 0.20 / 4);
  const fatGoal  = Math.round(kcalGoal * 0.30 / 9);

  const confirmDelete = (entry) => {
    Alert.alert(
      tr.calories.removeTitle,
      tr.calories.removePrompt(entry.name),
      [
        { text: tr.calories.cancel, style: 'cancel' },
        { text: tr.calories.delete, style: 'destructive', onPress: () => removeEntry(entry.id) },
      ],
    );
  };

  return (
    <View style={s.bg}>
      <SafeAreaView style={{ flex: 1 }}>

        {/* â”€â”€ Header â”€â”€ */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8} style={s.headerBtn}>
            <Ionicons name="chevron-back" size={26} color={TEXT} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{mLabel}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddFood', { meal })}
            hitSlop={8}
            style={s.headerBtn}
          >
            <Ionicons name="create-outline" size={22} color={MUTED} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 110 : 90 }}
        >

          {/* â”€â”€ Hero card â”€â”€ */}
          <LinearGradient
            colors={meta.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.hero}
          >
            <Text style={s.heroEmoji}>{meta.emoji}</Text>
            <Text style={s.heroTitle}>{mLabel}</Text>
            <Text style={s.heroSub}>
              {totalKcal} kcal · {tr.meals.entries(entries.length)}
            </Text>
            {/* Cosmetic camera icon */}
            <View style={s.heroCamIcon}>
              <Ionicons name="camera-outline" size={18} color="rgba(255,255,255,0.7)" />
            </View>
          </LinearGradient>

          {/* â”€â”€ Macro grid 2×2 â”€â”€ */}
          <View style={s.macroGrid}>
            <View style={s.macroRow}>
              <MacroCard value={totalKcal} unit="kcal" label={tr.calories.caloriesLabel} />
              <MacroCard value={Math.round(totalCarbs * 10) / 10} unit="g" label={tr.calories.carbohydrates} />
            </View>
            <View style={s.macroRow}>
              <MacroCard value={Math.round(totalProtein * 10) / 10} unit="g" label={tr.calories.protein} />
              <MacroCard value={Math.round(totalFat * 10) / 10} unit="g" label={tr.calories.fat} />
            </View>
          </View>

          {/* â”€â”€ Food items list â”€â”€ */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>{tr.meals.foodItems}</Text>
            <View style={s.card}>
              {entries.length === 0 ? (
                <View style={s.emptyWrap}>
                  <Text style={s.emptyEmoji}>{meta.emoji}</Text>
                  <Text style={s.emptyText}>{tr.meals.noEntriesYet}</Text>
                </View>
              ) : (
                entries.map((entry, i) => (
                  <FoodItem
                    key={entry.id}
                    entry={entry}
                    onEdit={() => openEdit(entry)}
                    onDelete={() => confirmDelete(entry)}
                    isLast={i === entries.length - 1}
                  />
                ))
              )}
            </View>
          </View>

          {/* Nutrition progress */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>{tr.calories.nutritionDetails}</Text>
            <View style={[s.card, { gap: 18 }]}>
              <ProgressRow label={tr.calories.caloriesLabel} eaten={totalKcal}    goal={kcalGoal} unit="kcal" />
              <ProgressRow label={tr.calories.carbohydrates} eaten={totalCarbs}   goal={carbGoal} />
              <ProgressRow label={tr.calories.protein}       eaten={totalProtein} goal={protGoal} />
              <ProgressRow label={tr.calories.fat}           eaten={totalFat}     goal={fatGoal} />
            </View>
          </View>

        </ScrollView>

        {/* â”€â”€ Mehr hinzufügen button â”€â”€ */}
        <View style={s.footer}>
          <TouchableOpacity
            style={s.addMoreBtn}
            onPress={() => navigation.navigate('AddFood', { meal })}
            activeOpacity={0.85}
          >
            <Text style={s.addMoreText}>{tr.meals.moreAdd}</Text>
          </TouchableOpacity>
        </View>

        {/* â”€â”€ Edit serving modal â”€â”€ */}
        <Modal
          visible={!!editEntry}
          transparent
          animationType="slide"
          onRequestClose={closeEdit}
        >
          <KeyboardAvoidingView
            style={em.backdrop}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeEdit} activeOpacity={1} />
            <View style={em.sheet}>
              <View style={em.handle} />
              <Text style={em.foodName} numberOfLines={2}>{editEntry?.name}</Text>

              {/* Preset chips */}
              <View style={em.chipsRow}>
                {[50, 75, 100, 150, 200].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[em.chip, editGrams === String(v) && em.chipActive]}
                    onPress={() => setEditGrams(String(v))}
                    activeOpacity={0.75}
                  >
                    <Text style={[em.chipText, editGrams === String(v) && em.chipTextActive]}>
                      {v}g
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom grams input */}
              <View style={em.inputRow}>
                <TextInput
                  style={em.input}
                  value={editGrams}
                  onChangeText={setEditGrams}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                  placeholder="Custom g"
                  placeholderTextColor={MUTED}
                />
                <Text style={em.inputUnit}>g</Text>
              </View>

              {/* Update button */}
              <TouchableOpacity style={em.updateBtn} onPress={commitEdit} activeOpacity={0.85}>
                <Text style={em.updateText}>Update</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </SafeAreaView>
    </View>
  );
}

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: BG },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: TEXT },

  hero: { marginHorizontal: 16, marginTop: 16, marginBottom: 8, borderRadius: 22, paddingVertical: 36, paddingHorizontal: 20, alignItems: 'center', gap: 6, overflow: 'hidden' },
  heroEmoji: { fontSize: 52 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.4, marginTop: 4 },
  heroSub:   { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  heroCamIcon: { position: 'absolute', bottom: 14, right: 16 },

  macroGrid: { paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  macroRow:  { flexDirection: 'row', gap: 8 },

  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  card: { backgroundColor: SURFACE, borderRadius: 18, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 16, paddingVertical: 12 },

  emptyWrap: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  emptyEmoji: { fontSize: 36, opacity: 0.4 },
  emptyText: { fontSize: 14, color: MUTED, fontWeight: '500' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: BORDER, backgroundColor: BG },
  addMoreBtn: { backgroundColor: '#FFFFFF', borderRadius: 28, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  addMoreText: { color: BG, fontSize: 16, fontWeight: '800' },
});

// â”€â”€ Edit serving modal styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const em = StyleSheet.create({
  backdrop:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet:     { backgroundColor: SURFACE, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 36 : 20, gap: 16 },
  handle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 4 },
  foodName:  { fontSize: 18, fontWeight: '800', color: TEXT, textAlign: 'center' },
  chipsRow:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  chip:      { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: '#141B2D' },
  chipActive:{ backgroundColor: TEAL, borderColor: TEAL },
  chipText:  { fontSize: 14, fontWeight: '700', color: MUTED },
  chipTextActive: { color: '#000' },
  inputRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center' },
  input:     { width: 110, borderWidth: 2, borderColor: TEAL, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, fontSize: 22, fontWeight: '800', color: TEXT, textAlign: 'center', backgroundColor: 'rgba(0,229,168,0.08)' },
  inputUnit: { fontSize: 18, fontWeight: '700', color: TEAL },
  updateBtn: { backgroundColor: TEAL, borderRadius: 22, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  updateText:{ fontSize: 16, fontWeight: '800', color: '#000' },
});

import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  TextInput, Modal, ScrollView, Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSettings } from '../context/SettingsContext';
import { useCalories } from '../context/CalorieContext';
import { analyzeNutritionLabel } from '../utils/gemini';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_ICONS = { breakfast: 'sunny-outline', lunch: 'restaurant-outline', dinner: 'moon-outline', snack: 'apple-outline' };
const MEAL_COLORS = { breakfast: '#FF9F0A', lunch: '#0A84FF', dinner: '#BF5AF2', snack: '#00E87A' };

// ── Serving Calculator Modal ─────────────────────────────────────────────────
function ServingModal({ visible, result, onClose, onLog, calorieGoal, todayKcal, theme, tr }) {
  const [grams, setGrams] = useState('100');
  const [meal, setMeal] = useState('snack');
  const insets = useSafeAreaInsets();

  const g = parseFloat(grams) || 0;
  const factor = g / 100;
  const kcal    = Math.round((result?.kcalPer100g    || 0) * factor);
  const protein = Math.round((result?.proteinPer100g || 0) * factor * 10) / 10;
  const carbs   = Math.round((result?.carbsPer100g   || 0) * factor * 10) / 10;
  const fat     = Math.round((result?.fatPer100g     || 0) * factor * 10) / 10;
  const sugar   = Math.round((result?.sugarPer100g   || 0) * factor * 10) / 10;
  const remaining = calorieGoal - todayKcal;
  const afterEating = remaining - kcal;
  const pct = calorieGoal > 0 ? Math.min((todayKcal + kcal) / calorieGoal, 1) : 0;
  const overBudget = afterEating < 0;

  const macroBar = (label, val, max, color) => {
    const barPct = max > 0 ? Math.min(val / max, 1) : 0;
    return (
      <View style={styles.macroRow}>
        <Text style={[styles.macroLabel, { color: theme.textMuted }]}>{label}</Text>
        <View style={[styles.macroTrack, { backgroundColor: theme.surfaceAlt }]}>
          <View style={[styles.macroFill, { width: `${barPct * 100}%`, backgroundColor: color }]} />
        </View>
        <Text style={[styles.macroVal, { color: theme.text }]}>{val}g</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Animated.View
          entering={FadeInUp.duration(320).springify().damping(22)}
          style={[styles.modalSheet, { backgroundColor: theme.surface, paddingBottom: insets.bottom + 16 }]}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: theme.border }]} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 18, paddingBottom: 8 }}>

            {/* Food name */}
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconWrap, { backgroundColor: theme.accentLight }]}>
                <Ionicons name="nutrition-outline" size={22} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={2}>
                  {result?.name || 'Scanned Food'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                  {result?.kcalPer100g ?? '—'} kcal per 100g
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Ionicons name="close-circle" size={26} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Grams input */}
            <View style={[styles.gramsCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Ionicons name="scale-outline" size={18} color={theme.accent} />
              <Text style={[styles.gramsLabel, { color: theme.textSub }]}>How much will you eat?</Text>
              <View style={[styles.gramsInputWrap, { backgroundColor: theme.surface, borderColor: theme.accent + '60' }]}>
                <TextInput
                  style={[styles.gramsInput, { color: theme.text }]}
                  value={grams}
                  onChangeText={setGrams}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
                <Text style={[styles.gramsUnit, { color: theme.accent }]}>g</Text>
              </View>
            </View>

            {/* Quick presets */}
            <View style={styles.presetsRow}>
              {[50, 100, 150, 200, 250].map((v) => (
                <TouchableOpacity
                  key={v}
                  onPress={() => setGrams(String(v))}
                  style={[
                    styles.presetChip,
                    { backgroundColor: String(v) === grams ? theme.accent : theme.surfaceAlt,
                      borderColor: String(v) === grams ? theme.accent : theme.border },
                  ]}
                >
                  <Text style={[styles.presetText, { color: String(v) === grams ? '#FFF' : theme.textSub }]}>
                    {v}g
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Calorie result */}
            <LinearGradient
              colors={overBudget ? [theme.danger + '22', theme.danger + '08'] : [theme.accent + '22', theme.accent + '08']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[styles.kcalCard, { borderColor: overBudget ? theme.danger + '40' : theme.accent + '40' }]}
            >
              <View style={styles.kcalRow}>
                <View style={[styles.kcalIconWrap, { backgroundColor: overBudget ? theme.danger + '25' : theme.accent + '25' }]}>
                  <Ionicons name="flame-sharp" size={20} color={overBudget ? theme.danger : theme.accent} />
                </View>
                <View>
                  <Text style={[styles.kcalBig, { color: overBudget ? theme.danger : theme.accent }]}>
                    {kcal} kcal
                  </Text>
                  <Text style={[styles.kcalSub, { color: theme.textMuted }]}>for {g}g</Text>
                </View>
                <View style={{ flex: 1 }} />
                <View style={styles.kcalRemaining}>
                  <Text style={[styles.kcalRemLabel, { color: theme.textMuted }]}>After eating</Text>
                  <Text style={[styles.kcalRemVal, { color: overBudget ? theme.danger : theme.accentGreen }]}>
                    {overBudget ? `−${Math.abs(afterEating)}` : `+${afterEating}`} kcal
                  </Text>
                  <Text style={[styles.kcalRemLabel, { color: theme.textMuted }]}>
                    {overBudget ? 'over budget' : 'remaining'}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.budgetBarWrap}>
                <View style={[styles.budgetTrack, { backgroundColor: theme.surfaceAlt }]}>
                  {/* already eaten */}
                  <View style={[styles.budgetFill, {
                    width: `${Math.min(todayKcal / calorieGoal, 1) * 100}%`,
                    backgroundColor: theme.textMuted,
                  }]} />
                  {/* this meal */}
                  <View style={[styles.budgetFill, {
                    width: `${Math.min(kcal / calorieGoal, pct - Math.min(todayKcal / calorieGoal, 1)) * 100}%`,
                    backgroundColor: overBudget ? theme.danger : theme.accent,
                    marginLeft: `${Math.min(todayKcal / calorieGoal, 1) * 100}%`,
                    position: 'absolute',
                  }]} />
                </View>
                <View style={styles.budgetLabels}>
                  <Text style={[styles.budgetLabel, { color: theme.textMuted }]}>
                    {todayKcal} eaten
                  </Text>
                  <Text style={[styles.budgetLabel, { color: theme.textMuted }]}>
                    {calorieGoal} goal
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* Macros */}
            <View style={[styles.macrosCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Text style={[styles.macrosTitle, { color: theme.textMuted }]}>MACROS</Text>
              {macroBar('Protein', protein, result?.proteinPer100g, theme.protein)}
              {macroBar('Carbs',   carbs,   result?.carbsPer100g,   theme.carbs)}
              {macroBar('Fat',     fat,     result?.fatPer100g,     theme.fat)}
              {sugar > 0 && macroBar('Sugar', sugar, result?.sugarPer100g, theme.sugar)}
            </View>

            {/* Meal picker */}
            <View>
              <Text style={[styles.mealPickerLabel, { color: theme.textMuted }]}>LOG TO MEAL</Text>
              <View style={styles.mealPicker}>
                {MEALS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMeal(m)}
                    style={[
                      styles.mealChip,
                      { backgroundColor: meal === m ? MEAL_COLORS[m] + '22' : theme.surfaceAlt,
                        borderColor: meal === m ? MEAL_COLORS[m] : theme.border },
                    ]}
                  >
                    <Ionicons name={MEAL_ICONS[m]} size={14} color={meal === m ? MEAL_COLORS[m] : theme.textMuted} />
                    <Text style={[styles.mealChipText, { color: meal === m ? MEAL_COLORS[m] : theme.textSub }]}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Log button */}
          <TouchableOpacity
            onPress={() => onLog({ result, grams: g, meal, kcal, protein, carbs, fat, sugar })}
            disabled={g <= 0}
            activeOpacity={0.88}
            style={{ marginTop: 12 }}
          >
            <LinearGradient
              colors={g > 0 ? [theme.accent, theme.accentDark] : [theme.border, theme.border]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.logBtn}
            >
              <Ionicons name="add-circle-sharp" size={22} color="#FFF" />
              <Text style={styles.logBtnText}>Log {kcal > 0 ? `${kcal} kcal` : 'to Diary'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function CameraLabelScreen({ navigation }) {
  const { theme, tr, geminiKey, setGeminiKey, calorieGoal } = useSettings();
  const { saveFood, addEntry, todayEntries } = useCalories();
  const c = tr.calories;
  const [permission, requestPermission] = useCameraPermissions();
  const [analyzing, setAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [keyDraft, setKeyDraft] = useState(geminiKey);
  const cameraRef = useRef(null);
  const insets = useSafeAreaInsets();

  const todayKcal = todayEntries.reduce((s, e) => s + (e.calories || 0), 0);

  // No key — setup screen
  if (!geminiKey) {
    return (
      <View style={[styles.setupWrap, { backgroundColor: theme.bg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.setupBack, { backgroundColor: theme.surfaceAlt, top: insets.top + 12 }]}>
          <Ionicons name="close" size={20} color={theme.text} />
        </TouchableOpacity>
        <View style={[styles.setupIcon, { backgroundColor: theme.accentLight }]}>
          <Ionicons name="scan-outline" size={36} color={theme.accent} />
        </View>
        <Text style={[styles.setupTitle, { color: theme.text }]}>{c.labelScanner}</Text>
        <Text style={[styles.setupDesc, { color: theme.textMuted }]}>{c.labelScannerDesc}</Text>
        <View style={[styles.keyRow, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <TextInput
            style={[styles.keyInput, { color: theme.text }]}
            value={keyDraft}
            onChangeText={setKeyDraft}
            placeholder="AIza..."
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity
          style={[styles.setupBtn, { backgroundColor: keyDraft.trim() ? theme.accent : theme.border }]}
          disabled={!keyDraft.trim()}
          onPress={() => setGeminiKey(keyDraft.trim())}
        >
          <Text style={styles.setupBtnText}>{c.saveAndContinue}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!permission) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Ionicons name="camera-outline" size={56} color={theme.textMuted} />
        <Text style={[styles.permText, { color: theme.text }]}>{c.cameraPermission}</Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.accent }]} onPress={requestPermission}>
          <Text style={styles.btnText}>{c.grantPermission}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || analyzing) return;
    setAnalyzing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false });
      const resized = await manipulateAsync(photo.uri, [{ resize: { width: 1024 } }], {
        compress: 0.7, format: SaveFormat.JPEG, base64: true,
      });
      const result = await analyzeNutritionLabel(resized.base64, geminiKey);
      setScanResult(result);
      setShowModal(true);
    } catch (e) {
      if (e.message === 'NO_API_KEY' || e.message?.includes('API_KEY')) {
        setGeminiKey('');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLog = ({ result, grams, meal, kcal, protein, carbs, fat, sugar }) => {
    addEntry({
      name: result.name || 'Scanned Food',
      meal,
      amountG: grams,
      kcalPer100g:    result.kcalPer100g    || 0,
      proteinPer100g: result.proteinPer100g  || 0,
      carbsPer100g:   result.carbsPer100g    || 0,
      fatPer100g:     result.fatPer100g      || 0,
      sugarPer100g:   result.sugarPer100g    || 0,
      calories: kcal,
      proteinG: protein,
      carbsG: carbs,
      fatG: fat,
      sugarG: sugar,
    });
    setShowModal(false);
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
        <View style={styles.overlay}>
          {/* Back button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { top: insets.top + 12, backgroundColor: 'rgba(0,0,0,0.5)' }]}
          >
            <Ionicons name="close" size={22} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.framingGuide}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            <Text style={styles.guideText}>{c.cameraGuide}</Text>
          </View>
        </View>
      </CameraView>

      {/* Capture bar */}
      <View style={[styles.controls, { backgroundColor: theme.bg, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.captureHint}>
          <Ionicons name="nutrition-outline" size={16} color={theme.accent} />
          <Text style={[styles.captureHintText, { color: theme.textSub }]}>
            Point at nutrition label · tap to scan
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.captureBtn, { backgroundColor: theme.accent }]}
          onPress={handleCapture}
          disabled={analyzing}
          activeOpacity={0.85}
        >
          {analyzing
            ? <ActivityIndicator color="#FFF" />
            : <Ionicons name="scan-sharp" size={28} color="#FFF" />}
        </TouchableOpacity>
      </View>

      {analyzing && (
        <View style={styles.analyzingOverlay}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.analyzingText, { color: '#FFF' }]}>{c.analyzing}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Reading nutrition label…</Text>
        </View>
      )}

      <ServingModal
        visible={showModal}
        result={scanResult}
        onClose={() => { setShowModal(false); setAnalyzing(false); }}
        onLog={handleLog}
        calorieGoal={calorieGoal}
        todayKcal={todayKcal}
        theme={theme}
        tr={tr}
      />
    </View>
  );
}

const CORNER_SIZE = 22;
const CORNER_THICK = 3;

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  permText: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  btn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  setupWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  setupBack: { position: 'absolute', left: 20, padding: 10, borderRadius: 12 },
  setupIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  setupTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  setupDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  keyRow: { width: '100%', borderWidth: 1.5, borderRadius: 14, overflow: 'hidden' },
  keyInput: { padding: 14, fontSize: 15, width: '100%' },
  setupBtn: { width: '100%', height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  setupBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },

  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { position: 'absolute', left: 16, padding: 8, borderRadius: 20 },
  framingGuide: { alignItems: 'center', gap: 20 },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: '#FFF' },
  cornerTL: { top: -90, left: -130, borderTopWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK, borderTopLeftRadius: 4 },
  cornerTR: { top: -90, right: -130, borderTopWidth: CORNER_THICK, borderRightWidth: CORNER_THICK, borderTopRightRadius: 4 },
  cornerBL: { bottom: -50, left: -130, borderBottomWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: -50, right: -130, borderBottomWidth: CORNER_THICK, borderRightWidth: CORNER_THICK, borderBottomRightRadius: 4 },
  guideText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },

  controls: {
    paddingHorizontal: 24, paddingTop: 16, gap: 14, alignItems: 'center',
  },
  captureHint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  captureHintText: { fontSize: 13 },
  captureBtn: {
    width: 70, height: 70, borderRadius: 35,
    alignItems: 'center', justifyContent: 'center',
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center', justifyContent: 'center', gap: 14,
  },
  analyzingText: { fontSize: 17, fontWeight: '700' },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, maxHeight: '90%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  modalSubtitle: { fontSize: 12, marginTop: 2 },

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

  budgetBarWrap: { gap: 6 },
  budgetTrack: { height: 8, borderRadius: 4, overflow: 'hidden', position: 'relative' },
  budgetFill: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 4 },
  budgetLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetLabel: { fontSize: 11 },

  macrosCard: { borderRadius: 16, padding: 14, borderWidth: 1, gap: 10 },
  macrosTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  macroRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  macroLabel: { width: 46, fontSize: 12, fontWeight: '600' },
  macroTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  macroFill: { height: '100%', borderRadius: 3 },
  macroVal: { width: 38, fontSize: 12, fontWeight: '700', textAlign: 'right' },

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

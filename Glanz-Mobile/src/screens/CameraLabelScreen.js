import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  TextInput, Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useCalories } from '../context/CalorieContext';
import ServingModal from '../components/ServingModal';
import { analyzeNutritionLabel } from '../utils/gemini';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// ── Main screen ──────────────────────────────────────────────────────────────
export default function CameraLabelScreen({ navigation }) {
  const { theme, tr, geminiKey, setGeminiKey, calorieGoal, carbGoal, proteinGoal, fatGoal } = useSettings();
  const { saveFood, addEntry, todayEntries } = useCalories();
  const c = tr.calories;
  const [permission, requestPermission] = useCameraPermissions();
  const [analyzing, setAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [keyDraft, setKeyDraft] = useState(geminiKey);
  const [errorMsg, setErrorMsg] = useState('');
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
        {keyDraft.trim() && !keyDraft.trim().startsWith('AIza') && !keyDraft.trim().startsWith('AQ') && (
          <Text style={[styles.setupHint, { color: theme.textMuted }]}>
            Paste your Gemini API key from aistudio.google.com
          </Text>
        )}
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
      const msg = e.message || 'Unknown error';
      if (msg === 'NO_API_KEY' || msg.includes('API_KEY')) {
        setGeminiKey('');
      } else {
        setErrorMsg(msg);
        setTimeout(() => setErrorMsg(''), 8000);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLog = ({ food, grams, meal, kcal, protein, carbs, fat, sugar }) => {
    addEntry({
      name: food.name || 'Scanned Food',
      meal,
      amountG: grams,
      kcalPer100g:    food.kcalPer100g    || 0,
      proteinPer100g: food.proteinPer100g  || 0,
      carbsPer100g:   food.carbsPer100g    || 0,
      fatPer100g:     food.fatPer100g      || 0,
      sugarPer100g:   food.sugarPer100g    || 0,
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

      {errorMsg !== '' && (
        <View style={styles.errorBar}>
          <Ionicons name="alert-circle" size={16} color="#FF453A" />
          <Text style={styles.errorText} numberOfLines={3}>{errorMsg}</Text>
        </View>
      )}

      <ServingModal
        visible={showModal}
        food={scanResult}
        onClose={() => { setShowModal(false); setAnalyzing(false); }}
        onLog={handleLog}
        calorieGoal={calorieGoal}
        todayKcal={todayKcal}
        carbGoal={carbGoal}
        proteinGoal={proteinGoal}
        fatGoal={fatGoal}
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
  setupHint: { fontSize: 12, textAlign: 'center', paddingHorizontal: 12 },

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
  errorBar: {
    position: 'absolute', bottom: 180, left: 20, right: 20,
    backgroundColor: 'rgba(255,69,58,0.15)', borderRadius: 12,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  errorText: { color: '#FF453A', fontSize: 13, flex: 1, lineHeight: 18 },
});

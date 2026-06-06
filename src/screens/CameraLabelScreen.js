import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSettings } from '../context/SettingsContext';
import { analyzeNutritionLabel } from '../utils/gemini';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';

export default function CameraLabelScreen({ navigation }) {
  const { theme, tr, geminiKey, setGeminiKey } = useSettings();
  const c = tr.calories;
  const [permission, requestPermission] = useCameraPermissions();
  const [analyzing, setAnalyzing] = useState(false);
  const [keyDraft, setKeyDraft] = useState(geminiKey);
  const cameraRef = useRef(null);

  // No key set yet — show one-time setup screen
  if (!geminiKey) {
    return (
      <View style={[styles.setupWrap, { backgroundColor: theme.bg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.setupBack, { backgroundColor: theme.surfaceAlt }]}>
          <Ionicons name="close" size={20} color={theme.text} />
        </TouchableOpacity>

        <View style={[styles.setupIcon, { backgroundColor: theme.accentLight }]}>
          <Ionicons name="scan-outline" size={36} color={theme.accent} />
        </View>

        <Text style={[styles.setupTitle, { color: theme.text }]}>Label Scanner</Text>
        <Text style={[styles.setupDesc, { color: theme.textMuted }]}>
          Scans nutrition facts tables using Google Gemini AI — free up to 1500 scans/day.{'\n\n'}
          Get your free key at{'\n'}
          <Text style={{ color: theme.accent }}>aistudio.google.com</Text>{'\n\n'}
          Sign in → "Get API key" → copy and paste below.
        </Text>

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
          <Text style={styles.setupBtnText}>Save & Continue</Text>
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
      navigation.navigate('AddFood', { prefill: result });
    } catch (e) {
      if (e.message === 'NO_API_KEY' || e.message?.includes('API_KEY')) {
        // Key invalid — clear it so setup screen shows again
        setGeminiKey('');
        Alert.alert('Invalid API Key', 'Your Gemini key was rejected. Please enter a valid key.');
      } else {
        Alert.alert(c.analyzeError, e.message);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
        <View style={styles.overlay}>
          <View style={styles.frame} />
          <Text style={styles.guideText}>{c.cameraGuide}</Text>
        </View>
      </CameraView>

      <View style={[styles.controls, { backgroundColor: theme.bg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.captureBtn, { backgroundColor: theme.accent }]}
          onPress={handleCapture}
          disabled={analyzing}
        >
          {analyzing ? <ActivityIndicator color="#FFF" /> : <Ionicons name="scan" size={26} color="#FFF" />}
        </TouchableOpacity>
        <View style={{ width: 44 }} />
      </View>

      {analyzing && (
        <View style={styles.analyzingOverlay}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.analyzingText}>{c.analyzing}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  permText: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  btn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  setupWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  setupBack: { position: 'absolute', top: 52, left: 20, padding: 10, borderRadius: 12 },
  setupIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  setupTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  setupDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  keyRow: {
    width: '100%', borderWidth: 1.5, borderRadius: 14, overflow: 'hidden',
  },
  keyInput: { padding: 14, fontSize: 15, width: '100%' },
  setupBtn: { width: '100%', height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  setupBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },

  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  frame: {
    width: 280, height: 180, borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)', borderRadius: 12, borderStyle: 'dashed',
  },
  guideText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },

  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 32, paddingVertical: 20,
  },
  cancelBtn: { padding: 10 },
  captureBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },

  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  analyzingText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Platform, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { useSettings } from '../context/SettingsContext';
import { useCalories } from '../context/CalorieContext';
import { lookupBarcode as lookupOpenFoodFacts } from '../utils/openFoodFacts';
import { lookupBarcode as lookupUSDA } from '../utils/usdaFoodData';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

const SCAN_W = 260;
const SCAN_H = 180;
const CORNER = 22;
const THICK = 3;

function ScanLine({ theme }) {
  const anim = useSharedValue(0);

  useEffect(() => {
    anim.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.linear }),
      -1, true
    );
  }, []);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: anim.value * (SCAN_H - 2) }],
  }));

  return (
    <Animated.View
      style={[{
        position: 'absolute', left: 14, right: 14, height: 2,
        backgroundColor: theme.accent,
        shadowColor: theme.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 10,
        elevation: 6,
        borderRadius: 1,
      }, lineStyle]}
      pointerEvents="none"
    />
  );
}

export default function BarcodeScannerScreen({ navigation, route }) {
  const { theme, tr } = useSettings();
  const { saveFood } = useCalories();
  const c = tr.calories;
  const returnTo = route.params?.returnTo;
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const scanningRef = React.useRef(true);

  const enableScan = () => { scanningRef.current = true; setLoading(false); };
  const disableScan = () => { scanningRef.current = false; };

  useFocusEffect(useCallback(() => {
    enableScan();
    setShowManualInput(false);
    setManualBarcode('');
  }, []));

  useEffect(() => {
    const timer = setTimeout(() => setShowManualInput(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!permission) return <View style={[styles.center, { backgroundColor: theme.bg }]} />;

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Ionicons name="barcode-outline" size={56} color={theme.textMuted} />
        <Text style={[styles.permText, { color: theme.text }]}>{c.cameraPermission}</Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.accent }]} onPress={requestPermission}>
          <Text style={styles.btnText}>{c.grantPermission}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcode = async ({ data }) => {
    if (!scanningRef.current || loading) return;
    disableScan();
    setLoading(true);
    try {
      let result = await lookupOpenFoodFacts(data);
      if (!result) {
        result = await lookupUSDA(data);
      }
      if (!result) {
        Alert.alert(c.notFound, `${c.barcodeNotFound} (${data})`, [
          { text: tr.history.cancel, onPress: enableScan },
          { text: c.enterManually, onPress: () => { enableScan(); navigation.navigate('AddFood'); } },
        ]);
        return;
      }
      saveFood(result);
      if (returnTo) {
        navigation.navigate(returnTo, { prefill: result });
        return;
      }
      const lines = [
        `✓ Auto-saved to My Foods`,
        result.name,
        result.brand ?? null,
        result.kcalPer100g != null ? tr.meals.per100gResult(result.kcalPer100g, result.fatPer100g ?? '—', result.carbsPer100g ?? '—', result.proteinPer100g ?? '—') : null,
      ].filter(Boolean).join('\n');
      Alert.alert(c.found, lines, [
        { text: c.continueScan, style: 'cancel', onPress: enableScan },
        { text: c.toDiary, onPress: () => { enableScan(); navigation.navigate('AddFood', { prefill: result }); } },
      ]);
    } catch (e) {
      Alert.alert(c.scanError, e.message, [
        { text: 'OK', onPress: enableScan },
      ]);
    }
  };

  const handleManualLookup = async () => {
    const code = manualBarcode.trim();
    if (!code) return;
    setLoading(true);
    try {
      let result = await lookupOpenFoodFacts(code);
      if (!result) {
        result = await lookupUSDA(code);
      }
      if (!result) {
        Alert.alert(c.notFound, `${c.barcodeNotFound} (${code})`, [
          { text: 'OK' },
        ]);
        setLoading(false);
        return;
      }
      saveFood(result);
      if (returnTo) {
        navigation.navigate(returnTo, { prefill: result });
        return;
      }
      const lines = [
        `✓ Auto-saved to My Foods`,
        result.name,
        result.brand ?? null,
        result.kcalPer100g != null ? tr.meals.per100gResult(result.kcalPer100g, result.fatPer100g ?? '—', result.carbsPer100g ?? '—', result.proteinPer100g ?? '—') : null,
      ].filter(Boolean).join('\n');
      Alert.alert(c.found, lines, [
        { text: c.continueScan, onPress: () => { setLoading(false); enableScan(); } },
        { text: c.toDiary, onPress: () => { enableScan(); navigation.navigate('AddFood', { prefill: result }); } },
      ]);
    } catch (e) {
      Alert.alert(c.scanError, e.message, [{ text: 'OK' }]);
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        onBarcodeScanned={handleBarcode}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'qr', 'upc_a', 'upc_e', 'code128', 'code39'] }}
      >
        {/* Scoped overlay: dark/blurred all around except clear window in center */}
        <View style={styles.overlayContainer}>
          {/* Top mask */}
          <View style={styles.maskPanel}>
            {Platform.OS === 'ios' && <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />}
          </View>

          {/* Middle row: side masks + scan window */}
          <View style={styles.midRow}>
            <View style={styles.sideMask}>
              {Platform.OS === 'ios' && <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />}
            </View>

            <View style={styles.scanWindow}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              <ScanLine theme={theme} />
            </View>

            <View style={styles.sideMask}>
              {Platform.OS === 'ios' && <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />}
            </View>
          </View>

          {/* Bottom mask */}
          <View style={styles.maskPanel}>
            {Platform.OS === 'ios' && <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />}
          </View>

          <Text style={styles.guideText}>{c.barcodeGuide}</Text>
        </View>
      </CameraView>

      {/* Controls */}
      <View style={[styles.controls, { backgroundColor: theme.bg }]}>
        {showManualInput && (
          <View style={styles.manualRow}>
            <TextInput
              style={[styles.manualInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
              value={manualBarcode}
              onChangeText={setManualBarcode}
              placeholder={c.barcodePlaceholder || 'Enter barcode...'}
              placeholderTextColor={theme.textMuted}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={handleManualLookup}
            />
            <TouchableOpacity style={[styles.manualBtn, { backgroundColor: theme.accent }]} onPress={handleManualLookup}>
              <Text style={styles.manualBtnText}>{c.search || 'Lookup'}</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Ionicons name="close" size={24} color={theme.text} />
          <Text style={[styles.cancelText, { color: theme.text }]}>{tr.history.cancel}</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loadingText}>{c.lookingUp}</Text>
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

  overlayContainer: {
    flex: 1,
  },
  maskPanel: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  midRow: {
    flexDirection: 'row',
    height: SCAN_H,
  },
  sideMask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  scanWindow: {
    width: SCAN_W,
    height: SCAN_H,
    position: 'relative',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute', width: CORNER, height: CORNER,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  topLeft: { top: -1, left: -1, borderTopWidth: THICK, borderLeftWidth: THICK, borderTopLeftRadius: 4 },
  topRight: { top: -1, right: -1, borderTopWidth: THICK, borderRightWidth: THICK, borderTopRightRadius: 4 },
  bottomLeft: { bottom: -1, left: -1, borderBottomWidth: THICK, borderLeftWidth: THICK, borderBottomLeftRadius: 4 },
  bottomRight: { bottom: -1, right: -1, borderBottomWidth: THICK, borderRightWidth: THICK, borderBottomRightRadius: 4 },

  guideText: {
    position: 'absolute',
    bottom: 40,
    left: 0, right: 0,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  controls: {
    alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16,
  },
  manualRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, width: '100%' },
  manualInput: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, fontWeight: '700' },
  manualBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  manualBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  cancelText: { fontSize: 16 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  loadingText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

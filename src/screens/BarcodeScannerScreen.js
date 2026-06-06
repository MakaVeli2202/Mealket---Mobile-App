import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSettings } from '../context/SettingsContext';
import { lookupBarcode } from '../utils/openFoodFacts';
import { Ionicons } from '@expo/vector-icons';

export default function BarcodeScannerScreen({ navigation }) {
  const { theme, tr } = useSettings();
  const c = tr.calories;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);

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
    if (!scanning || loading) return;
    setScanning(false);
    setLoading(true);
    try {
      const result = await lookupBarcode(data);
      if (!result) {
        Alert.alert(c.notFound, `${c.barcodeNotFound} (${data})`, [
          { text: tr.history.cancel, onPress: () => { setScanning(true); setLoading(false); } },
          { text: c.enterManually, onPress: () => navigation.navigate('AddFood') },
        ]);
        return;
      }
      navigation.navigate('AddFood', { prefill: result });
    } catch (e) {
      Alert.alert(c.scanError, e.message, [
        { text: 'OK', onPress: () => { setScanning(true); setLoading(false); } },
      ]);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        onBarcodeScanned={scanning ? handleBarcode : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'qr', 'upc_a', 'upc_e', 'code128', 'code39'] }}
      >
        <View style={styles.overlay}>
          {/* Corner brackets for visual guide */}
          <View style={styles.frameContainer}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.guideText}>{c.barcodeGuide}</Text>
        </View>
      </CameraView>

      {/* Cancel button */}
      <View style={[styles.controls, { backgroundColor: theme.bg }]}>
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

const CORNER = 24;
const THICK = 3;

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  permText: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  btn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },

  frameContainer: {
    width: 260, height: 160, position: 'relative',
  },
  corner: {
    position: 'absolute', width: CORNER, height: CORNER,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  topLeft: { top: 0, left: 0, borderTopWidth: THICK, borderLeftWidth: THICK, borderTopLeftRadius: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: THICK, borderRightWidth: THICK, borderTopRightRadius: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: THICK, borderLeftWidth: THICK, borderBottomLeftRadius: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: THICK, borderRightWidth: THICK, borderBottomRightRadius: 4 },

  guideText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },

  controls: {
    alignItems: 'center', paddingVertical: 20,
  },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  cancelText: { fontSize: 16 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  loadingText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera } from 'expo-camera';
import { LinearGradient } from '../components/SafeGradient';
import { requestHealthPermissions } from '../utils/healthConnect';

const PERM_KEY = '@mealket_permissions_shown';

export default function PermissionsGate({ onDone }) {
  const [cameraGranted, setCameraGranted] = useState(null);
  const [healthGranted, setHealthGranted] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(PERM_KEY).then((val) => {
      if (val === 'true') {
        onDone();
      } else {
        setChecking(false);
      }
    });
  }, []);

  const handleGrant = async () => {
    const cam = await Camera.requestCameraPermissionsAsync();
    setCameraGranted(cam.granted);
    const hc = await requestHealthPermissions();
    setHealthGranted(hc);
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(PERM_KEY, 'true');
    onDone();
  };

  if (checking) return null;

  const allDone = cameraGranted !== null && healthGranted !== null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0D0D0D', '#1a1a2e']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark-outline" size={48} color="#0A84FF" />
        </View>
        <Text style={styles.title}>Permissions</Text>
        <Text style={styles.subtitle}>
          Mealket needs a few permissions to work properly.
        </Text>

        <View style={styles.permsList}>
          <View style={styles.permRow}>
            <Ionicons
              name={cameraGranted === null ? 'camera-outline' : cameraGranted ? 'checkmark-circle' : 'close-circle'}
              size={22}
              color={cameraGranted === null ? '#FFF' : cameraGranted ? '#30D158' : '#FF453A'}
            />
            <View style={styles.permTextWrap}>
              <Text style={styles.permName}>Camera</Text>
              <Text style={styles.permDesc}>Scan barcodes & food labels</Text>
            </View>
          </View>
          <View style={styles.permRow}>
            <Ionicons
              name={healthGranted === null ? 'fitness-outline' : healthGranted ? 'checkmark-circle' : 'close-circle'}
              size={22}
              color={healthGranted === null ? '#FFF' : healthGranted ? '#30D158' : '#FF453A'}
            />
            <View style={styles.permTextWrap}>
              <Text style={styles.permName}>Health Connect</Text>
              <Text style={styles.permDesc}>Steps, heart rate & calories burned</Text>
            </View>
          </View>
        </View>

        {!allDone ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleGrant}>
            <Text style={styles.primaryBtnText}>Grant Permissions</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleSkip}>
            <Text style={styles.primaryBtnText}>Continue</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  iconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(10,132,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 30, fontWeight: '900', color: '#FFF', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 21, marginBottom: 36 },
  permsList: { width: '100%', gap: 14, marginBottom: 36 },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  permTextWrap: { flex: 1 },
  permName: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  permDesc: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  primaryBtn: {
    backgroundColor: '#0A84FF', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', width: '100%', marginBottom: 12,
  },
  primaryBtnText: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  skipBtn: { padding: 8 },
  skipText: { fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
});

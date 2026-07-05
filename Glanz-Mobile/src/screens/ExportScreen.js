import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
let Sharing = null;
try { Sharing = require('expo-sharing'); } catch (_) {}
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from '../context/SettingsContext';
import { exportDataToCSV, exportDataToJSON } from '../utils/dataExport';
import GlassBg from '../components/GlassBg';
import GlassCard from '../components/GlassCard';
import SpringPressable from '../components/SpringPressable';

export default function ExportScreen({ navigation }) {
  const { theme } = useSettings();
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      const s = {};
      try {
        const c = await AsyncStorage.getItem('@mealket_calories');
        s.calorieEntries = c ? JSON.parse(c).length : 0;
      } catch (_) { s.calorieEntries = 0; }
      try {
        const w = await AsyncStorage.getItem('@mealket_weight');
        s.weightEntries = w ? (JSON.parse(w).weightHistory || []).length : 0;
      } catch (_) { s.weightEntries = 0; }
      try {
        const wa = await AsyncStorage.getItem('@mealket_water');
        s.waterLogs = wa ? JSON.parse(wa).length : 0;
      } catch (_) { s.waterLogs = 0; }
      try {
        const m = await AsyncStorage.getItem('@mealket_measurements');
        s.measurements = m ? JSON.parse(m).length : 0;
      } catch (_) { s.measurements = 0; }
      setStats(s);
    })();
  }, []);

  const totalEntries = useMemo(() => {
    if (!stats) return 0;
    return Object.values(stats).reduce((a, b) => a + b, 0);
  }, [stats]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const csv = await exportDataToCSV();
      const uri = await writeTempFile('mealket_export.csv', csv);
      if (Sharing && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Export Mealket Data' });
      }
    } catch (_) {}
    setExporting(false);
  };

  const handleExportJSON = async () => {
    setExporting(true);
    try {
      const json = await exportDataToJSON();
      const uri = await writeTempFile('mealket_export.json', JSON.stringify(json, null, 2));
      if (Sharing && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Export Mealket Data' });
      }
    } catch (_) {}
    setExporting(false);
  };

  async function writeTempFile(name, content) {
    const path = FileSystem.documentDirectory + name;
    await FileSystem.writeAsStringAsync(path, content, { encoding: FileSystem.EncodingType.UTF8 });
    return path;
  }

  return (
    <GlassBg theme={theme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Export Data</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
          {stats && (
            <GlassCard theme={theme} intensity={55} radius={22} style={{ padding: 20 }}>
              <Text style={[styles.statTitle, { color: theme.textMuted }]}>DATA OVERVIEW</Text>
              <View style={styles.statGrid}>
                <StatItem label="Calorie Entries" value={stats.calorieEntries} color={theme.accent} theme={theme} />
                <StatItem label="Weight Logs" value={stats.weightEntries} color={theme.protein} theme={theme} />
                <StatItem label="Water Logs" value={stats.waterLogs} color="#22C55E" theme={theme} />
                <StatItem label="Measurements" value={stats.measurements} color="#8B5CF6" theme={theme} />
              </View>
              <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
                <Text style={[styles.totalLabel, { color: theme.text }]}>Total Entries</Text>
                <Text style={[styles.totalValue, { color: theme.accent }]}>{totalEntries}</Text>
              </View>
            </GlassCard>
          )}

          <GlassCard theme={theme} intensity={50} radius={22} style={{ padding: 20, gap: 14 }}>
            <Text style={[styles.exportTitle, { color: theme.text }]}>Choose export format</Text>
            <Text style={[styles.exportDesc, { color: theme.textMuted }]}>
              Download all your Mealket data as a file. Calorie entries, weight history, water logs, and body measurements are included.
            </Text>
            <SpringPressable
              onPress={handleExportCSV}
              disabled={exporting}
              scaleDown={0.96}
              style={[styles.exportBtn, { backgroundColor: theme.accent }]}
            >
              <Ionicons name="document-text-outline" size={20} color="#FFF" />
              <Text style={styles.exportBtnText}>Export as CSV</Text>
            </SpringPressable>
            <SpringPressable
              onPress={handleExportJSON}
              disabled={exporting}
              scaleDown={0.96}
              style={[styles.exportBtn, { backgroundColor: theme.protein }]}
            >
              <Ionicons name="code-outline" size={20} color="#FFF" />
              <Text style={styles.exportBtnText}>Export as JSON</Text>
            </SpringPressable>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </GlassBg>
  );
}

function StatItem({ label, value, color, theme }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 10 },
  title: { flex: 1, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  statTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statItem: { alignItems: 'center', gap: 2, minWidth: 80 },
  statValue: { fontSize: 22, fontWeight: '900', fontFamily: 'SpaceGrotesk_700Bold' },
  statLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, marginTop: 8, borderTopWidth: 1 },
  totalLabel: { fontSize: 14, fontWeight: '700' },
  totalValue: { fontSize: 20, fontWeight: '900' },
  exportTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  exportDesc: { fontSize: 12, fontWeight: '500', textAlign: 'center', lineHeight: 18 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
  exportBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});

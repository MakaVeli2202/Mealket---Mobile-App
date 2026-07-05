import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from './GlassCard';
import { getTodaySteps, getTodayActiveCalories, stepsToKcal } from '../utils/healthConnect';
import { useSettings } from '../context/SettingsContext';

export default function StepsWidget({ theme, tr, strideLength = 0.000762 }) {
  const { stepsGoal } = useSettings();
  const [steps, setSteps] = useState(0);
  const [burnedCal, setBurnedCal] = useState(0);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      abortRef.current = false;
      setLoading(true);
      (async () => {
        try {
          const [s, cal] = await Promise.all([getTodaySteps(), getTodayActiveCalories()]);
          if (!abortRef.current) {
            setSteps(s);
            setBurnedCal(cal > 0 ? cal : stepsToKcal(s));
          }
        } catch {} finally {
          if (!abortRef.current) setLoading(false);
        }
      })();
      return () => { abortRef.current = true; };
    }, [])
  );

  const pct = Math.min(steps / stepsGoal, 1);
  const distance = Math.round(steps * strideLength * 100) / 100;

  return (
    <GlassCard theme={theme} intensity={50} radius={20} style={{ marginBottom: 12, padding: 16 }}>
      <View style={styles.header}>
        <Ionicons name="footsteps-outline" size={18} color="#FF9800" />
        <Text style={[styles.headerText, { color: theme.textMuted }]}>STEPS</Text>
        <Text style={[styles.goalText, { color: theme.textMuted }]}>{stepsGoal.toLocaleString()} goal</Text>
      </View>

      <View style={styles.body}>
        <View style={[styles.stepsCircle, { borderColor: '#FF9800' + '30' }]}>
          <Text style={[styles.stepsNum, { color: theme.text }]}>{loading ? '...' : steps.toLocaleString()}</Text>
          <Text style={[styles.stepsLabel, { color: theme.textMuted }]}>steps</Text>
        </View>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={[styles.statPct, { color: '#FF9800' }]}>{Math.round(pct * 100)}%</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>of goal</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statPct, { color: theme.text }]}>{distance} km</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>distance</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statPct, { color: '#FF453A' }]}>{loading ? '...' : burnedCal}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>kcal</Text>
          </View>
        </View>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
        <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: '#FF9800' }]} />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  headerText: { fontSize: 11, fontWeight: '800', letterSpacing: 1, flex: 1 },
  goalText: { fontSize: 11, fontWeight: '600' },
  body: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  stepsCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  stepsNum: { fontSize: 20, fontWeight: '900' },
  stepsLabel: { fontSize: 10, fontWeight: '600' },
  stats: { flex: 1, gap: 12 },
  statItem: { alignItems: 'center' },
  statPct: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },
  progressTrack: { height: 5, borderRadius: 3, marginTop: 12, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
});

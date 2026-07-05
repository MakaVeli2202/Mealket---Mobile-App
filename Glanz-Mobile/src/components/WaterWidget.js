import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import GlassCard from './GlassCard';

const WATER_GOAL = 2000;
const QUICK_ADD = [100, 250, 500];

export default function WaterWidget({ todayWater, onAdd, theme, tr }) {
  const pct = Math.min(todayWater / WATER_GOAL, 1);
  const size = 100;
  const border = 8;
  const deg = pct * 360;
  const over = todayWater >= WATER_GOAL;
  const radius = (size - border) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference * (1 - pct);

  return (
    <GlassCard theme={theme} intensity={50} radius={20} style={{ marginBottom: 12, padding: 16 }}>
      <View style={styles.header}>
        <Ionicons name="water-outline" size={18} color="#4FC3F7" />
        <Text style={[styles.headerText, { color: theme.textMuted }]}>WATER</Text>
        <Text style={[styles.goalText, { color: theme.textMuted }]}>
          {todayWater}/{WATER_GOAL} ml
        </Text>
      </View>

      <View style={styles.body}>
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={size} height={size} style={{ position: 'absolute' }}>
            <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'} strokeWidth={border} fill="none" />
            {pct > 0 && (
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#4FC3F7"
                strokeWidth={border}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            )}
          </Svg>
          <Ionicons name="water" size={24} color="#4FC3F7" />
        </View>

        <View style={styles.buttons}>
          {QUICK_ADD.map((ml) => (
            <TouchableOpacity
              key={ml}
              style={[styles.addBtn, { backgroundColor: over ? theme.surfaceAlt : theme.accent + '20', borderColor: over ? theme.border : theme.accent + '40' }]}
              onPress={() => onAdd(ml)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={12} color={over ? theme.textMuted : theme.accent} />
              <Text style={[styles.addText, { color: over ? theme.textMuted : theme.accent }]}>{ml}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {over && (
        <Text style={[styles.goalReached, { color: '#4FC3F7' }]}>
          <Ionicons name="checkmark-circle" size={14} /> Goal reached!
        </Text>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  headerText: { fontSize: 11, fontWeight: '800', letterSpacing: 1, flex: 1 },
  goalText: { fontSize: 11, fontWeight: '600' },
  body: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  buttons: { flex: 1, gap: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  addText: { fontSize: 13, fontWeight: '700' },
  goalReached: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 8 },
});

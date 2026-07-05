import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from './GlassCard';

const MOODS = [
  { key: 'excellent', icon: 'happy-outline', iconFilled: 'happy', label: 'Excellent' },
  { key: 'good', icon: 'happy-outline', label: 'Good' },
  { key: 'neutral', icon: 'remove-outline', label: 'Neutral' },
  { key: 'bad', icon: 'sad-outline', label: 'Bad' },
  { key: 'terrible', icon: 'sad-outline', iconFilled: 'sad', label: 'Terrible' },
];

const DEFAULT_MOOD_COLORS = {
  excellent: '#4CAF50', good: '#8BC34A', neutral: '#FFC107', bad: '#FF9800', terrible: '#F44336',
};

export default function MoodWidget({ todayMood, onSetMood, theme, tr, moodColors: customMoodColors = {} }) {
  return (
    <GlassCard theme={theme} intensity={50} radius={20} style={{ marginBottom: 12, padding: 16 }}>
      <View style={styles.header}>
        <Ionicons name="happy-outline" size={18} color={theme.accent} />
        <Text style={[styles.headerText, { color: theme.textMuted }]}>MOOD</Text>
      </View>
      <View style={styles.moods}>
        {MOODS.map((m) => {
          const active = todayMood === m.key;
          const moodColor = customMoodColors[m.key] || DEFAULT_MOOD_COLORS[m.key];
          return (
            <TouchableOpacity
              key={m.key}
              style={[styles.moodBtn, active && { backgroundColor: moodColor + '25', borderColor: moodColor }]}
              onPress={() => onSetMood(active ? null : m.key)}
              activeOpacity={0.7}
            >
              <Ionicons name={active && m.iconFilled ? m.iconFilled : m.icon} size={22} color={active ? moodColor : theme.textMuted} />
              <Text style={[styles.moodLabel, { color: active ? moodColor : theme.textMuted }]}>{m.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  headerText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  moods: { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn: { alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 12, borderWidth: 1.5, borderColor: 'transparent', flex: 1 },
  moodLabel: { fontSize: 9, fontWeight: '600' },
});

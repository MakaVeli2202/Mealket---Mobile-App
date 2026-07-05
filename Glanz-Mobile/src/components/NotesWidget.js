import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from './GlassCard';

export default function NotesWidget({ todayNotes, onSetNotes, theme, tr, placeholderText = 'How did today go?' }) {
  return (
    <GlassCard theme={theme} intensity={50} radius={20} style={{ marginBottom: 12, padding: 16 }}>
      <View style={styles.header}>
        <Ionicons name="book-outline" size={18} color={theme.accent} />
        <Text style={[styles.headerText, { color: theme.textMuted }]}>NOTES</Text>
      </View>
      <TextInput
        style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
        value={todayNotes}
        onChangeText={onSetNotes}
        placeholder={placeholderText}
        placeholderTextColor={theme.textMuted}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  headerText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  input: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 13, fontWeight: '500', minHeight: 70 },
});

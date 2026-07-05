import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from './GlassCard';

export default function WeightWidget({ currentWeight, goalWeight, weightChange, onAddWeight, theme, tr }) {
  const [showModal, setShowModal] = useState(false);
  const [draft, setDraft] = useState(String(currentWeight ?? ''));

  const handleSave = () => {
    const kg = parseFloat(draft);
    if (kg > 0 && kg < 500) { onAddWeight(kg); setShowModal(false); }
  };

  const diff = currentWeight && goalWeight ? Math.round((currentWeight - goalWeight) * 10) / 10 : null;
  const isAtGoal = diff !== null && diff <= 0;
  const trend = weightChange > 0 ? 'arrow-up' : weightChange < 0 ? 'arrow-down' : 'remove';

  return (
    <>
      <GlassCard theme={theme} intensity={50} radius={20} style={{ marginBottom: 12, padding: 16 }}>
        <View style={styles.header}>
          <Ionicons name="scale-outline" size={18} color={theme.accent} />
          <Text style={[styles.headerText, { color: theme.textMuted }]}>WEIGHT</Text>
          <TouchableOpacity onPress={() => { setDraft(String(currentWeight ?? '')); setShowModal(true); }} hitSlop={8}>
            <Ionicons name="add-circle-outline" size={20} color={theme.accent} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.weightMain}>
            <Text style={[styles.weightNum, { color: theme.text }]}>{currentWeight ?? '—'}</Text>
            <Text style={[styles.weightUnit, { color: theme.textMuted }]}>kg</Text>
          </View>
          {goalWeight && (
            <View style={styles.goalSection}>
              <View style={styles.goalRow}>
                <Text style={[styles.goalLabel, { color: theme.textMuted }]}>Goal</Text>
                <Text style={[styles.goalVal, { color: theme.text }]}>{goalWeight} kg</Text>
              </View>
              {diff !== null && (
                <View style={[styles.diffBadge, { backgroundColor: isAtGoal ? '#4CAF50' + '20' : theme.surfaceAlt }]}>
                  <Ionicons name={trend} size={12} color={isAtGoal ? '#4CAF50' : theme.textMuted} />
                  <Text style={[styles.diffText, { color: isAtGoal ? '#4CAF50' : theme.textMuted }]}>
                    {isAtGoal ? 'At goal' : `${Math.abs(diff)} kg to go`}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {weightChange !== 0 && currentWeight && (
          <View style={[styles.changeRow, { borderTopColor: theme.border }]}>
            <Ionicons name={trend} size={14} color={weightChange > 0 ? theme.danger : '#4CAF50'} />
            <Text style={[styles.changeText, { color: weightChange > 0 ? theme.danger : '#4CAF50' }]}>
              {weightChange > 0 ? '+' : ''}{weightChange} kg total change
            </Text>
          </View>
        )}
      </GlassCard>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowModal(false)}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Log Weight</Text>
            <View style={[styles.inputRow, { borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={draft} onChangeText={setDraft}
                keyboardType="decimal-pad" selectTextOnFocus autoFocus
              />
              <Text style={[styles.unit, { color: theme.textMuted }]}>kg</Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.surfaceAlt }]} onPress={() => setShowModal(false)}>
                <Text style={[styles.modalBtnText, { color: theme.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.accent }]} onPress={handleSave}>
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  headerText: { fontSize: 11, fontWeight: '800', letterSpacing: 1, flex: 1 },
  body: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  weightMain: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  weightNum: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  weightUnit: { fontSize: 14, fontWeight: '600' },
  goalSection: { flex: 1, gap: 6 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  goalLabel: { fontSize: 12, fontWeight: '600' },
  goalVal: { fontSize: 14, fontWeight: '700' },
  diffBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  diffText: { fontSize: 11, fontWeight: '700' },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  changeText: { fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalCard: { width: '100%', borderRadius: 20, padding: 24, gap: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 },
  input: { flex: 1, fontSize: 24, fontWeight: '800', textAlign: 'center', padding: 0 },
  unit: { fontSize: 16, fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  modalBtnText: { fontSize: 15, fontWeight: '700' },
});

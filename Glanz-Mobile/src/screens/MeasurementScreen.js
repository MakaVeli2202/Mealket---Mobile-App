import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, G, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../components/SafeGradient';
import { useSettings } from '../context/SettingsContext';
import { useMeasurements } from '../context/MeasurementContext';
import GlassBg from '../components/GlassBg';
import GlassCard from '../components/GlassCard';
import SpringPressable from '../components/SpringPressable';

const { width: SCREEN_W } = Dimensions.get('window');
const BODY_W = Math.min(SCREEN_W - 48, 220);
const BODY_H = BODY_W * 1.8;
const CX = BODY_W / 2;

const BODY_PARTS = [
  { key: 'neck',   label: 'Neck',   mx: 0,    my: 0.14, side: 'center' },
  { key: 'chest',  label: 'Chest',  mx: 0,    my: 0.28, side: 'center' },
  { key: 'arms',   label: 'Arms',   mx: 0.36, my: 0.34, side: 'left'   },
  { key: 'waist',  label: 'Waist',  mx: 0,    my: 0.42, side: 'center' },
  { key: 'hips',   label: 'Hips',   mx: 0,    my: 0.55, side: 'center' },
  { key: 'thighs', label: 'Thighs', mx: 0.14, my: 0.68, side: 'left'   },
];

const BODY_SCALE = BODY_W / 220;

const HEAD_R = 22 * BODY_SCALE;
const SHOULDER_Y = 62 * BODY_SCALE;
const TORSO_TOP = SHOULDER_Y + 4 * BODY_SCALE;
const TORSO_BOT = 175 * BODY_SCALE;
const ARM_TOP = SHOULDER_Y;
const ARM_BOT = 150 * BODY_SCALE;
const ARM_X_OFF = 38 * BODY_SCALE;
const LEG_BOT = 310 * BODY_SCALE;

export default function MeasurementScreen({ navigation }) {
  const { theme } = useSettings();
  const { measurements, addMeasurement, removeMeasurement, getMeasurementsByType, MEASUREMENT_TYPES, TYPE_UNITS, latestByType } = useMeasurements();
  const [selectedType, setSelectedType] = useState('waist');
  const [value, setValue] = useState('');

  const filtered = useMemo(() => getMeasurementsByType(selectedType), [getMeasurementsByType, selectedType]);
  const trend = filtered.slice(0, 5);
  const latest = filtered[0];
  const latestVal = latestByType[selectedType];

  const handleAdd = () => {
    const num = parseFloat(value.replace(',', '.'));
    if (isNaN(num) || num <= 0) return;
    addMeasurement(selectedType, num);
    setValue('');
  };

  const canAdd = parseFloat(value.replace(',', '.')) > 0;

  const bodyColor = theme.accent;
  const bodyDim = theme.dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';
  const bodyFill = theme.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';

  return (
    <GlassBg theme={theme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Body Measurements</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {/* â”€â”€ Body Avatar â”€â”€ */}
          <View style={styles.bodyWrap}>
            <Svg width={BODY_W} height={BODY_H} viewBox={`0 0 ${BODY_W} ${BODY_H}`}>
              <G opacity={0.9}>
                {/* Head */}
                <Circle cx={CX} cy={HEAD_R + 4 * BODY_SCALE} r={HEAD_R} fill={bodyFill} stroke={bodyDim} strokeWidth={1.5} />

                {/* Neck */}
                <Path
                  d={`M ${CX - 10 * BODY_SCALE} ${SHOULDER_Y} L ${CX + 10 * BODY_SCALE} ${SHOULDER_Y} L ${CX + 14 * BODY_SCALE} ${TORSO_TOP} L ${CX - 14 * BODY_SCALE} ${TORSO_TOP} Z`}
                  fill={bodyFill} stroke={bodyDim} strokeWidth={1.5}
                />

                {/* Torso */}
                <Path
                  d={`M ${CX - ARM_X_OFF - 6 * BODY_SCALE} ${ARM_TOP}
                      Q ${CX - ARM_X_OFF + 4 * BODY_SCALE} ${ARM_TOP + 10 * BODY_SCALE}
                        ${CX - 24 * BODY_SCALE} ${TORSO_TOP}
                      L ${CX - 24 * BODY_SCALE} ${TORSO_BOT}
                      Q ${CX - 30 * BODY_SCALE} ${TORSO_BOT + 8 * BODY_SCALE}
                        ${CX} ${TORSO_BOT + 10 * BODY_SCALE}
                      Q ${CX + 30 * BODY_SCALE} ${TORSO_BOT + 8 * BODY_SCALE}
                        ${CX + 24 * BODY_SCALE} ${TORSO_BOT}
                      L ${CX + 24 * BODY_SCALE} ${TORSO_TOP}
                      Q ${CX + ARM_X_OFF - 4 * BODY_SCALE} ${ARM_TOP + 10 * BODY_SCALE}
                        ${CX + ARM_X_OFF + 6 * BODY_SCALE} ${ARM_TOP}
                      Z`}
                  fill={bodyFill} stroke={bodyDim} strokeWidth={1.5}
                />

                {/* Left Arm */}
                <Path
                  d={`M ${CX - ARM_X_OFF - 6 * BODY_SCALE} ${ARM_TOP}
                      Q ${CX - ARM_X_OFF - 16 * BODY_SCALE} ${ARM_TOP + 20 * BODY_SCALE}
                        ${CX - ARM_X_OFF - 12 * BODY_SCALE} ${ARM_BOT}
                      L ${CX - ARM_X_OFF - 4 * BODY_SCALE} ${ARM_BOT}
                      Q ${CX - ARM_X_OFF - 2 * BODY_SCALE} ${ARM_TOP + 30 * BODY_SCALE}
                        ${CX - ARM_X_OFF + 2 * BODY_SCALE} ${ARM_TOP + 6 * BODY_SCALE}
                      Z`}
                  fill={bodyFill} stroke={bodyDim} strokeWidth={1.5}
                />

                {/* Right Arm */}
                <Path
                  d={`M ${CX + ARM_X_OFF + 6 * BODY_SCALE} ${ARM_TOP}
                      Q ${CX + ARM_X_OFF + 16 * BODY_SCALE} ${ARM_TOP + 20 * BODY_SCALE}
                        ${CX + ARM_X_OFF + 12 * BODY_SCALE} ${ARM_BOT}
                      L ${CX + ARM_X_OFF + 4 * BODY_SCALE} ${ARM_BOT}
                      Q ${CX + ARM_X_OFF + 2 * BODY_SCALE} ${ARM_TOP + 30 * BODY_SCALE}
                        ${CX + ARM_X_OFF - 2 * BODY_SCALE} ${ARM_TOP + 6 * BODY_SCALE}
                      Z`}
                  fill={bodyFill} stroke={bodyDim} strokeWidth={1.5}
                />

                {/* Left Leg */}
                <Path
                  d={`M ${CX - 6 * BODY_SCALE} ${TORSO_BOT}
                      Q ${CX - 12 * BODY_SCALE} ${TORSO_BOT + 10 * BODY_SCALE}
                        ${CX - 16 * BODY_SCALE} ${TORSO_BOT + 20 * BODY_SCALE}
                      L ${CX - 14 * BODY_SCALE} ${LEG_BOT}
                      L ${CX - 4 * BODY_SCALE} ${LEG_BOT}
                      L ${CX - 2 * BODY_SCALE} ${TORSO_BOT + 20 * BODY_SCALE}
                      Q ${CX + 2 * BODY_SCALE} ${TORSO_BOT + 10 * BODY_SCALE}
                        ${CX + 4 * BODY_SCALE} ${TORSO_BOT}
                      Z`}
                  fill={bodyFill} stroke={bodyDim} strokeWidth={1.5}
                />

                {/* Right Leg */}
                <Path
                  d={`M ${CX + 6 * BODY_SCALE} ${TORSO_BOT}
                      Q ${CX + 12 * BODY_SCALE} ${TORSO_BOT + 10 * BODY_SCALE}
                        ${CX + 16 * BODY_SCALE} ${TORSO_BOT + 20 * BODY_SCALE}
                      L ${CX + 14 * BODY_SCALE} ${LEG_BOT}
                      L ${CX + 4 * BODY_SCALE} ${LEG_BOT}
                      L ${CX + 2 * BODY_SCALE} ${TORSO_BOT + 20 * BODY_SCALE}
                      Q ${CX - 2 * BODY_SCALE} ${TORSO_BOT + 10 * BODY_SCALE}
                        ${CX - 4 * BODY_SCALE} ${TORSO_BOT}
                      Z`}
                  fill={bodyFill} stroke={bodyDim} strokeWidth={1.5}
                />

                {/* Measurement dots */}
                {BODY_PARTS.map((bp) => {
                  let x = CX + bp.mx * BODY_W;
                  if (bp.side === 'left') x = CX - bp.mx * BODY_W;
                  const y = bp.my * BODY_H;
                  const isSelected = selectedType === bp.key;
                  const val = latestByType[bp.key];
                  return (
                    <G key={bp.key} onPress={() => setSelectedType(bp.key)}>
                      <Circle cx={x} cy={y} r={isSelected ? 9 : 7} fill={isSelected ? theme.accent : bodyDim} />
                      <Circle cx={x} cy={y} r={isSelected ? 5 : 3} fill={isSelected ? '#FFF' : theme.textMuted} />
                      {val && (
                        <SvgText
                          x={bp.side === 'left' ? x - 38 : x + (bp.side === 'center' ? 0 : 38)}
                          y={y + 4}
                          fontSize={11}
                          fontWeight="700"
                          fill={theme.textMuted}
                          textAnchor="middle"
                        >
                          {`${val.value}${val.unit}`}
                        </SvgText>
                      )}
                    </G>
                  );
                })}
              </G>
            </Svg>

            {/* Touchable overlay for body parts (better tap area) */}
            {BODY_PARTS.map((bp) => {
              let lx = CX + bp.mx * BODY_W - 18;
              if (bp.side === 'left') lx = CX - bp.mx * BODY_W - 18;
              const ly = bp.my * BODY_H - 18;
              return (
                <TouchableOpacity
                  key={bp.key}
                  style={[styles.bodyTap, { left: lx, top: ly, width: 36, height: 36 }]}
                  onPress={() => setSelectedType(bp.key)}
                  activeOpacity={0.6}
                />
              );
            })}
          </View>

          {/* â”€â”€ Selected measurement label â”€â”€ */}
          <Text style={[styles.selectedLabel, { color: theme.textMuted }]}>
            {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} · {TYPE_UNITS[selectedType]}
          </Text>

          {/* â”€â”€ Input Form â”€â”€ */}
          <View style={{ paddingHorizontal: 16, gap: 10, marginBottom: 16 }}>
            <View style={[styles.inputRow, { borderColor: theme.border, backgroundColor: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={value}
                onChangeText={setValue}
                keyboardType="decimal-pad"
                placeholder="0.0"
                placeholderTextColor={theme.textMuted}
              />
              <Text style={[styles.unitLabel, { color: theme.textMuted }]}>{TYPE_UNITS[selectedType]}</Text>
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: canAdd ? theme.accent : theme.border }]} disabled={!canAdd} onPress={handleAdd}>
                <Ionicons name="add" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>

            {latest && (
              <Text style={[styles.latestLabel, { color: theme.textMuted }]}>
                Latest: {latest.value} {latest.unit} · {latest.date}
              </Text>
            )}
          </View>

          {/* â”€â”€ Quick stats chips â”€â”€ */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {MEASUREMENT_TYPES.map((type) => {
              const val = latestByType[type];
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, { backgroundColor: selectedType === type ? theme.accent : theme.surfaceAlt, borderColor: selectedType === type ? theme.accent : theme.border }]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text style={[styles.chipLabel, { color: selectedType === type ? '#FFF' : theme.textMuted }]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                  {val && (
                    <Text style={[styles.chipVal, { color: selectedType === type ? 'rgba(255,255,255,0.8)' : theme.textMuted }]}>
                      {val.value}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* â”€â”€ Trend â”€â”€ */}
          {trend.length > 0 && (
            <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
              <GlassCard theme={theme} intensity={45} radius={20} style={{ padding: 16 }}>
                <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>TREND</Text>
                {trend.map((entry, i) => (
                  <View key={entry.id} style={[styles.trendRow, i < trend.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: theme.border }]}>
                    <Text style={[styles.trendDate, { color: theme.textMuted }]}>{entry.date}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[styles.trendValue, { color: theme.text }]}>{entry.value} {entry.unit}</Text>
                      <TouchableOpacity onPress={() => removeMeasurement(entry.id)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </GlassCard>
            </View>
          )}

          {/* â”€â”€ Full History â”€â”€ */}
          {filtered.length > 0 && (
            <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
              <GlassCard theme={theme} intensity={40} radius={20} style={{ padding: 16 }}>
                <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>HISTORY</Text>
                {filtered.map((entry) => (
                  <View key={entry.id} style={[styles.historyRow, { borderBottomWidth: 0.5, borderBottomColor: theme.border }]}>
                    <Text style={[styles.historyDate, { color: theme.textMuted }]}>{entry.date}</Text>
                    <Text style={[styles.historyValue, { color: theme.text }]}>{entry.value} {entry.unit}</Text>
                    <TouchableOpacity onPress={() => removeMeasurement(entry.id)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </GlassCard>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </GlassBg>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 10 },
  title: { flex: 1, fontSize: 17, fontWeight: '800', textAlign: 'center' },

  bodyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20, position: 'relative' },
  bodyTap: { position: 'absolute', borderRadius: 18 },

  selectedLabel: { textAlign: 'center', fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: 12 },

  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingLeft: 16 },
  input: { flex: 1, fontSize: 20, fontWeight: '800', paddingVertical: 14 },
  unitLabel: { fontSize: 14, fontWeight: '600', marginRight: 8 },
  addBtn: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', margin: 4 },
  latestLabel: { textAlign: 'center', fontSize: 12, fontWeight: '500' },

  chipScroll: { marginBottom: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1, marginRight: 8 },
  chipLabel: { fontSize: 13, fontWeight: '600' },
  chipVal: { fontSize: 13, fontWeight: '800' },

  sectionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },

  trendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  trendDate: { fontSize: 12, fontWeight: '500' },
  trendValue: { fontSize: 14, fontWeight: '700' },

  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  historyDate: { flex: 1, fontSize: 12, fontWeight: '500' },
  historyValue: { fontSize: 14, fontWeight: '700' },
});

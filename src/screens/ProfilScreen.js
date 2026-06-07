import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform,
  Modal, TextInput, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, FadeIn,
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { useSettings } from '../context/SettingsContext';
import { useCalories } from '../context/CalorieContext';
import { useWeight } from '../context/WeightContext';
import { getTodaySteps, requestStepsPermission } from '../utils/healthConnect';
import GlassCard from '../components/GlassCard';
import GlassBg from '../components/GlassBg';
import SpringPressable from '../components/SpringPressable';

function calcStreak(entriesByDate) {
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (!entriesByDate[key] || entriesByDate[key].length === 0) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function SectionHeader({ label, theme }) {
  return (
    <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>{label}</Text>
  );
}

function SettingRow({ icon, iconColor, label, value, onPress, theme, last }) {
  return (
    <SpringPressable
      onPress={onPress}
      style={[styles.settingRow, { borderBottomColor: last ? 'transparent' : theme.border }]}
      scaleDown={0.97}
    >
      <View style={[styles.settingIcon, { backgroundColor: iconColor + '22' }]}>
        <Ionicons name={icon} size={15} color={iconColor} />
      </View>
      <Text style={[styles.settingLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.settingValue, { color: theme.text }]}>{value}</Text>
      <Ionicons name="chevron-forward" size={13} color={theme.textMuted} />
    </SpringPressable>
  );
}

// Animated bar
function WeightBar({ progress, color, theme }) {
  const fillW = useSharedValue(0);
  React.useEffect(() => {
    fillW.value = withSpring(progress, { damping: 18, stiffness: 80 });
  }, [progress]);
  const animStyle = useAnimatedStyle(() => ({ width: `${fillW.value * 100}%` }));
  return (
    <View style={[styles.progressBarBg, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
      <Animated.View style={[styles.progressBarFill, { backgroundColor: color }, animStyle]} />
    </View>
  );
}

export default function ProfilScreen({ navigation }) {
  const { theme, calorieGoal, setCalorieGoal, carbGoal, setCarbGoal, proteinGoal, setProteinGoal, fatGoal, setFatGoal, tr } = useSettings();
  const { entriesByDate, todayEntries } = useCalories();
  const { currentWeight, goalWeight, weightHistory, setWeight, setGoalWeight } = useWeight();
  const tabBarHeight = Platform.OS === 'ios' ? 96 : 80;

  const streak = useMemo(() => calcStreak(entriesByDate), [entriesByDate]);

  const [steps,        setSteps]        = useState(null);
  const [stepsGranted, setStepsGranted] = useState(false);
  const [modal,        setModal]        = useState(null);
  const [draft,        setDraft]        = useState('');

  React.useEffect(() => {
    getTodaySteps().then((s) => { if (s > 0) { setSteps(s); setStepsGranted(true); } });
  }, []);

  const openModal = (key, title, currentVal, setter) => {
    setDraft(String(currentVal));
    setModal({ key, title, setter });
  };

  const saveModal = () => {
    const n = parseFloat(draft.replace(',', '.'));
    if (!isNaN(n) && n > 0) { modal.setter(n); setModal(null); }
  };

  const handleConnectSteps = async () => {
    const granted = await requestStepsPermission();
    if (granted) {
      const s = await getTodaySteps();
      setSteps(s); setStepsGranted(true);
    } else {
      Alert.alert('Samsung Health', 'Open Samsung Health → Settings → Health Connect → Grant Mealket steps access.');
    }
  };

  const todayKcal = useMemo(() => todayEntries.reduce((s, e) => s + (e.calories || 0), 0), [todayEntries]);

  const startWeight = useMemo(() => weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].kg : currentWeight + 5, [weightHistory, currentWeight]);

  const weightLoss = goalWeight < startWeight;
  let weightProgress = 0;
  if (weightLoss && startWeight !== goalWeight)        weightProgress = (startWeight - currentWeight) / (startWeight - goalWeight);
  else if (!weightLoss && startWeight !== goalWeight)  weightProgress = (currentWeight - startWeight) / (goalWeight - startWeight);
  weightProgress = Math.min(1, Math.max(0, weightProgress));

  const weightDelta = Math.round((currentWeight - startWeight) * 10) / 10;

  return (
    <GlassBg theme={theme} variant="blue">
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: tabBarHeight + 24 }]} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <Animated.View entering={FadeInDown.duration(280).springify().damping(22)} style={styles.header}>
            <Text style={[styles.pageTitle, { color: theme.text }]}>{tr.profil.title}</Text>
            <SpringPressable
              style={[styles.gearBtn, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: theme.border }]}
              onPress={() => navigation.navigate('Settings')}
              scaleDown={0.88}
            >
              <Ionicons name="settings-outline" size={20} color={theme.textMuted} />
            </SpringPressable>
          </Animated.View>

          {/* TODAY */}
          <SectionHeader label="TODAY" theme={theme} />
          <Animated.View entering={FadeInDown.delay(60).duration(300).springify().damping(20)} style={styles.statsRow}>
            {[
              { icon: 'flame-outline', color: theme.accent, value: todayKcal, label: tr.calories.eaten },
              { icon: 'flash-outline', color: theme.carbs,  value: Math.max(0, calorieGoal - todayKcal), label: `kcal ${tr.calories.left}` },
              { icon: 'footsteps-outline', color: theme.accentGreen, value: steps !== null ? steps.toLocaleString() : '—', label: stepsGranted ? tr.profil.steps : tr.profil.connectWatch, onPress: stepsGranted ? undefined : handleConnectSteps },
            ].map((item, i) => (
              <SpringPressable key={i} style={{ flex: 1 }} onPress={item.onPress} scaleDown={0.94}>
                <GlassCard theme={theme} intensity={50} radius={18} shimmer={false} style={styles.statCard}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                  <Text style={[styles.statValue, { color: theme.text }]}>{item.value}</Text>
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>{item.label}</Text>
                </GlassCard>
              </SpringPressable>
            ))}
          </Animated.View>

          {/* STREAK */}
          <Animated.View entering={FadeInDown.delay(120).duration(300).springify().damping(20)}>
            <GlassCard theme={theme} intensity={50} radius={18} shimmer={false} style={styles.streakCard}>
              <View style={[styles.streakIconWrap, { backgroundColor: theme.accentLight }]}>
                <Ionicons name="flame" size={22} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.streakNumber, { color: theme.text }]}>{tr.profil.streak(streak)}</Text>
                <Text style={[styles.streakSub, { color: theme.textMuted }]}>
                  {streak > 0 ? tr.profil.streakActive : tr.profil.streakInactive}
                </Text>
              </View>
            </GlassCard>
          </Animated.View>

          {/* WEIGHT */}
          <SectionHeader label={tr.profil.progress.toUpperCase()} theme={theme} />
          <Animated.View entering={FadeInDown.delay(180).duration(320).springify().damping(20)}>
            <GlassCard theme={theme} intensity={55} radius={22} style={styles.weightCard}>
              <View style={styles.weightCardHeader}>
                <Text style={[styles.weightCardTitle, { color: theme.textMuted }]}>{tr.profil.weight}</Text>
                <SpringPressable onPress={() => openModal('goalWeight', tr.profil.weightGoal, goalWeight, setGoalWeight)}>
                  <Text style={[styles.goalLabel, { color: theme.accent }]}>
                    {tr.profil.goalWeight} {goalWeight} kg
                  </Text>
                </SpringPressable>
              </View>

              <SpringPressable onPress={() => openModal('weight', tr.profil.weightEntry, currentWeight, setWeight)}>
                <Text style={[styles.bigWeight, { color: theme.text }]}>
                  {currentWeight} <Text style={[styles.bigWeightUnit, { color: theme.textMuted }]}>kg</Text>
                </Text>
              </SpringPressable>

              <WeightBar progress={weightProgress} color={theme.accent} theme={theme} />

              <View style={styles.weightProgressRow}>
                <Text style={[styles.progressEdge, { color: theme.textMuted }]}>{startWeight} kg</Text>
                <View style={[styles.deltaTag, { backgroundColor: weightDelta <= 0 ? theme.accentGreenLight : theme.accentLight }]}>
                  <Ionicons name={weightDelta <= 0 ? 'trending-down' : 'trending-up'} size={11} color={weightDelta <= 0 ? theme.accentGreen : theme.accent} />
                  <Text style={[styles.deltaText, { color: weightDelta <= 0 ? theme.accentGreen : theme.accent }]}>
                    {weightDelta > 0 ? '+' : ''}{weightDelta} kg
                  </Text>
                </View>
                <Text style={[styles.progressEdge, { color: theme.textMuted }]}>{goalWeight} kg</Text>
              </View>

              <View style={[styles.stepper, { borderTopColor: theme.border }]}>
                <SpringPressable style={[styles.stepBtn, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} onPress={() => setWeight(Math.round((currentWeight - 0.1) * 10) / 10)} scaleDown={0.88}>
                  <Ionicons name="remove" size={20} color={theme.text} />
                </SpringPressable>
                <Text style={[styles.stepperValue, { color: theme.text }]}>{currentWeight} kg</Text>
                <SpringPressable style={[styles.stepBtn, { backgroundColor: theme.accent }]} onPress={() => setWeight(Math.round((currentWeight + 0.1) * 10) / 10)} scaleDown={0.88}>
                  <Ionicons name="add" size={20} color="#FFF" />
                </SpringPressable>
              </View>
            </GlassCard>
          </Animated.View>

          {/* GOALS */}
          <SectionHeader label={tr.profil.goals.toUpperCase()} theme={theme} />
          <Animated.View entering={FadeInDown.delay(240).duration(320).springify().damping(20)}>
            <GlassCard theme={theme} intensity={50} radius={22} shimmer={false}>
              <SettingRow icon="flame-outline"   iconColor={theme.accent}   label={tr.profil.calorieGoal} value={`${calorieGoal} kcal`} onPress={() => openModal('calories', tr.profil.calorieGoal, calorieGoal, setCalorieGoal)} theme={theme} />
              <SettingRow icon="grid-outline"    iconColor={theme.carbs}    label={tr.calories.carbs}     value={`${carbGoal} g`}       onPress={() => openModal('carbs', tr.calories.carbs, carbGoal, setCarbGoal)}           theme={theme} />
              <SettingRow icon="fitness-outline" iconColor={theme.protein}  label={tr.calories.protein}   value={`${proteinGoal} g`}    onPress={() => openModal('protein', tr.calories.protein, proteinGoal, setProteinGoal)} theme={theme} />
              <SettingRow icon="water-outline"   iconColor={theme.fat}      label={tr.calories.fat}       value={`${fatGoal} g`}        onPress={() => openModal('fat', tr.calories.fat, fatGoal, setFatGoal)}                 theme={theme} last />
            </GlassCard>
          </Animated.View>

          {/* HISTORY */}
          {weightHistory.length > 0 && (
            <>
              <SectionHeader label={tr.profil.history.toUpperCase()} theme={theme} />
              <Animated.View entering={FadeInDown.delay(300).duration(320).springify().damping(20)}>
                <GlassCard theme={theme} intensity={45} radius={22} shimmer={false}>
                  {weightHistory.slice(0, 5).map((entry, i) => (
                    <View key={entry.date}>
                      {i > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                      <View style={styles.historyRow}>
                        <Text style={[styles.historyDate, { color: theme.textMuted }]}>{entry.date}</Text>
                        <Text style={[styles.historyKg, { color: theme.text }]}>{entry.kg} kg</Text>
                      </View>
                    </View>
                  ))}
                </GlassCard>
              </Animated.View>
            </>
          )}

        </ScrollView>
      </SafeAreaView>

      {/* Edit modal */}
      <Modal visible={!!modal} transparent animationType="fade" onRequestClose={() => setModal(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <Animated.View entering={FadeIn.duration(180)} style={{ width: '100%' }}>
            <GlassCard theme={theme} intensity={85} radius={22} style={{ padding: 22 }}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{modal?.title}</Text>
              <TextInput
                style={[styles.modalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
                value={draft}
                onChangeText={setDraft}
                keyboardType="decimal-pad"
                autoFocus
                selectTextOnFocus
              />
              <View style={styles.modalBtns}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} onPress={() => setModal(null)}>
                  <Text style={[styles.modalBtnText, { color: theme.textMuted }]}>{tr.history.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.accent }]} onPress={saveModal}>
                  <Text style={[styles.modalBtnText, { color: '#FFF' }]}>{tr.fasting.save}</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </GlassBg>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 4 },
  pageTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  gearBtn: { width: 38, height: 38, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  sectionHeader: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 8, marginTop: 20, marginLeft: 2 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: { alignItems: 'center', padding: 12, gap: 4 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },

  streakCard: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, marginBottom: 4 },
  streakIconWrap: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  streakNumber: { fontSize: 15, fontWeight: '700' },
  streakSub: { fontSize: 12, marginTop: 1 },

  weightCard: { padding: 16, marginBottom: 4 },
  weightCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  weightCardTitle: { fontSize: 12, fontWeight: '600' },
  goalLabel: { fontSize: 13, fontWeight: '600' },
  bigWeight: { fontSize: 40, fontWeight: '900', letterSpacing: -1, marginBottom: 12 },
  bigWeightUnit: { fontSize: 22, fontWeight: '500' },

  progressBarBg: { height: 5, borderRadius: 3, marginBottom: 8, overflow: 'hidden' },
  progressBarFill: { height: 5, borderRadius: 3, minWidth: 4 },

  weightProgressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  progressEdge: { fontSize: 11 },
  deltaTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  deltaText: { fontSize: 11, fontWeight: '700' },

  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTopWidth: 1 },
  stepBtn: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { fontSize: 18, fontWeight: '700' },

  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  settingIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  settingValue: { fontSize: 14, fontWeight: '700', marginRight: 4 },

  divider: { height: StyleSheet.hairlineWidth },
  historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11 },
  historyDate: { fontSize: 13 },
  historyKg: { fontSize: 14, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 28 },
  modalTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12 },
  modalInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { fontSize: 15, fontWeight: '700' },
});

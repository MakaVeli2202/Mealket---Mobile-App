import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useCalories } from '../context/CalorieContext';
import { useWeight } from '../context/WeightContext';
import { getTodaySteps, requestStepsPermission, stepsToKcal } from '../utils/healthConnect';

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

export default function ProfilScreen({ navigation }) {
  const { theme, calorieGoal, setCalorieGoal } = useSettings();
  const { entriesByDate, todayEntries } = useCalories();
  const { currentWeight, goalWeight, weightHistory, setWeight, setGoalWeight } = useWeight();

  const streak = useMemo(() => calcStreak(entriesByDate), [entriesByDate]);

  const [steps, setSteps] = useState(null);
  const [stepsGranted, setStepsGranted] = useState(false);

  useEffect(() => {
    getTodaySteps().then((s) => {
      if (s > 0) { setSteps(s); setStepsGranted(true); }
    });
  }, []);

  const handleConnectSteps = async () => {
    const granted = await requestStepsPermission();
    if (granted) {
      const s = await getTodaySteps();
      setSteps(s);
      setStepsGranted(true);
    } else {
      Alert.alert(
        'Samsung Health',
        'Open Samsung Health → Settings → Health Connect → Grant Mealket steps access. Then come back.',
      );
    }
  };

  const todayKcal = useMemo(
    () => todayEntries.reduce((sum, e) => sum + (e.calories || 0), 0),
    [todayEntries],
  );
  const kcalRemaining = Math.max(0, calorieGoal - todayKcal);

  // Weight progress
  const startWeight = useMemo(() => {
    if (weightHistory.length > 0) {
      return weightHistory[weightHistory.length - 1].kg;
    }
    return currentWeight + 5;
  }, [weightHistory, currentWeight]);

  const weightLoss = goalWeight < startWeight;
  let weightProgress = 0;
  if (weightLoss && startWeight !== goalWeight) {
    weightProgress = (startWeight - currentWeight) / (startWeight - goalWeight);
  } else if (!weightLoss && startWeight !== goalWeight) {
    weightProgress = (currentWeight - startWeight) / (goalWeight - startWeight);
  }
  weightProgress = Math.min(1, Math.max(0, weightProgress));

  const weightDelta = Math.round((currentWeight - startWeight) * 10) / 10;

  const handleWeightMinus = () => {
    setWeight(Math.round((currentWeight - 0.1) * 10) / 10);
  };
  const handleWeightPlus = () => {
    setWeight(Math.round((currentWeight + 0.1) * 10) / 10);
  };

  const handleWeightManual = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Gewicht eintragen',
        'Aktuelles Gewicht in kg',
        (val) => {
          const n = parseFloat(val);
          if (!isNaN(n) && n > 0) setWeight(n);
        },
        'plain-text',
        String(currentWeight),
        'numeric',
      );
    } else {
      Alert.alert(
        'Gewicht eintragen',
        `Aktuell: ${currentWeight} kg\nNutze + / − zum Anpassen`,
      );
    }
  };

  const handleGoalWeightManual = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Zielgewicht',
        'Zielgewicht in kg',
        (val) => {
          const n = parseFloat(val);
          if (!isNaN(n) && n > 0) setGoalWeight(n);
        },
        'plain-text',
        String(goalWeight),
        'numeric',
      );
    } else {
      Alert.alert('Zielgewicht', `Aktuell: ${goalWeight} kg`);
    }
  };

  const handleEditCalorieGoal = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Calorie Goal',
        'Daily calorie goal (kcal)',
        (val) => {
          const n = parseInt(val, 10);
          if (!isNaN(n) && n > 0) setCalorieGoal(n);
        },
        'plain-text',
        String(calorieGoal),
        'numeric',
      );
    } else {
      navigation.navigate('Settings');
    }
  };

  const card = {
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: theme.text }]}>Profil</Text>
          <TouchableOpacity
            style={[styles.gearBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => navigation && navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={22} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Streak card */}
        <View style={[card, styles.streakCard]}>
          <View style={[styles.streakIconWrap, { backgroundColor: theme.accentLight }]}>
            <Ionicons name="flame" size={26} color={theme.accent} />
          </View>
          <View style={styles.streakText}>
            <Text style={[styles.streakNumber, { color: theme.text }]}>
              {streak} Tage Streak
            </Text>
            <Text style={[styles.streakSub, { color: theme.textMuted }]}>
              {streak > 0
                ? 'Weiter so! Jeden Tag tracken.'
                : 'Fang heute an zu tracken!'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </View>

        {/* 2-column stats */}
        <View style={styles.statsRow}>
          <View style={[card, styles.statCard]}>
            <Ionicons name="flame-outline" size={22} color={theme.accent} />
            <Text style={[styles.statValue, { color: theme.text }]}>{kcalRemaining}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>kcal übrig</Text>
          </View>
          <TouchableOpacity
            style={[card, styles.statCard]}
            activeOpacity={0.7}
            onPress={stepsGranted ? undefined : handleConnectSteps}
          >
            <Ionicons name="footsteps-outline" size={22} color={theme.accentGreen} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {steps !== null ? steps.toLocaleString() : '—'}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>
              {stepsGranted ? 'Steps' : 'Connect Watch'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mein Fortschritt */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Mein Fortschritt</Text>

        <View style={[card, styles.weightCard]}>
          <View style={styles.weightCardHeader}>
            <Text style={[styles.weightCardTitle, { color: theme.text }]}>Mein Gewicht</Text>
            <TouchableOpacity onPress={handleGoalWeightManual}>
              <Text style={[styles.goalLabel, { color: theme.accent }]}>
                Ziel {goalWeight} kg
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleWeightManual} activeOpacity={0.8}>
            <Text style={[styles.bigWeight, { color: theme.text }]}>
              {currentWeight} <Text style={[styles.bigWeightUnit, { color: theme.textMuted }]}>kg</Text>
            </Text>
          </TouchableOpacity>

          {/* Progress bar */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: theme.accent,
                  width: `${Math.round(weightProgress * 100)}%`,
                },
              ]}
            />
          </View>

          <View style={styles.weightProgressRow}>
            <Text style={[styles.progressStart, { color: theme.textMuted }]}>
              {startWeight} kg
            </Text>
            <View
              style={[
                styles.deltaTag,
                {
                  backgroundColor: weightDelta <= 0 ? theme.accentGreenLight : theme.accentLight,
                },
              ]}
            >
              <Ionicons
                name={weightDelta <= 0 ? 'trending-down' : 'trending-up'}
                size={13}
                color={weightDelta <= 0 ? theme.accentGreen : theme.accent}
              />
              <Text
                style={[
                  styles.deltaText,
                  { color: weightDelta <= 0 ? theme.accentGreen : theme.accent },
                ]}
              >
                {weightDelta > 0 ? '+' : ''}{weightDelta} kg
              </Text>
            </View>
            <Text style={[styles.progressEnd, { color: theme.textMuted }]}>
              {goalWeight} kg
            </Text>
          </View>

          {/* Stepper */}
          <View style={[styles.stepper, { borderTopColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.stepBtn, { backgroundColor: theme.surfaceAlt }]}
              onPress={handleWeightMinus}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={22} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleWeightManual} activeOpacity={0.7}>
              <Text style={[styles.stepperValue, { color: theme.text }]}>
                {currentWeight} kg
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stepBtn, { backgroundColor: theme.accent }]}
              onPress={handleWeightPlus}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Meine Ziele */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Meine Ziele</Text>

        <View style={[card, styles.goalsCard]}>
          <TouchableOpacity style={styles.goalRow} onPress={handleEditCalorieGoal} activeOpacity={0.7}>
            <Ionicons name="flame-outline" size={18} color={theme.accent} />
            <Text style={[styles.goalRowLabel, { color: theme.textMuted }]}>Calorie Goal</Text>
            <Text style={[styles.goalRowValue, { color: theme.text }]}>{calorieGoal} kcal</Text>
            <Ionicons name="chevron-forward" size={15} color={theme.textMuted} />
          </TouchableOpacity>
          <View style={[styles.goalDivider, { backgroundColor: theme.border }]} />
          <TouchableOpacity style={styles.goalRow} onPress={handleGoalWeightManual} activeOpacity={0.7}>
            <Ionicons name="scale-outline" size={18} color={theme.accentGreen} />
            <Text style={[styles.goalRowLabel, { color: theme.textMuted }]}>Zielgewicht</Text>
            <Text style={[styles.goalRowValue, { color: theme.text }]}>{goalWeight} kg</Text>
            <Ionicons name="chevron-forward" size={15} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Weight history hint */}
        {weightHistory.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Verlauf</Text>
            <View style={[card, styles.historyCard]}>
              {weightHistory.slice(0, 5).map((entry, i) => (
                <View key={entry.date}>
                  {i > 0 && (
                    <View style={[styles.goalDivider, { backgroundColor: theme.border }]} />
                  )}
                  <View style={styles.historyRow}>
                    <Text style={[styles.historyDate, { color: theme.textMuted }]}>
                      {entry.date}
                    </Text>
                    <Text style={[styles.historyKg, { color: theme.text }]}>
                      {entry.kg} kg
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 4,
  },
  pageTitle: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  gearBtn: {
    width: 42, height: 42, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    marginBottom: 14,
  },
  streakIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  streakText: { flex: 1 },
  streakNumber: { fontSize: 17, fontWeight: '700' },
  streakSub: { fontSize: 13, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, alignItems: 'center', padding: 16, gap: 6,
  },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '500' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 10, marginLeft: 2,
  },

  weightCard: { padding: 18, marginBottom: 24 },
  weightCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  weightCardTitle: { fontSize: 14, fontWeight: '600' },
  goalLabel: { fontSize: 13, fontWeight: '600' },
  bigWeight: { fontSize: 44, fontWeight: '900', letterSpacing: -1, marginBottom: 14 },
  bigWeightUnit: { fontSize: 24, fontWeight: '500' },

  progressBarBg: {
    height: 8, borderRadius: 4, backgroundColor: 'rgba(128,128,128,0.2)', marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: { height: 8, borderRadius: 4, minWidth: 4 },

  weightProgressRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
  },
  progressStart: { fontSize: 12 },
  progressEnd: { fontSize: 12 },
  deltaTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  deltaText: { fontSize: 12, fontWeight: '700' },

  stepper: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 16, borderTopWidth: 1,
  },
  stepBtn: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  stepperValue: { fontSize: 20, fontWeight: '700' },

  goalsCard: { padding: 4, marginBottom: 24 },
  goalRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
  },
  goalRowLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  goalRowValue: { fontSize: 14, fontWeight: '700' },
  goalDivider: { height: 1, marginHorizontal: 14 },

  historyCard: { overflow: 'hidden', marginBottom: 8 },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  historyDate: { fontSize: 13 },
  historyKg: { fontSize: 14, fontWeight: '700' },
});

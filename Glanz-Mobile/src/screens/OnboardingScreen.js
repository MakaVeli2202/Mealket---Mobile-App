import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions, Platform, KeyboardAvoidingView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../components/SafeGradient';
import Animated, {
  FadeInDown, FadeInUp, FadeIn,
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  interpolate, Extrapolation,
} from 'react-native-reanimated';
import { useSettings, computeTDEE } from '../context/SettingsContext';
import { useWeight } from '../context/WeightContext';
import GlassBg from '../components/GlassBg';
import GlassCard from '../components/GlassCard';

const { width: W } = Dimensions.get('window');

const ACTIVITY_OPTIONS = [
  { key: 'sedentary',   label: 'Sedentary',   desc: 'Desk job, little exercise',  icon: 'laptop-outline' },
  { key: 'light',       label: 'Light',        desc: '1-3 workouts / week',        icon: 'walk-outline' },
  { key: 'moderate',    label: 'Moderate',     desc: '3-5 workouts / week',        icon: 'bicycle-outline' },
  { key: 'active',      label: 'Active',       desc: '6-7 workouts / week',        icon: 'barbell-outline' },
  { key: 'very_active', label: 'Very Active',  desc: 'Physical job + daily train', icon: 'flash-outline' },
];

const GOAL_OPTIONS = [
  { key: 'lose',     label: 'Lose Weight',    icon: 'trending-down-outline',  kcalAdj: -500, color: '#FF6B6B' },
  { key: 'maintain', label: 'Maintain',       icon: 'remove-outline',         kcalAdj: 0,    color: '#00E5A8' },
  { key: 'gain',     label: 'Gain Muscle',    icon: 'trending-up-outline',    kcalAdj: +300, color: '#2C9CFF' },
];

const STEPS = ['welcome', 'body', 'activity', 'goal'];

export default function OnboardingScreen({ onDone }) {
  const { theme, setCalorieGoal, setCarbGoal, setProteinGoal, setFatGoal,
          setHeightCm, setAge, setSex, setActivityLevel, setUserName,
          setOnboardingComplete } = useSettings();
  const { setWeight, setGoalWeight } = useWeight();

  const [step, setStep] = useState(0);
  const [name, setName]         = useState('');
  const [weightVal, setWeightVal] = useState('75');
  const [goalWeightVal, setGoalWeightVal] = useState('70');
  const [height, setHeight]     = useState('173');
  const [ageVal, setAgeVal]     = useState('25');
  const [sexVal, setSexVal]     = useState('male');
  const [activity, setActivity] = useState('moderate');
  const [goal, setGoal]         = useState('lose');

  const slideAnim = useSharedValue(0);

  const goNext = () => {
    if (step < STEPS.length - 1) {
      slideAnim.value = withTiming(-W, { duration: 220 }, () => {
        slideAnim.value = W;
      });
      setTimeout(() => {
        setStep(s => s + 1);
        slideAnim.value = withSpring(0, { damping: 22, stiffness: 200 });
      }, 220);
    } else {
      finish();
    }
  };

  const goBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const finish = () => {
    const wKg   = parseFloat(weightVal) || 75;
    const hCm   = parseFloat(height)    || 173;
    const a     = parseInt(ageVal)      || 25;
    const gWKg  = parseFloat(goalWeightVal) || wKg;
    const goalObj = GOAL_OPTIONS.find(o => o.key === goal) || GOAL_OPTIONS[0];

    const tdee = computeTDEE(wKg, hCm, a, sexVal, activity);
    const calorieTarget = Math.max(1200, tdee + goalObj.kcalAdj);

    // Macro split: 40% carbs / 30% protein / 30% fat
    const carbs   = Math.round((calorieTarget * 0.40) / 4);
    const protein = Math.round((calorieTarget * 0.30) / 4);
    const fat     = Math.round((calorieTarget * 0.30) / 9);

    if (name.trim()) setUserName(name.trim());
    setHeightCm(hCm);
    setAge(a);
    setSex(sexVal);
    setActivityLevel(activity);
    setCalorieGoal(calorieTarget);
    setCarbGoal(carbs);
    setProteinGoal(protein);
    setFatGoal(fat);
    setWeight(wKg);
    setGoalWeight(gWKg);
    setOnboardingComplete(true);
    onDone?.();
  };

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideAnim.value }],
  }));

  const tdeePreview = computeTDEE(
    parseFloat(weightVal) || 75,
    parseFloat(height) || 173,
    parseInt(ageVal) || 25,
    sexVal,
    activity,
  );
  const goalAdj = GOAL_OPTIONS.find(o => o.key === goal)?.kcalAdj || 0;
  const targetKcal = Math.max(1200, tdeePreview + goalAdj);

  const StepDots = () => (
    <View style={styles.dots}>
      {STEPS.map((_, i) => (
        <View key={i} style={[
          styles.dot,
          { backgroundColor: i === step ? theme.accent : theme.border, width: i === step ? 20 : 6 },
        ]} />
      ))}
    </View>
  );

  const renderStep = () => {
    switch (STEPS[step]) {
      case 'welcome':
        return (
          <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.stepContent}>
            <View style={styles.logoRow}>
              <Image source={require('../../assets/MealKet-Icon.png')} style={styles.logo} />
            </View>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Welcome to{'\n'}Mealket</Text>
            <Text style={[styles.stepSub, { color: theme.textSub }]}>
              Your premium health OS.{'\n'}Let's set up your personal goals in 60 seconds.
            </Text>
            <GlassCard theme={theme} intensity={50} radius={20} style={styles.nameCard}>
              <View style={styles.nameInputRow}>
                <Ionicons name="person-outline" size={18} color={theme.accent} />
                <TextInput
                  style={[styles.nameInput, { color: theme.text }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name (optional)"
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="words"
                />
              </View>
            </GlassCard>
          </Animated.View>
        );

      case 'body':
        return (
          <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Your Body Stats</Text>
            <Text style={[styles.stepSub, { color: theme.textSub }]}>Used to calculate your personal calorie target</Text>

            <View style={styles.sexRow}>
              {(['male', 'female']).map(s => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSexVal(s)}
                  style={[styles.sexBtn, { borderColor: sexVal === s ? theme.accent : theme.border, backgroundColor: sexVal === s ? theme.accent + '18' : theme.surfaceAlt }]}
                >
                  <Ionicons name={s === 'male' ? 'male' : 'female'} size={20} color={sexVal === s ? theme.accent : theme.textMuted} />
                  <Text style={[styles.sexBtnText, { color: sexVal === s ? theme.accent : theme.textMuted }]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputGrid}>
              {[
                { label: 'Height', unit: 'cm', val: height, set: setHeight, kb: 'numeric' },
                { label: 'Age',    unit: 'yrs', val: ageVal, set: setAgeVal,  kb: 'numeric' },
              ].map(f => (
                <GlassCard key={f.label} theme={theme} intensity={50} radius={16} style={styles.inputCard}>
                  <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{f.label}</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.bigInput, { color: theme.text }]}
                      value={f.val}
                      onChangeText={f.set}
                      keyboardType={f.kb}
                      selectTextOnFocus
                    />
                    <Text style={[styles.inputUnit, { color: theme.textMuted }]}>{f.unit}</Text>
                  </View>
                </GlassCard>
              ))}
            </View>

            <View style={styles.inputGrid}>
              {[
                { label: 'Current Weight', unit: 'kg', val: weightVal, set: setWeightVal, kb: 'decimal-pad' },
                { label: 'Goal Weight',    unit: 'kg', val: goalWeightVal, set: setGoalWeightVal, kb: 'decimal-pad' },
              ].map(f => (
                <GlassCard key={f.label} theme={theme} intensity={50} radius={16} style={styles.inputCard}>
                  <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{f.label}</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.bigInput, { color: theme.text }]}
                      value={f.val}
                      onChangeText={f.set}
                      keyboardType={f.kb}
                      selectTextOnFocus
                    />
                    <Text style={[styles.inputUnit, { color: theme.textMuted }]}>{f.unit}</Text>
                  </View>
                </GlassCard>
              ))}
            </View>
          </Animated.View>
        );

      case 'activity':
        return (
          <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Activity Level</Text>
            <Text style={[styles.stepSub, { color: theme.textSub }]}>How active are you on a typical week?</Text>

            <View style={styles.optionList}>
              {ACTIVITY_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setActivity(opt.key)}
                  activeOpacity={0.75}
                >
                  <GlassCard
                    theme={theme} intensity={activity === opt.key ? 60 : 40} radius={16}
                    style={[styles.optionCard, { borderColor: activity === opt.key ? theme.accent + '80' : 'transparent', borderWidth: 1.5 }]}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: (activity === opt.key ? theme.accent : theme.textMuted) + '22' }]}>
                      <Ionicons name={opt.icon} size={20} color={activity === opt.key ? theme.accent : theme.textMuted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionLabel, { color: activity === opt.key ? theme.text : theme.textSub }]}>{opt.label}</Text>
                      <Text style={[styles.optionDesc, { color: theme.textMuted }]}>{opt.desc}</Text>
                    </View>
                    {activity === opt.key && <Ionicons name="checkmark-circle" size={20} color={theme.accent} />}
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        );

      case 'goal':
        return (
          <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Your Goal</Text>
            <Text style={[styles.stepSub, { color: theme.textSub }]}>We'll calculate your personal daily target</Text>

            <View style={styles.goalGrid}>
              {GOAL_OPTIONS.map(opt => (
                <TouchableOpacity key={opt.key} onPress={() => setGoal(opt.key)} activeOpacity={0.75} style={{ flex: 1 }}>
                  <GlassCard
                    theme={theme} intensity={goal === opt.key ? 60 : 40} radius={18}
                    style={[styles.goalCard, { borderColor: goal === opt.key ? opt.color + '80' : 'transparent', borderWidth: 1.5 }]}
                  >
                    <View style={[styles.goalIcon, { backgroundColor: opt.color + '22' }]}>
                      <Ionicons name={opt.icon} size={22} color={opt.color} />
                    </View>
                    <Text style={[styles.goalLabel, { color: goal === opt.key ? theme.text : theme.textSub }]}>{opt.label}</Text>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>

            <GlassCard theme={theme} intensity={60} radius={20} style={styles.tdeeCard}>
              <LinearGradient
                colors={[theme.accent + '20', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
              />
              <Text style={[styles.tdeeTitle, { color: theme.textMuted }]}>YOUR DAILY TARGET</Text>
              <Text style={[styles.tdeeKcal, { color: theme.accent }]}>{targetKcal.toLocaleString()}</Text>
              <Text style={[styles.tdeeUnit, { color: theme.textMuted }]}>kcal / day</Text>
              <Text style={[styles.tdeeSub, { color: theme.textMuted }]}>
                TDEE {tdeePreview.toLocaleString()} kcal  {goalAdj > 0 ? `+${goalAdj}` : goalAdj} deficit
              </Text>
            </GlassCard>
          </Animated.View>
        );
    }
  };

  const canContinue = () => {
    if (STEPS[step] === 'body') {
      return parseFloat(weightVal) > 0 && parseFloat(height) > 0 && parseInt(ageVal) > 0;
    }
    return true;
  };

  return (
    <GlassBg theme={theme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.header}>
            {step > 0 ? (
              <TouchableOpacity onPress={goBack} hitSlop={12} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={22} color={theme.text} />
              </TouchableOpacity>
            ) : <View style={styles.backBtn} />}
            <StepDots />
            <View style={styles.backBtn} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={slideStyle}>
              {renderStep()}
            </Animated.View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={goNext}
              disabled={!canContinue()}
              activeOpacity={0.85}
              style={{ borderRadius: 18, overflow: 'hidden', opacity: canContinue() ? 1 : 0.5 }}
            >
              <LinearGradient
                colors={[theme.accent, theme.accentBlue || theme.accent]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.nextBtn}
              >
                <Text style={styles.nextBtnText}>
                  {STEPS[step] === 'goal' ? "Let's Go!" : 'Continue'}
                </Text>
                <Ionicons name={STEPS[step] === 'goal' ? 'rocket-outline' : 'arrow-forward'} size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>

            {STEPS[step] === 'welcome' && (
              <TouchableOpacity onPress={finish} style={{ marginTop: 12, alignItems: 'center' }} hitSlop={8}>
                <Text style={[styles.skipText, { color: theme.textMuted }]}>Skip setup</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GlassBg>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 6, borderRadius: 3 },

  scrollContent: { paddingHorizontal: 24, paddingBottom: 24, flexGrow: 1 },
  stepContent: { paddingTop: 24, gap: 20 },

  logoRow: { alignItems: 'center', marginBottom: 8 },
  logo: { width: 90, height: 90, borderRadius: 24 },
  stepTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1, lineHeight: 40 },
  stepSub: { fontSize: 15, lineHeight: 22, fontWeight: '500', marginTop: -8 },

  nameCard: { padding: 4 },
  nameInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  nameInput: { flex: 1, fontSize: 17, fontWeight: '600', padding: 0 },

  sexRow: { flexDirection: 'row', gap: 12 },
  sexBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5 },
  sexBtnText: { fontSize: 15, fontWeight: '700' },

  inputGrid: { flexDirection: 'row', gap: 12 },
  inputCard: { flex: 1, padding: 16 },
  inputLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  bigInput: { fontSize: 28, fontWeight: '900', padding: 0, flex: 1 },
  inputUnit: { fontSize: 13, fontWeight: '600' },

  optionList: { gap: 8 },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  optionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { fontSize: 15, fontWeight: '700' },
  optionDesc: { fontSize: 12, fontWeight: '500', marginTop: 2 },

  goalGrid: { flexDirection: 'row', gap: 10 },
  goalCard: { padding: 16, alignItems: 'center', gap: 10 },
  goalIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  goalLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },

  tdeeCard: { padding: 24, alignItems: 'center', gap: 4, overflow: 'hidden' },
  tdeeTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  tdeeKcal: { fontSize: 52, fontWeight: '900', letterSpacing: -2 },
  tdeeUnit: { fontSize: 13, fontWeight: '600', marginTop: -4 },
  tdeeSub: { fontSize: 12, fontWeight: '500', marginTop: 6, textAlign: 'center' },

  footer: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 32 : 24, paddingTop: 12 },
  nextBtn: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24 },
  nextBtnText: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  skipText: { fontSize: 14, fontWeight: '600' },
});

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Platform,
  Modal, TextInput, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import Animated, {
  FadeInDown, FadeIn, FadeOut,
  useSharedValue, useAnimatedStyle, withTiming, withSpring, withSequence, withRepeat,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../components/SafeGradient';
import { BlurView } from 'expo-blur';
import { useSettings } from '../context/SettingsContext';
import { useFasting } from '../context/FastingContext';
import GlassCard from '../components/GlassCard';
import GlassBg from '../components/GlassBg';
import SpringPressable from '../components/SpringPressable';

const FUN_FACTS = [
  { icon: 'flame-sharp',         color: '#FF9F0A', text: 'After 12h fasting your body switches to burning fat for fuel \u2014 ketosis begins.' },
  { icon: 'refresh-circle',      color: '#0A84FF', text: 'Fasting triggers autophagy \u2014 your cells clean out damaged components, a deep internal reset.' },
  { icon: 'heart-sharp',         color: '#FF375F', text: 'Even short fasts can lower LDL cholesterol and triglycerides, reducing heart disease risk.' },
  { icon: 'bulb-sharp',          color: '#BF5AF2', text: 'Fasting boosts BDNF \u2014 a brain protein that grows new neurons and sharpens memory & focus.' },
  { icon: 'trending-down-sharp', color: '#d4a840', text: 'Insulin drops dramatically during a fast, making stored body fat much easier to access.' },
  { icon: 'barbell-sharp',       color: '#FF6B1A', text: 'Growth hormone spikes up to 5x during a fast \u2014 protecting muscle and accelerating fat loss.' },
  { icon: 'water-sharp',         color: '#2C9CFF', text: 'Staying hydrated during a fast reduces hunger by up to 30% \u2014 aim for 2\u20133L of water.' },
  { icon: 'leaf-sharp',          color: '#00C870', text: "Black coffee and plain tea don't break a fast and can enhance fat burning." },
  { icon: 'flash-sharp',         color: '#FEBC2E', text: 'Most people feel an energy surge after 24\u201348h as the body fully adapts to fasting.' },
  { icon: 'time-sharp',          color: '#5AC8FA', text: 'The 16:8 method is the most studied \u2014 proven effective and sustainable long term.' },
  { icon: 'shield-checkmark',    color: '#30D158', text: 'Fasting reduces inflammation markers like CRP \u2014 linked to lower chronic disease risk.' },
  { icon: 'moon-sharp',          color: '#7D7AFF', text: 'Your longest natural fast is while you sleep. Eating earlier in the evening extends it.' },
];

function FunFactCard({ theme, isFasting }) {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * FUN_FACTS.length));
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const interval = setInterval(() => {
      opacity.value   = withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) });
      translateY.value = withTiming(-10, { duration: 300 });
      setTimeout(() => {
        setIndex((i) => (i + 1) % FUN_FACTS.length);
        translateY.value = 14;
        opacity.value    = withTiming(1, { duration: 380, easing: Easing.out(Easing.quad) });
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }, 340);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  const fact = FUN_FACTS[index];

  return (
    <Animated.View entering={FadeInDown.delay(280).duration(320).springify()} style={{ marginBottom: 16 }}>
      <GlassCard theme={theme} intensity={45} radius={18} shimmer={false} glow={false}>
        {isFasting && (
          <LinearGradient
            colors={[theme.accentSecondary + '15', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        )}
        <Animated.View style={[styles.factInner, animStyle]}>
          <View style={[styles.factIconWrap, { backgroundColor: fact.color + '22' }]}>
            <Ionicons name={fact.icon} size={18} color={fact.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.factLabel, { color: fact.color }]}>DID YOU KNOW?</Text>
            <Text style={[styles.factText, { color: theme.textSub }]}>{fact.text}</Text>
          </View>
        </Animated.View>
      </GlassCard>
    </Animated.View>
  );
}

const PRESETS = [
  { label: '16:8',  fast: 16, eat: 8  },
  { label: '18:6',  fast: 18, eat: 6  },
  { label: '20:4',  fast: 20, eat: 4  },
  { label: '12:12', fast: 12, eat: 12 },
];

const PAUSED_AMBER = '#d4a840';

function formatSeconds(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [String(h).padStart(2, '0'), String(m).padStart(2, '0'), String(s).padStart(2, '0')];
}

function PulseRing({ color, active }) {
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(0);
  useEffect(() => {
    if (active) {
      scale.value   = withRepeat(withSequence(withTiming(1.35, { duration: 1000, easing: Easing.out(Easing.quad) }), withTiming(1, { duration: 800 })), -1);
      opacity.value = withRepeat(withSequence(withTiming(0.45, { duration: 1000 }), withTiming(0, { duration: 800 })), -1);
    } else {
      scale.value   = withTiming(1, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [active]);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { borderRadius: 40, borderWidth: 2, borderColor: color }, anim]}
      pointerEvents="none"
    />
  );
}

export default function FastingScreen() {
  const { theme, tr } = useSettings();
  const tabBarHeight  = Platform.OS === 'ios' ? 96 : 80;
  const { isFasting, tracking, eatingWindowHours, fastingWindowHours, eatStart, eatEndTime, timeElapsedSeconds, paused, fastingHistory, startFasting, stopFasting, pauseFasting, resumeFasting, setEatingWindow, setEatStart } = useFasting();

  const [editTimeModal, setEditTimeModal] = useState(false);
  const [timeInput,     setTimeInput]     = useState('');

  const [hh, mm, ss] = formatSeconds(timeElapsedSeconds);
  const [ph, pm, ps] = paused ? formatSeconds(timeElapsedSeconds) : ['00', '00', '00'];

  const handleStart = () => startFasting();

  const handleStop = () => {
    Alert.alert(tr.fasting.stopTitle, tr.fasting.stopMsg, [
      { text: tr.history.cancel, style: 'cancel' },
      { text: tr.fasting.stop, style: 'destructive', onPress: stopFasting },
    ]);
  };

  const handleEditEatStart = () => {
    setTimeInput(eatStart);
    setEditTimeModal(true);
  };

  const handleTimeModalSave = () => {
    if (/^\d{1,2}:\d{2}$/.test(timeInput.trim())) {
      setEatStart(timeInput.trim());
      setEditTimeModal(false);
    } else Alert.alert(tr.fasting.invalidFormat, tr.fasting.formatHint);
  };

  const activeColor = paused ? PAUSED_AMBER : (tracking ? (isFasting ? theme.accentSecondary : theme.accentGreen) : theme.textMuted);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentHistory = fastingHistory.filter((e) => new Date(e.date) >= sevenDaysAgo).slice(0, 7);

  return (
    <GlassBg theme={theme} variant="purple">
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.container, { paddingBottom: tabBarHeight + 16 }]} showsVerticalScrollIndicator={false}>

          <Animated.View entering={FadeInDown.duration(280).springify().damping(22)} style={styles.header}>
            <Text style={[styles.pageTitle, { color: theme.text }]}>{tr.fasting.title}</Text>
            <Text style={[styles.pageSub, { color: theme.textMuted }]}>
              {fastingWindowHours}h fast &middot; {eatingWindowHours}h eat
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(340).springify().damping(18)}>
            <GlassCard theme={theme} intensity={60} radius={24} style={{ marginBottom: 16 }}>
              <LinearGradient
                colors={paused ? [PAUSED_AMBER + '28', 'transparent'] : (tracking ? (isFasting ? [theme.accentSecondary + '28', 'transparent'] : [activeColor + '28', 'transparent']) : [theme.textMuted + '18', 'transparent'])}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ height: 3, marginBottom: 20 }}
              />

              <View style={styles.statusRow}>
                <View style={styles.circleWrap}>
                  {paused ? (
                    <LinearGradient
                      colors={[PAUSED_AMBER, '#b8922e']}
                      start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }}
                      style={[styles.circle, { width: 86, height: 86, borderRadius: 43 }]}
                    >
                      <Ionicons name="pause" size={42} color="#FFF" />
                    </LinearGradient>
                  ) : (tracking && isFasting) ? (
                    <LinearGradient
                      colors={theme.secondaryGradient}
                      start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }}
                      style={[styles.circle, { width: 86, height: 86, borderRadius: 43 }]}
                    >
                      <Ionicons name="flame" size={42} color="#FFF" />
                    </LinearGradient>
                  ) : (
                    <>
                      <PulseRing color={activeColor} active={tracking} />
                      <LinearGradient
                        colors={tracking ? [activeColor + '70', activeColor + '28'] : [theme.textMuted + '40', theme.textMuted + '15']}
                        start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }}
                        style={styles.circle}
                      >
                        <Ionicons name={isFasting ? 'flame' : 'cafe-outline'} size={36} color={tracking ? activeColor : theme.textMuted} />
                      </LinearGradient>
                    </>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statusText, { color: activeColor, fontSize: paused ? 14 : (tracking ? 16 : 13) }]}>
                    {paused ? 'Fasting \u2014 Paused' : (isFasting ? tr.fasting.fasting : tr.fasting.canEat)}
                  </Text>
                  <View style={[styles.timerRow, (tracking && isFasting) && { justifyContent: 'center' }]}>
                    <Text style={[styles.timerDigit, { color: (tracking && isFasting) ? activeColor : theme.text, fontSize: (tracking && isFasting) ? 34 : 26 }]}>{paused ? ph : hh}</Text>
                    <Text style={[styles.timerColon, { color: theme.textMuted, fontSize: (tracking && isFasting) ? 26 : 20 }]}>:</Text>
                    <Text style={[styles.timerDigit, { color: (tracking && isFasting) ? activeColor : theme.text, fontSize: (tracking && isFasting) ? 34 : 26 }]}>{paused ? pm : mm}</Text>
                    <Text style={[styles.timerColon, { color: theme.textMuted, fontSize: (tracking && isFasting) ? 26 : 20 }]}>:</Text>
                    <Text style={[styles.timerDigit, { color: (tracking && isFasting) ? activeColor : theme.text, fontSize: (tracking && isFasting) ? 34 : 26 }]}>{paused ? ps : ss}</Text>
                  </View>
                  {paused && (
                    <Text style={[styles.pausedHint, { color: PAUSED_AMBER }]}>Paused</Text>
                  )}
                </View>
              </View>

              {tracking ? (
                <View style={styles.buttonRow}>
                  {paused ? (
                    <SpringPressable onPress={resumeFasting} style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }} scaleDown={0.96}>
                      <LinearGradient colors={['#30D158', '#1a9e4a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mainBtn}>
                        <Ionicons name="play-circle-outline" size={20} color="#FFF" />
                        <Text style={styles.mainBtnText}>Resume</Text>
                      </LinearGradient>
                    </SpringPressable>
                  ) : (
                    <SpringPressable onPress={pauseFasting} style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }} scaleDown={0.96}>
                      <LinearGradient colors={[PAUSED_AMBER, '#b8922e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mainBtn}>
                        <Ionicons name="pause-circle-outline" size={20} color="#FFF" />
                        <Text style={styles.mainBtnText}>Pause</Text>
                      </LinearGradient>
                    </SpringPressable>
                  )}
                  <View style={{ width: 10 }} />
                  <SpringPressable onPress={handleStop} style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }} scaleDown={0.96}>
                    <LinearGradient colors={theme.secondaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mainBtn}>
                      <Ionicons name="stop-circle-outline" size={20} color="#FFF" />
                      <Text style={styles.mainBtnText}>{tr.fasting.stop}</Text>
                    </LinearGradient>
                  </SpringPressable>
                </View>
              ) : (
                <SpringPressable
                  onPress={handleStart}
                  style={{ marginHorizontal: 16, borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}
                  scaleDown={0.96}
                >
                  <LinearGradient
                    colors={[theme.accent, theme.accentDark]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.mainBtn}
                  >
                    <Ionicons name="play-circle-outline" size={20} color="#FFF" />
                    <Text style={styles.mainBtnText}>{tr.fasting.start}</Text>
                  </LinearGradient>
                </SpringPressable>
              )}

              <View style={[styles.timeRow, { borderTopColor: theme.border }]}>
                <View style={styles.timeBlock}>
                  <Text style={[styles.timeLabel, { color: theme.textMuted }]}>{tr.fasting.eatStart}</Text>
                  <Text style={[styles.timeValue, { color: theme.text }]}>{eatStart}</Text>
                  <TouchableOpacity onPress={handleEditEatStart} hitSlop={8}>
                    <Text style={[styles.editBtn, { color: theme.accent }]}>{tr.fasting.edit}</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.timeDivider, { backgroundColor: theme.border }]} />
                <View style={styles.timeBlock}>
                  <Text style={[styles.timeLabel, { color: theme.textMuted }]}>{tr.fasting.eatEnd}</Text>
                  <Text style={[styles.timeValue, { color: theme.text }]}>{eatEndTime}</Text>
                  <View style={{ height: 16 }} />
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {recentHistory.length > 0 && (
            <Animated.View entering={FadeInDown.delay(160).duration(300).springify()} style={{ marginBottom: 16 }}>
              <GlassCard theme={theme} intensity={50} radius={20}>
                <Text style={[styles.historyTitle, { color: theme.text }]}>Fasting History</Text>
                <View style={[styles.historyDivider, { backgroundColor: theme.border }]} />
                {recentHistory.map((entry, idx) => {
                  const [eh, em, es] = formatSeconds(entry.durationSeconds);
                  return (
                    <View key={entry.id}>
                      <View style={styles.historyRow}>
                        <Text style={[styles.historyDate, { color: theme.textMuted }]}>
                          {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </Text>
                        <Text style={[styles.historyDuration, { color: theme.text }]}>{eh}:{em}:{es}</Text>
                        <Text style={[styles.historyStatus, { color: entry.completed ? '#30D158' : theme.accentSecondary }]}>completed</Text>
                      </View>
                      {idx < recentHistory.length - 1 && <View style={[styles.historyItemDivider, { backgroundColor: theme.border }]} />}
                    </View>
                  );
                })}
              </GlassCard>
            </Animated.View>
          )}

          <FunFactCard theme={theme} isFasting={isFasting} />

          <Animated.View entering={FadeInDown.delay(320).duration(300).springify()} style={styles.presetsRow}>
            {PRESETS.map((p) => {
              const isActive = p.eat === eatingWindowHours;
              const pillColor = paused ? PAUSED_AMBER : (tracking && isFasting ? theme.accentSecondary : theme.accent);
              return (
                <SpringPressable
                  key={p.label}
                  onPress={() => setEatingWindow(p.eat)}
                  style={[styles.presetPill, { backgroundColor: isActive ? pillColor : theme.surface, borderColor: isActive ? pillColor : theme.border }]}
                  scaleDown={0.92}
                >
                  <Text style={[styles.presetText, { color: isActive ? '#FFF' : theme.text }]}>{p.label}</Text>
                </SpringPressable>
              );
            })}
          </Animated.View>

        </ScrollView>
      </SafeAreaView>

      <Modal visible={editTimeModal} transparent animationType="fade" onRequestClose={() => setEditTimeModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <Animated.View entering={FadeIn.duration(200)} style={{ width: '100%' }}>
            <GlassCard theme={theme} intensity={80} radius={22} style={{ padding: 24 }}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{tr.fasting.eatStart}</Text>
              <Text style={[styles.modalSub, { color: theme.textMuted }]}>{tr.fasting.timePrompt}</Text>
              <TextInput
                style={[styles.modalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
                value={timeInput}
                onChangeText={setTimeInput}
                placeholder="12:00"
                placeholderTextColor={theme.textMuted}
                keyboardType="numbers-and-punctuation"
                autoFocus
              />
              <View style={styles.modalBtns}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.surfaceAlt }]} onPress={() => setEditTimeModal(false)}>
                  <Text style={[styles.modalBtnText, { color: theme.textMuted }]}>{tr.history.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.accent }]} onPress={handleTimeModalSave}>
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
  container: { padding: 16 },
  header:    { marginBottom: 20, marginTop: 4 },
  pageTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  pageSub:   { fontSize: 13, marginTop: 3, fontWeight: '500' },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginHorizontal: 16, marginBottom: 16 },
  circleWrap: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  circle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  statusText: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  timerDigit: { fontSize: 26, fontWeight: '800', letterSpacing: -1 },
  timerColon: { fontSize: 20, fontWeight: '300', marginBottom: 2 },
  pausedHint: { fontSize: 11, fontWeight: '600', marginTop: 2 },

  buttonRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16 },
  mainBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', paddingVertical: 12 },
  mainBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  timeRow: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 14, paddingBottom: 16, marginHorizontal: 16 },
  timeBlock: { flex: 1, alignItems: 'center', gap: 4 },
  timeLabel: { fontSize: 11, fontWeight: '500' },
  timeValue: { fontSize: 20, fontWeight: '800' },
  editBtn: { fontSize: 12, fontWeight: '700' },
  timeDivider: { width: 1, marginVertical: 4 },

  historyTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3, padding: 16, paddingBottom: 12 },
  historyDivider: { height: 1, marginHorizontal: 16 },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  historyDate: { flex: 1, fontSize: 13, fontWeight: '500' },
  historyDuration: { fontSize: 15, fontWeight: '700', marginRight: 12 },
  historyStatus: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  historyItemDivider: { height: 1, marginLeft: 16, marginRight: 16 },

  factInner: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 14 },
  factIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  factLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: 4 },
  factText: { fontSize: 13, lineHeight: 19 },

  presetsRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  presetPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  presetText: { fontSize: 14, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 28 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  modalSub: { fontSize: 13, marginBottom: 12 },
  modalInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 12 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { fontSize: 15, fontWeight: '700' },
});

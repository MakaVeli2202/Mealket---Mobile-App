import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Share,
  Modal, TextInput, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSettings } from '../context/SettingsContext';
import { useFasting } from '../context/FastingContext';

const PRESETS = [
  { label: '16:8', fast: 16, eat: 8 },
  { label: '18:6', fast: 18, eat: 6 },
  { label: '20:4', fast: 20, eat: 4 },
  { label: '12:12', fast: 12, eat: 12 },
];

function formatSeconds(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0'),
  ];
}

export default function FastingScreen() {
  const { theme } = useSettings();
  const {
    isFasting,
    eatingWindowHours,
    fastingWindowHours,
    eatStart,
    eatEndTime,
    timeElapsedSeconds,
    startFasting,
    stopFasting,
    setEatingWindow,
    setEatStart,
  } = useFasting();

  const [editTimeModal, setEditTimeModal] = useState(false);
  const [timeInput, setTimeInput] = useState('');

  const [hh, mm, ss] = isFasting
    ? formatSeconds(timeElapsedSeconds)
    : ['00', '00', '00'];

  const activePreset = PRESETS.find((p) => p.eat === eatingWindowHours);

  const handleStartStop = () => {
    if (isFasting) {
      Alert.alert(
        'Fasten beenden',
        'Möchtest du das Fasten jetzt beenden?',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Beenden', style: 'destructive', onPress: stopFasting },
        ],
      );
    } else {
      startFasting();
    }
  };

  const handleEditEatStart = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Essen Start',
        'Uhrzeit eingeben (z.B. 12:00)',
        (val) => {
          if (val && /^\d{1,2}:\d{2}$/.test(val.trim())) {
            setEatStart(val.trim());
          } else if (val) {
            Alert.alert('Ungültig', 'Format: HH:MM (z.B. 12:00)');
          }
        },
        'plain-text',
        eatStart,
      );
    } else {
      setTimeInput(eatStart);
      setEditTimeModal(true);
    }
  };

  const handleTimeModalSave = () => {
    if (/^\d{1,2}:\d{2}$/.test(timeInput.trim())) {
      setEatStart(timeInput.trim());
      setEditTimeModal(false);
    } else {
      Alert.alert('Ungültig', 'Format: HH:MM (z.B. 12:00)');
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
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.pageTitle, { color: theme.text }]}>Intervallfasten</Text>
            <Text style={[styles.pageSub, { color: theme.textMuted }]}>
              {fastingWindowHours}h Fasten · {eatingWindowHours}h Essen
            </Text>
          </View>
        </View>

        {/* Section label + edit */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Fasten-Tracker</Text>
          <Text style={[styles.presetLabel, { color: theme.accent }]}>
            {fastingWindowHours}:{eatingWindowHours}
          </Text>
        </View>

        {/* Main fasting card */}
        <View style={[card, styles.trackerCard]}>
          {/* Top icons */}
          <View style={styles.cardIcons}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: theme.surfaceAlt }]}
              activeOpacity={0.7}
              onPress={() => {
                const msg = isFasting
                  ? `Ich faste seit ${hh}:${mm}:${ss} (${fastingWindowHours}:${eatingWindowHours})`
                  : `Ich mache Intervallfasten (${fastingWindowHours}:${eatingWindowHours})`;
                Share.share({ message: msg }).catch(() => {});
              }}
            >
              <Ionicons name="share-outline" size={18} color={theme.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: theme.surfaceAlt }]}
              activeOpacity={0.7}
              onPress={() => Alert.alert(
                'Intervallfasten',
                `${fastingWindowHours}:${eatingWindowHours} — ${fastingWindowHours}h Fasten, ${eatingWindowHours}h Essen.\n\nDein Fasten startet automatisch nach dem Essensfenster.`
              )}
            >
              <Ionicons name="information-circle-outline" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Status text */}
          <Text style={[styles.statusText, { color: isFasting ? theme.accent : theme.accentGreen }]}>
            {isFasting ? 'Du fastest gerade' : 'Du kannst jetzt essen!'}
          </Text>

          {/* Circle icon */}
          <LinearGradient
            colors={isFasting
              ? [theme.accent + '30', theme.accent + '10']
              : [theme.accentGreen + '30', theme.accentGreen + '10']
            }
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={[styles.circle, { borderColor: isFasting ? theme.accent : theme.accentGreen }]}
          >
            <Ionicons
              name={isFasting ? 'flame' : 'cafe-outline'}
              size={52}
              color={isFasting ? theme.accent : theme.accentGreen}
            />
          </LinearGradient>

          {/* Timer */}
          <View style={styles.timerRow}>
            <View style={styles.timerBlock}>
              <Text style={[styles.timerDigit, { color: theme.text }]}>{hh}</Text>
              <Text style={[styles.timerUnit, { color: theme.textMuted }]}>Std</Text>
            </View>
            <Text style={[styles.timerColon, { color: theme.textMuted }]}>:</Text>
            <View style={styles.timerBlock}>
              <Text style={[styles.timerDigit, { color: theme.text }]}>{mm}</Text>
              <Text style={[styles.timerUnit, { color: theme.textMuted }]}>Min</Text>
            </View>
            <Text style={[styles.timerColon, { color: theme.textMuted }]}>:</Text>
            <View style={styles.timerBlock}>
              <Text style={[styles.timerDigit, { color: theme.text }]}>{ss}</Text>
              <Text style={[styles.timerUnit, { color: theme.textMuted }]}>Sek</Text>
            </View>
          </View>

          {/* Start / Stop button */}
          <TouchableOpacity
            style={[
              styles.mainBtn,
              {
                backgroundColor: isFasting ? theme.danger : theme.accent,
              },
            ]}
            onPress={handleStartStop}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isFasting ? 'stop-circle-outline' : 'play-circle-outline'}
              size={22}
              color="#FFF"
            />
            <Text style={styles.mainBtnText}>
              {isFasting ? 'Fasten beenden' : 'Fasten starten'}
            </Text>
          </TouchableOpacity>

          {/* Eat window times */}
          <View style={[styles.timeRow, { borderTopColor: theme.border }]}>
            <View style={styles.timeBlock}>
              <Text style={[styles.timeLabel, { color: theme.textMuted }]}>Essen Start</Text>
              <Text style={[styles.timeValue, { color: theme.text }]}>{eatStart}</Text>
              <TouchableOpacity onPress={handleEditEatStart} activeOpacity={0.7}>
                <Text style={[styles.bearbeitenBtn, { color: theme.accent }]}>Bearbeiten</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.timeDivider, { backgroundColor: theme.border }]} />
            <View style={styles.timeBlock}>
              <Text style={[styles.timeLabel, { color: theme.textMuted }]}>Essen Ende</Text>
              <Text style={[styles.timeValue, { color: theme.text }]}>{eatEndTime}</Text>
              <Text style={[styles.bearbeitenBtn, { color: 'transparent' }]}>—</Text>
            </View>
          </View>
        </View>

        {/* Preset buttons */}
        <View style={styles.presetsRow}>
          {PRESETS.map((p) => {
            const isActive = p.eat === eatingWindowHours;
            return (
              <TouchableOpacity
                key={p.label}
                style={[
                  styles.presetPill,
                  {
                    backgroundColor: isActive ? theme.accent : theme.surface,
                    borderColor: isActive ? theme.accent : theme.border,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => setEatingWindow(p.eat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.presetPillText,
                    { color: isActive ? '#FFF' : theme.text },
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

      </View>

      {/* Android edit time modal */}
      <Modal
        visible={editTimeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setEditTimeModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Essen Start</Text>
            <Text style={[styles.modalSub, { color: theme.textMuted }]}>Uhrzeit eingeben (z.B. 12:00)</Text>
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
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.surfaceAlt }]}
                onPress={() => setEditTimeModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: theme.textMuted }]}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.accent }]}
                onPress={handleTimeModalSave}
              >
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Speichern</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },

  header: { marginBottom: 20, marginTop: 4 },
  pageTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  pageSub: { fontSize: 13, marginTop: 3 },

  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1,
  },
  presetLabel: { fontSize: 14, fontWeight: '800' },

  trackerCard: { padding: 20, alignItems: 'center', marginBottom: 20 },

  cardIcons: {
    flexDirection: 'row', justifyContent: 'space-between',
    width: '100%', marginBottom: 16,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },

  statusText: { fontSize: 15, fontWeight: '700', marginBottom: 20 },

  circle: {
    width: 130, height: 130, borderRadius: 65, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },

  timerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 24,
  },
  timerBlock: { alignItems: 'center', minWidth: 52 },
  timerDigit: { fontSize: 38, fontWeight: '800', letterSpacing: -1, lineHeight: 44 },
  timerUnit: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  timerColon: { fontSize: 32, fontWeight: '300', marginBottom: 14 },

  mainBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14,
    marginBottom: 20,
  },
  mainBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  timeRow: {
    flexDirection: 'row', width: '100%', borderTopWidth: 1, paddingTop: 16,
  },
  timeBlock: { flex: 1, alignItems: 'center', gap: 4 },
  timeLabel: { fontSize: 12, fontWeight: '500' },
  timeValue: { fontSize: 20, fontWeight: '800' },
  bearbeitenBtn: { fontSize: 12, fontWeight: '600' },
  timeDivider: { width: 1, marginVertical: 4 },

  presetsRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  presetPill: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
  },
  presetPillText: { fontSize: 14, fontWeight: '700' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  modalCard: {
    width: '100%', borderRadius: 20, borderWidth: 1,
    padding: 24, gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSub: { fontSize: 13 },
  modalInput: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 18, fontWeight: '700', textAlign: 'center',
  },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { fontSize: 15, fontWeight: '700' },
});

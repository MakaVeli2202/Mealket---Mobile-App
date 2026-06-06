import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';

export default function SettingsScreen({ navigation }) {
  const {
    theme, tr, isDark, toggleDark, language, setLanguage,
    calorieGoal, setCalorieGoal,
  } = useSettings();
  const s = tr.settings;

  const [goalInput, setGoalInput] = useState(String(calorieGoal));
  const [keyDraft, setKeyDraft] = useState(geminiKey);
  const [keyVisible, setKeyVisible] = useState(false);

  const handleGoalSave = () => { setCalorieGoal(goalInput); };
  const handleKeySave = () => {
    if (keyDraft.trim()) setGeminiKey(keyDraft.trim());
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Back + header row */}
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
              <Ionicons name="chevron-back" size={26} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.pageTitle, { color: theme.text }]}>{s.title}</Text>
            <View style={{ width: 42 }} />
          </View>

          {/* Brand header */}
          <View style={styles.brandHeader}>
            <View style={[styles.brandIcon, { backgroundColor: theme.accentLight }]}>
              <Ionicons name="restaurant-outline" size={22} color={theme.accent} />
            </View>
            <View>
              <Text style={[styles.brandName, { color: theme.text }]}>Mealket</Text>
              <Text style={[styles.brandSub, { color: theme.textMuted }]}>{s.version}</Text>
            </View>
          </View>

          {/* Appearance */}
          <Text style={[styles.section, { color: theme.textMuted }]}>{s.appearance}</Text>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Row
              icon="moon-outline"
              label={s.dark}
              theme={theme}
              right={
                <Switch
                  value={isDark}
                  onValueChange={toggleDark}
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor={theme.white || '#FFF'}
                />
              }
            />
          </View>

          {/* Language */}
          <Text style={[styles.section, { color: theme.textMuted }]}>{s.language}</Text>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <LangOption
              label="English"
              flag="🇬🇧"
              selected={language === 'en'}
              onPress={() => setLanguage('en')}
              theme={theme}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <LangOption
              label="Deutsch"
              flag="🇦🇹"
              selected={language === 'de'}
              onPress={() => setLanguage('de')}
              theme={theme}
            />
          </View>

          {/* Nutrition */}
          <Text style={[styles.section, { color: theme.textMuted }]}>{s.nutrition}</Text>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Calorie goal */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabel}>
                <Ionicons name="flame-outline" size={20} color={theme.textMuted} />
                <Text style={[styles.fieldLabelText, { color: theme.text }]}>{s.calorieGoal}</Text>
              </View>
              <View style={styles.fieldInputRow}>
                <TextInput
                  style={[styles.shortInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
                  value={goalInput}
                  onChangeText={setGoalInput}
                  onBlur={handleGoalSave}
                  onSubmitEditing={handleGoalSave}
                  keyboardType="number-pad"
                  placeholder={s.calorieGoalPlaceholder}
                  placeholderTextColor={theme.textMuted}
                  selectTextOnFocus
                />
                <Text style={[styles.unit, { color: theme.textMuted }]}>kcal</Text>
              </View>
            </View>

          </View>

          {/* Gemini API Key */}
          <Text style={[styles.section, { color: theme.textMuted }]}>Gemini API</Text>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.geminiBlock}>
              <View style={styles.geminiLabelRow}>
                <Ionicons name="key-outline" size={18} color={theme.textMuted} />
                <Text style={[styles.rowLabel, { color: theme.text, flex: 1 }]}>{s.geminiKey}</Text>
              </View>
              <View style={[styles.keyInputRow, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
                <TextInput
                  style={[styles.keyInput, { color: theme.text }]}
                  value={keyDraft}
                  onChangeText={setKeyDraft}
                  onBlur={handleKeySave}
                  placeholder={s.geminiKeyPlaceholder}
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!keyVisible}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setKeyVisible((v) => !v)} hitSlop={8}>
                  <Ionicons name={keyVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.hint, { color: theme.textMuted }]}>{s.geminiKeyHint}</Text>
            </View>
          </View>

          {/* History */}
          <Text style={[styles.section, { color: theme.textMuted }]}>{s.history}</Text>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={theme.textMuted} />
              <Text style={[styles.infoText, { color: theme.textMuted }]}>{s.autoDeleteInfo}</Text>
            </View>
          </View>

          <Text style={[styles.version, { color: theme.textMuted }]}>{s.version}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Row({ icon, label, theme, right }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={theme.textMuted} />
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      {right}
    </View>
  );
}

function LangOption({ label, flag, selected, onPress, theme }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.flag}>{flag}</Text>
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      {selected && <Ionicons name="checkmark-circle" size={22} color={theme.accent} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  topRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 20, marginTop: 4,
  },
  backBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { flex: 1, fontSize: 20, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  section: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 8, marginTop: 20, marginLeft: 4,
  },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },

  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  flag: { fontSize: 22 },
  divider: { height: 1, marginHorizontal: 14 },

  fieldRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, gap: 12,
  },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  fieldLabelText: { fontSize: 14, fontWeight: '500' },
  fieldInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shortInput: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 16, fontWeight: '700', width: 80, textAlign: 'center',
  },
  unit: { fontSize: 13, fontWeight: '600' },

  geminiBlock: { padding: 14, gap: 8 },
  geminiLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  keyInputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 10, overflow: 'hidden',
  },
  keyInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  eyeBtn: { paddingHorizontal: 12 },
  hint: { fontSize: 12, lineHeight: 18 },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 10 },
  infoText: { flex: 1, fontSize: 14, lineHeight: 20 },
  version: { textAlign: 'center', fontSize: 12, marginTop: 32 },

  brandHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginBottom: 8, marginTop: 8,
  },
  brandIcon: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  brandName: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  brandSub: { fontSize: 12, marginTop: 1 },
});

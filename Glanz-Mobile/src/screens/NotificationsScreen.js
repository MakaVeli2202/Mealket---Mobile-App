import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Switch, ScrollView, TextInput,
  TouchableOpacity, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useNotifications } from '../context/NotificationContext';
import GlassBg from '../components/GlassBg';
import GlassCard from '../components/GlassCard';
import SpringPressable from '../components/SpringPressable';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WATER_INTERVALS = [30, 60, 90, 120];

export default function NotificationsScreen({ navigation }) {
  const { theme } = useSettings();
  const { preferences, updateReminder, scheduleAllReminders } = useNotifications();
  const tabBarHeight = Platform.OS === 'ios' ? 96 : 80;

  const [local, setLocal] = useState({ ...preferences });

  const toggle = (key) => {
    setLocal((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const set = (key, value) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    updateReminder(null, local);
    await scheduleAllReminders();
    Alert.alert('Scheduled', 'Your notification reminders have been updated.');
    navigation.goBack();
  };

  const dayIndex = DAYS_FULL.indexOf(local.weightReminderDay);
  const selectedDay = dayIndex >= 0 ? dayIndex : 0;

  return (
    <GlassBg theme={theme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: tabBarHeight + 100 }]} keyboardShouldPersistTaps="handled">
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
              <Ionicons name="chevron-back" size={26} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.pageTitle, { color: theme.text }]}>Notifications</Text>
            <View style={{ width: 42 }} />
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Reminders</Text>

          <GlassCard theme={theme} intensity={40} radius={22} style={styles.card}>
            <ReminderRow
              icon="water-outline"
              iconColor="#00B8FF"
              label="Water Reminder"
              enabled={local.waterReminder}
              onToggle={() => toggle('waterReminder')}
              theme={theme}
            />
            {local.waterReminder && (
              <View style={styles.configRow}>
                <Text style={[styles.configLabel, { color: theme.textSub }]}>Every</Text>
                <View style={styles.optionRow}>
                  {WATER_INTERVALS.map((min) => (
                    <TouchableOpacity
                      key={min}
                      style={[
                        styles.optionBtn,
                        { borderColor: theme.border },
                        local.waterReminderInterval === min && { backgroundColor: theme.accent, borderColor: theme.accent },
                      ]}
                      onPress={() => set('waterReminderInterval', min)}
                    >
                      <Text style={[
                        styles.optionText,
                        { color: theme.textSub },
                        local.waterReminderInterval === min && { color: '#FFF', fontWeight: '700' },
                      ]}>
                        {min}m
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </GlassCard>

          <GlassCard theme={theme} intensity={40} radius={22} style={styles.card}>
            <ReminderRow
              icon="fast-food-outline"
              iconColor={theme.accent}
              label="Food Reminder"
              enabled={local.foodReminder}
              onToggle={() => toggle('foodReminder')}
              theme={theme}
            />
            {local.foodReminder && (
              <View style={styles.configRow}>
                <Text style={[styles.configLabel, { color: theme.textSub }]}>Time</Text>
                <TextInput
                  style={[styles.timeInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
                  value={local.foodReminderTime}
                  onChangeText={(v) => set('foodReminderTime', v)}
                  placeholder="HH:MM"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
            )}
          </GlassCard>

          <GlassCard theme={theme} intensity={40} radius={22} style={styles.card}>
            <ReminderRow
              icon="scale-outline"
              iconColor="#8B5CF6"
              label="Weight Reminder"
              enabled={local.weightReminder}
              onToggle={() => toggle('weightReminder')}
              theme={theme}
            />
            {local.weightReminder && (
              <View style={styles.configRow}>
                <Text style={[styles.configLabel, { color: theme.textSub }]}>Day</Text>
                <View style={styles.optionRow}>
                  {DAYS.map((day, i) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayBtn,
                        { borderColor: theme.border },
                        selectedDay === i && { backgroundColor: theme.accentSecondary, borderColor: theme.accentSecondary },
                      ]}
                      onPress={() => set('weightReminderDay', DAYS_FULL[i])}
                    >
                      <Text style={[
                        styles.optionText,
                        { color: theme.textSub },
                        selectedDay === i && { color: '#FFF', fontWeight: '700' },
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </GlassCard>

          <GlassCard theme={theme} intensity={40} radius={22} style={styles.card}>
            <ReminderRow
              icon="time-outline"
              iconColor="#EC4899"
              label="Fasting Reminder"
              enabled={local.fastingReminder}
              onToggle={() => toggle('fastingReminder')}
              theme={theme}
            />
            {local.fastingReminder && (
              <View style={styles.configRow}>
                <Text style={[styles.configLabel, { color: theme.textSub }]}>Time</Text>
                <TextInput
                  style={[styles.timeInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
                  value={local.fastingReminderTime}
                  onChangeText={(v) => set('fastingReminderTime', v)}
                  placeholder="HH:MM"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
            )}
          </GlassCard>

          <SpringPressable
            onPress={handleSave}
            style={[styles.saveBtn, { backgroundColor: theme.accent }]}
            scaleDown={0.96}
          >
            <Text style={styles.saveText}>Save & Schedule</Text>
          </SpringPressable>
        </ScrollView>
      </SafeAreaView>
    </GlassBg>
  );
}

function ReminderRow({ icon, iconColor, label, enabled, onToggle, theme }) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: iconColor + '22' }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: theme.border, true: theme.accent + '88' }}
        thumbColor={enabled ? theme.accent : '#555'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  topRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 20, marginTop: 4,
  },
  backBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { flex: 1, fontSize: 20, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 8, marginLeft: 4,
  },
  card: { marginBottom: 12, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  configRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingBottom: 14,
    gap: 10,
  },
  configLabel: { fontSize: 13, fontWeight: '500', width: 44 },
  optionRow: { flexDirection: 'row', gap: 8, flex: 1, flexWrap: 'wrap' },
  optionBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1,
  },
  optionText: { fontSize: 13, fontWeight: '600' },
  dayBtn: {
    width: 40, height: 36, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  timeInput: {
    flex: 1, borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    fontSize: 16, fontWeight: '700', textAlign: 'center',
  },
  saveBtn: {
    marginTop: 8, paddingVertical: 16, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  saveText: { color: '#FFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
});

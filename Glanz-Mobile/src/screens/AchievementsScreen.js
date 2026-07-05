import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../components/SafeGradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSettings } from '../context/SettingsContext';
import { useCalories } from '../context/CalorieContext';
import { useWeight } from '../context/WeightContext';
import GlassBg from '../components/GlassBg';
import GlassCard from '../components/GlassCard';

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

function BadgeCard({ badge, theme }) {
  const locked = !badge.unlocked;
  return (
    <Animated.View entering={FadeInDown.duration(280).delay(badge.index * 40).springify()}>
      <GlassCard theme={theme} intensity={locked ? 30 : 55} radius={20} style={[styles.badge, { opacity: locked ? 0.5 : 1 }]}>
        {!locked && (
          <LinearGradient
            colors={[badge.color + '28', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
          />
        )}
        <View style={[styles.badgeIcon, { backgroundColor: badge.color + (locked ? '18' : '28'), borderColor: badge.color + (locked ? '30' : '60'), borderWidth: 1.5 }]}>
          <Ionicons name={badge.icon} size={26} color={locked ? theme.textMuted : badge.color} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.badgeName, { color: locked ? theme.textMuted : theme.text }]}>{badge.name}</Text>
          <Text style={[styles.badgeDesc, { color: theme.textMuted }]}>{badge.desc}</Text>
        </View>
        {!locked && (
          <View style={[styles.unlockTag, { backgroundColor: badge.color + '22', borderColor: badge.color + '50' }]}>
            <Ionicons name="checkmark-circle" size={14} color={badge.color} />
            <Text style={[styles.unlockText, { color: badge.color }]}>Earned</Text>
          </View>
        )}
        {locked && (
          <Ionicons name="lock-closed-outline" size={16} color={theme.textMuted} />
        )}
      </GlassCard>
    </Animated.View>
  );
}

export default function AchievementsScreen({ navigation }) {
  const { theme, tr } = useSettings();
  const { entriesByDate, savedFoods, savedPlates } = useCalories();
  const { weightHistory } = useWeight();
  const tabBarHeight = Platform.OS === 'ios' ? 96 : 80;

  const streak = useMemo(() => calcStreak(entriesByDate), [entriesByDate]);
  const totalLoggedDays = useMemo(() => Object.keys(entriesByDate).filter(k => entriesByDate[k]?.length > 0).length, [entriesByDate]);
  const weightEntries = weightHistory.length;

  const badges = useMemo(() => [
    // Streak badges
    { name: 'First Step',      desc: 'Log your first meal',           icon: 'restaurant-outline',   color: '#00E5A8', unlocked: totalLoggedDays >= 1 },
    { name: '3 Day Streak',    desc: 'Log meals 3 days in a row',     icon: 'flame-outline',         color: '#FF9F0A', unlocked: streak >= 3 },
    { name: 'Week Warrior',    desc: '7-day logging streak',          icon: 'trophy-outline',        color: '#F59E0B', unlocked: streak >= 7 },
    { name: 'Fortnight',       desc: '14-day logging streak',         icon: 'medal-outline',         color: '#8B5CF6', unlocked: streak >= 14 },
    { name: '21 Day Habit',    desc: 'Build the habit: 21 days',      icon: 'star-outline',          color: '#EC4899', unlocked: streak >= 21 },
    { name: 'Monthly Master',  desc: '30-day unbroken streak',        icon: 'ribbon-outline',        color: '#EF4444', unlocked: streak >= 30 },
    { name: 'Iron Will',       desc: '60 days straight — unstoppable',icon: 'diamond-outline',       color: '#00B8FF', unlocked: streak >= 60 },
    { name: 'Legend',          desc: '90 days — you are the habit',   icon: 'planet-outline',        color: '#A78BFA', unlocked: streak >= 90 },
    // Tracking badges
    { name: 'Scale Check',     desc: 'Record your weight',            icon: 'scale-outline',         color: '#22C55E', unlocked: weightEntries >= 1 },
    { name: 'Weight Watcher',  desc: 'Track weight 5 times',          icon: 'trending-down-outline', color: '#30D158', unlocked: weightEntries >= 5 },
    { name: 'Food Saver',      desc: 'Save your first custom food',   icon: 'heart-outline',         color: '#FF375F', unlocked: savedFoods.length >= 1 },
    { name: 'Plate Creator',   desc: 'Build your first custom meal',  icon: 'layers-outline',        color: '#FF9F0A', unlocked: savedPlates.length >= 1 },
    { name: 'Consistency',     desc: 'Log on 10 different days',      icon: 'calendar-outline',      color: '#0A84FF', unlocked: totalLoggedDays >= 10 },
    { name: 'Dedicated',       desc: 'Log on 30 different days',      icon: 'sparkles-outline',      color: '#BF5AF2', unlocked: totalLoggedDays >= 30 },
  ].map((b, i) => ({ ...b, index: i })), [streak, totalLoggedDays, weightEntries, savedFoods, savedPlates]);

  const earned = badges.filter(b => b.unlocked).length;

  return (
    <GlassBg theme={theme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: tabBarHeight + 24 }]} showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8} style={[styles.backBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>Achievements</Text>
            <View style={styles.backBtn} />
          </View>

          <Animated.View entering={FadeInDown.duration(300).springify()}>
            <GlassCard theme={theme} intensity={60} radius={24} style={styles.summaryCard}>
              <LinearGradient
                colors={['#F59E0B28', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
              />
              <View style={styles.summaryTop}>
                <View style={[styles.trophyBg, { backgroundColor: '#F59E0B22' }]}>
                  <Ionicons name="trophy" size={32} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.summaryBig, { color: theme.text }]}>{earned} / {badges.length}</Text>
                  <Text style={[styles.summarySub, { color: theme.textMuted }]}>Achievements earned</Text>
                </View>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                <View style={[styles.progressFill, { width: `${(earned / badges.length) * 100}%`, backgroundColor: '#F59E0B' }]} />
              </View>
              <Text style={[styles.streakLine, { color: theme.textMuted }]}>
                Current streak: <Text style={{ color: theme.accent, fontWeight: '800' }}>{streak} day{streak !== 1 ? 's' : ''}</Text>
              </Text>
            </GlassCard>
          </Animated.View>

          <Text style={[styles.section, { color: theme.textMuted }]}>STREAKS</Text>
          {badges.slice(0, 8).map(b => <BadgeCard key={b.name} badge={b} theme={theme} />)}

          <Text style={[styles.section, { color: theme.textMuted }]}>TRACKING</Text>
          {badges.slice(8).map(b => <BadgeCard key={b.name} badge={b} theme={theme} />)}

        </ScrollView>
      </SafeAreaView>
    </GlassBg>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  backBtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  summaryCard: { padding: 20, marginBottom: 24, overflow: 'hidden', gap: 12 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  trophyBg: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  summaryBig: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  summarySub: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  streakLine: { fontSize: 13, fontWeight: '600' },

  section: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginTop: 20, marginBottom: 10, marginLeft: 2 },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, marginBottom: 8, overflow: 'hidden' },
  badgeIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  badgeName: { fontSize: 15, fontWeight: '700' },
  badgeDesc: { fontSize: 12, fontWeight: '500' },
  unlockTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  unlockText: { fontSize: 11, fontWeight: '700' },
});

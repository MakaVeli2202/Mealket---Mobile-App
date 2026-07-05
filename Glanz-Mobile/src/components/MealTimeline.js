import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from './GlassCard';

function EntryItem({ entry, index, theme, onPress }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const delay = index * 80;
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withTiming(0, { duration: 300 });
    }, delay);
    return () => clearTimeout(timer);
  }, [index]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const totalMacro = useMemo(() => {
    return (entry.proteinG || entry.protein || 0) + (entry.carbsG || entry.carbs || 0) + (entry.fatG || entry.fat || 0) || 1;
  }, [entry]);

  return (
    <Animated.View style={[styles.entry, animStyle]}>
      <TouchableOpacity onPress={() => onPress?.(entry)} style={styles.entryTouch} activeOpacity={0.7}>
        <View style={styles.entryLeft}>
          <Text style={[styles.entryName, { color: theme.text }]} numberOfLines={1}>
            {entry.foodName || entry.name || 'Food'}
          </Text>
          <View style={styles.macroRow}>
            <View style={[styles.macroMini, { backgroundColor: theme.carbs + '30' }]}>
              <View style={[styles.macroMiniFill, { width: `${Math.min(((entry.carbsG || entry.carbs || 0) / totalMacro) * 100, 100)}%`, backgroundColor: theme.carbs }]} />
            </View>
            <View style={[styles.macroMini, { backgroundColor: theme.protein + '30' }]}>
              <View style={[styles.macroMiniFill, { width: `${Math.min(((entry.proteinG || entry.protein || 0) / totalMacro) * 100, 100)}%`, backgroundColor: theme.protein }]} />
            </View>
            <View style={[styles.macroMini, { backgroundColor: theme.fat + '30' }]}>
              <View style={[styles.macroMiniFill, { width: `${Math.min(((entry.fatG || entry.fat || 0) / totalMacro) * 100, 100)}%`, backgroundColor: theme.fat }]} />
            </View>
          </View>
        </View>
        <Text style={[styles.entryKcal, { color: theme.textSub }]}>{Math.round(entry.calories || entry.kcal || 0)} kcal</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MealTimeline({
  theme,
  icon,
  label,
  entries = [],
  kcalSubtotal,
  onMealPress,
  onAddPress,
}) {
  const [expanded, setExpanded] = useState(true);
  const expandValue = useSharedValue(1);

  const toggleExpand = () => {
    setExpanded(prev => !prev);
  };

  useEffect(() => {
    expandValue.value = withTiming(expanded ? 1 : 0, {
      duration: 300,
      easing: Easing.inOut(Easing.sin),
    });
  }, [expanded]);

  const expandAnimStyle = useAnimatedStyle(() => ({
    maxHeight: expandValue.value * 500,
    opacity: expandValue.value,
    overflow: 'hidden',
  }));

  return (
    <GlassCard theme={theme} radius={20} style={styles.card}>
      <TouchableOpacity onPress={toggleExpand} style={styles.header} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconWrap, { backgroundColor: theme.accentLight }]}>
            <Ionicons name={icon} size={20} color={theme.accent} />
          </View>
          <View>
            <Text style={[styles.headerLabel, { color: theme.text }]}>{label}</Text>
            {kcalSubtotal !== undefined && (
              <Text style={[styles.headerKcal, { color: theme.textMuted }]}>{Math.round(kcalSubtotal)} kcal</Text>
            )}
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
          <Ionicons name="chevron-down" size={20} color={theme.textSub} />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={expandAnimStyle}>
        {entries.map((entry, index) => (
          <EntryItem key={entry.id || index} entry={entry} index={index} theme={theme} onPress={onMealPress} />
        ))}
      </Animated.View>

      {onAddPress && (
        <TouchableOpacity onPress={onAddPress} style={[styles.addBtn, { borderTopColor: theme.border }]}>
          <Ionicons name="add-circle-outline" size={18} color={theme.accent} />
          <Text style={[styles.addText, { color: theme.accent }]}>Add</Text>
        </TouchableOpacity>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerKcal: {
    fontSize: 13,
    marginTop: 1,
  },
  entry: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  entryTouch: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryLeft: {
    flex: 1,
    marginRight: 8,
  },
  entryName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 4,
  },
  macroMini: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  macroMiniFill: {
    height: '100%',
    borderRadius: 2,
  },
  entryKcal: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderTopWidth: 1,
    marginTop: 4,
  },
  addText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

import React, { useMemo, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../components/SafeGradient';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useSettings } from '../context/SettingsContext';
import { useCalories } from '../context/CalorieContext';
import { useWeight } from '../context/WeightContext';
import { useWellness } from '../context/WellnessContext';
import GlassBg from '../components/GlassBg';

const SCREEN_W = Dimensions.get('window').width;
const CHART_H = 160;
const CHART_PAD = 20;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function lastNDays(n) {
  const arr = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    arr.push(d.toISOString().slice(0, 10));
  }
  return arr;
}

function bezierControlPoints(p0, p1, p2, smooth) {
  const d01 = Math.sqrt((p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2);
  const d12 = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
  const fa = smooth * d01 / (d01 + d12) || 0;
  const fb = smooth * d12 / (d01 + d12) || 0;
  return {
    cp1: { x: p1.x - fa * (p2.x - p0.x), y: p1.y - fa * (p2.y - p0.y) },
    cp2: { x: p1.x + fb * (p2.x - p0.x), y: p1.y + fb * (p2.y - p0.y) },
  };
}

function smoothPath(points, smooth = 0.35) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const { cp1, cp2 } = bezierControlPoints(p0, p1, p2, smooth);
    const { cp1: _, cp2: cp2b } = bezierControlPoints(p1, p2, p3, smooth);
    d += ` C ${cp1.x} ${cp1.y}, ${cp2b.x} ${cp2b.y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function LineChart({ data, color, gradientColors, label }) {
  const [tooltip, setTooltip] = useState(null);
  const chartW = Math.max(SCREEN_W - 64, data.length * 35);

  const values = data.map(d => d.value);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = Math.max(maxVal - minVal, maxVal * 0.1);
  const plotH = CHART_H - CHART_PAD * 2;

  const points = data.map((d, i) => {
    const x = CHART_PAD + (i / Math.max(data.length - 1, 1)) * (chartW - CHART_PAD * 2);
    const y = CHART_PAD + plotH - ((d.value - minVal) / range) * plotH;
    return { x, y, ...d };
  });

  const linePath = smoothPath(points);
  const areaPath = points.length > 1
    ? `${linePath} L ${points[points.length - 1].x} ${CHART_H - CHART_PAD} L ${points[0].x} ${CHART_H - CHART_PAD} Z`
    : '';

  const handleTouch = (evt) => {
    const x = evt.nativeEvent.locationX;
    let closest = points[0];
    let minDist = Infinity;
    points.forEach(p => {
      const dist = Math.abs(p.x - x);
      if (dist < minDist) { minDist = dist; closest = p; }
    });
    setTooltip(closest);
  };

  return (
    <Pressable onPress={handleTouch} style={{ position: 'relative' }}>
      <Svg width={chartW} height={CHART_H}>
        <Defs>
          <SvgGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={gradientColors?.[0] || color} stopOpacity="0.35" />
            <Stop offset="1" stopColor={gradientColors?.[1] || color} stopOpacity="0.02" />
          </SvgGradient>
        </Defs>
        {areaPath ? <Path d={areaPath} fill={`url(#grad-${label})`} /> : null}
        {linePath ? <Path d={linePath} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
        ))}
      </Svg>
      {tooltip && (
        <View style={[styles.tooltip, { left: Math.min(Math.max(tooltip.x - 40, 0), chartW - 80), top: tooltip.y - 36 }]}>
          <Text style={[styles.tooltipText, { color: '#FFF' }]}>{tooltip.value}</Text>
          <Text style={[styles.tooltipLabel, { color: 'rgba(255,255,255,0.7)' }]}>{tooltip.label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function AnalyticsScreen({ route, navigation }) {
  const { theme, tr } = useSettings();
  const hideBack = route.params?.hideBack;
  const { entriesByDate } = useCalories();
  const { weightHistory } = useWeight();
  const { waterLogs } = useWellness();
  const [period, setPeriod] = useState(7);

  const dates = useMemo(() => lastNDays(period), [period]);

  const chartData = useMemo(() => {
    return dates.map((date) => {
      const dayEntries = entriesByDate[date] || [];
      const cals = dayEntries.reduce((s, e) => s + (e.calories || 0), 0);
      const protein = dayEntries.reduce((s, e) => s + (e.proteinG || 0), 0);
      const carbs = dayEntries.reduce((s, e) => s + (e.carbsG || 0), 0);
      const fat = dayEntries.reduce((s, e) => s + (e.fatG || 0), 0);
      const water = waterLogs.filter((w) => w.date === date).reduce((s, w) => s + (w.amountMl || 0), 0);
      const weight = weightHistory.find((w) => w.date === date);
      const dayLabel = DAYS[new Date(date).getDay() === 0 ? 6 : new Date(date).getDay() - 1];
      const dateLabel = `${new Date(date).getDate()}.${MONTHS[new Date(date).getMonth()]}`;
      return { date, dayLabel, dateLabel, cals, protein, carbs, fat, water, weight: weight?.kg || null };
    });
  }, [dates, entriesByDate, waterLogs, weightHistory]);

  const maxCals = useMemo(() => Math.max(...chartData.map((d) => d.cals), 1), [chartData]);
  const maxWater = useMemo(() => Math.max(...chartData.map((d) => d.water), 1), [chartData]);
  const maxProtein = useMemo(() => Math.max(...chartData.map((d) => d.protein), 1), [chartData]);

  const avgCals = useMemo(() => Math.round(chartData.reduce((s, d) => s + d.cals, 0) / period), [chartData, period]);
  const avgProtein = useMemo(() => Math.round(chartData.reduce((s, d) => s + d.protein, 0) / period), [chartData, period]);
  const avgWater = useMemo(() => Math.round(chartData.reduce((s, d) => s + d.water, 0) / period), [chartData, period]);

  const weights = useMemo(() => weightHistory.slice(0, period).reverse(), [weightHistory, period]);
  const weightChange = useMemo(() => {
    if (weights.length < 2) return null;
    return (weights[weights.length - 1].kg - weights[0].kg).toFixed(1);
  }, [weights]);

  return (
    <GlassBg theme={theme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          {!hideBack && (
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
          )}
          <Text style={[styles.title, { color: theme.text }]}>Analytics</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}>
          <View style={styles.periodRow}>
            <TouchableOpacity style={[styles.periodBtn, { backgroundColor: period === 7 ? theme.accent : theme.surfaceAlt, borderColor: theme.border }]} onPress={() => setPeriod(7)}>
              <Text style={[styles.periodText, { color: period === 7 ? '#FFF' : theme.textMuted }]}>7 days</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.periodBtn, { backgroundColor: period === 14 ? theme.accent : theme.surfaceAlt, borderColor: theme.border }]} onPress={() => setPeriod(14)}>
              <Text style={[styles.periodText, { color: period === 14 ? '#FFF' : theme.textMuted }]}>14 days</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.periodBtn, { backgroundColor: period === 30 ? theme.accent : theme.surfaceAlt, borderColor: theme.border }]} onPress={() => setPeriod(30)}>
              <Text style={[styles.periodText, { color: period === 30 ? '#FFF' : theme.textMuted }]}>30 days</Text>
            </TouchableOpacity>
          </View>

          <LinearGradient colors={[theme.accent + '18', theme.accent + '04']} style={[styles.chartCard, { borderColor: theme.accent + '25' }]}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>Calories</Text>
            <Text style={[styles.chartAvg, { color: theme.textMuted }]}>Avg {avgCals} kcal/day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart data={chartData.map(d => ({ value: d.cals, label: d.dateLabel }))} color={theme.accent} gradientColors={['#00E5A8', '#00B8FF']} label="calories" />
            </ScrollView>
          </LinearGradient>

          <LinearGradient colors={[theme.protein + '18', theme.protein + '04']} style={[styles.chartCard, { borderColor: theme.protein + '25' }]}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>Protein</Text>
            <Text style={[styles.chartAvg, { color: theme.textMuted }]}>Avg {avgProtein}g/day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart data={chartData.map(d => ({ value: d.protein, label: d.dateLabel }))} color={theme.protein} gradientColors={['#3B82F6', '#3B82F6']} label="protein" />
            </ScrollView>
          </LinearGradient>

          <LinearGradient colors={['#3B82F6' + '18', '#3B82F6' + '04']} style={[styles.chartCard, { borderColor: '#3B82F6' + '25' }]}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>Water</Text>
            <Text style={[styles.chartAvg, { color: theme.textMuted }]}>Avg {avgWater}ml/day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart data={chartData.map(d => ({ value: d.water, label: d.dateLabel }))} color="#3B82F6" gradientColors={['#60A5FA', '#3B82F6']} label="water" />
            </ScrollView>
          </LinearGradient>

          {weights.length > 1 && (
            <LinearGradient colors={['#F59E0B' + '18', '#F59E0B' + '04']} style={[styles.chartCard, { borderColor: '#F59E0B' + '25' }]}>
              <Text style={[styles.chartTitle, { color: theme.text }]}>Weight</Text>
              <Text style={[styles.chartAvg, { color: weightChange > 0 ? '#EF4444' : weightChange < 0 ? '#22C55E' : theme.textMuted }]}>
                {weightChange > 0 ? '+' : ''}{weightChange} kg
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart data={weights.map(w => ({ value: w.kg, label: w.date.slice(5) }))} color="#F59E0B" gradientColors={['#FBBF24', '#F59E0B']} label="weight" />
              </ScrollView>
            </LinearGradient>
          )}

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="flame-outline" size={20} color={theme.accent} />
              <Text style={[styles.summaryNum, { color: theme.text }]}>{avgCals}</Text>
              <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Avg kcal</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="barbell-outline" size={20} color={theme.protein} />
              <Text style={[styles.summaryNum, { color: theme.text }]}>{avgProtein}g</Text>
              <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Avg protein</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="water-outline" size={20} color="#3B82F6" />
              <Text style={[styles.summaryNum, { color: theme.text }]}>{avgWater}ml</Text>
              <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Avg water</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GlassBg>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  title: { flex: 1, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  periodRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  periodBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14, borderWidth: 1 },
  periodText: { fontSize: 12, fontWeight: '700' },
  chartCard: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 4 },
  chartTitle: { fontSize: 15, fontWeight: '800' },
  chartAvg: { fontSize: 12, fontWeight: '600' },
  tooltip: {
    position: 'absolute', backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    alignItems: 'center', zIndex: 10,
  },
  tooltipText: { fontSize: 13, fontWeight: '800' },
  tooltipLabel: { fontSize: 9, fontWeight: '500' },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 14, alignItems: 'center', gap: 4 },
  summaryNum: { fontSize: 18, fontWeight: '900' },
  summaryLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
});

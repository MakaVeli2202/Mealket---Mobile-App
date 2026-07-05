import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../components/SafeGradient';
import { useSettings } from '../context/SettingsContext';
import GlassBg from '../components/GlassBg';

export default function FoodDetailScreen({ route, navigation }) {
  const { theme, tr } = useSettings();
  const food = route.params?.food;
  if (!food) return null;

  const sugarVal = food.sugarPer100g ?? food.sugarsPer100g ?? 0;

  const c = tr.calories;
  const nutriRows = [
    { label: c.caloriesLabel, val: food.kcalPer100g || food.caloriesPer100g || 0, unit: 'kcal', color: theme.accent },
    { label: c.protein, val: food.proteinPer100g || 0, unit: 'g', color: theme.protein },
    { label: c.carbohydrates, val: food.carbsPer100g || 0, unit: 'g', color: theme.carbs },
    { label: c.ofWhichSugar, val: sugarVal, unit: 'g', color: theme.carbs, sub: true },
    { label: c.fat, val: food.fatPer100g || 0, unit: 'g', color: theme.fat },
    { label: 'of which Saturated', val: food.saturatedFatPer100g || 0, unit: 'g', color: theme.fat, sub: true },
    { label: 'of which Unsaturated', val: food.unsaturatedFatPer100g || 0, unit: 'g', color: theme.fat, sub: true },
    { label: 'Fiber', val: food.fiberPer100g || 0, unit: 'g', color: '#8B5CF6' },
    { label: 'Cholesterol', val: food.cholesterolPer100g || 0, unit: 'mg', color: '#F59E0B' },
    { label: 'Sodium', val: food.sodiumPer100g || 0, unit: 'mg', color: '#F59E0B' },
    { label: 'Potassium', val: food.potassiumPer100g || 0, unit: 'mg', color: '#F59E0B' },
    { label: 'Vitamin A', val: food.vitaminAPer100g || 0, unit: 'µg', color: '#22C55E' },
    { label: 'Vitamin C', val: food.vitaminCPer100g || 0, unit: 'mg', color: '#22C55E' },
    { label: 'Vitamin D', val: food.vitaminDPer100g || 0, unit: 'µg', color: '#22C55E' },
    { label: 'Iron', val: food.ironPer100g || 0, unit: 'mg', color: '#A78BFA' },
    { label: 'Magnesium', val: food.magnesiumPer100g || 0, unit: 'mg', color: '#A78BFA' },
    { label: 'Zinc', val: food.zincPer100g || 0, unit: 'mg', color: '#A78BFA' },
  ];

  return (
    <GlassBg theme={theme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{food.name}</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
          <LinearGradient colors={[theme.accent + '22', theme.accent + '08']} style={[styles.kcalCard, { borderColor: theme.accent + '30' }]}>
            <Text style={[styles.kcalNum, { color: theme.accent }]}>{food.kcalPer100g || food.caloriesPer100g || 0}</Text>
            <Text style={[styles.kcalUnit, { color: theme.textMuted }]}>kcal per 100g</Text>
            {food.brand && <Text style={[styles.brand, { color: theme.textMuted }]}>{food.brand}</Text>}
            {food.servingSize && <Text style={[styles.serving, { color: theme.textMuted }]}>Serving: {food.servingSize}</Text>}
          </LinearGradient>

          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>NUTRITION FACTS</Text>
            <Text style={[styles.per100g, { color: theme.textMuted }]}>Per 100g</Text>
            {nutriRows.map((r, i) => (
              <View key={i} style={[styles.nutriRow, r.sub && styles.subRow]}>
                <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
                  {r.sub && <Text style={{ color: theme.textMuted, fontSize: 12 }}>—</Text>}
                  <Text style={[styles.nutriLabel, { color: r.sub ? theme.textMuted : theme.text }]}>{r.label}</Text>
                </View>
                <Text style={[styles.nutriVal, { color: r.color }]}>{r.val} {r.unit}</Text>
              </View>
            ))}
          </View>

          {food.barcode && (
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.metaRow}>
                <Ionicons name="barcode-outline" size={14} color={theme.textMuted} />
                <Text style={[styles.metaText, { color: theme.textMuted }]}>{food.barcode}</Text>
              </View>
            </View>
          )}

          {food.ingredients && (
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>INGREDIENTS</Text>
              <Text style={[styles.ingText, { color: theme.text }]}>{food.ingredients}</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </GlassBg>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 10 },
  title: { flex: 1, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  kcalCard: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: 'center', gap: 4 },
  kcalNum: { fontSize: 52, fontWeight: '900', letterSpacing: -3 },
  kcalUnit: { fontSize: 13, fontWeight: '600' },
  brand: { fontSize: 12, fontWeight: '500', marginTop: 4 },
  serving: { fontSize: 12, fontWeight: '500' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  per100g: { fontSize: 11, fontWeight: '600', marginTop: -4 },
  nutriRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#333' },
  subRow: { paddingLeft: 12 },
  nutriLabel: { fontSize: 13, fontWeight: '500' },
  nutriVal: { fontSize: 13, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, fontWeight: '500' },
  ingText: { fontSize: 13, lineHeight: 19 },
});

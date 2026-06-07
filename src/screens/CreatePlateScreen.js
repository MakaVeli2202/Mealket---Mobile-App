import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSettings } from '../context/SettingsContext';
import { useCalories } from '../context/CalorieContext';
import { searchLocalFoods } from '../constants/foodDatabase';
import GlassBg from '../components/GlassBg';

function numVal(s) { return parseFloat(String(s).replace(',', '.')) || 0; }

export default function CreatePlateScreen({ navigation, route }) {
  const { theme, tr } = useSettings();
  const { savedFoods, savedPlates, savePlate, removePlate, entries } = useCalories();
  const tabBarHeight = Platform.OS === 'ios' ? 96 : 80;

  const editingPlate = route.params?.plate ?? null;

  const [plateName, setPlateName] = useState(editingPlate?.name ?? '');
  const [ingredients, setIngredients] = useState(editingPlate?.ingredients ?? []);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Recent foods from history
  const recentFoods = useMemo(() => {
    const seen = new Set();
    return entries
      .filter((e) => { if (seen.has(e.name)) return false; seen.add(e.name); return true; })
      .slice(0, 10)
      .map((e) => ({ name: e.name, kcalPer100g: e.kcalPer100g, fatPer100g: e.fatPer100g, carbsPer100g: e.carbsPer100g, sugarPer100g: e.sugarPer100g, proteinPer100g: e.proteinPer100g }));
  }, [entries]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const local = searchLocalFoods(q);
    const mine = savedFoods.filter((f) => f.name.toLowerCase().includes(q));
    const recent = recentFoods.filter((f) => f.name.toLowerCase().includes(q));
    const seen = new Set();
    return [...recent, ...mine, ...local].filter((f) => {
      if (seen.has(f.name.toLowerCase())) return false;
      seen.add(f.name.toLowerCase()); return true;
    }).slice(0, 15);
  }, [search, savedFoods, recentFoods]);

  const addIngredient = useCallback((food) => {
    setIngredients((prev) => {
      const existing = prev.find((i) => i.name.toLowerCase() === food.name.toLowerCase());
      if (existing) return prev;
      return [...prev, { ...food, amountG: '100' }];
    });
    setSearch('');
    setShowSearch(false);
  }, []);

  const updateAmount = useCallback((name, value) => {
    setIngredients((prev) => prev.map((i) => i.name === name ? { ...i, amountG: value } : i));
  }, []);

  const removeIngredient = useCallback((name) => {
    setIngredients((prev) => prev.filter((i) => i.name !== name));
  }, []);

  // Auto-calculate totals from ingredients
  const totals = useMemo(() => {
    return ingredients.reduce((acc, ing) => {
      const g = numVal(ing.amountG);
      return {
        kcal:    acc.kcal    + (g / 100) * (ing.kcalPer100g    || 0),
        fat:     acc.fat     + (g / 100) * (ing.fatPer100g     || 0),
        carbs:   acc.carbs   + (g / 100) * (ing.carbsPer100g   || 0),
        sugar:   acc.sugar   + (g / 100) * (ing.sugarPer100g   || 0),
        protein: acc.protein + (g / 100) * (ing.proteinPer100g || 0),
        totalG:  acc.totalG  + g,
      };
    }, { kcal: 0, fat: 0, carbs: 0, sugar: 0, protein: 0, totalG: 0 });
  }, [ingredients]);

  // Per 100g values (for storing as a food entry)
  const per100g = useMemo(() => {
    if (totals.totalG === 0) return { kcal: 0, fat: 0, carbs: 0, sugar: 0, protein: 0 };
    const f = 100 / totals.totalG;
    return {
      kcal:    Math.round(totals.kcal    * f),
      fat:     Math.round(totals.fat     * f * 10) / 10,
      carbs:   Math.round(totals.carbs   * f * 10) / 10,
      sugar:   Math.round(totals.sugar   * f * 10) / 10,
      protein: Math.round(totals.protein * f * 10) / 10,
    };
  }, [totals]);

  const canSave = plateName.trim().length > 0 && ingredients.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const plate = {
      id: editingPlate?.id ?? Date.now().toString(),
      name: plateName.trim(),
      ingredients,
      totalKcal:    Math.round(totals.kcal),
      totalFat:     Math.round(totals.fat     * 10) / 10,
      totalCarbs:   Math.round(totals.carbs   * 10) / 10,
      totalProtein: Math.round(totals.protein * 10) / 10,
      totalG:       Math.round(totals.totalG),
      // per-100g fields so it can be added as a normal food entry
      kcalPer100g:    per100g.kcal,
      fatPer100g:     per100g.fat,
      carbsPer100g:   per100g.carbs,
      sugarPer100g:   per100g.sugar,
      proteinPer100g: per100g.protein,
    };
    savePlate(plate);
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert('Delete plate', `Delete "${plateName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { removePlate(editingPlate.id); navigation.goBack(); } },
    ]);
  };

  const card = { backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border };

  return (
    <GlassBg theme={theme}>
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {editingPlate ? 'Edit Plate' : 'New Plate'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {editingPlate && (
              <TouchableOpacity onPress={handleDelete} hitSlop={8} style={[styles.headerAction, { backgroundColor: theme.danger + '20' }]}>
                <Ionicons name="trash-outline" size={16} color={theme.danger} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleSave} hitSlop={8} style={[styles.headerAction, { backgroundColor: canSave ? theme.accent : theme.surfaceAlt }]}>
              <Ionicons name="checkmark" size={18} color={canSave ? '#FFF' : theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Plate name */}
          <View style={[card, styles.nameCard]}>
            <Ionicons name="restaurant-outline" size={18} color={theme.accent} />
            <TextInput
              style={[styles.nameInput, { color: theme.text }]}
              value={plateName}
              onChangeText={setPlateName}
              placeholder="Plate name (e.g. Chicken & Rice)"
              placeholderTextColor={theme.textMuted}
              autoCorrect={false}
            />
          </View>

          {/* Macro summary */}
          {ingredients.length > 0 && (
            <View style={[card, styles.summaryCard]}>
              <Text style={[styles.summaryTitle, { color: theme.textMuted }]}>TOTAL ({Math.round(totals.totalG)}g)</Text>
              <View style={styles.macroRow}>
                <View style={styles.macroItem}>
                  <Text style={[styles.macroVal, { color: theme.accent }]}>{Math.round(totals.kcal)}</Text>
                  <Text style={[styles.macroLbl, { color: theme.textMuted }]}>kcal</Text>
                </View>
                <View style={[styles.macroDivider, { backgroundColor: theme.border }]} />
                <View style={styles.macroItem}>
                  <Text style={[styles.macroVal, { color: theme.carbs }]}>{Math.round(totals.carbs)}g</Text>
                  <Text style={[styles.macroLbl, { color: theme.textMuted }]}>carbs</Text>
                </View>
                <View style={[styles.macroDivider, { backgroundColor: theme.border }]} />
                <View style={styles.macroItem}>
                  <Text style={[styles.macroVal, { color: theme.protein }]}>{Math.round(totals.protein)}g</Text>
                  <Text style={[styles.macroLbl, { color: theme.textMuted }]}>protein</Text>
                </View>
                <View style={[styles.macroDivider, { backgroundColor: theme.border }]} />
                <View style={styles.macroItem}>
                  <Text style={[styles.macroVal, { color: theme.fat }]}>{Math.round(totals.fat)}g</Text>
                  <Text style={[styles.macroLbl, { color: theme.textMuted }]}>fat</Text>
                </View>
              </View>
            </View>
          )}

          {/* Ingredients list */}
          <View>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>INGREDIENTS</Text>
              <TouchableOpacity onPress={() => setShowSearch((v) => !v)} style={[styles.addIngBtn, { backgroundColor: theme.accentLight }]} activeOpacity={0.7}>
                <Ionicons name={showSearch ? 'close' : 'add'} size={16} color={theme.accent} />
                <Text style={[styles.addIngText, { color: theme.accent }]}>{showSearch ? 'Close' : 'Add'}</Text>
              </TouchableOpacity>
            </View>

            {/* Ingredient search */}
            {showSearch && (
              <View style={{ marginBottom: 10 }}>
                <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Ionicons name="search-outline" size={16} color={theme.textMuted} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search ingredient…"
                    placeholderTextColor={theme.textMuted}
                    autoFocus autoCorrect={false}
                  />
                </View>
                {search.trim().length > 0 && searchResults.map((food) => (
                  <TouchableOpacity
                    key={food.name}
                    style={[styles.searchResult, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => addIngredient(food)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.searchResultName, { color: theme.text }]} numberOfLines={1}>{food.name}</Text>
                    <Text style={[styles.searchResultKcal, { color: theme.accent }]}>{food.kcalPer100g} kcal/100g</Text>
                    <Ionicons name="add-circle-outline" size={20} color={theme.accent} />
                  </TouchableOpacity>
                ))}
                {search.trim().length === 0 && (
                  <>
                    {recentFoods.length > 0 && <Text style={[styles.sectionLabel, { color: theme.textMuted, marginBottom: 6 }]}>RECENT</Text>}
                    {recentFoods.slice(0, 5).map((food) => (
                      <TouchableOpacity
                        key={food.name}
                        style={[styles.searchResult, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => addIngredient(food)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.searchResultName, { color: theme.text }]} numberOfLines={1}>{food.name}</Text>
                        <Text style={[styles.searchResultKcal, { color: theme.accent }]}>{food.kcalPer100g} kcal/100g</Text>
                        <Ionicons name="add-circle-outline" size={20} color={theme.accent} />
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </View>
            )}

            {/* Ingredient rows */}
            {ingredients.length === 0 ? (
              <View style={[card, styles.emptyIngredients]}>
                <Ionicons name="leaf-outline" size={28} color={theme.textMuted} style={{ opacity: 0.4 }} />
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>Tap "Add" to add ingredients</Text>
              </View>
            ) : (
              ingredients.map((ing) => {
                const g = numVal(ing.amountG);
                const ingKcal = Math.round((g / 100) * (ing.kcalPer100g || 0));
                return (
                  <View key={ing.name} style={[card, styles.ingRow]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.ingName, { color: theme.text }]} numberOfLines={1}>{ing.name}</Text>
                      <Text style={[styles.ingKcal, { color: theme.accent }]}>{ingKcal} kcal</Text>
                    </View>
                    <TextInput
                      style={[styles.ingAmount, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
                      value={ing.amountG}
                      onChangeText={(v) => updateAmount(ing.name, v)}
                      keyboardType="decimal-pad"
                      selectTextOnFocus
                    />
                    <Text style={[styles.ingUnit, { color: theme.textMuted }]}>g</Text>
                    <TouchableOpacity onPress={() => removeIngredient(ing.name)} hitSlop={8}>
                      <Ionicons name="close-circle" size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>

        </ScrollView>

        {/* Save button */}
        <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: 'transparent', paddingBottom: tabBarHeight + 8 }]}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: canSave ? theme.accent : theme.surfaceAlt }]}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Ionicons name="restaurant-outline" size={18} color={canSave ? '#FFF' : theme.textMuted} />
            <Text style={[styles.saveBtnText, { color: canSave ? '#FFF' : theme.textMuted }]}>
              {editingPlate ? 'Update Plate' : 'Save Plate'}
            </Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
    </GlassBg>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerAction: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  nameCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  nameInput: { flex: 1, fontSize: 16, fontWeight: '600', padding: 0 },

  summaryCard: { padding: 16 },
  summaryTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  macroRow: { flexDirection: 'row', alignItems: 'center' },
  macroItem: { flex: 1, alignItems: 'center', gap: 2 },
  macroVal: { fontSize: 18, fontWeight: '800' },
  macroLbl: { fontSize: 10, fontWeight: '600' },
  macroDivider: { width: 1, height: 32 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  addIngBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addIngText: { fontSize: 13, fontWeight: '700' },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  searchResult: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 11, marginBottom: 6 },
  searchResultName: { flex: 1, fontSize: 14, fontWeight: '600' },
  searchResultKcal: { fontSize: 12, fontWeight: '600' },

  emptyIngredients: { padding: 24, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 13, fontWeight: '500' },

  ingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 8 },
  ingName: { fontSize: 14, fontWeight: '600' },
  ingKcal: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  ingAmount: { width: 60, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  ingUnit: { fontSize: 13, fontWeight: '600' },

  footer: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  saveBtnText: { fontSize: 16, fontWeight: '800' },
});

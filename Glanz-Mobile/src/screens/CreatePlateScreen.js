import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Platform, KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../components/SafeGradient';
import { useSettings } from '../context/SettingsContext';
import { useCalories } from '../context/CalorieContext';
import { searchFood } from '../utils/openFoodFacts';
import { numVal } from '../utils/numbers';
import GlassBg from '../components/GlassBg';
import GlassCard from '../components/GlassCard';

const MEAL_TYPE_OPTIONS = [
  { key: 'plate', label: 'Plate', icon: 'restaurant-outline' },
  { key: 'shake', label: 'Shake / Drink', icon: 'water-outline' },
  { key: 'snack', label: 'Snack', icon: 'nutrition-outline' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-circle-outline' },
];

export default function CreatePlateScreen({ navigation, route }) {
  const { theme, tr } = useSettings();
  const { savedFoods, savedPlates, savePlate, removePlate, entries, saveFood } = useCalories();
  const tabBarHeight = Platform.OS === 'ios' ? 96 : 80;

  const editingPlate = route.params?.plate ?? null;

  const [plateName, setPlateName] = useState(editingPlate?.name ?? '');
  const [mealType, setMealType] = useState(editingPlate?.mealType ?? 'plate');
  const [ingredients, setIngredients] = useState(editingPlate?.ingredients ?? []);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [offResults, setOffResults] = useState([]);
  const [offSearching, setOffSearching] = useState(false);
  const offDebounce = useRef(null);

  const recentFoods = useMemo(() => {
    const seen = new Set();
    return entries
      .filter((e) => { if (seen.has(e.name)) return false; seen.add(e.name); return true; })
      .slice(0, 8)
      .map((e) => ({ name: e.name, kcalPer100g: e.kcalPer100g, fatPer100g: e.fatPer100g, carbsPer100g: e.carbsPer100g, sugarPer100g: e.sugarPer100g, proteinPer100g: e.proteinPer100g }));
  }, [entries]);

  const savedFoodsList = useMemo(() => {
    const seen = new Set(recentFoods.map(f => f.name.toLowerCase()));
    return savedFoods.filter(f => !seen.has(f.name.toLowerCase())).slice(0, 20);
  }, [savedFoods, recentFoods]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const mine = savedFoods.filter((f) => f.name.toLowerCase().includes(q));
    const recent = recentFoods.filter((f) => f.name.toLowerCase().includes(q));
    const seen = new Set();
    return [...recent, ...mine, ...offResults].filter((f) => {
      if (seen.has(f.name.toLowerCase())) return false;
      seen.add(f.name.toLowerCase()); return true;
    }).slice(0, 20);
  }, [search, savedFoods, recentFoods, offResults]);

  useEffect(() => {
    if (offDebounce.current) clearTimeout(offDebounce.current);
    const q = search.trim().toLowerCase();
    if (q.length < 2) { setOffResults([]); setOffSearching(false); return; }
    let mounted = true;
    offDebounce.current = setTimeout(async () => {
      setOffSearching(true);
      try {
        const remote = await searchFood(q);
        if (mounted) setOffResults(remote);
      } catch (_) { if (mounted) setOffResults([]); }
      if (mounted) setOffSearching(false);
    }, 500);
    return () => { clearTimeout(offDebounce.current); mounted = false; };
  }, [search]);

  const addIngredient = useCallback((food) => {
    if (!food || !food.name) return;
    saveFood({ name: food.name, kcalPer100g: food.kcalPer100g || 0, proteinPer100g: food.proteinPer100g || 0, carbsPer100g: food.carbsPer100g || 0, fatPer100g: food.fatPer100g || 0, sugarPer100g: food.sugarPer100g || 0 });
    setIngredients((prev) => {
      if (prev.find((i) => i.name && i.name.toLowerCase() === food.name.toLowerCase())) return prev;
      return [...prev, { ...food, amountG: '100' }];
    });
    setSearch('');
  }, [saveFood]);

  const updateAmount = useCallback((name, value) => {
    setIngredients((prev) => prev.map((i) => i.name === name ? { ...i, amountG: value } : i));
  }, []);

  const removeIngredient = useCallback((name) => {
    setIngredients((prev) => prev.filter((i) => i.name !== name));
  }, []);

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
      mealType,
      ingredients,
      totalKcal:    Math.round(totals.kcal),
      totalFat:     Math.round(totals.fat     * 10) / 10,
      totalCarbs:   Math.round(totals.carbs   * 10) / 10,
      totalProtein: Math.round(totals.protein * 10) / 10,
      totalG:       Math.round(totals.totalG),
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
    Alert.alert('Delete', `Delete "${plateName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { removePlate(editingPlate.id); navigation.goBack(); } },
    ]);
  };

  const handleBarcodeScan = () => {
    navigation.navigate('BarcodeScanner', { returnTo: 'CreatePlate' });
  };

  const selectedType = MEAL_TYPE_OPTIONS.find(o => o.key === mealType) || MEAL_TYPE_OPTIONS[0];

  const card = { backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border };

  const FoodRow = ({ food, showKcal = true }) => (
    <TouchableOpacity
      key={food.name}
      style={[card, styles.searchResult]}
      onPress={() => addIngredient(food)}
      activeOpacity={0.7}
    >
      <View style={[styles.foodIcon, { backgroundColor: theme.accent + '18' }]}>
        <Ionicons name="add" size={18} color={theme.accent} />
      </View>
      <Text style={[styles.searchResultName, { color: theme.text }]} numberOfLines={1}>{food.name}</Text>
      {showKcal && <Text style={[styles.searchResultKcal, { color: theme.accent }]}>{food.kcalPer100g ?? 0} kcal</Text>}
    </TouchableOpacity>
  );

  return (
    <GlassBg theme={theme}>
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {editingPlate ? 'Edit Meal' : 'New Custom Meal'}
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

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Name */}
          <GlassCard theme={theme} intensity={55} radius={16} style={styles.nameCard}>
            <Ionicons name={selectedType.icon} size={18} color={theme.accent} />
            <TextInput
              style={[styles.nameInput, { color: theme.text }]}
              value={plateName}
              onChangeText={setPlateName}
              placeholder={`Name (e.g. ${mealType === 'shake' ? 'Protein Shake' : mealType === 'snack' ? 'Afternoon Snack' : 'Chicken & Rice'})`}
              placeholderTextColor={theme.textMuted}
              autoCorrect={false}
            />
          </GlassCard>

          {/* Meal Type Picker */}
          <View style={styles.typePicker}>
            {MEAL_TYPE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setMealType(opt.key)}
                style={[
                  styles.typeChip,
                  { borderColor: mealType === opt.key ? theme.accent : theme.border, backgroundColor: mealType === opt.key ? theme.accent + '18' : theme.surfaceAlt },
                ]}
                activeOpacity={0.75}
              >
                <Ionicons name={opt.icon} size={13} color={mealType === opt.key ? theme.accent : theme.textMuted} />
                <Text style={[styles.typeChipText, { color: mealType === opt.key ? theme.accent : theme.textMuted }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Macro Summary */}
          {ingredients.length > 0 && (
            <GlassCard theme={theme} intensity={55} radius={16} style={styles.summaryCard}>
              <LinearGradient
                colors={[theme.accent + '18', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ height: 2, marginBottom: 14 }}
              />
              <Text style={[styles.summaryTitle, { color: theme.textMuted }]}>TOTAL ({Math.round(totals.totalG)}g)</Text>
              <View style={styles.macroRow}>
                {[
                  { val: Math.round(totals.kcal), lbl: 'kcal', color: theme.accent },
                  { val: `${Math.round(totals.protein)}g`, lbl: 'protein', color: theme.protein },
                  { val: `${Math.round(totals.carbs)}g`, lbl: 'carbs', color: theme.carbs },
                  { val: `${Math.round(totals.fat)}g`, lbl: 'fat', color: theme.fat },
                ].map((m, i, arr) => (
                  <React.Fragment key={m.lbl}>
                    <View style={styles.macroItem}>
                      <Text style={[styles.macroVal, { color: m.color }]}>{m.val}</Text>
                      <Text style={[styles.macroLbl, { color: theme.textMuted }]}>{m.lbl}</Text>
                    </View>
                    {i < arr.length - 1 && <View style={[styles.macroDivider, { backgroundColor: theme.border }]} />}
                  </React.Fragment>
                ))}
              </View>
            </GlassCard>
          )}

          {/* Ingredients Section */}
          <View>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>INGREDIENTS</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity onPress={handleBarcodeScan} style={[styles.addIngBtn, { backgroundColor: theme.accentLight }]} activeOpacity={0.7}>
                  <Ionicons name="barcode-outline" size={14} color={theme.accent} />
                  <Text style={[styles.addIngText, { color: theme.accent }]}>Scan</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowSearch((v) => !v)} style={[styles.addIngBtn, { backgroundColor: showSearch ? theme.accent : theme.accentLight }]} activeOpacity={0.7}>
                  <Ionicons name={showSearch ? 'close' : 'add'} size={14} color={showSearch ? '#FFF' : theme.accent} />
                  <Text style={[styles.addIngText, { color: showSearch ? '#FFF' : theme.accent }]}>{showSearch ? 'Close' : 'Add'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {showSearch && (
              <View style={{ marginBottom: 10, gap: 6 }}>
                <GlassCard theme={theme} intensity={50} radius={12} style={styles.searchBar}>
                  <Ionicons name="search-outline" size={16} color={theme.textMuted} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search ingredient…"
                    placeholderTextColor={theme.textMuted}
                    autoFocus autoCorrect={false}
                  />
                  {offSearching && <ActivityIndicator size="small" color={theme.accent} />}
                </GlassCard>

                {search.trim().length > 0 ? (
                  searchResults.length > 0
                    ? searchResults.map((food) => <FoodRow key={food.name} food={food} />)
                    : !offSearching && <Text style={[styles.emptyHint, { color: theme.textMuted }]}>No results found</Text>
                ) : (
                  <>
                    {recentFoods.length > 0 && (
                      <>
                        <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: 4 }]}>RECENT</Text>
                        {recentFoods.map((food) => <FoodRow key={food.name} food={food} />)}
                      </>
                    )}
                    {savedFoodsList.length > 0 && (
                      <>
                        <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: 8 }]}>SAVED FOODS</Text>
                        {savedFoodsList.map((food) => <FoodRow key={food.name} food={food} />)}
                      </>
                    )}
                    {recentFoods.length === 0 && savedFoodsList.length === 0 && (
                      <Text style={[styles.emptyHint, { color: theme.textMuted }]}>Type to search or scan a barcode</Text>
                    )}
                  </>
                )}
              </View>
            )}

            {ingredients.length === 0 ? (
              <TouchableOpacity onPress={() => setShowSearch(true)} activeOpacity={0.75}>
                <GlassCard theme={theme} intensity={40} radius={16} style={styles.emptyIngredients}>
                  <Ionicons name="add-circle-outline" size={32} color={theme.accent} style={{ opacity: 0.6 }} />
                  <Text style={[styles.emptyText, { color: theme.textMuted }]}>Tap "Add" to find ingredients</Text>
                  <Text style={[styles.emptyHint, { color: theme.textMuted }]}>Works for plates, shakes, snacks and more</Text>
                </GlassCard>
              </TouchableOpacity>
            ) : (
              ingredients.map((ing) => {
                const g = numVal(ing.amountG);
                const ingKcal = Math.round((g / 100) * (ing.kcalPer100g || 0));
                const ingProtein = Math.round((g / 100) * (ing.proteinPer100g || 0) * 10) / 10;
                return (
                  <View key={ing.name} style={[card, styles.ingRow]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.ingName, { color: theme.text }]} numberOfLines={1}>{ing.name}</Text>
                      <Text style={[styles.ingKcal, { color: theme.textMuted }]}>
                        {ingKcal} kcal  {ingProtein}g protein
                      </Text>
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

        <View style={[styles.footer, { borderTopColor: theme.border, paddingBottom: tabBarHeight + 8 }]}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: canSave ? theme.accent : theme.surfaceAlt }]}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            {canSave && (
              <LinearGradient
                colors={[theme.accent, theme.accentDark || theme.accent]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 14 }]}
              />
            )}
            <Ionicons name={selectedType.icon} size={18} color={canSave ? '#FFF' : theme.textMuted} />
            <Text style={[styles.saveBtnText, { color: canSave ? '#FFF' : theme.textMuted }]}>
              {editingPlate ? 'Update' : 'Save'} {selectedType.label}
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

  typePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  typeChipText: { fontSize: 12, fontWeight: '700' },

  summaryCard: { padding: 16 },
  summaryTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  macroRow: { flexDirection: 'row', alignItems: 'center' },
  macroItem: { flex: 1, alignItems: 'center', gap: 2 },
  macroVal: { fontSize: 17, fontWeight: '800' },
  macroLbl: { fontSize: 10, fontWeight: '600' },
  macroDivider: { width: 1, height: 30 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  addIngBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addIngText: { fontSize: 13, fontWeight: '700' },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  searchResult: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, marginBottom: 4 },
  foodIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  searchResultName: { flex: 1, fontSize: 14, fontWeight: '600' },
  searchResultKcal: { fontSize: 12, fontWeight: '600' },

  emptyIngredients: { padding: 28, alignItems: 'center', gap: 6 },
  emptyText: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  emptyHint: { fontSize: 12, fontWeight: '500', textAlign: 'center' },

  ingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 6 },
  ingName: { fontSize: 14, fontWeight: '600' },
  ingKcal: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  ingAmount: { width: 60, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  ingUnit: { fontSize: 13, fontWeight: '600' },

  footer: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14, overflow: 'hidden' },
  saveBtnText: { fontSize: 16, fontWeight: '800' },
});

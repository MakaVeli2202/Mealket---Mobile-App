import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useRecipes } from '../context/RecipeContext';
import { useCalories } from '../context/CalorieContext';
import { searchFood } from '../utils/openFoodFacts';
import { numVal } from '../utils/numbers';
import GlassBg from '../components/GlassBg';

const CATEGORIES = ['High Protein', 'Low Carb', 'Vegan', 'Vegetarian', 'Keto', 'Breakfast', 'Dessert'];

export default function CreateRecipeScreen({ navigation, route }) {
  const { theme, tr } = useSettings();
  const { saveRecipe } = useRecipes();
  const { savedFoods, entries, saveFood } = useCalories();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [servings, setServings] = useState('1');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [offResults, setOffResults] = useState([]);
  const [offSearching, setOffSearching] = useState(false);
  const offDebounce = useRef(null);

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
    setShowSearch(false);
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
        protein: acc.protein + (g / 100) * (ing.proteinPer100g || 0),
      };
    }, { kcal: 0, fat: 0, carbs: 0, protein: 0 });
  }, [ingredients]);

  const handleSave = () => {
    if (!name.trim()) return;
    const numServings = parseInt(servings) || 1;
    const recipe = {
      name: name.trim(),
      category: category || null,
      servings: numServings,
      description: description.trim() || null,
      totalKcal:    Math.round(totals.kcal / numServings),
      totalProtein: Math.round(totals.protein / numServings * 10) / 10,
      totalCarbs:   Math.round(totals.carbs / numServings * 10) / 10,
      totalFat:     Math.round(totals.fat / numServings * 10) / 10,
      ingredients,
    };
    saveRecipe(recipe);
    navigation.goBack();
  };

  const handleBarcodeScan = () => {
    navigation.navigate('BarcodeScanner', { returnTo: 'CreateRecipe' });
  };

  const canSave = name.trim().length > 0 && ingredients.length > 0;

  return (
    <GlassBg theme={theme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>New Recipe</Text>
            <TouchableOpacity disabled={!canSave} onPress={handleSave} hitSlop={8}>
              <Ionicons name="checkmark-circle" size={26} color={canSave ? theme.accent : theme.border} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TextInput style={[styles.nameInput, { color: theme.text }]} value={name} onChangeText={setName} placeholder="Recipe name" placeholderTextColor={theme.textMuted} />
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.label, { color: theme.textMuted }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity key={c} style={[styles.catChip, { backgroundColor: category === c ? theme.accent : theme.surfaceAlt, borderColor: category === c ? theme.accent : theme.border }]} onPress={() => setCategory(category === c ? '' : c)}>
                    <Text style={[styles.catText, { color: category === c ? '#FFF' : theme.textMuted }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.label, { color: theme.textMuted }]}>Servings</Text>
              <TextInput style={[styles.input, { color: theme.text }]} value={servings} onChangeText={setServings} keyboardType="number-pad" />
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.label, { color: theme.textMuted }]}>Description</Text>
              <TextInput style={[styles.textArea, { color: theme.text }]} value={description} onChangeText={setDescription} multiline numberOfLines={2} placeholderTextColor={theme.textMuted} />
            </View>

            {ingredients.length > 0 && (
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.label, { color: theme.textMuted }]}>Nutrition (total)</Text>
                <View style={styles.nutriRow}>
                  <View style={styles.nutriItem}>
                    <Text style={[styles.nutriVal, { color: theme.accent }]}>{Math.round(totals.kcal)}</Text>
                    <Text style={[styles.nutriLbl, { color: theme.textMuted }]}>kcal</Text>
                  </View>
                  <View style={[styles.nutriDiv, { backgroundColor: theme.border }]} />
                  <View style={styles.nutriItem}>
                    <Text style={[styles.nutriVal, { color: theme.protein }]}>{Math.round(totals.protein)}g</Text>
                    <Text style={[styles.nutriLbl, { color: theme.textMuted }]}>protein</Text>
                  </View>
                  <View style={[styles.nutriDiv, { backgroundColor: theme.border }]} />
                  <View style={styles.nutriItem}>
                    <Text style={[styles.nutriVal, { color: theme.carbs }]}>{Math.round(totals.carbs)}g</Text>
                    <Text style={[styles.nutriLbl, { color: theme.textMuted }]}>carbs</Text>
                  </View>
                  <View style={[styles.nutriDiv, { backgroundColor: theme.border }]} />
                  <View style={styles.nutriItem}>
                    <Text style={[styles.nutriVal, { color: theme.fat }]}>{Math.round(totals.fat)}g</Text>
                    <Text style={[styles.nutriLbl, { color: theme.textMuted }]}>fat</Text>
                  </View>
                </View>
              </View>
            )}

            <View>
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>INGREDIENTS</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity onPress={handleBarcodeScan} style={[styles.addIngBtn, { backgroundColor: theme.accent + '20' }]} activeOpacity={0.7}>
                    <Ionicons name="barcode-outline" size={15} color={theme.accent} />
                    <Text style={[styles.addIngText, { color: theme.accent }]}>Scan</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowSearch((v) => !v)} style={[styles.addIngBtn, { backgroundColor: theme.accent + '20' }]} activeOpacity={0.7}>
                    <Ionicons name={showSearch ? 'close' : 'search'} size={15} color={theme.accent} />
                    <Text style={[styles.addIngText, { color: theme.accent }]}>{showSearch ? 'Close' : 'Search'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

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
                  {search.trim().length > 0 && offSearching && (
                    <ActivityIndicator color={theme.accent} style={{ marginTop: 4, marginBottom: 8 }} />
                  )}
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

              {ingredients.length === 0 ? (
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, padding: 24, alignItems: 'center', gap: 8 }]}>
                  <Ionicons name="leaf-outline" size={28} color={theme.textMuted} style={{ opacity: 0.4 }} />
                  <Text style={[styles.emptyText, { color: theme.textMuted }]}>Tap "Search" or "Scan" to add ingredients</Text>
                </View>
              ) : (
                ingredients.map((ing) => {
                  const g = numVal(ing.amountG);
                  const ingKcal = Math.round((g / 100) * (ing.kcalPer100g || 0));
                  return (
                    <View key={ing.name} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 8 }]}>
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
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GlassBg>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  title: { flex: 1, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  nameInput: { fontSize: 18, fontWeight: '700', padding: 0 },
  input: { fontSize: 15, fontWeight: '600', padding: 0 },
  textArea: { fontSize: 14, minHeight: 50, padding: 0 },
  row: { flexDirection: 'row', gap: 12 },
  nutriRow: { flexDirection: 'row', alignItems: 'center' },
  nutriItem: { flex: 1, alignItems: 'center', gap: 2 },
  nutriVal: { fontSize: 18, fontWeight: '800' },
  nutriLbl: { fontSize: 10, fontWeight: '600' },
  nutriDiv: { width: 1, height: 32 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  catText: { fontSize: 12, fontWeight: '600' },
  saveBtn: { paddingVertical: 15, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  addIngBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addIngText: { fontSize: 13, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  searchResult: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 11, marginBottom: 6 },
  searchResultName: { flex: 1, fontSize: 14, fontWeight: '600' },
  searchResultKcal: { fontSize: 12, fontWeight: '600' },
  emptyText: { fontSize: 13, fontWeight: '500' },
  ingName: { fontSize: 14, fontWeight: '600' },
  ingKcal: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  ingAmount: { width: 60, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  ingUnit: { fontSize: 13, fontWeight: '600' },
});

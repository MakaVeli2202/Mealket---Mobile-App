import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from '../context/SettingsContext';
import { useCalories } from '../context/CalorieContext';
import { useRecipes } from '../context/RecipeContext';
import ServingModal from '../components/ServingModal';
import { searchFood as searchOpenFoodFacts } from '../utils/openFoodFacts';
import { searchFood as searchUSDA } from '../utils/usdaFoodData';

const TEAL = '#00E5A8';

function numVal(s) {
  return parseFloat(String(s).replace(',', '.')) || 0;
}

// ── Flat food row (Yazio style) ───────────────────────────────────────────────
function FoodRow({ item, onAdd, isLast }) {
  return (
    <View style={[row.wrap, isLast && { borderBottomWidth: 0 }]}>
      <View style={row.info}>
        <Text style={row.name} numberOfLines={1}>{item.name}</Text>
        <Text style={row.sub} numberOfLines={1}>
          {[item.brand, item.serving].filter(Boolean).join(', ')}
        </Text>
      </View>
      {item.kcalPer100g != null && (
        <Text style={row.kcal}>{item.kcalPer100g} kcal</Text>
      )}
      <TouchableOpacity style={row.addBtn} onPress={() => onAdd(item)} hitSlop={8} activeOpacity={0.75}>
        <Ionicons name="add" size={20} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

const row = StyleSheet.create({
  wrap:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
  info:   { flex: 1, marginRight: 8 },
  name:   { fontSize: 15, fontWeight: '700', color: '#F0F4FF', marginBottom: 2 },
  sub:    { fontSize: 12, color: '#6A7A94' },
  kcal:   { fontSize: 14, color: '#F0F4FF', fontWeight: '500', marginRight: 12, minWidth: 60, textAlign: 'right' },
  addBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center' },
});

// ── Icon button in the icon grid ──────────────────────────────────────────────
function IconBtn({ icon, label, color, onPress, selected }) {
  return (
    <TouchableOpacity style={ib.wrap} onPress={onPress} activeOpacity={0.75}>
      <View style={[
        ib.square,
        selected
          ? { backgroundColor: color, borderColor: color }
          : { backgroundColor: color + '28', borderColor: 'rgba(255,255,255,0.1)' },
      ]}>
        <Ionicons name={icon} size={26} color={selected ? '#FFF' : color} />
      </View>
      <Text style={[ib.label, selected && { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const ib = StyleSheet.create({
  wrap:   { alignItems: 'center', gap: 6 },
  square: { width: 68, height: 68, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  label:  { fontSize: 11, color: '#6A7A94', fontWeight: '600' },
});

// ── Filter pill ───────────────────────────────────────────────────────────────
function FilterPill({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[fp.pill, active && fp.pillActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[fp.text, active && fp.textActive]}>{label}</Text>
      <Ionicons name="chevron-down" size={12} color={active ? TEAL : '#6A7A94'} />
    </TouchableOpacity>
  );
}

const fp = StyleSheet.create({
  pill:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#0E1221' },
  pillActive: { borderColor: TEAL },
  text:       { fontSize: 13, color: '#6A7A94', fontWeight: '600' },
  textActive: { color: TEAL },
});

// ── NUTRIENT_FIELDS for manual entry ────────────────────────────────────────
const NUTRIENT_FIELDS = [
  { key: 'kcal',    icon: 'flash-outline',    labelKey: 'kcal',    color: TEAL },
  { key: 'fat',     icon: 'water-outline',    labelKey: 'fat',     color: '#FF375F' },
  { key: 'carbs',   icon: 'grid-outline',     labelKey: 'carbs',   color: '#FF9F0A' },
  { key: 'sugar',   icon: 'ellipse-outline',  labelKey: 'sugar',   color: '#BF5AF2' },
  { key: 'protein', icon: 'fitness-outline',  labelKey: 'protein', color: '#2C9CFF' },
];

function prefillToState(p) {
  return {
    name:    p.name    ?? '',
    kcal:    p.kcalPer100g    != null ? String(p.kcalPer100g)    : '',
    fat:     p.fatPer100g     != null ? String(p.fatPer100g)     : '',
    carbs:   p.carbsPer100g   != null ? String(p.carbsPer100g)   : '',
    sugar:   p.sugarPer100g   != null ? String(p.sugarPer100g)   : '',
    protein: p.proteinPer100g != null ? String(p.proteinPer100g) : '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AddFoodScreen({ navigation, route }) {
  const { theme, tr, calorieGoal, carbGoal, proteinGoal, fatGoal } = useSettings();
  const { addEntry, todayByMeal, entries, savedFoods, saveFood, savedPlates, savePlate } = useCalories();
  const { recipes } = useRecipes();

  const meal      = route.params?.meal ?? 'snack';
  const mealLabel = tr.meals[meal] ?? meal;
  const mealCount = todayByMeal?.[meal]?.length ?? 0;
  const todayKcal = todayByMeal ? Object.values(todayByMeal).flat().reduce((s, e) => s + (e.calories || 0), 0) : 0;

  // View modes: 'search' | 'manual'
  const [mode, setMode] = useState('search');

  // Search state
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [sortMode,  setSortMode]  = useState('frequent'); // frequent | recent | az
  const debounceRef = useRef(null);
  const searchInputRef = useRef(null);

  // Serving modal
  const [servingFood, setServingFood] = useState(null);
  const [showServing, setShowServing] = useState(false);

  // Manual entry state
  const [name,    setName]    = useState('');
  const [kcal,    setKcal]    = useState('');
  const [fat,     setFat]     = useState('');
  const [carbs,   setCarbs]   = useState('');
  const [sugar,   setSugar]   = useState('');
  const [protein, setProtein] = useState('');
  const [amountG, setAmountG] = useState('100');
  const [foodType, setFoodType] = useState(route.params?.foodType || 'food');

  const stateMap  = { kcal, fat, carbs, sugar, protein };
  const setterMap = { kcal: setKcal, fat: setFat, carbs: setCarbs, sugar: setSugar, protein: setProtein };

  const kcalNum   = numVal(kcal);
  const amountNum = numVal(amountG);
  const totalKcal = Math.round((amountNum / 100) * kcalNum);
  const canSave   = name.trim().length > 0 && kcalNum > 0 && amountNum > 0;

  // Load amount pref
  useEffect(() => {
    AsyncStorage.getItem('@einkauf_last_amount').then((v) => { if (v) setAmountG(v); }).catch(() => {});
  }, []);

  const saveAmount = useCallback((v) => {
    setAmountG(v);
    AsyncStorage.setItem('@einkauf_last_amount', v).catch(() => {});
  }, []);

  // Prefill from route params (e.g. barcode scanner)
  useEffect(() => {
    if (route.params?.prefill) {
      const s = prefillToState(route.params.prefill);
      setName(s.name); setKcal(s.kcal); setFat(s.fat);
      setCarbs(s.carbs); setSugar(s.sugar); setProtein(s.protein);
      setMode('manual');
      if (route.params.foodType) setFoodType(route.params.foodType);
    }
  }, [route.params?.prefill]);

  // Recent foods (deduped)
  const recentFoods = useMemo(() => {
    const seen = new Set();
    return entries
      .filter((e) => { if (seen.has(e.name)) return false; seen.add(e.name); return true; })
      .slice(0, 20)
      .map((e) => ({
        name: e.name,
        brand: null,
        serving: `${e.amountG}g`,
        kcalPer100g: e.kcalPer100g,
        fatPer100g: e.fatPer100g,
        carbsPer100g: e.carbsPer100g,
        sugarPer100g: e.sugarPer100g,
        proteinPer100g: e.proteinPer100g,
      }));
  }, [entries]);

  // Search effect
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim().toLowerCase();
    if (!q) { setResults([]); setSearching(false); return; }

    const local = savedFoods.filter(
      (f) => f.type !== 'ingredient' && (f.name.toLowerCase().includes(q) || (f.brand && f.brand.toLowerCase().includes(q)))
    );
    const recipeResults = recipes.filter((r) => r.name.toLowerCase().includes(q)).map((r) => ({
      name: r.name, brand: 'Recipe',
      kcalPer100g: r.totalKcal, fatPer100g: r.totalFat,
      carbsPer100g: r.totalCarbs, proteinPer100g: r.totalProtein, sugarPer100g: 0,
      _recipe: r,
    }));

    if (q.length < 2) { setResults([...recipeResults, ...local]); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const [off, usda] = await Promise.all([searchOpenFoodFacts(q), searchUSDA(q)]);
        const remote = [...off, ...usda];
        const localNames = new Set([...recipeResults, ...local].map((f) => f.name.toLowerCase()));
        setResults([...recipeResults, ...local, ...remote.filter((r) => !localNames.has(r.name.toLowerCase()))]);
      } catch (_) {} finally { setSearching(false); }
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [query, savedFoods, recipes]);

  // Default list items (no query)
  const defaultItems = useMemo(() => {
    const items = sortMode === 'recent' ? recentFoods
      : sortMode === 'az' ? [...savedFoods.filter(f => f.type !== 'ingredient')].sort((a, b) => a.name.localeCompare(b.name))
      : [...recentFoods, ...savedFoods.filter(f => f.type !== 'ingredient' && !recentFoods.find(r => r.name === f.name))];
    return items;
  }, [recentFoods, savedFoods, sortMode]);

  const applyPrefill = useCallback((item) => {
    setServingFood(item);
    setShowServing(true);
  }, []);

  const handleLogFromModal = useCallback(({ food, grams, meal: m, kcal: k, protein: p, carbs: c, fat: f, sugar: sg }) => {
    saveFood({ name: food.name, brand: food.brand, kcalPer100g: food.kcalPer100g, fatPer100g: food.fatPer100g, carbsPer100g: food.carbsPer100g, sugarPer100g: food.sugarPer100g, proteinPer100g: food.proteinPer100g, type: food.type || 'food' });
    addEntry({
      name: food.name, meal: m,
      amountG: grams,
      kcalPer100g: food.kcalPer100g || 0, proteinPer100g: food.proteinPer100g || 0,
      carbsPer100g: food.carbsPer100g || 0, fatPer100g: food.fatPer100g || 0,
      sugarPer100g: food.sugarPer100g || 0,
      calories: k, proteinG: p, carbsG: c, fatG: f, sugarG: sg,
    });
    setShowServing(false);
    navigation.goBack();
  }, [addEntry, saveFood, navigation]);

  const handleSave = useCallback(() => {
    if (!canSave) return;
    const food = {
      name: name.trim(), kcalPer100g: kcalNum,
      fatPer100g: numVal(fat), carbsPer100g: numVal(carbs),
      sugarPer100g: numVal(sugar), proteinPer100g: numVal(protein),
      type: foodType,
    };
    saveFood(food);
    if (foodType === 'food') {
      addEntry({ ...food, meal, amountG: amountNum });
    }
    navigation.goBack();
  }, [canSave, name, kcalNum, fat, carbs, sugar, protein, foodType, amountNum, meal, saveFood, addEntry, navigation]);

  const cycleSortMode = useCallback(() => {
    setSortMode((prev) => prev === 'frequent' ? 'recent' : prev === 'recent' ? 'az' : 'frequent');
  }, []);

  const sortLabel = sortMode === 'frequent' ? 'Frequent' : sortMode === 'recent' ? 'Recent' : 'A–Z';

  // ── render manual form ──────────────────────────────────────────────────────
  const renderManual = () => (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}
    >
      {/* Food name */}
      <View style={mf.card}>
        <Text style={mf.label}>FOOD NAME</Text>
        <TextInput
          style={mf.nameInput}
          value={name} onChangeText={setName}
          placeholder="e.g. Greek Yogurt"
          placeholderTextColor="#6A7A94"
          autoCorrect={false}
        />
      </View>

      {/* Nutrients per 100g */}
      <View style={mf.card}>
        <Text style={mf.label}>PER 100 G</Text>
        <View style={mf.nutriGrid}>
          {NUTRIENT_FIELDS.map(({ key, icon, labelKey, color }) => (
            <View key={key} style={mf.nutriField}>
              <Ionicons name={icon} size={13} color={color} />
              <TextInput
                style={mf.nutriInput}
                value={stateMap[labelKey]}
                onChangeText={setterMap[labelKey]}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#6A7A94"
                selectTextOnFocus
              />
              <Text style={mf.nutriLabel}>{tr.meals.nutrientFields[labelKey]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Amount */}
      <View style={mf.card}>
        <Text style={mf.label}>AMOUNT</Text>
        <View style={mf.amountRow}>
          {['50','100','150','200'].map((v) => (
            <TouchableOpacity
              key={v}
              style={[mf.amountChip, amountG === v && mf.amountChipActive]}
              onPress={() => saveAmount(v)}
              activeOpacity={0.7}
            >
              <Text style={[mf.amountChipText, amountG === v && { color: '#000' }]}>{v}g</Text>
            </TouchableOpacity>
          ))}
          <TextInput
            style={mf.amountInput}
            value={amountG} onChangeText={saveAmount}
            keyboardType="decimal-pad"
            placeholder="100"
            placeholderTextColor="#6A7A94"
            selectTextOnFocus
          />
          <Text style={{ color: '#6A7A94', fontSize: 14, fontWeight: '600' }}>g</Text>
        </View>
      </View>

      {/* Live preview */}
      {kcalNum > 0 && amountNum > 0 && (
        <View style={mf.resultCard}>
          <Text style={mf.resultKcal}>{totalKcal}</Text>
          <Text style={mf.resultLabel}>kcal total</Text>
        </View>
      )}
    </ScrollView>
  );

  // ── render search content ──────────────────────────────────────────────────
  const renderSearch = () => {
    if (query.trim()) {
      if (searching && results.length === 0) {
        return <View style={ss.center}><ActivityIndicator color={TEAL} size="large" /></View>;
      }
      if (!searching && results.length === 0) {
        return (
          <View style={ss.center}>
            <Ionicons name="search-outline" size={40} color="#6A7A94" style={{ opacity: 0.5 }} />
            <Text style={ss.emptyText}>No results found</Text>
          </View>
        );
      }
      return (
        <FlatList
          data={results}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item, index }) => (
            <FoodRow item={item} onAdd={applyPrefill} isLast={index === results.length - 1} />
          )}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListFooterComponent={searching ? <ActivityIndicator color={TEAL} style={{ margin: 12 }} /> : null}
        />
      );
    }

    // Default list
    const plateList = savedPlates || [];
    const recipeList = recipes || [];
    const showPlates = plateList.length > 0;
    const showRecipes = recipeList.length > 0;

    return (
      <FlatList
        data={defaultItems}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) => (
          <FoodRow item={item} onAdd={applyPrefill} isLast={index === defaultItems.length - 1 && !showPlates && !showRecipes} />
        )}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={(
          <>
            {/* Filter row */}
            <View style={ss.filterRow}>
              <FilterPill label="Food" active={true} onPress={() => {}} />
              <FilterPill label={sortLabel} active={false} onPress={cycleSortMode} />
            </View>

            {/* Plates quick access */}
            {showPlates && (
              <View style={ss.section}>
                <View style={ss.sectionHeader}>
                  <Text style={ss.sectionTitle}>MY PLATES</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('CreatePlate')} hitSlop={8}>
                    <Text style={ss.sectionLink}>+ New</Text>
                  </TouchableOpacity>
                </View>
                {plateList.map((plate) => (
                  <FoodRow
                    key={plate.id}
                    item={{ name: plate.name, brand: `${plate.ingredients?.length ?? 0} ingredients`, serving: null, kcalPer100g: plate.totalKcal }}
                    onAdd={() => {
                      addEntry({ name: plate.name, meal, kcalPer100g: plate.kcalPer100g, fatPer100g: plate.fatPer100g, carbsPer100g: plate.carbsPer100g, sugarPer100g: plate.sugarPer100g ?? 0, proteinPer100g: plate.proteinPer100g, amountG: plate.totalG || 100 });
                      navigation.goBack();
                    }}
                    isLast={false}
                  />
                ))}
              </View>
            )}

            {/* Recipes quick access */}
            {showRecipes && (
              <View style={ss.section}>
                <View style={ss.sectionHeader}>
                  <Text style={ss.sectionTitle}>MY RECIPES</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('CreateRecipe')} hitSlop={8}>
                    <Text style={ss.sectionLink}>+ New</Text>
                  </TouchableOpacity>
                </View>
                {recipeList.map((r) => (
                  <FoodRow
                    key={r.id}
                    item={{ name: r.name, brand: `${r.servings || 1} servings`, serving: null, kcalPer100g: r.totalKcal || 0 }}
                    onAdd={() => {
                      addEntry({ name: r.name, meal, kcalPer100g: r.totalKcal, fatPer100g: r.totalFat || 0, carbsPer100g: r.totalCarbs || 0, sugarPer100g: 0, proteinPer100g: r.totalProtein || 0, amountG: 100 });
                      navigation.goBack();
                    }}
                    isLast={false}
                  />
                ))}
              </View>
            )}

            {defaultItems.length > 0 && (
              <View style={ss.sectionHeader}>
                <Text style={ss.sectionTitle}>{sortMode === 'recent' ? 'RECENTLY USED' : sortMode === 'az' ? 'ALL FOODS' : 'FREQUENT'}</Text>
              </View>
            )}
          </>
        )}
        ListEmptyComponent={(
          <View style={ss.center}>
            <Ionicons name="nutrition-outline" size={40} color="#6A7A94" style={{ opacity: 0.4 }} />
            <Text style={ss.emptyText}>Search for a food above</Text>
          </View>
        )}
      />
    );
  };

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <View style={s.bg}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          {/* ── Header ── */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8} style={s.headerSide}>
              <Ionicons name="arrow-back" size={22} color="#F0F4FF" />
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <View style={s.countBadge}>
                <Text style={s.countText}>{mealCount}</Text>
              </View>
              <Text style={s.headerTitle}>{mealLabel}</Text>
            </View>

            {mode === 'manual' && canSave ? (
              <TouchableOpacity onPress={handleSave} style={[s.headerSide, s.doneBtn]} hitSlop={4}>
                <Ionicons name="checkmark" size={18} color="#000" />
              </TouchableOpacity>
            ) : (
              <View style={s.headerSide} />
            )}
          </View>

          {/* ── Icon grid ── */}
          <View style={s.iconGrid}>
            <IconBtn
              icon="search-outline"
              label={tr.meals.search}
              color={TEAL}
              onPress={() => setMode('search')}
              selected={mode === 'search'}
            />
            <IconBtn
              icon="barcode-outline"
              label={tr.meals.barcode}
              color="#C0392B"
              onPress={() => navigation.navigate('BarcodeScanner', { meal })}
              selected={false}
            />
            <IconBtn
              icon="create-outline"
              label={tr.meals.manual}
              color="#2980B9"
              onPress={() => setMode(mode === 'manual' ? 'search' : 'manual')}
              selected={mode === 'manual'}
            />
            <IconBtn
              icon="ellipsis-horizontal"
              label="More"
              color="#6A7A94"
              onPress={() => navigation.navigate('MyFoods')}
              selected={false}
            />
          </View>

          {/* ── Search bar ── */}
          {mode === 'search' && (
            <View style={s.searchWrap}>
              <View style={s.searchBar}>
                <Ionicons name="search-outline" size={17} color="#6A7A94" />
                <TextInput
                  ref={searchInputRef}
                  style={s.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder={tr.meals.searchPlaceholder(mealLabel)}
                  placeholderTextColor="#6A7A94"
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {searching ? (
                  <ActivityIndicator size="small" color={TEAL} />
                ) : query.length > 0 ? (
                  <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color="#6A7A94" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          )}

          {/* ── Content ── */}
          <View style={{ flex: 1 }}>
            {mode === 'manual' ? renderManual() : renderSearch()}
          </View>

          {/* ── Footer "Done" button ── */}
          <View style={s.footer}>
            <TouchableOpacity
              style={[s.fertigBtn, mode === 'manual' && !canSave && s.fertigBtnDisabled]}
              onPress={mode === 'manual' && canSave ? handleSave : () => navigation.goBack()}
              activeOpacity={0.85}
            >
              <Text style={s.fertigText}>
                {mode === 'manual' && canSave
                  ? (foodType === 'ingredient' ? 'Save Ingredient' : tr.meals.done)
                  : tr.meals.done}
              </Text>
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>

        <ServingModal
          visible={showServing}
          food={servingFood}
          onClose={() => { setShowServing(false); setServingFood(null); }}
          onLog={handleLogFromModal}
          initialMeal={meal}
          calorieGoal={calorieGoal}
          todayKcal={todayKcal}
          carbGoal={carbGoal}
          proteinGoal={proteinGoal}
          fatGoal={fatGoal}
          theme={{ accent: TEAL, text: '#F0F4FF', textMuted: '#6A7A94', surface: '#0E1221', border: 'rgba(255,255,255,0.08)', surfaceAlt: '#141B2D', dark: true }}
          tr={tr}
        />
      </SafeAreaView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#03040A' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
  headerSide: { width: 40, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#F0F4FF', marginTop: 2 },
  countBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center' },
  countText: { color: '#000', fontSize: 11, fontWeight: '800' },
  doneBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center' },

  iconGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },

  searchWrap: { paddingHorizontal: 16, paddingVertical: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0E1221', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 11 },
  searchInput: { flex: 1, fontSize: 15, color: '#F0F4FF', padding: 0 },

  footer: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' },
  fertigBtn: { backgroundColor: '#FFFFFF', borderRadius: 28, paddingVertical: 15, alignItems: 'center' },
  fertigBtnDisabled: { backgroundColor: '#1A2237' },
  fertigText: { color: '#03040A', fontWeight: '800', fontSize: 16 },
});

const ss = StyleSheet.create({
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  section: { marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#6A7A94', letterSpacing: 0.8, textTransform: 'uppercase' },
  sectionLink: { fontSize: 13, fontWeight: '700', color: TEAL },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 60 },
  emptyText: { fontSize: 14, color: '#6A7A94', fontWeight: '500' },
});

const mf = StyleSheet.create({
  card: { backgroundColor: '#0E1221', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 16, gap: 12 },
  label: { fontSize: 10, fontWeight: '700', color: '#6A7A94', letterSpacing: 1, textTransform: 'uppercase' },
  nameInput: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: '500', color: '#F0F4FF' },
  nutriGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nutriField: { width: '47%', backgroundColor: '#141B2D', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 10, gap: 2 },
  nutriInput: { fontSize: 18, fontWeight: '800', color: '#F0F4FF', width: '100%', padding: 0 },
  nutriLabel: { fontSize: 10, fontWeight: '600', color: '#6A7A94' },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  amountChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#141B2D' },
  amountChipActive: { backgroundColor: TEAL, borderColor: TEAL },
  amountChipText: { fontSize: 12, fontWeight: '700', color: '#6A7A94' },
  amountInput: { width: 70, borderWidth: 2, borderColor: TEAL, borderRadius: 11, paddingVertical: 8, paddingHorizontal: 10, fontSize: 16, fontWeight: '800', textAlign: 'center', color: '#F0F4FF', backgroundColor: 'rgba(0,229,168,0.1)' },
  resultCard: { backgroundColor: TEAL, borderRadius: 18, padding: 18, alignItems: 'center', gap: 2 },
  resultKcal: { fontSize: 42, fontWeight: '900', color: '#000', letterSpacing: -2 },
  resultLabel: { fontSize: 13, color: 'rgba(0,0,0,0.6)', fontWeight: '600' },
});

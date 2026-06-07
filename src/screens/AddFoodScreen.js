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
import GlassBg from '../components/GlassBg';
import { searchFood } from '../utils/openFoodFacts';
import { searchLocalFoods, FOOD_DATABASE } from '../constants/foodDatabase';

const NUTRIENT_FIELDS = [
  { key: 'kcal',    icon: 'flash-outline',    labelKey: 'kcal',    colorKey: 'accent'  },
  { key: 'fat',     icon: 'water-outline',    labelKey: 'fat',     colorKey: 'fat'     },
  { key: 'carbs',   icon: 'grid-outline',     labelKey: 'carbs',   colorKey: 'carbs'   },
  { key: 'sugar',   icon: 'ellipse-outline',  labelKey: 'sugar',   colorKey: 'sugar'   },
  { key: 'protein', icon: 'fitness-outline',  labelKey: 'protein', colorKey: 'protein' },
];

function numVal(s) {
  return parseFloat(String(s).replace(',', '.')) || 0;
}

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

function SearchResultItem({ item, onAdd, theme }) {
  return (
    <View style={[srStyles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={srStyles.info}>
        <Text style={[srStyles.name, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[srStyles.sub, { color: theme.textMuted }]} numberOfLines={1}>
          {[item.brand, item.serving].filter(Boolean).join(' · ')}
        </Text>
      </View>
      {item.kcalPer100g != null && (
        <Text style={[srStyles.kcal, { color: theme.accent }]}>{item.kcalPer100g} kcal</Text>
      )}
      <TouchableOpacity style={[srStyles.addBtn, { backgroundColor: theme.accent }]} onPress={() => onAdd(item)} hitSlop={8} activeOpacity={0.75}>
        <Ionicons name="add" size={20} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const srStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8 },
  info:   { flex: 1 },
  name:   { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  sub:    { fontSize: 11, fontWeight: '500' },
  kcal:   { fontSize: 13, fontWeight: '700', marginRight: 4 },
  addBtn: { borderRadius: 20, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});

export default function AddFoodScreen({ navigation, route }) {
  const { theme, tr } = useSettings();
  const { addEntry, todayByMeal, entries, savedFoods, savedPlates } = useCalories();
  const insets = useSafeAreaInsets();
  const tabBarHeight = Platform.OS === 'ios' ? 96 : 80;

  const meal      = route.params?.meal ?? 'snack';
  const mealLabel = tr.meals[meal] ?? meal;

  const [isManual, setIsManual] = useState(false);
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef               = useRef(null);

  const [name,    setName]    = useState('');
  const [kcal,    setKcal]    = useState('');
  const [fat,     setFat]     = useState('');
  const [carbs,   setCarbs]   = useState('');
  const [sugar,   setSugar]   = useState('');
  const [protein, setProtein] = useState('');
  const [amountG, setAmountG] = useState('100');

  useEffect(() => {
    AsyncStorage.getItem('@einkauf_last_amount').then((v) => { if (v) setAmountG(v); }).catch(() => {});
  }, []);

  const saveAmount = useCallback((v) => {
    setAmountG(v);
    AsyncStorage.setItem('@einkauf_last_amount', v).catch(() => {});
  }, []);

  const stateMap  = { kcal, fat, carbs, sugar, protein };
  const setterMap = { kcal: setKcal, fat: setFat, carbs: setCarbs, sugar: setSugar, protein: setProtein };

  const kcalNum      = numVal(kcal);
  const amountNum    = numVal(amountG);
  const totalKcal    = Math.round((amountNum / 100) * kcalNum);
  const totalFat     = Math.round((amountNum / 100) * numVal(fat)     * 10) / 10;
  const totalCarbs   = Math.round((amountNum / 100) * numVal(carbs)   * 10) / 10;
  const totalProtein = Math.round((amountNum / 100) * numVal(protein) * 10) / 10;
  const canSave      = name.trim().length > 0 && kcalNum > 0 && amountNum > 0;
  const mealCount    = todayByMeal?.[meal]?.length ?? 0;

  useEffect(() => {
    if (route.params?.prefill) {
      const s = prefillToState(route.params.prefill);
      setName(s.name); setKcal(s.kcal); setFat(s.fat);
      setCarbs(s.carbs); setSugar(s.sugar); setProtein(s.protein);
      setIsManual(true);
    }
  }, [route.params?.prefill]);

  const recentFoods = useMemo(() => {
    const seen = new Set();
    return entries
      .filter((e) => { if (seen.has(e.name)) return false; seen.add(e.name); return true; })
      .slice(0, 10)
      .map((e) => ({ name: e.name, brand: null, serving: `${e.amountG}g`, kcalPer100g: e.kcalPer100g, fatPer100g: e.fatPer100g, carbsPer100g: e.carbsPer100g, sugarPer100g: e.sugarPer100g, proteinPer100g: e.proteinPer100g }));
  }, [entries]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim().toLowerCase();
    if (!q) { setResults([]); setSearching(false); return; }
    const local = [...searchLocalFoods(q), ...savedFoods.filter(
      (f) => f.name.toLowerCase().includes(q) || (f.brand && f.brand.toLowerCase().includes(q))
    )];
    setResults(local);
    if (q.length < 2) return;
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const remote = await searchFood(q);
        const localNames = new Set(local.map((f) => f.name.toLowerCase()));
        setResults([...local, ...remote.filter((r) => !localNames.has(r.name.toLowerCase()))]);
      } catch (_) {} finally { setSearching(false); }
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [query, savedFoods]);

  const applyPrefill = useCallback((item) => {
    const s = prefillToState(item);
    setName(s.name); setKcal(s.kcal); setFat(s.fat);
    setCarbs(s.carbs); setSugar(s.sugar); setProtein(s.protein);
    setAmountG('100'); saveAmount('100');
    setIsManual(true);
  }, []);

  const handleAddPlate = useCallback((plate) => {
    addEntry({
      name: plate.name,
      meal,
      kcalPer100g: plate.kcalPer100g,
      fatPer100g: plate.fatPer100g,
      carbsPer100g: plate.carbsPer100g,
      sugarPer100g: plate.sugarPer100g ?? 0,
      proteinPer100g: plate.proteinPer100g,
      amountG: plate.totalG || 100,
    });
  }, [addEntry, meal]);

  const handleSave = () => {
    if (!canSave) return;
    addEntry({ name: name.trim(), meal, kcalPer100g: kcalNum, fatPer100g: numVal(fat), carbsPer100g: numVal(carbs), sugarPer100g: numVal(sugar), proteinPer100g: numVal(protein), amountG: amountNum });
    navigation.goBack();
  };

  // ── render search content ─────────────────────────────────────────────────

  const renderSearchContent = () => {
    const plates = savedPlates || [];
    if (query.trim()) {
      if (searching && results.length === 0) return (
        <View style={ss.emptyState}><ActivityIndicator color={theme.accent} /></View>
      );
      if (results.length === 0) return (
        <View style={ss.emptyState}>
          <Ionicons name="alert-circle-outline" size={36} color={theme.textMuted} style={{ opacity: 0.4 }} />
          <Text style={[ss.emptyText, { color: theme.textMuted }]}>{tr.meals.noResults}</Text>
        </View>
      );
      return (
        <FlatList
          data={results}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <SearchResultItem item={item} onAdd={applyPrefill} theme={theme} />}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: tabBarHeight + 80 }}
          ListFooterComponent={searching ? <ActivityIndicator color={theme.accent} style={{ marginTop: 8 }} /> : null}
        />
      );
    }

    return (
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: tabBarHeight + 80 }}>
        {plates.length > 0 && (
          <>
            <View style={ss.sectionRow}>
              <Text style={[ss.sectionHeader, { color: theme.textMuted }]}>MY PLATES</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CreatePlate')} hitSlop={8}>
                <Text style={[ss.sectionLink, { color: theme.accent }]}>+ New</Text>
              </TouchableOpacity>
            </View>
            {plates.map((plate) => (
              <View key={plate.id} style={[srStyles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[ss.plateIcon, { backgroundColor: theme.accent + '20' }]}>
                  <Ionicons name="restaurant-outline" size={16} color={theme.accent} />
                </View>
                <View style={srStyles.info}>
                  <Text style={[srStyles.name, { color: theme.text }]} numberOfLines={1}>{plate.name}</Text>
                  <Text style={[srStyles.sub, { color: theme.textMuted }]}>{plate.totalKcal} kcal · {plate.ingredients?.length ?? 0} ingredients</Text>
                </View>
                <TouchableOpacity style={[srStyles.addBtn, { backgroundColor: theme.accent }]} onPress={() => handleAddPlate(plate)} hitSlop={8} activeOpacity={0.75}>
                  <Ionicons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {recentFoods.length > 0 && (
          <>
            <Text style={[ss.sectionHeader, { color: theme.textMuted }]}>{tr.meals.recentlyUsed}</Text>
            {recentFoods.map((item, i) => <SearchResultItem key={`r${i}`} item={item} onAdd={applyPrefill} theme={theme} />)}
          </>
        )}
        {savedFoods.length > 0 && (
          <>
            <Text style={[ss.sectionHeader, { color: theme.textMuted }]}>{tr.meals.myFoods}</Text>
            {savedFoods.map((item, i) => <SearchResultItem key={`s${i}`} item={item} onAdd={applyPrefill} theme={theme} />)}
          </>
        )}
        <View style={ss.sectionRow}>
          <Text style={[ss.sectionHeader, { color: theme.textMuted }]}>{tr.meals.suggestions}</Text>
          {plates.length === 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('CreatePlate')} hitSlop={8}>
              <Text style={[ss.sectionLink, { color: theme.accent }]}>+ New plate</Text>
            </TouchableOpacity>
          )}
        </View>
        {FOOD_DATABASE.slice(0, 20).map((item, i) => <SearchResultItem key={`db${i}`} item={item} onAdd={applyPrefill} theme={theme} />)}
      </ScrollView>
    );
  };

  // ── render manual form ────────────────────────────────────────────────────

  const renderManual = () => (
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: tabBarHeight + 80 }}>
      {/* food name */}
      <View style={[mf.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[mf.label, { color: theme.textMuted }]}>{tr.calories.foodName}</Text>
        <TextInput
          style={[mf.nameInput, { color: theme.text, borderColor: theme.border }]}
          value={name} onChangeText={setName}
          placeholder={tr.calories.foodNamePlaceholder}
          placeholderTextColor={theme.textMuted}
          autoCorrect={false} returnKeyType="next"
        />
      </View>

      {/* per 100g */}
      <View style={[mf.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[mf.label, { color: theme.textMuted }]}>{tr.calories.per100g}</Text>
        <View style={mf.nutriGrid}>
          {NUTRIENT_FIELDS.map(({ key, icon, labelKey, colorKey }) => (
            <View key={key} style={[mf.nutriField, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
              <Ionicons name={icon} size={13} color={theme[colorKey] || theme.accent} />
              <TextInput
                style={[mf.nutriInput, { color: theme.text }]}
                value={stateMap[labelKey]} onChangeText={setterMap[labelKey]}
                keyboardType="decimal-pad" placeholder="0"
                placeholderTextColor={theme.textMuted} selectTextOnFocus
              />
              <Text style={[mf.nutriLabel, { color: theme.textMuted }]}>{tr.meals.nutrientFields[labelKey]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* amount */}
      <View style={[mf.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[mf.label, { color: theme.textMuted }]}>{tr.calories.amountConsumed}</Text>
        <View style={mf.amountRow}>
          {['50','100','150','200'].map((v) => (
            <TouchableOpacity
              key={v}
              style={[mf.amountChip, { backgroundColor: amountG === v ? theme.accent : theme.surfaceAlt, borderColor: amountG === v ? theme.accent : theme.border }]}
              onPress={() => saveAmount(v)}
              activeOpacity={0.7}
            >
              <Text style={[mf.amountChipText, { color: amountG === v ? '#FFF' : theme.textMuted }]}>{v}g</Text>
            </TouchableOpacity>
          ))}
          <TextInput
            style={[mf.amountInput, { color: theme.text, borderColor: theme.accent, backgroundColor: theme.accentLight }]}
            value={amountG} onChangeText={saveAmount}
            keyboardType="decimal-pad" placeholder="100"
            placeholderTextColor={theme.textMuted} selectTextOnFocus
          />
          <Text style={[mf.amountUnit, { color: theme.textMuted }]}>g</Text>
        </View>
      </View>

      {/* live result */}
      {kcalNum > 0 && amountNum > 0 && (
        <View style={[mf.resultCard, { backgroundColor: theme.accent }]}>
          <Text style={mf.resultKcal}>{totalKcal}</Text>
          <Text style={mf.resultKcalLabel}>kcal</Text>
          {(totalFat > 0 || totalCarbs > 0 || totalProtein > 0) && (
            <Text style={mf.resultMacros}>{tr.meals.macrosLine(totalFat, totalCarbs, totalProtein)}</Text>
          )}
        </View>
      )}
    </ScrollView>
  );

  return (
    <GlassBg theme={theme}>
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* ── Header ── */}
        <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <View style={[styles.counterBubble, { backgroundColor: theme.accent }]}>
            <Text style={styles.counterText}>{mealCount}</Text>
          </View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{mealLabel}</Text>
          {isManual && canSave ? (
            <TouchableOpacity onPress={handleSave} style={[styles.doneBtn, { backgroundColor: theme.accent }]} hitSlop={4}>
              <Ionicons name="checkmark" size={18} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        {/* ── Search bar + mode controls ── */}
        <View style={[styles.searchArea, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <View style={[styles.searchBar, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <Ionicons name="search-outline" size={17} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              value={isManual ? '' : query}
              onChangeText={(t) => { if (!isManual) setQuery(t); }}
              onFocus={() => { if (isManual) setIsManual(false); }}
              placeholder={tr.meals.searchPlaceholder(mealLabel)}
              placeholderTextColor={theme.textMuted}
              autoCorrect={false}
              editable={!isManual}
            />
            {searching && !isManual && <ActivityIndicator size="small" color={theme.accent} />}
          </View>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]} onPress={() => navigation.navigate('CameraLabel')} activeOpacity={0.75}>
            <Ionicons name="camera-outline" size={18} color={theme.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]} onPress={() => navigation.navigate('BarcodeScanner')} activeOpacity={0.75}>
            <Ionicons name="barcode-outline" size={18} color={theme.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.manualPill, { backgroundColor: isManual ? theme.accent : theme.surfaceAlt, borderColor: isManual ? theme.accent : theme.border }]}
            onPress={() => setIsManual((v) => !v)}
            activeOpacity={0.75}
          >
            <Ionicons name="create-outline" size={15} color={isManual ? '#FFF' : theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── Content ── */}
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}>
          {isManual ? renderManual() : renderSearchContent()}
        </View>

        {/* ── Footer ── */}
        <View style={[styles.footerWrap, { borderTopColor: theme.border, backgroundColor: theme.surface, paddingBottom: tabBarHeight + 8 }]}>
          <TouchableOpacity style={[styles.fertigBtn, { backgroundColor: isManual && canSave ? theme.accent : theme.accent }]} onPress={isManual && canSave ? handleSave : () => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.fertigText}>{isManual && canSave ? tr.meals.addFood ?? 'Add' : tr.meals.done}</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
    </GlassBg>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1 },
  headerBtn: { padding: 2 },
  counterBubble: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  counterText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  doneBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  searchArea: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500', padding: 0 },
  iconBtn: { width: 38, height: 38, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  manualPill: { width: 38, height: 38, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  footerWrap: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1 },
  fertigBtn: { borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  fertigText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});

const ss = StyleSheet.create({
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 60 },
  emptyText: { fontSize: 14, fontWeight: '500', opacity: 0.7 },
  sectionHeader: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 4 },
  sectionLink: { fontSize: 13, fontWeight: '700' },
  plateIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});

const mf = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  nameInput: { borderWidth: 1.5, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 11, fontSize: 15, fontWeight: '500' },
  nutriGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nutriField: { width: '47%', borderRadius: 11, borderWidth: 1, padding: 10, alignItems: 'flex-start', gap: 2 },
  nutriInput: { fontSize: 18, fontWeight: '800', width: '100%', padding: 0 },
  nutriLabel: { fontSize: 10, fontWeight: '600' },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amountChip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  amountChipText: { fontSize: 12, fontWeight: '700' },
  amountInput: { width: 70, borderWidth: 2, borderRadius: 11, paddingVertical: 8, paddingHorizontal: 10, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  amountUnit: { fontSize: 15, fontWeight: '700' },
  resultCard: { borderRadius: 18, padding: 16, alignItems: 'center', gap: 2 },
  resultKcal: { fontSize: 40, fontWeight: '900', color: '#FFF', letterSpacing: -2 },
  resultKcalLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: -6 },
  resultMacros: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '500' },
});

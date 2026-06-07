import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from '../context/SettingsContext';
import { useCalories } from '../context/CalorieContext';
import { searchFood } from '../utils/openFoodFacts';
import { searchLocalFoods, FOOD_DATABASE } from '../constants/foodDatabase';

// ─── constants ───────────────────────────────────────────────────────────────

const NUTRIENT_FIELDS = [
  { key: 'kcal',    icon: 'flash-outline',    labelKey: 'kcal',   colorKey: 'accent'  },
  { key: 'fat',     icon: 'water-outline',    labelKey: 'fat',    colorKey: 'fat'     },
  { key: 'carbs',   icon: 'grid-outline',     labelKey: 'carbs',  colorKey: 'carbs'   },
  { key: 'sugar',   icon: 'ellipse-outline',  labelKey: 'sugar',  colorKey: 'sugar'   },
  { key: 'protein', icon: 'fitness-outline',  labelKey: 'protein',colorKey: 'protein' },
];

const TAB_DEFS = [
  { id: 'search', labelKey: 'search',  icon: 'search-outline'  },
  { id: 'camera', labelKey: 'camera',  icon: 'camera-outline'  },
  { id: 'barcode', labelKey: 'barcode', icon: 'barcode-outline' },
  { id: 'manual', labelKey: 'manual',  icon: 'create-outline'  },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

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

// ─── sub-components ──────────────────────────────────────────────────────────

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
      <TouchableOpacity
        style={[srStyles.addBtn, { backgroundColor: theme.accent }]}
        onPress={() => onAdd(item)}
        hitSlop={8}
        activeOpacity={0.75}
      >
        <Ionicons name="add" size={20} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const srStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8,
  },
  info:  { flex: 1 },
  name:  { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  sub:   { fontSize: 11, fontWeight: '500' },
  kcal:  { fontSize: 13, fontWeight: '700', marginRight: 4 },
  addBtn: { borderRadius: 20, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});

// ─── main screen ─────────────────────────────────────────────────────────────

export default function AddFoodScreen({ navigation, route }) {
  const { theme, tr } = useSettings();
  const { addEntry, todayByMeal, entries, savedFoods } = useCalories();

  const meal    = route.params?.meal ?? 'snack';
  const mealLabel = tr.meals[meal] ?? meal;

  // ── tab state ──
  const [activeTab, setActiveTab] = useState('search');

  // ── search state ──
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState([]);
  const [searching, setSearching]   = useState(false);
  const debounceRef                 = useRef(null);

  // ── manual-entry state ──
  const [name,    setName]    = useState('');
  const [kcal,    setKcal]    = useState('');
  const [fat,     setFat]     = useState('');
  const [carbs,   setCarbs]   = useState('');
  const [sugar,   setSugar]   = useState('');
  const [protein, setProtein] = useState('');
  const [amountG, setAmountG] = useState('100');

  // ── persist last amount ──
  useEffect(() => {
    AsyncStorage.getItem('@einkauf_last_amount').then((v) => {
      if (v) setAmountG(v);
    }).catch(() => {});
  }, []);
  const saveAmount = useCallback((v) => {
    setAmountG(v);
    AsyncStorage.setItem('@einkauf_last_amount', v).catch(() => {});
  }, []);

  const stateMap  = { kcal, fat, carbs, sugar, protein };
  const setterMap = { kcal: setKcal, fat: setFat, carbs: setCarbs, sugar: setSugar, protein: setProtein };

  // ── derived values ──
  const kcalNum   = numVal(kcal);
  const amountNum = numVal(amountG);
  const totalKcal    = Math.round((amountNum / 100) * kcalNum);
  const totalFat     = Math.round((amountNum / 100) * numVal(fat)     * 10) / 10;
  const totalCarbs   = Math.round((amountNum / 100) * numVal(carbs)   * 10) / 10;
  const totalProtein = Math.round((amountNum / 100) * numVal(protein)  * 10) / 10;
  const canSave = name.trim().length > 0 && kcalNum > 0 && amountNum > 0;

  // count of entries already in this meal today
  const mealCount = todayByMeal?.[meal]?.length ?? 0;

  // ── prefill from route.params (camera / barcode return) ──
  useEffect(() => {
    if (route.params?.prefill) {
      const s = prefillToState(route.params.prefill);
      setName(s.name);
      setKcal(s.kcal);
      setFat(s.fat);
      setCarbs(s.carbs);
      setSugar(s.sugar);
      setProtein(s.protein);
      setActiveTab('manual');
    }
  }, [route.params?.prefill]);

  // ── recently logged foods (unique names, newest first, max 10) ──
  const recentFoods = useMemo(() => {
    const seen = new Set();
    return entries
      .filter((e) => { if (seen.has(e.name)) return false; seen.add(e.name); return true; })
      .slice(0, 10)
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

  // ── debounced search (local + remote) ──
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q || q.length < 1) {
      setResults([]);
      setSearching(false);
      return;
    }
    // immediate local search (database + saved foods)
    const local = [...searchLocalFoods(q), ...savedFoods.filter(
      (f) => f.name.toLowerCase().includes(q) || (f.brand && f.brand.toLowerCase().includes(q))
    )];
    setResults(local);
    if (q.length < 2) return;
    // debounced remote search
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const remote = await searchFood(q);
        // merge: local first (deduplicated by name)
        const localNames = new Set(local.map((f) => f.name.toLowerCase()));
        const merged = [...local, ...remote.filter((r) => !localNames.has(r.name.toLowerCase()))];
        setResults(merged);
      } catch (_) {
        // keep local results on network error
      } finally {
        setSearching(false);
      }
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [query, savedFoods]);

  // ── handlers ──
  const applyPrefill = useCallback((item) => {
    const s = prefillToState(item);
    setName(s.name);
    setKcal(s.kcal);
    setFat(s.fat);
    setCarbs(s.carbs);
    setSugar(s.sugar);
    setProtein(s.protein);
    setAmountG('100');
    saveAmount('100');
    setActiveTab('manual');
  }, []);

  const handleSave = () => {
    if (!canSave) return;
    addEntry({
      name: name.trim(),
      meal,
      kcalPer100g:    kcalNum,
      fatPer100g:     numVal(fat),
      carbsPer100g:   numVal(carbs),
      sugarPer100g:   numVal(sugar),
      proteinPer100g: numVal(protein),
      amountG:        amountNum,
    });
    navigation.goBack();
  };

  const handleTabPress = (tabId) => {
    if (tabId === 'camera') {
      navigation.navigate('CameraLabel');
      return;
    }
    if (tabId === 'barcode') {
      navigation.navigate('BarcodeScanner');
      return;
    }
    setActiveTab(tabId);
  };

  // ── tab content renderers ──
  const renderSearch = () => (
    <View style={{ flex: 1 }}>
      {/* search bar */}
      <View style={[tabContent.searchBarWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={18} color={theme.textMuted} />
        <TextInput
          style={[tabContent.searchInput, { color: theme.text }]}
          value={query}
          onChangeText={setQuery}
          placeholder={tr.meals.searchPlaceholder(mealLabel)}
          placeholderTextColor={theme.textMuted}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searching && <ActivityIndicator size="small" color={theme.accent} />}
      </View>

      {/* results / empty state */}
      {!query.trim() ? (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {recentFoods.length > 0 && (
            <>
              <Text style={[tabContent.sectionHeader, { color: theme.textMuted }]}>{tr.meals.recentlyUsed}</Text>
              {recentFoods.map((item, i) => (
                <SearchResultItem key={`r${i}`} item={item} onAdd={applyPrefill} theme={theme} />
              ))}
            </>
          )}
          {savedFoods.length > 0 && (
            <>
              <Text style={[tabContent.sectionHeader, { color: theme.textMuted }]}>{tr.meals.myFoods}</Text>
              {savedFoods.map((item, i) => (
                <SearchResultItem key={`s${i}`} item={item} onAdd={applyPrefill} theme={theme} />
              ))}
            </>
          )}
          <Text style={[tabContent.sectionHeader, { color: theme.textMuted }]}>{tr.meals.suggestions}</Text>
          {FOOD_DATABASE.slice(0, 20).map((item, i) => (
            <SearchResultItem key={`db${i}`} item={item} onAdd={applyPrefill} theme={theme} />
          ))}
        </ScrollView>
      ) : query.trim().length < 1 ? null
      : searching && results.length === 0 ? (
        <View style={tabContent.emptyState}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : results.length === 0 ? (
        <View style={tabContent.emptyState}>
          <Ionicons name="alert-circle-outline" size={40} color={theme.textMuted} style={{ opacity: 0.4 }} />
          <Text style={[tabContent.emptyText, { color: theme.textMuted }]}>{tr.meals.noResults}</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <SearchResultItem item={item} onAdd={applyPrefill} theme={theme} />
          )}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListFooterComponent={searching ? <ActivityIndicator color={theme.accent} style={{ marginTop: 8 }} /> : null}
        />
      )}
    </View>
  );

  const renderManual = () => (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: 14, paddingBottom: 24 }}
    >
      {/* food name */}
      <View style={[card.wrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[card.label, { color: theme.textMuted }]}>{tr.calories.foodName}</Text>
        <TextInput
          style={[card.nameInput, { color: theme.text, borderColor: theme.border }]}
          value={name}
          onChangeText={setName}
          placeholder={tr.calories.foodNamePlaceholder}
          placeholderTextColor={theme.textMuted}
          autoCorrect={false}
          returnKeyType="next"
        />
      </View>

      {/* nutrition per 100g */}
      <View style={[card.wrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[card.label, { color: theme.textMuted }]}>{tr.calories.per100g}</Text>
        <View style={card.nutriGrid}>
          {NUTRIENT_FIELDS.map(({ key, icon, labelKey, colorKey }) => (
            <View
              key={key}
              style={[card.nutriField, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
            >
              <Ionicons name={icon} size={14} color={theme[colorKey] || theme.accent} style={{ marginBottom: 4 }} />
              <TextInput
                style={[card.nutriInput, { color: theme.text }]}
                value={stateMap[labelKey]}
                onChangeText={setterMap[labelKey]}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={theme.textMuted}
                selectTextOnFocus
              />
              <Text style={[card.nutriLabel, { color: theme.textMuted }]}>{tr.meals.nutrientFields[labelKey]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* amount */}
      <View style={[card.wrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[card.label, { color: theme.textMuted }]}>{tr.calories.amountConsumed}</Text>
        <View style={card.amountRow}>
          <TextInput
            style={[
              card.amountInput,
              { color: theme.text, borderColor: theme.accent, backgroundColor: theme.accentLight },
            ]}
            value={amountG}
            onChangeText={saveAmount}
            keyboardType="decimal-pad"
            placeholder="100"
            placeholderTextColor={theme.textMuted}
            selectTextOnFocus
          />
          <Text style={[card.amountUnit, { color: theme.textMuted }]}>g</Text>
        </View>
      </View>

      {/* live result card */}
      {kcalNum > 0 && amountNum > 0 && (
        <View style={[card.resultCard, { backgroundColor: theme.accent }]}>
          <Text style={card.resultKcal}>{totalKcal}</Text>
          <Text style={card.resultKcalLabel}>kcal</Text>
          {(totalFat > 0 || totalCarbs > 0 || totalProtein > 0) && (
              <Text style={card.resultMacros}>
                {tr.meals.macrosLine(totalFat, totalCarbs, totalProtein)}
              </Text>
          )}
        </View>
      )}
    </ScrollView>
  );

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* ── Header ── */}
        <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
          {/* counter bubble */}
          <View style={[styles.counterBubble, { backgroundColor: theme.accent }]}>
            <Text style={styles.counterText}>{mealCount}</Text>
          </View>

          {/* meal name */}
          <Text style={[styles.headerTitle, { color: theme.text }]}>{mealLabel}</Text>

          {/* done checkmark — saves if on manual tab with valid data, else goes back */}
          <TouchableOpacity
            onPress={activeTab === 'manual' && canSave ? handleSave : () => navigation.goBack()}
            style={[
              styles.doneBtn,
              { backgroundColor: activeTab === 'manual' && canSave ? theme.accent : theme.surfaceAlt },
            ]}
            hitSlop={4}
          >
            <Ionicons
              name="checkmark"
              size={18}
              color={activeTab === 'manual' && canSave ? '#FFF' : theme.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* ── Tab bar ── */}
        <View style={[styles.tabBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarInner}>
            {TAB_DEFS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tabPill,
                    {
                      backgroundColor: isActive ? theme.accent : theme.surfaceAlt,
                      borderColor: isActive ? theme.accent : theme.border,
                    },
                  ]}
                  onPress={() => handleTabPress(tab.id)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={tab.icon}
                    size={15}
                    color={isActive ? '#FFF' : theme.textMuted}
                  />
                  <Text style={[styles.tabLabel, { color: isActive ? '#FFF' : theme.textMuted }]}>
                    {tr.meals[tab.labelKey]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Tab content ── */}
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 14 }}>
          {activeTab === 'search' && renderSearch()}
          {activeTab === 'manual' && renderManual()}
        </View>

        {/* ── Fertig button ── */}
        <View style={[styles.footerWrap, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
          <TouchableOpacity
            style={[styles.fertigBtn, { backgroundColor: theme.accent }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.fertigText}>{tr.meals.done}</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  counterBubble: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  counterText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  doneBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },

  tabBar: { borderBottomWidth: 1 },
  tabBarInner: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  tabPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  tabLabel: { fontSize: 13, fontWeight: '600' },

  footerWrap: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  fertigBtn: {
    borderRadius: 16, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  fertigText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});

const tabContent = StyleSheet.create({
  searchBarWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 60 },
  emptyText: { fontSize: 14, fontWeight: '500', opacity: 0.7 },
  sectionHeader: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 8, marginTop: 4,
  },
});

const card = StyleSheet.create({
  wrap: { borderRadius: 20, borderWidth: 1, padding: 18, gap: 14 },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  nameInput: { borderWidth: 1.5, borderRadius: 12, padding: 14, fontSize: 16, fontWeight: '500' },
  nutriGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  nutriField: { width: '47%', borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'flex-start', gap: 2 },
  nutriInput: { fontSize: 22, fontWeight: '800', width: '100%' },
  nutriLabel: { fontSize: 10, fontWeight: '600' },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  amountInput: {
    flex: 1, borderWidth: 2, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 12,
    fontSize: 24, fontWeight: '800', textAlign: 'center',
  },
  amountUnit: { fontSize: 18, fontWeight: '700', minWidth: 20 },
  resultCard: { borderRadius: 20, padding: 20, alignItems: 'center', gap: 4 },
  resultKcal: { fontSize: 48, fontWeight: '900', color: '#FFF', letterSpacing: -2 },
  resultKcalLabel: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: -8 },
  resultMacros: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: '500' },
});

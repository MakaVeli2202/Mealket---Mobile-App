import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  FlatList, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useRecipes } from '../context/RecipeContext';
import { useCalories } from '../context/CalorieContext';
import GlassBg from '../components/GlassBg';

const CATEGORIES = [
  { key: 'all', icon: 'grid-outline', label: 'All' },
  { key: 'high protein', icon: 'fitness-outline', label: 'High Protein' },
  { key: 'low carb', icon: 'leaf-outline', label: 'Low Carb' },
  { key: 'vegan', icon: 'flower-outline', label: 'Vegan' },
  { key: 'vegetarian', icon: 'restaurant-outline', label: 'Veggie' },
  { key: 'keto', icon: 'flame-outline', label: 'Keto' },
  { key: 'breakfast', icon: 'sunny-outline', label: 'Breakfast' },
  { key: 'dessert', icon: 'ice-cream-outline', label: 'Dessert' },
];

export default function RecipeListScreen({ route, navigation }) {
  const { theme, tr } = useSettings();
  const { recipes } = useRecipes();
  const { savedFoods } = useCalories();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const hideBack = route.params?.hideBack;

  const filtered = useMemo(() => {
    if (tab === 'ingredients') return savedFoods.filter((f) => f.type === 'ingredient');
    let list = recipes;
    if (category !== 'all') {
      list = list.filter((r) => (r.category || '').toLowerCase() === category);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q));
    }
    return list;
  }, [recipes, savedFoods, category, search, tab]);

  const showCategories = tab === 'all' || tab === 'recipes';

  return (
    <GlassBg theme={theme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          {!hideBack && (
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
          )}
          <Text style={[styles.title, { color: theme.text }]}>Food</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => navigation.navigate('BarcodeScanner', { returnTo: 'RecipeList' })} hitSlop={8} style={styles.addBtn}>
              <Ionicons name="barcode-outline" size={22} color={theme.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('CreateRecipe')} hitSlop={8} style={styles.addBtn}>
              <Ionicons name="add-circle" size={24} color={theme.accent} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.tabRow, { borderBottomColor: theme.border }]}>
          {[
            { key: 'all', label: 'All' },
            { key: 'recipes', label: 'Recipes' },
            { key: 'ingredients', label: 'Ingredients' },
          ].map((t) => (
            <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={[styles.tabBtn, tab === t.key && { borderBottomColor: theme.accent, borderBottomWidth: 2 }]}>
              <Text style={[styles.tabLabel, { color: tab === t.key ? theme.accent : theme.textMuted }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.searchBar, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={17} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            value={search} onChangeText={setSearch}
            placeholder="Search food, ingredients, recipes..."
            placeholderTextColor={theme.textMuted}
          />
        </View>

        {showCategories && !search.trim() && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.key}
                style={[styles.catChip, { backgroundColor: category === c.key ? theme.accent : theme.surfaceAlt, borderColor: category === c.key ? theme.accent : theme.border }]}
                onPress={() => setCategory(c.key)}
              >
                <Ionicons name={c.icon} size={14} color={category === c.key ? '#FFF' : theme.textMuted} />
                <Text style={[styles.catLabel, { color: category === c.key ? '#FFF' : theme.textMuted }]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <FlatList
          data={filtered}
          keyExtractor={(item, i) => item.id || String(i)}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="nutrition-outline" size={48} color={theme.textMuted} style={{ opacity: 0.3 }} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No food items yet</Text>
              <TouchableOpacity style={[styles.createBtn, { backgroundColor: theme.accent }]} onPress={() => navigation.navigate('CreateRecipe')}>
                <Text style={styles.createBtnText}>Add Recipe or Food</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={useCallback(({ item }) => {
            const isFood = item.type === 'food' || !item.servings;
            const isIngredientTab = tab === 'ingredients';
            return (
              <TouchableOpacity
                style={[styles.recipeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => {
                  if (isIngredientTab) navigation.navigate('AddFood', { prefill: item, foodType: 'ingredient' });
                  else if (isFood) navigation.navigate('AddFood', { prefill: item });
                  else navigation.navigate('RecipeDetail', { recipe: item });
                }}
              >
                <View style={styles.recipeInfo}>
                  <Text style={[styles.recipeName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.recipeMeta, { color: theme.textMuted }]}>
                    {isFood ? `${item.kcalPer100g || '—'} kcal/100g` : `${item.servings || 1} servings · ${item.totalKcal || '—'} kcal`}
                  </Text>
                  {isIngredientTab && (
                    <View style={[styles.recipeCat, { backgroundColor: theme.accent + '20' }]}>
                      <Text style={[styles.recipeCatText, { color: theme.accent }]}>INGREDIENT</Text>
                    </View>
                  )}
                  {!isFood && item.category && (
                    <View style={[styles.recipeCat, { backgroundColor: theme.accent + '20' }]}>
                      <Text style={[styles.recipeCatText, { color: theme.accent }]}>{item.category}</Text>
                    </View>
                  )}
                </View>
                <Ionicons name={isIngredientTab ? 'add-circle-outline' : (isFood ? 'add-circle-outline' : 'chevron-forward')} size={18} color={theme.textMuted} />
              </TouchableOpacity>
            );
          }, [theme, tab, navigation])}
        />
      </SafeAreaView>
    </GlassBg>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 2 },
  title: { flex: 1, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  addBtn: { padding: 2 },
  headerRight: { flexDirection: 'row', gap: 6 },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, gap: 0 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabLabel: { fontSize: 13, fontWeight: '600' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500', padding: 0 },
  categoriesRow: { maxHeight: 44, marginBottom: 4 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  catLabel: { fontSize: 12, fontWeight: '600' },
  recipeCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  recipeInfo: { flex: 1, gap: 4 },
  recipeName: { fontSize: 15, fontWeight: '700' },
  recipeMeta: { fontSize: 12, fontWeight: '500' },
  recipeCat: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  recipeCatText: { fontSize: 10, fontWeight: '700' },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  emptyText: { fontSize: 15, fontWeight: '600', opacity: 0.5 },
  createBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  createBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});

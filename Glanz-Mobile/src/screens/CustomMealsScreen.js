import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useCalories } from '../context/CalorieContext';
import { useRecipes } from '../context/RecipeContext';
import GlassBg from '../components/GlassBg';
import ServingModal from '../components/ServingModal';

export default function CustomMealsScreen({ navigation }) {
  const { theme, tr, calorieGoal, carbGoal, proteinGoal, fatGoal } = useSettings();
  const { savedPlates, removePlate, addEntry, todayEntries } = useCalories();
  const { recipes } = useRecipes();
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const allMeals = useMemo(() => {
    const items = [];
    if (savedPlates) {
      savedPlates.forEach((p) => items.push({ id: p.id, type: 'plate', ...p }));
    }
    recipes.forEach((r) => items.push({ id: r.id, type: 'recipe', ...r }));
    return items;
  }, [savedPlates, recipes]);

  const categories = ['all', 'breakfast', 'lunch', 'dinner', 'snack', 'pre-workout', 'post-workout'];

  const filtered = useMemo(() => {
    let list = allMeals;
    if (selectedCategory !== 'all') {
      list = list.filter((m) => (m.meal || m.category || '').toLowerCase() === selectedCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(q));
    }
    return list;
  }, [allMeals, selectedCategory, search]);

  const servingFood = useMemo(() => {
    if (!selectedItem) return null;
    if (selectedItem.type === 'plate') {
      return {
        name: selectedItem.name,
        kcalPer100g: selectedItem.kcalPer100g || 0,
        fatPer100g: selectedItem.fatPer100g || 0,
        carbsPer100g: selectedItem.carbsPer100g || 0,
        proteinPer100g: selectedItem.proteinPer100g || 0,
        sugarPer100g: selectedItem.sugarPer100g || 0,
      };
    }
    return {
      name: selectedItem.name,
      isRecipe: true,
      servings: selectedItem.servings || 1,
      kcalPer100g: selectedItem.totalKcal || 0,
      fatPer100g: selectedItem.totalFat || 0,
      carbsPer100g: selectedItem.totalCarbs || 0,
      proteinPer100g: selectedItem.totalProtein || 0,
      sugarPer100g: 0,
    };
  }, [selectedItem]);

  return (
    <GlassBg theme={theme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Custom Meals</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CreatePlate')} hitSlop={8}>
            <Ionicons name="add-circle" size={24} color={theme.accent} />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBar, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={17} color={theme.textMuted} />
          <TextInput style={[styles.searchInput, { color: theme.text }]} value={search} onChangeText={setSearch} placeholder="Search meals..." placeholderTextColor={theme.textMuted} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44, marginBottom: 8 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, { backgroundColor: selectedCategory === cat ? theme.accent : theme.surfaceAlt, borderColor: selectedCategory === cat ? theme.accent : theme.border }]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.catLabel, { color: selectedCategory === cat ? '#FFF' : theme.textMuted }]}>{cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="restaurant-outline" size={48} color={theme.textMuted} style={{ opacity: 0.3 }} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No custom meals yet</Text>
              <TouchableOpacity style={[styles.createBtn, { backgroundColor: theme.accent }]} onPress={() => navigation.navigate('CreatePlate')}>
                <Text style={styles.createBtnText}>Create Plate</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.mealCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setSelectedItem(item)}
            >
              <View style={styles.mealHeader}>
                <View style={[styles.mealType, { backgroundColor: item.type === 'recipe' ? theme.accent + '20' : theme.accentSecondary + '20' }]}>
                  <Ionicons name={item.type === 'recipe' ? 'book-outline' : 'layers-outline'} size={14} color={item.type === 'recipe' ? theme.accent : theme.accentSecondary} />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: item.type === 'recipe' ? theme.accent : theme.accentSecondary }}>{item.type === 'recipe' ? 'RECIPE' : 'PLATE'}</Text>
                </View>
                {item.meal && <Text style={[styles.mealTag, { color: theme.textMuted }]}>{item.meal}</Text>}
              </View>
              <Text style={[styles.mealName, { color: theme.text }]}>{item.name}</Text>
              {item.totalKcal && <Text style={[styles.mealKcal, { color: theme.accent }]}>{item.totalKcal} kcal</Text>}
            </TouchableOpacity>
          )}
        />

        <ServingModal
          visible={!!selectedItem}
          food={servingFood}
          onClose={() => setSelectedItem(null)}
          onLog={(entry) => {
            addEntry({
              name: selectedItem.name,
              meal: entry.meal || 'snack',
              amountG: entry.grams || 100,
              kcalPer100g: servingFood.kcalPer100g,
              proteinPer100g: servingFood.proteinPer100g,
              carbsPer100g: servingFood.carbsPer100g,
              fatPer100g: servingFood.fatPer100g,
              sugarPer100g: servingFood.sugarPer100g,
              isRecipe: selectedItem.type === 'recipe',
              servings: selectedItem.type === 'recipe' ? (selectedItem.servings || 1) : undefined,
              calories: Math.round((entry.grams || 100) / 100 * servingFood.kcalPer100g),
            });
            setSelectedItem(null);
          }}
          calorieGoal={calorieGoal}
          todayKcal={todayEntries.reduce((s, e) => s + (e.calories || 0), 0)}
          carbGoal={carbGoal}
          proteinGoal={proteinGoal}
          fatGoal={fatGoal}
          theme={theme}
          tr={tr}
        />
      </SafeAreaView>
    </GlassBg>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 10 },
  title: { flex: 1, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginVertical: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500', padding: 0 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  catLabel: { fontSize: 12, fontWeight: '600' },
  mealCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 6 },
  mealHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mealType: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  mealTag: { fontSize: 11, fontWeight: '600' },
  mealName: { fontSize: 15, fontWeight: '700' },
  mealKcal: { fontSize: 13, fontWeight: '800' },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  emptyText: { fontSize: 15, fontWeight: '600', opacity: 0.5 },
  createBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  createBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});

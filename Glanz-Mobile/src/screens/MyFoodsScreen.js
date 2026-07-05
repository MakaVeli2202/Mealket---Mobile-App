import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useCalories } from '../context/CalorieContext';
import GlassBg from '../components/GlassBg';
import ServingModal from '../components/ServingModal';

export default function MyFoodsScreen({ navigation }) {
  const { theme, tr, calorieGoal, carbGoal, proteinGoal, fatGoal } = useSettings();
  const { savedFoods, removeSavedFood, addEntry, todayEntries } = useCalories();
  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return savedFoods;
    const q = search.trim().toLowerCase();
    return savedFoods.filter((f) => f.name.toLowerCase().includes(q));
  }, [savedFoods, search]);

  const freqMap = useMemo(() => {
    const map = {};
    savedFoods.forEach((f) => {
      map[f.name] = f;
    });
    return Object.values(map).slice(0, 10);
  }, [savedFoods]);

  return (
    <GlassBg theme={theme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>My Foods</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity onPress={() => navigation.navigate('BarcodeScanner', { returnTo: 'MyFoods' })} hitSlop={8}>
              <Ionicons name="barcode-outline" size={22} color={theme.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('CameraLabel')} hitSlop={8}>
              <Ionicons name="camera-outline" size={22} color={theme.accent} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.searchBar, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={17} color={theme.textMuted} />
          <TextInput style={[styles.searchInput, { color: theme.text }]} value={search} onChangeText={setSearch} placeholder="Search saved foods..." placeholderTextColor={theme.textMuted} />
        </View>

        {freqMap.length > 0 && !search && (
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>FREQUENTLY USED</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {freqMap.map((f, i) => (
                <TouchableOpacity key={i} style={[styles.freqChip, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]} onPress={() => setSelectedFood(f)}>
                  <Text style={[styles.freqText, { color: theme.text }]} numberOfLines={1}>{f.name}</Text>
                  <Text style={[styles.freqKcal, { color: theme.accent }]}>{f.kcalPer100g || f.caloriesPer100g || 0} kcal</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <FlatList
          data={filtered}
          keyExtractor={(item, i) => item.name + i}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="fast-food-outline" size={48} color={theme.textMuted} style={{ opacity: 0.3 }} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No saved foods</Text>
              <Text style={[styles.emptySub, { color: theme.textMuted }]}>Foods you search or scan appear here</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.foodRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setSelectedFood(item)} onLongPress={() => Alert.alert('Delete Food', `Remove "${item.name}" from saved foods?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => removeSavedFood(item.name) }])}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.foodName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                {item.brand && <Text style={[styles.foodBrand, { color: theme.textMuted }]}>{item.brand}</Text>}
              </View>
              <Text style={[styles.foodKcal, { color: theme.accent }]}>{item.kcalPer100g || item.caloriesPer100g || 0}</Text>
              <Text style={[styles.foodUnit, { color: theme.textMuted }]}>kcal</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        />

        <ServingModal
          visible={!!selectedFood}
          food={selectedFood}
          onClose={() => setSelectedFood(null)}
          onLog={(entry) => {
            addEntry({
              name: selectedFood.name,
              meal: entry.meal || 'snack',
              amountG: entry.grams || 100,
              kcalPer100g: selectedFood.kcalPer100g || selectedFood.caloriesPer100g || 0,
              proteinPer100g: selectedFood.proteinPer100g || 0,
              carbsPer100g: selectedFood.carbsPer100g || 0,
              fatPer100g: selectedFood.fatPer100g || 0,
              sugarPer100g: selectedFood.sugarPer100g || 0,
              calories: Math.round((entry.grams || 100) / 100 * (selectedFood.kcalPer100g || selectedFood.caloriesPer100g || 0)),
            });
            setSelectedFood(null);
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
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500', padding: 0 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  freqChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1 },
  freqText: { fontSize: 12, fontWeight: '600', maxWidth: 100 },
  freqKcal: { fontSize: 11, fontWeight: '700' },
  foodRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  foodName: { fontSize: 14, fontWeight: '700' },
  foodBrand: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  foodKcal: { fontSize: 15, fontWeight: '800' },
  foodUnit: { fontSize: 11, fontWeight: '500' },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 60 },
  emptyText: { fontSize: 15, fontWeight: '600', opacity: 0.5 },
  emptySub: { fontSize: 12, fontWeight: '500', opacity: 0.35 },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../components/SafeGradient';
import { useSettings } from '../context/SettingsContext';
import GlassBg from '../components/GlassBg';

export default function RecipeDetailScreen({ route, navigation }) {
  const { theme, tr } = useSettings();
  const recipe = route.params?.recipe;
  if (!recipe) {
    return (
      <GlassBg theme={theme}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>Recipe</Text>
            <View style={{ width: 22 }} />
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
            <Ionicons name="alert-circle-outline" size={56} color={theme.textMuted} style={{ opacity: 0.4 }} />
            <Text style={{ fontSize: 17, fontWeight: '700', color: theme.text, textAlign: 'center' }}>Recipe not found</Text>
            <Text style={{ fontSize: 13, fontWeight: '500', color: theme.textMuted, textAlign: 'center' }}>The recipe you're looking for doesn't exist or was removed.</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, backgroundColor: theme.accent }}>
              <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 15 }}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </GlassBg>
    );
  }

  const macros = [
    { label: 'Protein', val: recipe.totalProtein, color: theme.protein },
    { label: 'Carbs', val: recipe.totalCarbs, color: theme.carbs },
    { label: 'Fat', val: recipe.totalFat, color: theme.fat },
  ];

  return (
    <GlassBg theme={theme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{recipe.name}</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <LinearGradient colors={[theme.accent + '22', theme.accent + '08']} style={[styles.kcalCard, { borderColor: theme.accent + '30' }]}>
            <Text style={[styles.kcalNum, { color: theme.accent }]}>{recipe.totalKcal || '—'}</Text>
            <Text style={[styles.kcalLabel, { color: theme.textMuted }]}>kcal per serving</Text>
            <Text style={[styles.servingInfo, { color: theme.textMuted }]}>{recipe.servings || 1} servings</Text>
          </LinearGradient>

          {recipe.description && (
            <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Description</Text>
              <Text style={[styles.descText, { color: theme.text }]}>{recipe.description}</Text>
            </View>
          )}

          {macros.some((m) => m.val > 0) && (
            <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Macros per serving</Text>
              {macros.map((m) => (
                <View key={m.label} style={styles.macroRow}>
                  <Text style={[styles.macroLabel, { color: theme.textMuted }]}>{m.label}</Text>
                  <View style={[styles.macroTrack, { backgroundColor: theme.surfaceAlt }]}>
                    <View style={[styles.macroFill, { width: `${Math.min((m.val || 0) / 100, 1) * 100}%`, backgroundColor: m.color }]} />
                  </View>
                  <Text style={[styles.macroVal, { color: theme.text }]}>{m.val || 0}g</Text>
                </View>
              ))}
            </View>
          )}

          {recipe.ingredients?.length > 0 && (
            <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Ingredients</Text>
              {recipe.ingredients.map((ing, i) => (
                <View key={i} style={styles.ingRow}>
                  <Text style={[styles.ingBullet, { color: theme.accent }]}>•</Text>
                  <Text style={[styles.ingText, { color: theme.text }]}>
                    {typeof ing === 'string' ? ing : `${ing.amountG ?? 100}g ${ing.name}`}
                  </Text>
                </View>
              ))}
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
  kcalCard: { borderRadius: 20, borderWidth: 1, padding: 20, alignItems: 'center', gap: 4 },
  kcalNum: { fontSize: 44, fontWeight: '900', letterSpacing: -2 },
  kcalLabel: { fontSize: 13, fontWeight: '600' },
  servingInfo: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  descText: { fontSize: 14, lineHeight: 20 },
  macroRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  macroLabel: { width: 50, fontSize: 12, fontWeight: '600' },
  macroTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  macroFill: { height: '100%', borderRadius: 3 },
  macroVal: { width: 40, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  ingRow: { flexDirection: 'row', gap: 6 },
  ingBullet: { fontSize: 14, lineHeight: 20 },
  ingText: { fontSize: 14, flex: 1, lineHeight: 20 },
});

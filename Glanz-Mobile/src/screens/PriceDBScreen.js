import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import GlassBg from '../components/GlassBg';
import { useSettings } from '../context/SettingsContext';
import { useShopping } from '../context/ShoppingContext';

export default function PriceDBScreen({ navigation }) {
  const { theme } = useSettings();
  const { priceHistory, updatePriceHistory, deletePriceEntry, renamePriceEntry } = useShopping();

  const [search, setSearch] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [addMode, setAddMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const entries = useMemo(() => {
    const q = search.toLowerCase().trim();
    return Object.entries(priceHistory)
      .filter(([k]) => !q || k.includes(q))
      .sort(([a], [b]) => a.localeCompare(b));
  }, [priceHistory, search]);

  const startEdit = (key, price) => {
    setEditingKey(key);
    setEditName(key.charAt(0).toUpperCase() + key.slice(1));
    setEditPrice(price > 0 ? String(price) : '');
  };

  const saveEdit = () => {
    if (!editName.trim()) return;
    const price = parseFloat(editPrice.replace(',', '.')) || 0;
    renamePriceEntry(editingKey, editName.trim(), price);
    setEditingKey(null);
  };

  const cancelEdit = () => setEditingKey(null);

  const handleDelete = (key) => {
    Alert.alert(
      'Remove entry',
      `Remove "${key.charAt(0).toUpperCase() + key.slice(1)}" from price memory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deletePriceEntry(key) },
      ],
    );
  };

  const saveNew = () => {
    if (!newName.trim()) return;
    const price = parseFloat(newPrice.replace(',', '.')) || 0;
    updatePriceHistory(newName.trim(), price > 0 ? price : 0.01);
    setNewName('');
    setNewPrice('');
    setAddMode(false);
  };

  const cancelAdd = () => {
    setNewName('');
    setNewPrice('');
    setAddMode(false);
  };

  const renderItem = ({ item: [key, price], index }) => {
    const isEditing = editingKey === key;
    const displayName = key.charAt(0).toUpperCase() + key.slice(1);

    return (
      <Animated.View entering={FadeInDown.delay(index * 25).duration(280)}>
        <View style={[s.row, { backgroundColor: theme.surface, borderColor: isEditing ? theme.borderAccent : theme.border }]}>
          <View style={[s.iconWrap, { backgroundColor: theme.accentLight }]}>
            <Ionicons name="pricetag-outline" size={15} color={theme.accent} />
          </View>

          {isEditing ? (
            <View style={s.editFields}>
              <TextInput
                style={[s.editNameInput, { color: theme.text, borderColor: theme.borderAccent, backgroundColor: theme.surfaceAlt }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Name"
                placeholderTextColor={theme.textMuted}
                autoFocus
                returnKeyType="next"
              />
              <TextInput
                style={[s.editPriceInput, { color: theme.accent, borderColor: theme.borderAccent, backgroundColor: theme.surfaceAlt }]}
                value={editPrice}
                onChangeText={setEditPrice}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.textMuted}
                returnKeyType="done"
                onSubmitEditing={saveEdit}
              />
              <TouchableOpacity onPress={saveEdit} style={[s.confirmBtn, { backgroundColor: theme.accent }]}>
                <Ionicons name="checkmark" size={17} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelEdit} style={s.ghostBtn} hitSlop={6}>
                <Ionicons name="close" size={17} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[s.name, { color: theme.text }]} numberOfLines={1}>{displayName}</Text>
              <Text style={[s.price, { color: price > 0 ? theme.accent : theme.textMuted }]}>
                {price > 0 ? `${price.toFixed(2)} €` : '—'}
              </Text>
              <TouchableOpacity onPress={() => startEdit(key, price)} style={s.ghostBtn} hitSlop={8}>
                <Ionicons name="pencil-outline" size={17} color={theme.textSub} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(key)} style={s.ghostBtn} hitSlop={8}>
                <Ionicons name="trash-outline" size={17} color={theme.danger} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <GlassBg theme={theme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={8}>
              <Ionicons name="chevron-back" size={26} color={theme.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[s.title, { color: theme.text }]}>Ingredient DB</Text>
              <Text style={[s.subtitle, { color: theme.textMuted }]}>
                {Object.keys(priceHistory).length} saved {Object.keys(priceHistory).length === 1 ? 'entry' : 'entries'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => { setAddMode(true); setEditingKey(null); }}
              style={[s.addBtn, { backgroundColor: theme.accent }]}
              hitSlop={4}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={22} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={[s.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="search-outline" size={15} color={theme.textMuted} />
            <TextInput
              style={[s.searchInput, { color: theme.text }]}
              value={search}
              onChangeText={setSearch}
              placeholder="Search ingredients…"
              placeholderTextColor={theme.textMuted}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={15} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Add new row */}
          {addMode && (
            <Animated.View entering={FadeIn.duration(200)}>
              <View style={[s.addRow, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderAccent }]}>
                <Ionicons name="add-circle-outline" size={16} color={theme.accent} />
                <TextInput
                  style={[s.editNameInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceAlt, flex: 1 }]}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Ingredient name"
                  placeholderTextColor={theme.textMuted}
                  autoFocus
                  returnKeyType="next"
                />
                <TextInput
                  style={[s.editPriceInput, { color: theme.accent, borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
                  value={newPrice}
                  onChangeText={setNewPrice}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={theme.textMuted}
                  returnKeyType="done"
                  onSubmitEditing={saveNew}
                />
                <TouchableOpacity onPress={saveNew} style={[s.confirmBtn, { backgroundColor: theme.accent }]}>
                  <Ionicons name="checkmark" size={17} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelAdd} style={s.ghostBtn} hitSlop={6}>
                  <Ionicons name="close" size={17} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* Info banner */}
          <View style={[s.banner, { backgroundColor: theme.accentLight, borderColor: theme.borderAccent }]}>
            <Ionicons name="flash-outline" size={13} color={theme.accent} />
            <Text style={[s.bannerText, { color: theme.accent }]}>
              Prices auto-fill when the same ingredient appears in a new list
            </Text>
          </View>

          {/* List */}
          <FlatList
            data={entries}
            keyExtractor={([key]) => key}
            renderItem={renderItem}
            contentContainerStyle={[s.list, { paddingBottom: 48 }]}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="pricetags-outline" size={48} color={theme.textMuted} />
                <Text style={[s.emptyTitle, { color: theme.text }]}>No entries yet</Text>
                <Text style={[s.emptyDesc, { color: theme.textMuted }]}>
                  Prices are saved automatically when you enter them while shopping, or tap + to add manually.
                </Text>
              </View>
            }
          />

        </KeyboardAvoidingView>
      </SafeAreaView>
    </GlassBg>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14, gap: 10,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, marginTop: 1 },
  addBtn: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 8,
    paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 14, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 16, marginBottom: 10,
    paddingHorizontal: 11, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1,
  },
  bannerText: { fontSize: 12, flex: 1, lineHeight: 16 },
  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 16, marginBottom: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1.5,
  },
  list: { paddingHorizontal: 16, gap: 7 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 13, paddingVertical: 11,
    borderRadius: 14, borderWidth: 1,
  },
  iconWrap: {
    width: 28, height: 28, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  name: { flex: 1, fontSize: 15, fontWeight: '500' },
  price: { fontSize: 14, fontWeight: '700', minWidth: 58, textAlign: 'right' },
  ghostBtn: { padding: 4 },
  editFields: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  editNameInput: {
    flex: 1, fontSize: 14, paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1,
  },
  editPriceInput: {
    width: 70, fontSize: 14, paddingHorizontal: 8, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1, textAlign: 'right',
  },
  confirmBtn: {
    width: 30, height: 30, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
  },
  empty: { alignItems: 'center', paddingTop: 64, gap: 10, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyDesc: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
});

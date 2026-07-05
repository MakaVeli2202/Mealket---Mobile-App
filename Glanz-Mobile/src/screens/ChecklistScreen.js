import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Platform, ActivityIndicator, Image, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import ConfirmModal from '../components/ConfirmModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../components/SafeGradient';
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import GlassBg from '../components/GlassBg';
import GlassCard from '../components/GlassCard';
import { useSettings } from '../context/SettingsContext';
import { useShopping } from '../context/ShoppingContext';
import { parseShoppingText } from '../utils/parser';
import StoreGroup from '../components/StoreGroup';
import PriceSummary from '../components/PriceSummary';
import ProgressBar from '../components/ProgressBar';
import SpringPressable from '../components/SpringPressable';

export default function ChecklistScreen({ navigation }) {
  const { theme, tr, language } = useSettings();
  const { currentList, toggleItem, updateItemPrice, moveItemToNextStore, restoreItem, closeList } = useShopping();
  const c = tr.checklist;
  const p = tr.paste;
  const tabBarHeight = Platform.OS === 'ios' ? 96 : 80;
  const [pasteText, setPasteText] = useState('');
  const [pasteLoading, setPasteLoading] = useState(false);
  const [closeModalVisible, setCloseModalVisible] = useState(false);

  const glowOpacity = useSharedValue(0.3);
  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1, true
    );
  }, []);
  const glowAnimStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  if (!currentList) {
    const handlePasteFromClipboard = async () => {
      setPasteLoading(true);
      try {
        const clipped = await Clipboard.getStringAsync();
        const input = clipped?.trim() ?? '';
        if (!input) { setPasteLoading(false); return; }
        setPasteText(input);
        const list = parseShoppingText(input, language);
        navigation.navigate('Review', { parsedList: list });
      } catch (_) {} finally {
        setPasteLoading(false);
      }
    };

    const handleParseTyped = () => {
      const input = pasteText.trim();
      if (!input) return;
      const list = parseShoppingText(input, language);
      navigation.navigate('Review', { parsedList: list });
    };

    return (
      <GlassBg theme={theme}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.hero}>
              <TouchableOpacity
                onPress={() => navigation.navigate('History')}
                style={[styles.heroHistoryBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                hitSlop={8}
                activeOpacity={0.75}
              >
                <Ionicons name="time" size={22} color={theme.accent} />
              </TouchableOpacity>
              <Image source={require('../../assets/MealKet-Icon.png')} style={styles.heroIcon} />
              <Text style={[styles.heroTitle, { color: theme.text }]}>Mealket</Text>
              <Text style={[styles.heroTagline, { color: theme.accent }]}>{p.subtitle}</Text>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.pasteContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="interactive"
            >
              <GlassCard theme={theme} intensity={65} radius={18}>
                <TextInput
                  style={[styles.pasteInput, { color: theme.text }]}
                  multiline
                  value={pasteText}
                  onChangeText={setPasteText}
                  placeholder={p.placeholder}
                  placeholderTextColor={theme.textSub}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlignVertical="top"
                />
              </GlassCard>
            </ScrollView>

            {/* Sticky action buttons — always visible above keyboard */}
            <View style={[styles.pasteStickyActions, { borderTopColor: theme.border + '30' }]}>
              {!!pasteText.trim() && (
                <TouchableOpacity
                  onPress={handleParseTyped}
                  activeOpacity={0.82}
                  style={[styles.parseSecondary, { borderColor: theme.accent + '80', backgroundColor: theme.accent + '15' }]}
                >
                  <Ionicons name="list-outline" size={18} color={theme.accent} />
                  <Text style={[styles.parseSecondaryText, { color: theme.accent }]}>{p.parseTyped}</Text>
                  <Ionicons name="arrow-forward" size={16} color={theme.accent + '80'} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handlePasteFromClipboard}
                disabled={pasteLoading}
                activeOpacity={0.88}
                style={styles.pasteBtnOuter}
              >
                <LinearGradient
                  colors={[theme.accent, theme.accentDark]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.pasteBtn}
                >
                  {pasteLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <View style={styles.pasteBtnIconWrap}>
                        <Ionicons name="clipboard-sharp" size={20} color="#FFF" />
                      </View>
                      <Text style={styles.pasteBtnText}>{p.pasteFromClipboard}</Text>
                      <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.6)" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </GlassBg>
    );
  }

  const { stores, title } = currentList;
  const regularStores = stores.filter((s) => s.id !== '__not_found__');
  const notFoundStore = stores.find((s) => s.id === '__not_found__');
  const allStores = notFoundStore ? [...regularStores, notFoundStore] : regularStores;

  const totalItems   = stores.reduce((s, g) => s + g.items.length, 0);
  const checkedTotal = stores.reduce((s, g) => s + g.checkedCount, 0);
  const globalProgress = totalItems > 0 ? checkedTotal / totalItems : 0;
  const allDone = checkedTotal === totalItems && totalItems > 0;
  const progressColor = allDone ? theme.accentGreen : theme.accent;

  const ListHeader = (
    <Animated.View
      entering={FadeInDown.duration(300).springify().damping(18)}
      style={[styles.header, { backgroundColor: 'transparent' }]}
    >
      <View style={styles.headerTop}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <View style={styles.titleRow}>
            <Image source={require('../../assets/MealKet-Icon.png')} style={styles.appIcon} />
            <Text style={[styles.listTitle, { color: theme.text }]} numberOfLines={2}>
              {title || c.title}
            </Text>
          </View>
          <View style={styles.progressRow}>
            <Text style={[styles.progressCount, { color: progressColor }]}>{checkedTotal}</Text>
            <Text style={[styles.progressSep, { color: theme.textMuted }]}> / {totalItems}</Text>
            {allDone && (
              <Animated.View entering={FadeIn.duration(300)} style={{ marginLeft: 6 }}>
                <Ionicons name="checkmark-circle" size={18} color={theme.accentGreen} />
              </Animated.View>
            )}
          </View>
        </View>
        <SpringPressable onPress={() => navigation.navigate('Paste')} scaleDown={0.93}>
          <LinearGradient colors={[theme.accent, theme.accentDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.addCircleBtn}>
            <Animated.View style={[styles.addCirclePulse, { backgroundColor: theme.accent }, glowAnimStyle]} />
            <Ionicons name="add" size={26} color="#FFF" />
          </LinearGradient>
        </SpringPressable>
      </View>

      <ProgressBar progress={globalProgress} color={progressColor} theme={theme} />

      <View style={[styles.swipeHint, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, borderWidth: 1 }]}>
        <Ionicons name="swap-horizontal" size={14} color={theme.accent} />
        <Text style={[styles.swipeHintText, { color: theme.textSub }]}>{c.swipeHint}</Text>
      </View>

      <SpringPressable onPress={() => setCloseModalVisible(true)} scaleDown={0.95}>
        <View style={styles.closeListPill}>
          <Ionicons name="close" size={14} color="#FF453A" />
          <Text style={styles.closeListText}>Close list</Text>
        </View>
      </SpringPressable>
    </Animated.View>
  );

  return (
    <GlassBg theme={theme}>
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ConfirmModal
        visible={closeModalVisible}
        title="Close Shopping List"
        message="Save this list to history and close it?"
        confirmLabel="Close List"
        cancelLabel="Keep Shopping"
        confirmColor="#FF453A"
        iconName="checkmark-done-circle-outline"
        iconColor="#FF453A"
        onConfirm={async () => { setCloseModalVisible(false); await closeList(); navigation.navigate('Main'); }}
        onCancel={() => setCloseModalVisible(false)}
        theme={theme}
      />
      <FlatList
        data={allStores}
        keyExtractor={(s) => s.id || s.name || s.color}
        renderItem={({ item: store }) => (
          <StoreGroup
            store={store}
            storeIndex={stores.indexOf(store)}
            totalStores={stores.length}
            onToggleItem={toggleItem}
            onPriceChange={updateItemPrice}
            onNotFound={moveItemToNextStore}
            onRestoreItem={restoreItem}
          />
        )}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={
          <>
            <PriceSummary stores={allStores} />
            <View style={{ height: tabBarHeight + 16 }} />
          </>
        }
        contentContainerStyle={{ paddingTop: 8 }}
      />
    </SafeAreaView>
    </GlassBg>
  );
}

const styles = StyleSheet.create({
  appIcon: { width: 28, height: 28, borderRadius: 7, marginRight: 8 },
  header: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 10, gap: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  listTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3, lineHeight: 24, flex: 1 },
  progressRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  progressCount: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  progressSep: { fontSize: 16, fontWeight: '600' },
  newListBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  newListText: { fontSize: 13, fontWeight: '700' },
  addCircleBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  addCirclePulse: { position: 'absolute', top: -4, left: -4, right: -4, bottom: -4, borderRadius: 26, opacity: 0.35 },
  closeListPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,69,58,0.45)', backgroundColor: 'rgba(255,69,58,0.08)' },
  closeListText: { fontSize: 13, fontWeight: '700', color: '#FF453A' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  legendPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  legendText: { fontSize: 12, fontWeight: '700' },
  swipeHint: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 12 },
  swipeHintText: { fontSize: 11, flex: 1 },

  hero: {
    alignItems: 'center', paddingTop: 24, paddingBottom: 4,
    paddingHorizontal: 20,
  },
  heroIcon: { width: 80, height: 80, borderRadius: 22, marginBottom: 12 },
  heroTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.8, marginBottom: 2 },
  heroTagline: { fontSize: 14, fontWeight: '600', letterSpacing: 0.4 },
  heroHistoryBtn: {
    position: 'absolute', top: 18, right: 20,
    width: 46, height: 46, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  pasteContainer: { padding: 20, paddingBottom: 8 },
  pasteStickyActions: { gap: 10, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 90, borderTopWidth: StyleSheet.hairlineWidth },
  pasteInput: { minHeight: 160, padding: 16, fontSize: 15, lineHeight: 24, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  pasteBtnOuter: { borderRadius: 18, overflow: 'hidden' },
  pasteBtn: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20 },
  pasteBtnIconWrap: { width: 30, height: 30, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  pasteBtnText: { flex: 1, color: '#FFF', fontSize: 17, fontWeight: '800' },
  parseSecondary: { borderRadius: 14, height: 46, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  parseSecondaryText: { fontSize: 14, fontWeight: '700' },
});

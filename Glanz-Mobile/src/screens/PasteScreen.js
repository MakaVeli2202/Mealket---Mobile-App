import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Dimensions, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../components/SafeGradient';
import * as Clipboard from 'expo-clipboard';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withRepeat, withSequence,
  interpolate, Extrapolation, FadeInDown,
  Easing,
} from 'react-native-reanimated';
import { useSettings } from '../context/SettingsContext';
import { parseShoppingText } from '../utils/parser';
import GlassCard from '../components/GlassCard';
import GlassBg from '../components/GlassBg';

const { width: W } = Dimensions.get('window');
const TAB_BAR_H = Platform.OS === 'ios' ? 96 : 80;

export default function PasteScreen({ navigation, route }) {
  const { theme, tr, language } = useSettings();
  const p = tr.paste;
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const borderGlow = useSharedValue(0);
  const pasteScale = useSharedValue(1);
  const iconSpin = useSharedValue(0);

  useEffect(() => {
    const shared = route?.params?.sharedText;
    if (shared) setText(shared);
  }, [route?.params?.sharedText]);

  useEffect(() => {
    borderGlow.value = withTiming(focused ? 1 : 0, { duration: 300 });
  }, [focused]);

  useEffect(() => {
    iconSpin.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
        withTiming(0, { duration: 3000, easing: Easing.bezier(0.42, 0, 0.58, 1) })
      ), -1
    );
  }, []);

  const handlePasteFromClipboard = async () => {
    pasteScale.value = withSequence(
      withTiming(0.93, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    setLoading(true);
    try {
      const clipped = await Clipboard.getStringAsync();
      const input = clipped?.trim() ?? '';
      if (!input) { setLoading(false); return; }
      setText(input);
      const list = parseShoppingText(input, language);
      navigation.navigate('Review', { parsedList: list });
    } catch (_) {} finally {
      setLoading(false);
    }
  };

  const handleParseTyped = () => {
    const input = text.trim();
    if (!input) return;
    const list = parseShoppingText(input, language);
    navigation.navigate('Review', { parsedList: list });
  };

  const cardBorderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(212,168,64,${interpolate(borderGlow.value, [0, 1], [0.18, 0.9], Extrapolation.CLAMP)})`,
    shadowOpacity: interpolate(borderGlow.value, [0, 1], [0.0, 0.35], Extrapolation.CLAMP),
    shadowRadius: interpolate(borderGlow.value, [0, 1], [0, 20], Extrapolation.CLAMP),
  }));

  const iconFloatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(iconSpin.value, [0, 1], [0, -4], Extrapolation.CLAMP) }],
  }));

  const pasteBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pasteScale.value }],
  }));

  const lineCount = text.split('\n').filter(l => l.trim()).length;
  const charCount = text.length;

  return (
    <GlassBg theme={theme}>
    <SafeAreaView style={[styles.root, { backgroundColor: 'transparent' }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <Animated.View entering={FadeInDown.duration(400).springify().damping(20)} style={styles.hero}>
          <View style={styles.heroLeft}>
            <Image source={require('../../assets/MealKet-Icon.png')} style={styles.appIconImg} />
            <View>
              <Text style={[styles.appName, { color: theme.text }]}>Mealket</Text>
              <Text style={[styles.tagline, { color: theme.accent }]}>{p.subtitle}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('History')}
            style={[styles.historyBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
            hitSlop={8}
            activeOpacity={0.75}
          >
            <Ionicons name="time" size={18} color={theme.accent} />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scroll, { paddingBottom: 8 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
        >

          <Animated.View
            entering={FadeInDown.duration(350).delay(60).springify().damping(20)}
            style={styles.sectionLabel}
          >
            <View style={[styles.labelDot, { backgroundColor: text ? theme.accent : theme.textMuted }]} />
            <Text style={[styles.labelText, { color: text ? theme.textSub : theme.textMuted }]}>
              {text ? `${lineCount} ${lineCount === 1 ? 'item line' : 'item lines'}  ${charCount} chars` : p.placeholder?.split('\n')[0] || 'Paste or type your list'}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(380).delay(100).springify().damping(20)}
            style={[styles.inputCardOuter, cardBorderStyle]}
          >
            <GlassCard theme={theme} intensity={65} glow style={styles.inputCard}>
              <View style={[styles.termBar, { borderBottomColor: theme.border + '60' }]}>
                <Ionicons name="document-text-outline" size={12} color={theme.accent} />
                <Text style={[styles.termLabel, { color: theme.textMuted }]}>shopping-list.txt</Text>
              </View>

              <TextInput
                ref={inputRef}
                style={[styles.input, { color: theme.text }]}
                multiline
                value={text}
                onChangeText={setText}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={p.placeholder}
                placeholderTextColor={theme.textSub}
                autoCapitalize="none"
                autoCorrect={false}
                textAlignVertical="top"
              />

              {focused && (
                <LinearGradient
                  colors={[theme.accent + '00', theme.accent, theme.accent + '00']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.inputGlowLine}
                />
              )}
            </GlassCard>
          </Animated.View>

          {!!text && (
            <Animated.View
              entering={FadeInDown.duration(200)}
              style={styles.clearRow}
            >
              <TouchableOpacity
                style={[styles.clearChip, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                onPress={() => setText('')}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={13} color={theme.danger} />
                <Text style={[styles.clearText, { color: theme.danger }]}>{p.clear}</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

        </ScrollView>

        {/* Sticky action buttons — always visible above keyboard */}
        <View style={[styles.stickyActions, { borderTopColor: theme.border + '30' }]}>
          {!!text.trim() && (
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
          <Animated.View style={pasteBtnStyle}>
            <TouchableOpacity
              onPress={handlePasteFromClipboard}
              disabled={loading}
              activeOpacity={0.88}
              style={styles.parseBtnOuter}
            >
              <LinearGradient
                colors={[theme.accent, theme.accentDark]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.parseBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <View style={styles.parseBtnIconWrap}>
                      <Ionicons name="clipboard-sharp" size={20} color="#FFF" />
                    </View>
                    <Text style={styles.parseBtnText}>{p.pasteFromClipboard}</Text>
                    <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.6)" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </GlassBg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  hero: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10,
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  appIconImg: { width: 42, height: 42, borderRadius: 11 },
  logoWrap: { borderRadius: 16, padding: 3 },
  logoGrad: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  appName: { fontSize: 22, fontWeight: '900', letterSpacing: -0.8 },
  tagline: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4, marginTop: 1 },
  historyBtn: {
    width: 38, height: 38, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  scroll: { paddingHorizontal: 16, paddingTop: 4 },

  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10, paddingHorizontal: 2 },
  labelDot: { width: 6, height: 6, borderRadius: 3 },
  labelText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },

  inputCardOuter: { marginBottom: 12 },
  inputCard: {
    borderRadius: 18,
  },
  termBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1,
  },
  termLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  input: {
    minHeight: 160, maxHeight: 280, padding: 16, paddingTop: 14,
    fontSize: 15, lineHeight: 24, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inputGlowLine: { height: 2, marginHorizontal: 0 },

  clearRow: { alignItems: 'flex-start', marginBottom: 4 },
  clearChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
  },
  clearText: { fontSize: 12, fontWeight: '600' },

  stickyActions: { gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: TAB_BAR_H + 8, borderTopWidth: StyleSheet.hairlineWidth },
  parseBtnOuter: { borderRadius: 18, overflow: 'hidden' },
  parseBtn: {
    height: 58, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20,
  },
  parseBtnIconWrap: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  parseBtnText: { flex: 1, color: '#FFF', fontSize: 17, fontWeight: '800' },
  parseSecondary: {
    borderRadius: 14, height: 46, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  parseSecondaryText: { fontSize: 14, fontWeight: '700' },
});

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useSettings } from '../context/SettingsContext';
import { parseShoppingText } from '../utils/parser';

export default function PasteScreen({ navigation, route }) {
  const { theme, tr } = useSettings();
  const p = tr.paste;
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const shared = route?.params?.sharedText;
    if (shared) setText(shared);
  }, [route?.params?.sharedText]);

  const handlePasteAndParse = async () => {
    setLoading(true);
    try {
      const clipped = await Clipboard.getStringAsync();
      const input = clipped?.trim() || text.trim();
      if (!input) { setLoading(false); return; }
      if (clipped?.trim()) setText(clipped.trim());
      const list = parseShoppingText(input);
      navigation.navigate('Review', { parsedList: list });
    } catch (_) {
      // If clipboard fails, parse whatever is in the text box
      if (text.trim()) {
        const list = parseShoppingText(text.trim());
        navigation.navigate('Review', { parsedList: list });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleParseOnly = () => {
    if (!text.trim()) return;
    const list = parseShoppingText(text.trim());
    navigation.navigate('Review', { parsedList: list });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logoMark, { backgroundColor: theme.accentLight }]}>
            <Ionicons name="cart-outline" size={20} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>Mealket</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>{p.subtitle}</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('History')}
            style={[styles.historyBtn, { backgroundColor: theme.surfaceAlt }]}
            hitSlop={8}
            activeOpacity={0.75}
          >
            <Ionicons name="time-outline" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Input card */}
          <View style={[styles.inputCard, { backgroundColor: theme.surface, borderColor: theme.border }, theme.shadow.sm]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              multiline
              value={text}
              onChangeText={setText}
              placeholder={p.placeholder}
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              textAlignVertical="top"
            />
          </View>

          {/* Clear button — only when there's text */}
          {!!text && (
            <TouchableOpacity style={styles.clearBtn} onPress={() => setText('')} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={15} color={theme.textMuted} />
              <Text style={[styles.clearText, { color: theme.textMuted }]}>{p.clear}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Buttons */}
        <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
          {/* Primary: Paste from clipboard & parse */}
          <TouchableOpacity
            style={[styles.parseBtn, { backgroundColor: theme.accent }]}
            onPress={handlePasteAndParse}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <>
                  <Ionicons name="clipboard-outline" size={20} color="#FFF" />
                  <Text style={styles.parseBtnText}>
                    {text.trim() ? 'Paste & Parse' : 'Paste from Clipboard'}
                  </Text>
                </>
            }
          </TouchableOpacity>

          {/* Secondary: parse only typed text (shown when user typed something) */}
          {!!text.trim() && (
            <TouchableOpacity
              style={[styles.parseSecondary, { borderColor: theme.border }]}
              onPress={handleParseOnly}
              activeOpacity={0.75}
            >
              <Ionicons name="list-outline" size={17} color={theme.textMuted} />
              <Text style={[styles.parseSecondaryText, { color: theme.textMuted }]}>
                Parse typed text
              </Text>
            </TouchableOpacity>
          )}
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
  },
  historyBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  logoMark: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 1 },

  scroll: { padding: 16, paddingBottom: 24 },
  inputCard: { borderRadius: 20, borderWidth: 1.5, overflow: 'hidden' },
  input: { minHeight: 260, padding: 18, fontSize: 15, lineHeight: 24 },

  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, alignSelf: 'center',
    paddingVertical: 10, paddingHorizontal: 14,
    minHeight: 44,
  },
  clearText: { fontSize: 13 },

  footer: { padding: 16, paddingBottom: 20, borderTopWidth: 1, gap: 10 },
  parseBtn: {
    borderRadius: 18, height: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  parseBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  parseSecondary: {
    borderRadius: 14, height: 44, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  parseSecondaryText: { fontSize: 14, fontWeight: '600' },
});

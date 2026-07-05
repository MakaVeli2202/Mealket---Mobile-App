import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, Platform, KeyboardAvoidingView, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../components/SafeGradient';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import { useSettings } from '../context/SettingsContext';
import { useBudget, getCurrentPeriod } from '../context/BudgetContext';
import { parseGeorgeCSV, importSummary } from '../utils/georgeImport';
import GlassBg from '../components/GlassBg';
import GlassCard from '../components/GlassCard';

const ICON_OPTIONS = [
  'cart-outline','car-outline','home-outline','heart-outline','flash-outline',
  'restaurant-outline','airplane-outline','school-outline','barbell-outline',
  'shirt-outline','phone-portrait-outline','tv-outline','wifi-outline',
  'gift-outline','musical-notes-outline','paw-outline','bus-outline',
  'bicycle-outline','ellipsis-horizontal-outline',
];

const COLOR_OPTIONS = [
  '#00E5A8','#00B8FF','#8B5CF6','#EC4899','#F59E0B',
  '#EF4444','#22C55E','#0A84FF','#FF9F0A','#6B7280',
];

function fmt(n) {
  return (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function statusInfo(spent, budget) {
  if (!budget || budget <= 0) return { label: 'No limit', color: '#6B7280', icon: 'infinite-outline', pct: 0 };
  const pct = spent / budget;
  if (pct <= 0.7) return { label: 'On Track', color: '#00E5A8', icon: 'checkmark-circle-outline', pct };
  if (pct <= 0.9) return { label: 'Careful', color: '#F59E0B', icon: 'warning-outline', pct };
  if (pct <= 1.0) return { label: 'Almost', color: '#FF9F0A', icon: 'alert-circle-outline', pct };
  return { label: 'Over Budget', color: '#EF4444', icon: 'close-circle-outline', pct };
}

function ProgressBar({ pct, color, height = 6 }) {
  const clamped = Math.min(pct, 1);
  return (
    <View style={[pb.track, { height }]}>
      <View style={[pb.fill, { width: `${clamped * 100}%`, backgroundColor: color }]} />
    </View>
  );
}
const pb = StyleSheet.create({
  track: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 99 },
});

function CategoryCard({ cat, spent, onPress, onDelete, theme, index }) {
  const budget = cat.budget || 0;
  const { label, color, icon, pct } = statusInfo(spent, budget);
  return (
    <Animated.View entering={FadeInDown.duration(250).delay(index * 35).springify()} layout={Layout.springify()}>
      <GlassCard theme={theme} intensity={50} radius={18} style={styles.catCard}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.catCardInner}>
          <View style={[styles.catIcon, { backgroundColor: cat.color + '28', borderColor: cat.color + '50', borderWidth: 1.5 }]}>
            <Ionicons name={cat.icon} size={22} color={cat.color} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={styles.catRow}>
              <Text style={[styles.catName, { color: theme.text }]}>{cat.name}</Text>
              <View style={[styles.statusPill, { backgroundColor: color + '20', borderColor: color + '50', borderWidth: 1 }]}>
                <Ionicons name={icon} size={11} color={color} />
                <Text style={[styles.statusTxt, { color }]}>{label}</Text>
              </View>
            </View>
            <View style={styles.catRow}>
              <Text style={[styles.spentAmt, { color: theme.text }]}>{fmt(spent)}</Text>
              {budget > 0 && (
                <Text style={[styles.budgetAmt, { color: theme.textMuted }]}>/ {fmt(budget)}</Text>
              )}
            </View>
            {budget > 0 && <ProgressBar pct={pct} color={pct > 1 ? '#EF4444' : cat.color} height={5} />}
            {budget > 0 && (
              <Text style={[styles.remainTxt, { color: theme.textMuted }]}>
                {budget - spent >= 0
                  ? `${fmt(budget - spent)} remaining`
                  : `${fmt(spent - budget)} over budget`}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={onDelete} hitSlop={8} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        </TouchableOpacity>
      </GlassCard>
    </Animated.View>
  );
}

function ExpenseRow({ exp, catName, catColor, onDelete, theme }) {
  return (
    <View style={[styles.expRow, { borderBottomColor: theme.border }]}>
      <View style={[styles.expDot, { backgroundColor: catColor + '30', borderColor: catColor + '60' }]}>
        <View style={[styles.expDotInner, { backgroundColor: catColor }]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.expLabel, { color: theme.text }]}>{exp.label || catName}</Text>
        <Text style={[styles.expMeta, { color: theme.textMuted }]}>{catName} · {fmtDate(exp.date)}</Text>
      </View>
      <Text style={[styles.expAmt, { color: theme.text }]}>-{fmt(exp.amount)}</Text>
      <TouchableOpacity onPress={() => onDelete(exp.id)} hitSlop={8} style={{ marginLeft: 8 }}>
        <Ionicons name="close-circle" size={18} color={theme.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

function SheetBackdrop({ onClose }) {
  return (
    <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose}>
      {Platform.OS === 'ios'
        ? <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
        : <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.72)' }]} />
      }
    </Pressable>
  );
}

function AddExpenseModal({ visible, onClose, categories, theme, onAdd }) {
  const [catId, setCatId] = useState(categories[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');

  const handleAdd = () => {
    const amt = parseFloat(amount);
    if (!catId || isNaN(amt) || amt <= 0) return;
    onAdd({ categoryId: catId, amount: amt, label: label.trim() });
    setAmount(''); setLabel('');
    onClose();
  };

  const selectedCat = categories.find(c => c.id === catId);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SheetBackdrop onClose={onClose} />
        <View style={[styles.sheet, { backgroundColor: 'transparent' }]}>
          <View style={[styles.sheetInner, { backgroundColor: '#0E1221', borderColor: 'rgba(255,255,255,0.10)' }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: theme.text }]}>Add Expense</Text>

            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {categories.map(c => (
                <TouchableOpacity key={c.id} onPress={() => setCatId(c.id)} style={[
                  styles.catChip,
                  { borderColor: catId === c.id ? c.color : theme.border, backgroundColor: catId === c.id ? c.color + '22' : 'transparent' }
                ]}>
                  <Ionicons name={c.icon} size={14} color={catId === c.id ? c.color : theme.textMuted} />
                  <Text style={[styles.catChipTxt, { color: catId === c.id ? c.color : theme.textMuted }]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Amount</Text>
            <View style={[styles.inputRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Text style={[styles.currSign, { color: selectedCat?.color || theme.accent }]}>$</Text>
              <TextInput
                style={[styles.input, { color: theme.text, flex: 1 }]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Description (optional)</Text>
            <View style={[styles.inputRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.text, flex: 1 }]}
                value={label}
                onChangeText={setLabel}
                placeholder="e.g. Grocery run, Fill-up..."
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <TouchableOpacity onPress={handleAdd} activeOpacity={0.85} style={{ marginTop: 8 }}>
              <LinearGradient
                colors={[selectedCat?.color || theme.accent, (selectedCat?.color || theme.accent) + 'AA']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.sheetBtn}
              >
                <Text style={styles.sheetBtnTxt}>Add Expense</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function AddCategoryModal({ visible, onClose, theme, onAdd }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICON_OPTIONS[0]);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [budget, setBudget] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), icon, color, budget: parseFloat(budget) || 0 });
    setName(''); setIcon(ICON_OPTIONS[0]); setColor(COLOR_OPTIONS[0]); setBudget('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SheetBackdrop onClose={onClose} />
        <View style={[styles.sheet, { backgroundColor: 'transparent' }]}>
          <View style={[styles.sheetInner, { backgroundColor: '#0E1221', borderColor: 'rgba(255,255,255,0.10)', maxHeight: '90%' }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: theme.text }]}>New Category</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Name</Text>
              <View style={[styles.inputRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                <TextInput
                  style={[styles.input, { color: theme.text, flex: 1 }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Diesel, Subscriptions..."
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Monthly Budget (optional)</Text>
              <View style={[styles.inputRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                <Text style={[styles.currSign, { color }]}>$</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, flex: 1 }]}
                  value={budget}
                  onChangeText={setBudget}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Icon</Text>
              <View style={styles.iconGrid}>
                {ICON_OPTIONS.map(ic => (
                  <TouchableOpacity key={ic} onPress={() => setIcon(ic)} style={[
                    styles.iconCell,
                    { backgroundColor: icon === ic ? color + '30' : theme.surfaceAlt, borderColor: icon === ic ? color : theme.border, borderWidth: 1.5 }
                  ]}>
                    <Ionicons name={ic} size={20} color={icon === ic ? color : theme.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Color</Text>
              <View style={styles.colorRow}>
                {COLOR_OPTIONS.map(c => (
                  <TouchableOpacity key={c} onPress={() => setColor(c)} style={[
                    styles.colorDot,
                    { backgroundColor: c, borderWidth: color === c ? 3 : 1, borderColor: color === c ? '#fff' : 'transparent' }
                  ]} />
                ))}
              </View>

              <TouchableOpacity onPress={handleAdd} activeOpacity={0.85} style={{ marginTop: 16, marginBottom: 8 }}>
                <LinearGradient
                  colors={[color, color + 'AA']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.sheetBtn}
                >
                  <Text style={styles.sheetBtnTxt}>Add Category</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PeriodModal({ visible, onClose, currentDay, theme, onSave }) {
  const [day, setDay] = useState(String(currentDay));
  const d = parseInt(day, 10);
  const valid = !isNaN(d) && d >= 1 && d <= 28;

  const preview = useMemo(() => {
    if (!valid) return null;
    const { start, end } = getCurrentPeriod(d);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }, [d, valid]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SheetBackdrop onClose={onClose} />
        <View style={[styles.sheet, { backgroundColor: 'transparent' }]}>
          <View style={[styles.sheetInner, { backgroundColor: '#0E1221', borderColor: 'rgba(255,255,255,0.10)' }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: theme.text }]}>Budget Period Start</Text>
            <Text style={[styles.periodHint, { color: theme.textMuted }]}>
              Which day of the month does your budget period start? (e.g. 1 for the 1st, 28 for the 28th)
            </Text>
            <View style={[styles.inputRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.text, flex: 1, fontSize: 28, fontWeight: '800', textAlign: 'center' }]}
                value={day}
                onChangeText={setDay}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            {valid && preview && (
              <Animated.View entering={FadeInUp.duration(200)}>
                <View style={[styles.previewCard, { backgroundColor: theme.accent + '18', borderColor: theme.accent + '40' }]}>
                  <Ionicons name="calendar-outline" size={16} color={theme.accent} />
                  <Text style={[styles.previewTxt, { color: theme.accent }]}>Current period: {preview}</Text>
                </View>
              </Animated.View>
            )}
            <TouchableOpacity
              onPress={() => { if (valid) { onSave(d); onClose(); } }}
              activeOpacity={0.85}
              style={{ marginTop: 16 }}
            >
              <LinearGradient
                colors={[theme.accent, theme.accent + 'AA']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.sheetBtn}
              >
                <Text style={styles.sheetBtnTxt}>Save</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function TotalBudgetModal({ visible, onClose, current, theme, onSave }) {
  const [val, setVal] = useState(current > 0 ? String(current) : '');
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SheetBackdrop onClose={onClose} />
        <View style={[styles.sheet, { backgroundColor: 'transparent' }]}>
          <View style={[styles.sheetInner, { backgroundColor: '#0E1221', borderColor: 'rgba(255,255,255,0.10)' }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: theme.text }]}>Total Budget</Text>
            <Text style={[styles.periodHint, { color: theme.textMuted }]}>
              Set your total spending limit for the budget period.
            </Text>
            <View style={[styles.inputRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Text style={[styles.currSign, { color: theme.accent }]}>$</Text>
              <TextInput
                style={[styles.input, { color: theme.text, flex: 1 }]}
                value={val}
                onChangeText={setVal}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.textMuted}
              />
            </View>
            <TouchableOpacity
              onPress={() => { onSave(parseFloat(val) || 0); onClose(); }}
              activeOpacity={0.85} style={{ marginTop: 16 }}
            >
              <LinearGradient
                colors={[theme.accent, theme.accent + 'AA']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.sheetBtn}
              >
                <Text style={styles.sheetBtnTxt}>Save</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const CAT_LABELS = {
  food: 'Food & Groceries', transport: 'Transport', rent: 'Rent / Housing',
  health: 'Health', utilities: 'Utilities', other: 'Other',
};

function GeorgeImportModal({ visible, onClose, theme, onImport }) {
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => { setCsvText(''); setPreview(null); setError(''); };

  const handleClose = () => { reset(); onClose(); };

  const pasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (!text) { setError('Clipboard is empty.'); return; }
      setCsvText(text);
      setError('');
    } catch {
      setError('Could not read clipboard.');
    }
  };

  const handleParse = () => {
    setError('');
    setPreview(null);
    if (!csvText.trim()) { setError('Paste your George CSV first.'); return; }
    try {
      const result = parseGeorgeCSV(csvText);
      if (result.expenses.length === 0) {
        setError('No expense rows found. Make sure you copied the full CSV including the header row.');
        return;
      }
      const summary = importSummary(result);
      setPreview({ result, summary });
    } catch (e) {
      setError(e.message || 'Could not parse CSV.');
    }
  };

  const handleImport = () => {
    if (!preview) return;
    setLoading(true);
    for (const exp of preview.result.expenses) {
      onImport({ categoryId: exp.categoryId, amount: exp.amount, label: exp.description, date: exp.date });
    }
    setLoading(false);
    handleClose();
    Alert.alert('Import Complete', `${preview.result.imported} transactions imported successfully.`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SheetBackdrop onClose={handleClose} />
        <View style={[styles.sheet, { backgroundColor: 'transparent' }]}>
          <View style={[styles.sheetInner, { backgroundColor: '#0E1221', borderColor: 'rgba(255,255,255,0.10)', maxHeight: '92%' }]}>
            <View style={styles.sheetHandle} />
            <View style={gi.headerRow}>
              <View style={[gi.bankBadge, { backgroundColor: '#CC0000' + '20', borderColor: '#CC0000' + '50' }]}>
                <Text style={[gi.bankLogo, { color: '#CC0000' }]}>erste</Text>
              </View>
              <Text style={[styles.sheetTitle, { color: theme.text, flex: 1, marginBottom: 0 }]}>George Import</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Instructions */}
              <GlassCard theme={theme} intensity={35} radius={14} style={gi.instructCard}>
                <Text style={[gi.instructTitle, { color: theme.text }]}>How to export from George</Text>
                {[
                  'Open george.at in your browser',
                  'Go to your account → Umsätze (Transactions)',
                  'Click Export → CSV or Excel',
                  'Open the file in any text editor',
                  'Select All → Copy',
                  'Come back here and tap Paste',
                ].map((step, i) => (
                  <View key={i} style={gi.step}>
                    <View style={[gi.stepNum, { backgroundColor: theme.accent + '30' }]}>
                      <Text style={[gi.stepNumTxt, { color: theme.accent }]}>{i + 1}</Text>
                    </View>
                    <Text style={[gi.stepTxt, { color: theme.textMuted }]}>{step}</Text>
                  </View>
                ))}
              </GlassCard>

              {/* Paste area */}
              {!preview && (
                <>
                  <View style={[gi.pasteArea, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                    <TextInput
                      style={[gi.pasteInput, { color: theme.text }]}
                      value={csvText}
                      onChangeText={t => { setCsvText(t); setError(''); }}
                      multiline
                      placeholder={'Paste CSV here...\n\nBuchungsdatum;Valutadatum;Buchungstext;Betrag;...'}
                      placeholderTextColor={theme.textMuted}
                      textAlignVertical="top"
                    />
                  </View>
                  <View style={gi.pasteRow}>
                    <TouchableOpacity onPress={pasteFromClipboard} style={[gi.pasteBtn, { borderColor: theme.accent + '50', backgroundColor: theme.accent + '12' }]}>
                      <Ionicons name="clipboard-outline" size={16} color={theme.accent} />
                      <Text style={[gi.pasteBtnTxt, { color: theme.accent }]}>Paste from Clipboard</Text>
                    </TouchableOpacity>
                    {csvText.length > 0 && (
                      <Text style={[gi.charCount, { color: theme.textMuted }]}>{csvText.length} chars</Text>
                    )}
                  </View>
                </>
              )}

              {/* Error */}
              {!!error && (
                <View style={[gi.errorCard, { backgroundColor: '#EF4444' + '18', borderColor: '#EF4444' + '40' }]}>
                  <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                  <Text style={[gi.errorTxt, { color: '#EF4444' }]}>{error}</Text>
                </View>
              )}

              {/* Preview */}
              {preview && (
                <Animated.View entering={FadeInDown.duration(300).springify()}>
                  <GlassCard theme={theme} intensity={50} radius={16} style={gi.previewCard2}>
                    <LinearGradient
                      colors={[theme.accent + '20', 'transparent']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
                    />
                    <View style={gi.previewHeader}>
                      <Ionicons name="checkmark-circle" size={22} color={theme.accent} />
                      <Text style={[gi.previewTitle, { color: theme.text }]}>
                        {preview.result.imported} transactions found
                      </Text>
                    </View>
                    <Text style={[gi.previewTotal, { color: theme.text }]}>
                      Total: â‚¬{fmt(preview.summary.total)}
                    </Text>
                    {preview.result.skipped > 0 && (
                      <Text style={[gi.previewSkipped, { color: theme.textMuted }]}>
                        {preview.result.skipped} rows skipped (income or invalid)
                      </Text>
                    )}
                    <View style={gi.catBreakdown}>
                      {Object.entries(preview.summary.byCategory).map(([catId, count]) => (
                        <View key={catId} style={[gi.catPill, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                          <Text style={[gi.catPillTxt, { color: theme.textMuted }]}>
                            {CAT_LABELS[catId] || catId}: {count}
                          </Text>
                        </View>
                      ))}
                    </View>
                    {/* Sample rows */}
                    <Text style={[gi.sampleTitle, { color: theme.textMuted }]}>Preview (first 5):</Text>
                    {preview.result.expenses.slice(0, 5).map((e, i) => (
                      <View key={i} style={[gi.sampleRow, { borderBottomColor: theme.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[gi.sampleDesc, { color: theme.text }]} numberOfLines={1}>{e.description || 'No description'}</Text>
                          <Text style={[gi.sampleMeta, { color: theme.textMuted }]}>{CAT_LABELS[e.categoryId]} · {e.date}</Text>
                        </View>
                        <Text style={[gi.sampleAmt, { color: '#EF4444' }]}>-â‚¬{fmt(e.amount)}</Text>
                      </View>
                    ))}
                  </GlassCard>
                  <TouchableOpacity onPress={() => { setPreview(null); setError(''); }} style={gi.retryBtn}>
                    <Ionicons name="arrow-back-outline" size={14} color={theme.textMuted} />
                    <Text style={[gi.retryTxt, { color: theme.textMuted }]}>Start over</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {/* Action buttons */}
              {!preview ? (
                <TouchableOpacity onPress={handleParse} activeOpacity={0.85} style={{ marginTop: 12, marginBottom: 8 }}>
                  <LinearGradient
                    colors={[theme.accent, theme.accent + 'AA']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.sheetBtn}
                  >
                    <Ionicons name="scan-outline" size={18} color="#fff" />
                    <Text style={styles.sheetBtnTxt}>Parse CSV</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleImport} disabled={loading} activeOpacity={0.85} style={{ marginTop: 12, marginBottom: 8 }}>
                  <LinearGradient
                    colors={['#00E5A8', '#00B8FF']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.sheetBtn}
                  >
                    <Ionicons name="download-outline" size={18} color="#fff" />
                    <Text style={styles.sheetBtnTxt}>
                      Import {preview.result.imported} Transactions
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function BudgetScreen({ navigation }) {
  const { theme } = useSettings();
  const budget = useBudget();
  const [tab, setTab] = useState('overview');
  const [addExpModal, setAddExpModal] = useState(false);
  const [addCatModal, setAddCatModal] = useState(false);
  const [periodModal, setPeriodModal] = useState(false);
  const [totalModal, setTotalModal] = useState(false);
  const [importModal, setImportModal] = useState(false);

  const { start, end } = useMemo(() => budget.getCurrentPeriod(), [budget.periodStartDay]);
  const periodLabel = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const spent = useMemo(() => budget.totalSpent(), [budget.expenses, budget.periodStartDay]);
  const catSpent = useMemo(() => budget.spentByCategory(), [budget.expenses, budget.periodStartDay]);
  const periodExps = useMemo(() => budget.periodExpenses().sort((a, b) => b.date.localeCompare(a.date)), [budget.expenses, budget.periodStartDay]);
  const totalBudget = budget.totalBudget;
  const { label: overallLabel, color: overallColor, icon: overallIcon, pct: overallPct } = statusInfo(spent, totalBudget);

  const handleDeleteCategory = useCallback((id) => {
    Alert.alert('Delete Category', 'This will also remove all its expenses.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => budget.deleteCategory(id) },
    ]);
  }, [budget]);

  return (
    <GlassBg theme={theme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}
            style={[styles.backBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Budget</Text>
            <TouchableOpacity onPress={() => setPeriodModal(true)} style={styles.periodChip}>
              <Ionicons name="calendar-outline" size={12} color={theme.accent} />
              <Text style={[styles.periodChipTxt, { color: theme.accent }]}>{periodLabel}</Text>
              <Ionicons name="chevron-down" size={12} color={theme.accent} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => setImportModal(true)} hitSlop={8}
              style={[styles.addBtn, { backgroundColor: '#CC0000' + '18', borderColor: '#CC0000' + '40' }]}>
              <Ionicons name="download-outline" size={19} color="#CC0000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAddExpModal(true)} hitSlop={8}
              style={[styles.addBtn, { backgroundColor: theme.accent + '20', borderColor: theme.accent + '50' }]}>
              <Ionicons name="add" size={22} color={theme.accent} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={[styles.tabRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {['overview', 'expenses', 'categories'].map(t => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={[
              styles.tabBtn,
              tab === t && { backgroundColor: theme.accent + '20', borderColor: theme.accent + '50', borderWidth: 1 }
            ]}>
              <Text style={[styles.tabBtnTxt, { color: tab === t ? theme.accent : theme.textMuted }]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
        >

          {/* Overview Tab */}
          {tab === 'overview' && (
            <>
              {/* Total Budget Card */}
              <Animated.View entering={FadeInDown.duration(300).springify()}>
                <GlassCard theme={theme} intensity={60} radius={24} style={styles.totalCard}>
                  <LinearGradient
                    colors={[overallColor + '22', 'transparent']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
                  />
                  <View style={styles.totalTop}>
                    <View>
                      <Text style={[styles.totalLabel, { color: theme.textMuted }]}>Total Spent</Text>
                      <Text style={[styles.totalAmt, { color: theme.text }]}>${fmt(spent)}</Text>
                      {totalBudget > 0 && (
                        <Text style={[styles.totalOf, { color: theme.textMuted }]}>of ${fmt(totalBudget)}</Text>
                      )}
                    </View>
                    <View style={styles.totalRight}>
                      <View style={[styles.statusBadge, { backgroundColor: overallColor + '22', borderColor: overallColor + '60', borderWidth: 1 }]}>
                        <Ionicons name={overallIcon} size={16} color={overallColor} />
                        <Text style={[styles.statusBadgeTxt, { color: overallColor }]}>{overallLabel}</Text>
                      </View>
                      <TouchableOpacity onPress={() => setTotalModal(true)} style={[styles.editBudgetBtn, { borderColor: theme.border }]}>
                        <Ionicons name="create-outline" size={14} color={theme.textMuted} />
                        <Text style={[styles.editBudgetTxt, { color: theme.textMuted }]}>Set Budget</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {totalBudget > 0 && (
                    <>
                      <ProgressBar pct={overallPct} color={overallColor} height={8} />
                      <View style={styles.totalStats}>
                        <Text style={[styles.statTxt, { color: theme.textMuted }]}>
                          {totalBudget - spent >= 0
                            ? `$${fmt(totalBudget - spent)} left`
                            : `$${fmt(spent - totalBudget)} over`}
                        </Text>
                        <Text style={[styles.statTxt, { color: theme.textMuted }]}>
                          {Math.round(overallPct * 100)}% used
                        </Text>
                      </View>
                    </>
                  )}
                </GlassCard>
              </Animated.View>

              {/* Category Summary */}
              <Text style={[styles.sectionLbl, { color: theme.textMuted }]}>BY CATEGORY</Text>
              {budget.categories.map((cat, i) => (
                <CategoryCard
                  key={cat.id}
                  cat={cat}
                  spent={catSpent[cat.id] || 0}
                  theme={theme}
                  index={i}
                  onPress={() => setTab('expenses')}
                  onDelete={() => handleDeleteCategory(cat.id)}
                />
              ))}
              <TouchableOpacity onPress={() => setAddCatModal(true)} style={[styles.addCatBtn, { borderColor: theme.border }]}>
                <Ionicons name="add-circle-outline" size={18} color={theme.textMuted} />
                <Text style={[styles.addCatTxt, { color: theme.textMuted }]}>Add Category</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Expenses Tab */}
          {tab === 'expenses' && (
            <>
              <Text style={[styles.sectionLbl, { color: theme.textMuted }]}>THIS PERIOD · {periodExps.length} ITEM{periodExps.length !== 1 ? 'S' : ''}</Text>
              {periodExps.length === 0 && (
                <Animated.View entering={FadeInDown.duration(300)}>
                  <GlassCard theme={theme} intensity={40} radius={20} style={styles.emptyCard}>
                    <Ionicons name="receipt-outline" size={36} color={theme.textMuted} />
                    <Text style={[styles.emptyTxt, { color: theme.textMuted }]}>No expenses this period</Text>
                    <TouchableOpacity onPress={() => setAddExpModal(true)} style={[styles.emptyBtn, { borderColor: theme.accent + '50' }]}>
                      <Text style={[styles.emptyBtnTxt, { color: theme.accent }]}>Add First Expense</Text>
                    </TouchableOpacity>
                  </GlassCard>
                </Animated.View>
              )}
              {periodExps.length > 0 && (
                <GlassCard theme={theme} intensity={45} radius={18} style={styles.expListCard}>
                  {periodExps.map((exp, i) => {
                    const cat = budget.categories.find(c => c.id === exp.categoryId);
                    return (
                      <ExpenseRow
                        key={exp.id}
                        exp={exp}
                        catName={cat?.name || 'Unknown'}
                        catColor={cat?.color || '#6B7280'}
                        onDelete={budget.deleteExpense}
                        theme={theme}
                      />
                    );
                  })}
                </GlassCard>
              )}
            </>
          )}

          {/* Categories Tab */}
          {tab === 'categories' && (
            <>
              <Text style={[styles.sectionLbl, { color: theme.textMuted }]}>MANAGE CATEGORIES</Text>
              {budget.categories.map((cat, i) => (
                <Animated.View key={cat.id} entering={FadeInDown.duration(250).delay(i * 30).springify()} layout={Layout.springify()}>
                  <GlassCard theme={theme} intensity={45} radius={16} style={styles.catManageCard}>
                    <View style={[styles.catIcon, { backgroundColor: cat.color + '28', borderColor: cat.color + '50', borderWidth: 1.5 }]}>
                      <Ionicons name={cat.icon} size={20} color={cat.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.catName, { color: theme.text }]}>{cat.name}</Text>
                      <Text style={[styles.budgetAmt, { color: theme.textMuted }]}>
                        {cat.budget > 0 ? `Budget: $${fmt(cat.budget)}` : 'No limit set'}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteCategory(cat.id)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                  </GlassCard>
                </Animated.View>
              ))}
              <TouchableOpacity onPress={() => setAddCatModal(true)} style={[styles.addCatBtn, { borderColor: theme.accent + '50', backgroundColor: theme.accent + '10' }]}>
                <Ionicons name="add-circle-outline" size={18} color={theme.accent} />
                <Text style={[styles.addCatTxt, { color: theme.accent }]}>Add Category</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        <AddExpenseModal
          visible={addExpModal}
          onClose={() => setAddExpModal(false)}
          categories={budget.categories}
          theme={theme}
          onAdd={budget.addExpense}
        />
        <AddCategoryModal
          visible={addCatModal}
          onClose={() => setAddCatModal(false)}
          theme={theme}
          onAdd={budget.addCategory}
        />
        <PeriodModal
          visible={periodModal}
          onClose={() => setPeriodModal(false)}
          currentDay={budget.periodStartDay}
          theme={theme}
          onSave={budget.setPeriodStartDay}
        />
        <TotalBudgetModal
          visible={totalModal}
          onClose={() => setTotalModal(false)}
          current={budget.totalBudget}
          theme={theme}
          onSave={budget.setTotalBudget}
        />
        <GeorgeImportModal
          visible={importModal}
          onClose={() => setImportModal(false)}
          theme={theme}
          onImport={budget.addExpense}
        />
      </SafeAreaView>
    </GlassBg>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  backBtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  periodChip: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  periodChipTxt: { fontSize: 11, fontWeight: '600' },

  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 4, borderWidth: 1, gap: 2 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 11 },
  tabBtnTxt: { fontSize: 12, fontWeight: '700' },

  scroll: { paddingHorizontal: 16 },
  sectionLbl: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 10, marginTop: 4, marginLeft: 2 },

  totalCard: { padding: 20, marginBottom: 20, overflow: 'hidden', gap: 14 },
  totalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  totalLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  totalAmt: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  totalOf: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  totalRight: { alignItems: 'flex-end', gap: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  statusBadgeTxt: { fontSize: 12, fontWeight: '700' },
  editBudgetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  editBudgetTxt: { fontSize: 11, fontWeight: '600' },
  totalStats: { flexDirection: 'row', justifyContent: 'space-between' },
  statTxt: { fontSize: 12, fontWeight: '600' },

  catCard: { marginBottom: 10, overflow: 'hidden' },
  catCardInner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  catRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 15, fontWeight: '700' },
  spentAmt: { fontSize: 18, fontWeight: '800' },
  budgetAmt: { fontSize: 13, fontWeight: '500' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  statusTxt: { fontSize: 10, fontWeight: '800' },
  remainTxt: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  deleteBtn: { padding: 4 },

  addCatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', marginTop: 4, marginBottom: 20 },
  addCatTxt: { fontSize: 14, fontWeight: '600' },

  emptyCard: { padding: 32, alignItems: 'center', gap: 12, marginTop: 8 },
  emptyTxt: { fontSize: 14, fontWeight: '600' },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  emptyBtnTxt: { fontSize: 14, fontWeight: '700' },

  expListCard: { padding: 4, overflow: 'hidden' },
  expRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  expDot: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  expDotInner: { width: 10, height: 10, borderRadius: 5 },
  expLabel: { fontSize: 14, fontWeight: '600' },
  expMeta: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  expAmt: { fontSize: 15, fontWeight: '700' },

  catManageCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 8 },

  sheet: { flex: 1, justifyContent: 'flex-end' },
  sheetInner: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, borderWidth: 1 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 },
  currSign: { fontSize: 18, fontWeight: '700', marginRight: 6 },
  input: { fontSize: 16, fontWeight: '600' },
  sheetBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  sheetBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, marginRight: 8 },
  catChipTxt: { fontSize: 12, fontWeight: '600' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  iconCell: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  colorDot: { width: 30, height: 30, borderRadius: 15 },
  periodHint: { fontSize: 13, fontWeight: '500', marginBottom: 16, lineHeight: 20 },
  previewCard: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  previewTxt: { fontSize: 13, fontWeight: '700' },
});

const gi = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  bankBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  bankLogo: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },

  instructCard: { padding: 16, marginBottom: 16, gap: 10 },
  instructTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stepNumTxt: { fontSize: 11, fontWeight: '900' },
  stepTxt: { fontSize: 13, fontWeight: '500', flex: 1, lineHeight: 20 },

  pasteArea: { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 10 },
  pasteInput: { minHeight: 120, maxHeight: 200, fontSize: 12, fontFamily: 'monospace' },
  pasteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  pasteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1 },
  pasteBtnTxt: { fontSize: 13, fontWeight: '700' },
  charCount: { fontSize: 11, fontWeight: '500' },

  errorCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  errorTxt: { fontSize: 13, fontWeight: '500', flex: 1, lineHeight: 18 },

  previewCard2: { padding: 16, marginBottom: 10, overflow: 'hidden', gap: 8 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewTitle: { fontSize: 16, fontWeight: '800' },
  previewTotal: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  previewSkipped: { fontSize: 11, fontWeight: '500' },
  catBreakdown: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  catPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  catPillTxt: { fontSize: 11, fontWeight: '600' },
  sampleTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 8 },
  sampleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  sampleDesc: { fontSize: 13, fontWeight: '600' },
  sampleMeta: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  sampleAmt: { fontSize: 13, fontWeight: '700', marginLeft: 8 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 10, marginBottom: 8 },
  retryTxt: { fontSize: 13, fontWeight: '600' },
});

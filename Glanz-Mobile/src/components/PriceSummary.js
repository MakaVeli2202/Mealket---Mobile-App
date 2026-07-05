import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSettings } from '../context/SettingsContext';
import GlassCard from './GlassCard';

export default function PriceSummary({ stores }) {
  const { theme, tr, language } = useSettings();
  const p = tr.price;

  const grandTotal = stores.reduce((sum, s) => Math.round((sum + s.subtotal) * 100) / 100, 0);
  const fullTotal  = stores.reduce((sum, s) =>
    Math.round((sum + s.items.reduce((a, i) => Math.round((a + (i.unitPrice || 0) * (i.quantity || 1)) * 100) / 100, 0)) * 100) / 100, 0
  );
  const remaining = Math.round((fullTotal - grandTotal) * 100) / 100;

  return (
    <Animated.View
      entering={FadeInUp.duration(300).delay(200).springify().damping(18)}
      style={[styles.wrap, theme.shadow.md]}
    >
      <GlassCard theme={theme} intensity={55} style={styles.container} glow>
        <View style={styles.headerRow}>
          <View style={[styles.iconBadge, { backgroundColor: theme.accent + '22' }]}>
            <Ionicons name="receipt" size={16} color={theme.accent} />
          </View>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{p.section}</Text>
        </View>

        {stores.map((store, i) => (
          store.items.length > 0 && (
            <View key={i} style={styles.row}>
              <View style={[styles.storeIconWrap, { backgroundColor: store.color + '22' }]}>
                <View style={[styles.dot, { backgroundColor: store.color }]} />
              </View>
              <Text style={[styles.label, { color: theme.textSub }]}>{store.name || tr.storeGroup.other}</Text>
              <Text style={[styles.amount, { color: store.subtotal > 0 ? theme.text : theme.textMuted }]}>
                {store.subtotal > 0 ? `${store.subtotal.toLocaleString(language === 'de' ? 'de-DE' : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '—'}
              </Text>
            </View>
          )
        ))}

        {remaining > 0 && (
          <View style={styles.row}>
            <View style={[styles.storeIconWrap, { backgroundColor: theme.textMuted + '18' }]}>
              <Ionicons name="ellipsis-horizontal" size={10} color={theme.textMuted} />
            </View>
            <Text style={[styles.label, { color: theme.textMuted, fontStyle: 'italic' }]}>
              {typeof p.remaining === 'function' ? p.remaining(remaining.toLocaleString(language === 'de' ? 'de-DE' : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : `${remaining.toLocaleString(language === 'de' ? 'de-DE' : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € noch offen`}
            </Text>
          </View>
        )}

        <View style={[styles.totalRow, { borderTopColor: theme.border, backgroundColor: theme.accent + '0C' }]}>
          <View style={[styles.totalIconWrap, { backgroundColor: theme.accent + '25' }]}>
            <Ionicons name="wallet" size={18} color={theme.accent} />
          </View>
          <Text style={[styles.totalLabel, { color: theme.text }]}>{p.total}</Text>
          <Text style={[styles.totalAmount, { color: theme.accent }]}>
            {grandTotal > 0 ? `${grandTotal.toLocaleString(language === 'de' ? 'de-DE' : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '—'}
          </Text>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { margin: 16 },
  container: { borderRadius: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 10 },
  iconBadge: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 16 },
  storeIconWrap: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { flex: 1, fontSize: 14 },
  amount: { fontSize: 14, fontWeight: '700' },
  totalRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 8, padding: 16, borderTopWidth: 1,
  },
  totalIconWrap: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  totalLabel: { flex: 1, fontSize: 16, fontWeight: '800' },
  totalAmount: { fontSize: 24, fontWeight: '900', letterSpacing: -0.8 },
});

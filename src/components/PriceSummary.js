import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSettings } from '../context/SettingsContext';

export default function PriceSummary({ stores }) {
  const { theme, tr } = useSettings();
  const p = tr.price;

  const grandTotal = stores.reduce((sum, s) => Math.round((sum + s.subtotal) * 100) / 100, 0);
  const checkedTotal = stores.reduce((sum, s) =>
    Math.round((sum + s.items
      .filter((i) => i.checked)
      .reduce((a, i) => Math.round((a + i.subtotal) * 100) / 100, 0)
    ) * 100) / 100, 0
  );
  const remaining = Math.round((grandTotal - checkedTotal) * 100) / 100;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{p.section}</Text>

      {/* Per-store rows */}
      {stores.map((store, i) => (
        store.items.length > 0 && (
          <View key={i} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: store.color }]} />
            <Text style={[styles.label, { color: theme.textSub }]}>{store.name || 'Sonstiges'}</Text>
            <Text style={[styles.amount, { color: theme.text }]}>
              {store.subtotal > 0 ? `${store.subtotal.toFixed(2)} €` : '—'}
            </Text>
          </View>
        )
      ))}

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {/* Checked subtotal */}
      {checkedTotal > 0 && (
        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: theme.accentGreen }]} />
          <Text style={[styles.subLabel, { color: theme.textMuted }]}>{p.done}</Text>
          <Text style={[styles.subAmount, { color: theme.accentGreen }]}>{checkedTotal.toFixed(2)} €</Text>
        </View>
      )}

      {/* Grand total */}
      <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
        <Text style={[styles.totalLabel, { color: theme.text }]}>{p.total}</Text>
        <Text style={[styles.totalAmount, { color: theme.accent }]}>
          {grandTotal > 0 ? `${grandTotal.toFixed(2)} €` : '—'}
        </Text>
      </View>

      {/* Remaining */}
      {grandTotal > 0 && remaining > 0 && remaining < grandTotal && (
        <Text style={[styles.remaining, { color: theme.textMuted }]}>
          {typeof p.remaining === 'function' ? p.remaining(remaining.toFixed(2)) : `${remaining.toFixed(2)} €`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16, padding: 18,
    borderRadius: 20, borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  label: { flex: 1, fontSize: 15 },
  amount: { fontSize: 15, fontWeight: '600' },
  divider: { height: 1, marginVertical: 10 },
  subLabel: { flex: 1, fontSize: 13 },
  subAmount: { fontSize: 13, fontWeight: '700' },
  totalRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 10, marginTop: 4, borderTopWidth: 1,
  },
  totalLabel: { flex: 1, fontSize: 17, fontWeight: '800' },
  totalAmount: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  remaining: { fontSize: 12, textAlign: 'right', marginTop: 6 },
});

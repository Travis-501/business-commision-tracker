import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/Themed';
import { BusinessSwitcher } from '@/src/components/BusinessSwitcher';
import { useBusinessBooks } from '@/src/context/BusinessBooksContext';
import { simulateEntryChange } from '@/src/lib/booksEngine';
import { newId } from '@/src/lib/id';

export default function LedgerScreen() {
  const { activeBusiness, entries, saveEntry, removeEntry } = useBusinessBooks();
  const today = new Date().toISOString().slice(0, 10);
  const [draftIncome, setDraftIncome] = useState('0');
  const [draftId] = useState(() => newId());

  const simulation = useMemo(() => {
    if (!activeBusiness) return null;
    const base = entries.filter((e) => e.id !== draftId);
    const amount = parseFloat(draftIncome) || 0;
    const draft = {
      id: draftId,
      businessId: activeBusiness.id,
      clientId: null,
      jobId: 'DRAFT',
      type: 'income' as const,
      amount,
      description: 'What-if income',
      entryDate: today,
      isDraft: true,
    };
    return simulateEntryChange([...base, draft], activeBusiness, today, {});
  }, [activeBusiness, draftId, draftIncome, entries, today]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Ledger</Text>
      <BusinessSwitcher />

      <Link href="/entry/new" asChild>
        <Pressable style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>+ New entry</Text>
        </Pressable>
      </Link>

      {activeBusiness && simulation && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Play with today&apos;s numbers</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={draftIncome}
            onChangeText={setDraftIncome}
            placeholder="Hypothetical income"
          />
          <Text>Income: {simulation.dailyIncome.toFixed(2)}</Text>
          <Text>Suggested worker pay: {simulation.suggestedWorkerPay.toFixed(2)}</Text>
          <Text>Net: {simulation.net.toFixed(2)}</Text>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() =>
              saveEntry({
                type: 'income',
                amount: parseFloat(draftIncome) || 0,
                description: 'Daily income',
                entryDate: today,
                clientId: null,
                jobId: newId().slice(0, 8).toUpperCase(),
                isDraft: false,
              })
            }>
            <Text>Save as real income entry</Text>
          </Pressable>
        </View>
      )}

      {entries.map((e) => (
        <View key={e.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>
              {e.type} · {e.amount.toFixed(2)} {activeBusiness?.currency}
              {e.isDraft ? ' (draft)' : ''}
            </Text>
            <Text style={styles.meta}>
              {e.entryDate.slice(0, 10)} · Job {e.jobId} · {e.description}
            </Text>
          </View>
          {!e.isDraft && (
            <Pressable onPress={() => removeEntry(e.id)}>
              <Text style={styles.delete}>Delete</Text>
            </Pressable>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  primaryBtn: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  secondaryBtn: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
  },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#cbd5e1',
    marginBottom: 16,
  },
  sectionTitle: { fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  rowTitle: { fontWeight: '600' },
  meta: { fontSize: 12, opacity: 0.65 },
  delete: { color: '#dc2626', fontSize: 13 },
});

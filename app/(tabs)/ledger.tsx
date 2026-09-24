import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Text, useThemeColor } from '@/components/Themed';
import { BusinessSwitcher } from '@/src/components/BusinessSwitcher';
import { useBusinessBooks } from '@/src/context/BusinessBooksContext';
import {
    dailyExpenses,
    dailyIncome,
    dailySpentMoney,
    netForDay,
    simulateEntryChange,
    suggestedWorkerPay,
} from '@/src/lib/booksEngine';
import { newId } from '@/src/lib/id';

export default function LedgerScreen() {
  const { activeBusiness, entries, clients, saveEntry, removeEntry } = useBusinessBooks();
  const today = new Date().toISOString().slice(0, 10);
  const [draftIncome, setDraftIncome] = useState('0');
  const [summaryJobId, setSummaryJobId] = useState(() => newId().slice(0, 8).toUpperCase());
  const [summaryJobType, setSummaryJobType] = useState('daily-summary');
  const [summaryClientReference, setSummaryClientReference] = useState('');
  const [summarySpentMoney, setSummarySpentMoney] = useState('0');
  const [summaryDescription, setSummaryDescription] = useState('Daily income');
  const [summaryPaymentMethod, setSummaryPaymentMethod] = useState('');
  const [summaryPaymentStatus, setSummaryPaymentStatus] = useState<'paid' | 'not_paid'>('not_paid');
  const [draftId] = useState(() => newId());
  const cardBackground = useThemeColor({ light: '#ffffff', dark: '#111827' }, 'background');
  const cardBorder = useThemeColor({ light: '#dbe2ea', dark: '#334155' }, 'background');
  const inputText = useThemeColor({ light: '#0f172a', dark: '#f8fafc' }, 'text');
  const inputPlaceholder = useThemeColor({ light: '#64748b', dark: '#94a3b8' }, 'text');

  const simulation = useMemo(() => {
    if (!activeBusiness) return null;
    const base = entries.filter((e) => e.id !== draftId);
    const amount = parseFloat(draftIncome) || 0;
    const draft = {
      id: draftId,
      businessId: activeBusiness.id,
      clientId: null,
      clientReference: '',
      jobId: 'DRAFT',
      jobType: 'draft',
      type: 'income' as const,
      amount,
      spentMoney: 0,
      description: 'What-if income',
      entryDate: today,
      invoiceId: null,
      invoiceNumber: 'DRAFT-INV',
      paymentMethod: '',
      paymentStatus: 'not_paid' as const,
      isDraft: true,
    };
    return simulateEntryChange([...base, draft], activeBusiness, today, {});
  }, [activeBusiness, draftId, draftIncome, entries, today]);

  const dailyGroups = useMemo(() => {
    if (!activeBusiness) return [] as { date: string; income: number; expenses: number; spent: number; workerPay: number; net: number; entries: typeof entries }[];

    const groups = new Map<string, typeof entries>();
    for (const entry of entries) {
      const date = entry.entryDate.slice(0, 10);
      const existing = groups.get(date) ?? [];
      existing.push(entry);
      groups.set(date, existing);
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, dayEntries]) => {
        const income = dailyIncome(dayEntries, date);
        const expenses = dailyExpenses(dayEntries, date);
        const spent = dailySpentMoney(dayEntries, date);
        return {
          date,
          income,
          expenses,
          spent,
          workerPay: suggestedWorkerPay(activeBusiness, income, spent),
          net: netForDay(dayEntries, date),
          entries: dayEntries,
        };
      });
  }, [activeBusiness, entries]);

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
        <View
          style={[
            styles.card,
            { backgroundColor: cardBackground, borderColor: cardBorder },
          ]}>
          <Text style={styles.sectionTitle}>Daily summary</Text>
          <Text style={styles.summaryText}>
            Income: {simulation.dailyIncome.toFixed(2)} {activeBusiness.currency}
          </Text>
          <Text style={styles.summaryText}>
            Spent by worker: {simulation.dailySpentMoney.toFixed(2)} {activeBusiness.currency}
          </Text>
          <Text style={styles.summaryText}>
            Suggested worker pay: {simulation.suggestedWorkerPay.toFixed(2)} {activeBusiness.currency}
          </Text>
          <Text style={styles.summaryText}>Net: {simulation.net.toFixed(2)} {activeBusiness.currency}</Text>

          <TextInput
            style={[styles.input, { color: inputText }]}
            keyboardType="decimal-pad"
            value={draftIncome}
            onChangeText={setDraftIncome}
            placeholder="Hypothetical income"
            placeholderTextColor={inputPlaceholder}
          />
          <TextInput
            style={[styles.input, { color: inputText }]}
            value={summaryJobId}
            onChangeText={setSummaryJobId}
            placeholder="Job ID"
            placeholderTextColor={inputPlaceholder}
          />
          <TextInput
            style={[styles.input, { color: inputText }]}
            value={summaryJobType}
            onChangeText={setSummaryJobType}
            placeholder="Job type"
            placeholderTextColor={inputPlaceholder}
          />
          <TextInput
            style={[styles.input, { color: inputText }]}
            value={summaryClientReference}
            onChangeText={setSummaryClientReference}
            placeholder="Client reference / customer details"
            placeholderTextColor={inputPlaceholder}
          />
          <TextInput
            style={[styles.input, { color: inputText }]}
            keyboardType="decimal-pad"
            value={summarySpentMoney}
            onChangeText={setSummarySpentMoney}
            placeholder="Spent money by worker"
            placeholderTextColor={inputPlaceholder}
          />
          <TextInput
            style={[styles.input, { color: inputText }]}
            value={summaryPaymentMethod}
            onChangeText={setSummaryPaymentMethod}
            placeholder="Payment method (cash, card...)"
            placeholderTextColor={inputPlaceholder}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={[styles.chip, summaryPaymentStatus === 'not_paid' && styles.chipActive]} onPress={() => setSummaryPaymentStatus('not_paid')}>
              <Text>Not paid</Text>
            </Pressable>
            <Pressable style={[styles.chip, summaryPaymentStatus === 'paid' && styles.chipActive]} onPress={() => setSummaryPaymentStatus('paid')}>
              <Text>Paid</Text>
            </Pressable>
          </View>
          <TextInput
            style={[styles.input, { color: inputText }]}
            value={summaryDescription}
            onChangeText={setSummaryDescription}
            placeholder="Description"
            placeholderTextColor={inputPlaceholder}
          />

          <Pressable
            style={styles.secondaryBtn}
            disabled={!draftIncome || Number(draftIncome) <= 0 || !summaryJobId.trim() || !summaryJobType.trim() || !summaryClientReference.trim() || !summaryDescription.trim()}
            onPress={() =>
              saveEntry({
                type: 'income',
                amount: parseFloat(draftIncome) || 0,
                description: summaryDescription.trim(),
                entryDate: today,
                clientId: null,
                clientReference: summaryClientReference.trim(),
                jobId: summaryJobId.trim() || newId().slice(0, 8).toUpperCase(),
                jobType: summaryJobType.trim(),
                spentMoney: parseFloat(summarySpentMoney) || 0,
                paymentMethod: summaryPaymentMethod,
                paymentStatus: summaryPaymentStatus,
                invoiceId: null,
                invoiceNumber: '',
                isDraft: false,
              })
            }>
            <Text>{!draftIncome || Number(draftIncome) <= 0 || !summaryJobId.trim() || !summaryJobType.trim() || !summaryClientReference.trim() || !summaryDescription.trim() ? 'Fill required entry details' : 'Save as real income entry'}</Text>
          </Pressable>
        </View>
      )}

      {dailyGroups.map((group) => (
        <View key={group.date} style={[styles.dayCard, { backgroundColor: cardBackground, borderColor: cardBorder }]}>
          <Text style={styles.dayHeader}>
            {new Date(`${group.date}T12:00:00`).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
          <Text style={styles.summaryText}>
            Income: {group.income.toFixed(2)} · Expenses: {group.expenses.toFixed(2)} · Spent by worker:{' '}
            {group.spent.toFixed(2)}
          </Text>
          <Text style={styles.summaryText}>
            Suggested worker pay: {group.workerPay.toFixed(2)} · Net: {group.net.toFixed(2)}
          </Text>

          {group.entries.map((e) => {
            const linkedClient = e.clientId ? clients.find((client) => client.id === e.clientId) ?? null : null;
            const customerLabel = linkedClient
              ? `${linkedClient.name}${linkedClient.phone ? ` • ${linkedClient.phone}` : ''}`
              : e.clientReference || 'No client';

            return (
              <View key={e.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>
                    {e.type} · {e.amount.toFixed(2)} {activeBusiness?.currency}
                    {e.spentMoney > 0 ? ` · worker spent ${e.spentMoney.toFixed(2)}` : ''}
                    {e.isDraft ? ' (draft)' : ''}
                  </Text>
                  <Text style={styles.meta}>
                    {e.entryDate.slice(0, 10)} · Job {e.jobId} · {e.jobType || 'General'} · {customerLabel}
                  </Text>
                  <Text style={styles.meta}>Invoice: {e.invoiceNumber || 'draft invoice'}</Text>
                  <Text style={styles.meta}>{e.description}</Text>
                </View>

                <View style={styles.actionRow}>
                  {linkedClient?.phone ? (
                    <Pressable onPress={() => Linking.openURL(`tel:${linkedClient.phone}`)}>
                      <Text style={styles.callText}>Call</Text>
                    </Pressable>
                  ) : null}
                  <Link href={{ pathname: '/entry/new', params: { entryId: e.id } }} asChild>
                    <Pressable>
                      <Text style={styles.editText}>Edit</Text>
                    </Pressable>
                  </Link>
                  {!e.isDraft && (
                    <Pressable onPress={() => removeEntry(e.id)}>
                      <Text style={styles.delete}>Delete</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
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
    marginBottom: 16,
  },
  dayCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },
  dayHeader: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  summaryText: { fontSize: 12, opacity: 0.75, marginBottom: 3 },
  sectionTitle: { fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#bfdbfe' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowTitle: { fontWeight: '600' },
  meta: { fontSize: 12, opacity: 0.65 },
  callText: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
  editText: { color: '#0f766e', fontSize: 13, fontWeight: '600' },
  delete: { color: '#dc2626', fontSize: 13 },
});

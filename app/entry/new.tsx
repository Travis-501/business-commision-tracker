import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Text, useThemeColor } from '@/components/Themed';
import { useBusinessBooks } from '@/src/context/BusinessBooksContext';
import { newId } from '@/src/lib/id';
import type { EntryType } from '@/src/types/models';

const types: EntryType[] = ['income', 'expense', 'worker_pay', 'payment'];

export default function NewEntryScreen() {
  const { entryId } = useLocalSearchParams<{ entryId?: string }>();
  const { clients, entries, saveEntry } = useBusinessBooks();
  const screenBackground = useThemeColor({ light: '#f8fafc', dark: '#020817' }, 'background');
  const pillBackground = useThemeColor({ light: '#e2e8f0', dark: '#1f2937' }, 'background');
  const pillActive = useThemeColor({ light: '#bfdbfe', dark: '#2563eb' }, 'background');
  const inputText = useThemeColor({ light: '#0f172a', dark: '#f8fafc' }, 'text');
  const inputPlaceholder = useThemeColor({ light: '#64748b', dark: '#94a3b8' }, 'text');
  const editingEntry = entryId ? entries.find((entry) => entry.id === entryId) ?? null : null;

  const [type, setType] = useState<EntryType>('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [jobId, setJobId] = useState(newId().slice(0, 8).toUpperCase());
  const [jobType, setJobType] = useState('');
  const [spentMoney, setSpentMoney] = useState('');
  const [clientReference, setClientReference] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [paymentMethodField, setPaymentMethodField] = useState('');
  const [paymentStatusField, setPaymentStatusField] = useState<'paid' | 'not_paid'>('not_paid');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!editingEntry) {
      setType('income');
      setAmount('');
      setDescription('');
      setJobId(newId().slice(0, 8).toUpperCase());
      setJobType('');
      setSpentMoney('');
      setClientReference('');
      setClientId(null);
      setDate(new Date().toISOString().slice(0, 10));
      return;
    }

    setType(editingEntry.type);
    setAmount(String(editingEntry.amount));
    setDescription(editingEntry.description);
    setJobId(editingEntry.jobId || newId().slice(0, 8).toUpperCase());
    setJobType(editingEntry.jobType || '');
    setSpentMoney(String(editingEntry.spentMoney || ''));
    setClientReference(editingEntry.clientReference || '');
    setClientId(editingEntry.clientId ?? null);
    setPaymentMethodField((editingEntry as any).paymentMethod || '');
    setPaymentStatusField((editingEntry as any).paymentStatus || 'not_paid');
    setDate(editingEntry.entryDate.slice(0, 10));
  }, [editingEntry]);

  return (
    <>
      <Stack.Screen options={{ title: 'New entry' }} />
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: screenBackground }]}>
        <Text style={styles.label}>Type</Text>
        <View style={styles.chips}>
          {types.map((t) => (
            <Pressable
              key={t}
              style={[styles.chip, { backgroundColor: type === t ? pillActive : pillBackground }, type === t && styles.chipActive]}
              onPress={() => setType(t)}>
              <Text>{t}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          style={[styles.input, { color: inputText }]}
          placeholder="Amount"
          placeholderTextColor={inputPlaceholder}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
        <TextInput
          style={[styles.input, { color: inputText }]}
          placeholder="Job ID"
          placeholderTextColor={inputPlaceholder}
          value={jobId}
          onChangeText={setJobId}
        />
        <TextInput
          style={[styles.input, { color: inputText }]}
          placeholder="Job type (roofing, plumbing, install, etc.)"
          placeholderTextColor={inputPlaceholder}
          value={jobType}
          onChangeText={setJobType}
        />
        <TextInput
          style={[styles.input, { color: inputText }]}
          placeholder="Client reference / details"
          placeholderTextColor={inputPlaceholder}
          value={clientReference}
          onChangeText={setClientReference}
        />
        <TextInput
          style={[styles.input, { color: inputText }]}
          placeholder="Spent money by worker"
          placeholderTextColor={inputPlaceholder}
          keyboardType="decimal-pad"
          value={spentMoney}
          onChangeText={setSpentMoney}
        />
        <TextInput
          style={[styles.input, { color: inputText }]}
          placeholder="Date (YYYY-MM-DD)"
          placeholderTextColor={inputPlaceholder}
          value={date}
          onChangeText={setDate}
        />
        <TextInput
          style={[styles.input, { color: inputText }]}
          placeholder="Description"
          placeholderTextColor={inputPlaceholder}
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>Client</Text>
        <View style={styles.chips}>
          <Pressable
            style={[styles.chip, { backgroundColor: clientId === null ? pillActive : pillBackground }, clientId === null && styles.chipActive]}
            onPress={() => setClientId(null)}>
            <Text>None</Text>
          </Pressable>
          {clients.map((c) => (
            <Pressable
              key={c.id}
              style={[styles.chip, { backgroundColor: clientId === c.id ? pillActive : pillBackground }, clientId === c.id && styles.chipActive]}
              onPress={() => setClientId(c.id)}>
              <Text>{c.name}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.primaryBtn}
          disabled={
            !amount || Number(amount) <= 0 || !description.trim() || !jobId.trim() || !jobType.trim() || (!clientId && !clientReference.trim())
          }
          onPress={() => {
            const numericAmount = Number(amount);
            const trimmedDescription = description.trim();
            const trimmedJobId = jobId.trim();
            const trimmedJobType = jobType.trim();
            const trimmedClientReference = clientReference.trim();

            if (
              !trimmedDescription ||
              !Number.isFinite(numericAmount) ||
              numericAmount <= 0 ||
              !trimmedJobId ||
              !trimmedJobType ||
              (!clientId && !trimmedClientReference)
            ) {
              return;
            }

            saveEntry({
              id: editingEntry?.id,
              type,
              amount: numericAmount,
              clientReference: trimmedClientReference,
              description: trimmedDescription,
              entryDate: `${date}T12:00:00.000Z`,
              clientId,
              jobId: trimmedJobId,
              jobType: trimmedJobType,
              spentMoney: parseFloat(spentMoney) || 0,
              paymentMethod: paymentMethodField,
              paymentStatus: paymentStatusField,
              invoiceId: editingEntry?.invoiceId ?? null,
              invoiceNumber: editingEntry?.invoiceNumber ?? '',
              isDraft: false,
            });
            router.back();
          }}>
          <Text style={styles.primaryBtnText}>{editingEntry ? 'Update entry' : 'Save entry'}</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  label: { fontWeight: '600', marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#bfdbfe' },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
});

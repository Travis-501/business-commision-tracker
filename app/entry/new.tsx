import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useBusinessBooks } from '@/src/context/BusinessBooksContext';
import type { EntryType } from '@/src/types/models';
import { newId } from '@/src/lib/id';

const types: EntryType[] = ['income', 'expense', 'worker_pay', 'payment'];

export default function NewEntryScreen() {
  const { clients, saveEntry } = useBusinessBooks();
  const [type, setType] = useState<EntryType>('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [jobId, setJobId] = useState(newId().slice(0, 8).toUpperCase());
  const [clientId, setClientId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  return (
    <>
      <Stack.Screen options={{ title: 'New entry' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Type</Text>
        <View style={styles.chips}>
          {types.map((t) => (
            <Pressable
              key={t}
              style={[styles.chip, type === t && styles.chipActive]}
              onPress={() => setType(t)}>
              <Text>{t}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Amount"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
        <TextInput
          style={styles.input}
          placeholder="Job ID"
          value={jobId}
          onChangeText={setJobId}
        />
        <TextInput
          style={styles.input}
          placeholder="Date (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
        />
        <TextInput
          style={styles.input}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>Client</Text>
        <View style={styles.chips}>
          <Pressable
            style={[styles.chip, clientId === null && styles.chipActive]}
            onPress={() => setClientId(null)}>
            <Text>None</Text>
          </Pressable>
          {clients.map((c) => (
            <Pressable
              key={c.id}
              style={[styles.chip, clientId === c.id && styles.chipActive]}
              onPress={() => setClientId(c.id)}>
              <Text>{c.name}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.primaryBtn}
          onPress={() => {
            saveEntry({
              type,
              amount: parseFloat(amount) || 0,
              description: description.trim(),
              entryDate: `${date}T12:00:00.000Z`,
              clientId,
              jobId: jobId.trim() || newId().slice(0, 8).toUpperCase(),
              isDraft: false,
            });
            router.back();
          }}>
          <Text style={styles.primaryBtnText}>Save entry</Text>
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

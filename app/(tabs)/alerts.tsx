import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/Themed';
import { BusinessSwitcher } from '@/src/components/BusinessSwitcher';
import { useBusinessBooks } from '@/src/context/BusinessBooksContext';

export default function AlertsScreen() {
  const { reminders, clients, saveReminder, removeReminder } = useBusinessBooks();
  const [title, setTitle] = useState('Appointment');
  const [body, setBody] = useState('');
  const [when, setWhen] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Alerts & reminders</Text>
      <BusinessSwitcher />

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Customer appointment</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Title" />
        <TextInput
          style={[styles.input, styles.notes]}
          value={body}
          onChangeText={setBody}
          placeholder="Custom message"
          multiline
        />
        <TextInput
          style={styles.input}
          value={when}
          onChangeText={setWhen}
          placeholder="When (ISO: 2026-09-21T15:00:00)"
        />
        <Text style={styles.label}>Link to client (optional)</Text>
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
          onPress={async () => {
            const scheduledAt = when.trim() || new Date(Date.now() + 3600000).toISOString();
            await saveReminder({
              title: title.trim() || 'Appointment',
              body: body.trim(),
              scheduledAt,
              clientId,
            });
            setBody('');
          }}>
          <Text style={styles.primaryBtnText}>Schedule reminder</Text>
        </Pressable>
      </View>

      {reminders.map((r) => (
        <View key={r.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{r.title}</Text>
            <Text style={styles.meta}>{new Date(r.scheduledAt).toLocaleString()}</Text>
            {r.body ? <Text style={styles.meta}>{r.body}</Text> : null}
          </View>
          <Pressable onPress={() => removeReminder(r.id)}>
            <Text style={styles.delete}>Remove</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
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
  notes: { minHeight: 72, textAlignVertical: 'top' },
  label: { fontSize: 13, opacity: 0.7, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#bfdbfe' },
  primaryBtn: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  rowTitle: { fontWeight: '600' },
  meta: { fontSize: 12, opacity: 0.65 },
  delete: { color: '#dc2626' },
});

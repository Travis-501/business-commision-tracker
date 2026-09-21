import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Text, useThemeColor } from '@/components/Themed';
import { BusinessSwitcher } from '@/src/components/BusinessSwitcher';
import { useBusinessBooks } from '@/src/context/BusinessBooksContext';

export default function AlertsScreen() {
  const { reminders, clients, saveReminder, removeReminder } = useBusinessBooks();
  const screenBackground = useThemeColor({ light: '#f8fafc', dark: '#020817' }, 'background');
  const cardBackground = useThemeColor({ light: '#ffffff', dark: '#111827' }, 'background');
  const cardBorder = useThemeColor({ light: '#dbe2ea', dark: '#334155' }, 'background');
  const inputBackground = useThemeColor({ light: '#ffffff', dark: '#0f172a' }, 'background');
  const inputBorder = useThemeColor({ light: '#cbd5e1', dark: '#475569' }, 'background');
  const inputText = useThemeColor({ light: '#0f172a', dark: '#f8fafc' }, 'text');
  const inputPlaceholder = useThemeColor({ light: '#64748b', dark: '#94a3b8' }, 'text');
  const chipBackground = useThemeColor({ light: '#e2e8f0', dark: '#1f2937' }, 'background');
  const chipActive = useThemeColor({ light: '#bfdbfe', dark: '#2563eb' }, 'background');
  const [title, setTitle] = useState('Appointment');
  const [body, setBody] = useState('');
  const [when, setWhen] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: screenBackground }]}>
      <Text style={styles.title}>Alerts & reminders</Text>
      <BusinessSwitcher />

      <View style={[styles.card, { backgroundColor: cardBackground, borderColor: cardBorder }]}> 
        <Text style={styles.sectionTitle}>Customer appointment</Text>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor={inputPlaceholder}
        />
        <TextInput
          style={[styles.input, styles.notes, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
          value={body}
          onChangeText={setBody}
          placeholder="Custom message"
          placeholderTextColor={inputPlaceholder}
          multiline
        />
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
          value={when}
          onChangeText={setWhen}
          placeholder="When (ISO: 2026-09-21T15:00:00)"
          placeholderTextColor={inputPlaceholder}
        />
        <Text style={styles.label}>Link to client (optional)</Text>
        <View style={styles.chips}>
          <Pressable
            style={[styles.chip, { backgroundColor: clientId === null ? chipActive : chipBackground }]}
            onPress={() => setClientId(null)}>
            <Text>None</Text>
          </Pressable>
          {clients.map((c) => (
            <Pressable
              key={c.id}
              style={[styles.chip, { backgroundColor: clientId === c.id ? chipActive : chipBackground }]}
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

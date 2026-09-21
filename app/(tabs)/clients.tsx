import { Link } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Text, useThemeColor } from '@/components/Themed';
import { BusinessSwitcher } from '@/src/components/BusinessSwitcher';
import { useBusinessBooks } from '@/src/context/BusinessBooksContext';

export default function ClientsScreen() {
  const { clients, saveClient } = useBusinessBooks();
  const screenBackground = useThemeColor({ light: '#f8fafc', dark: '#020817' }, 'background');
  const cardBackground = useThemeColor({ light: '#ffffff', dark: '#111827' }, 'background');
  const cardBorder = useThemeColor({ light: '#dbe2ea', dark: '#334155' }, 'background');
  const inputText = useThemeColor({ light: '#0f172a', dark: '#f8fafc' }, 'text');
  const inputPlaceholder = useThemeColor({ light: '#64748b', dark: '#94a3b8' }, 'text');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: screenBackground }]}>
      <Text style={styles.title}>Clients</Text>
      <BusinessSwitcher />

      <View style={[styles.card, { backgroundColor: cardBackground, borderColor: cardBorder }]}> 
        <Text style={styles.sectionTitle}>New client</Text>
        <TextInput
          style={[styles.input, { color: inputText }]}
          placeholder="Name"
          placeholderTextColor={inputPlaceholder}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={[styles.input, { color: inputText }]}
          placeholder="Phone (for SMS / WhatsApp)"
          placeholderTextColor={inputPlaceholder}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          style={[styles.input, styles.notes, { color: inputText }]}
          placeholder="Notes"
          placeholderTextColor={inputPlaceholder}
          multiline
          value={notes}
          onChangeText={setNotes}
        />
        <Pressable
          style={styles.primaryBtn}
          onPress={() => {
            if (!name.trim()) return;
            saveClient({ name: name.trim(), phone: phone.trim(), notes: notes.trim() });
            setName('');
            setPhone('');
            setNotes('');
          }}>
          <Text style={styles.primaryBtnText}>Save client</Text>
        </Pressable>
      </View>

      {clients.map((c) => (
        <View key={c.id} style={styles.row}>
          <Link href={`/client/${c.id}`} asChild>
            <Pressable style={styles.rowInfo}>
              <Text style={styles.rowTitle}>{c.name}</Text>
              <Text style={styles.meta}>{c.phone || 'No phone'}</Text>
            </Pressable>
          </Link>
          {c.phone ? (
            <Pressable onPress={() => Linking.openURL(`tel:${c.phone}`)} style={styles.callBtn}>
              <Text style={styles.callText}>Call</Text>
            </Pressable>
          ) : null}
          <Text style={styles.chevron}>›</Text>
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
  notes: { minHeight: 64, textAlignVertical: 'top' },
  primaryBtn: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  rowInfo: { flex: 1 },
  rowTitle: { fontWeight: '600', fontSize: 16 },
  meta: { fontSize: 13, opacity: 0.65 },
  callBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: '#dbeafe' },
  callText: { color: '#1d4ed8', fontWeight: '600' },
  chevron: { fontSize: 22, opacity: 0.4 },
});

import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/Themed';
import { BusinessSwitcher } from '@/src/components/BusinessSwitcher';
import { useBusinessBooks } from '@/src/context/BusinessBooksContext';

export default function ClientsScreen() {
  const { clients, saveClient } = useBusinessBooks();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Clients</Text>
      <BusinessSwitcher />

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>New client</Text>
        <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
        <TextInput
          style={styles.input}
          placeholder="Phone (for SMS / WhatsApp)"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          style={[styles.input, styles.notes]}
          placeholder="Notes"
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
        <Link key={c.id} href={`/client/${c.id}`} asChild>
          <Pressable style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>{c.name}</Text>
              <Text style={styles.meta}>{c.phone || 'No phone'}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </Link>
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
  },
  rowTitle: { fontWeight: '600', fontSize: 16 },
  meta: { fontSize: 13, opacity: 0.65 },
  chevron: { fontSize: 22, opacity: 0.4 },
});

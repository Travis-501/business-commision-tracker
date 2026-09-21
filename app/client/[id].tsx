import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useBusinessBooks } from '@/src/context/BusinessBooksContext';
import * as db from '@/src/db/database';
import { frequentClients } from '@/src/lib/analytics';

export default function ClientProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { entries, clients, activeBusiness } = useBusinessBooks();
  const client = id ? db.getClient(id) : null;

  if (!client) {
    return (
      <>
        <Stack.Screen options={{ title: 'Client' }} />
        <Text style={{ padding: 16 }}>Client not found.</Text>
      </>
    );
  }

  const stats = frequentClients(clients, entries, 100).find((r) => r.client.id === client.id);
  const history = entries.filter((e) => e.clientId === client.id && !e.isDraft);

  return (
    <>
      <Stack.Screen options={{ title: client.name }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.phone}>{client.phone || 'No phone saved'}</Text>
        {client.notes ? <Text style={styles.notes}>{client.notes}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <Text>Visits: {stats?.visitCount ?? 0}</Text>
          <Text>
            Total spent: {stats?.totalSpent.toFixed(2) ?? '0.00'} {activeBusiness?.currency}
          </Text>
          <Text>Member since: {new Date(client.createdAt).toLocaleDateString()}</Text>
        </View>

        <Text style={styles.sectionTitle}>History</Text>
        {history.length === 0 ? (
          <Text style={styles.hint}>No ledger entries linked yet.</Text>
        ) : (
          history.map((e) => (
            <View key={e.id} style={styles.row}>
              <Text>
                {e.type} · {e.amount.toFixed(2)} · {e.entryDate.slice(0, 10)}
              </Text>
              <Text style={styles.meta}>{e.description}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  phone: { fontSize: 16, opacity: 0.8 },
  notes: { marginTop: 8, marginBottom: 12 },
  card: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    marginVertical: 12,
  },
  sectionTitle: { fontWeight: '600', fontSize: 16, marginBottom: 8 },
  row: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  meta: { fontSize: 12, opacity: 0.65 },
  hint: { opacity: 0.6 },
});

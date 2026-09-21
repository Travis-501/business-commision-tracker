import { Link, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { BusinessSwitcher } from '@/src/components/BusinessSwitcher';
import { useBusinessBooks } from '@/src/context/BusinessBooksContext';
import * as db from '@/src/db/database';

const channelLabel = { internal: 'In-app', sms: 'SMS', whatsapp: 'WhatsApp' };

export default function ChatScreen() {
  const { clients, threads, getOrCreateThread } = useBusinessBooks();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Chat</Text>
      <Text style={styles.sub}>
        In-app threads work offline. Connect SMS/WhatsApp in Settings (Twilio or Meta).
      </Text>
      <BusinessSwitcher />

      <Text style={styles.sectionTitle}>Start conversation</Text>
      {clients.map((c) => (
        <View key={c.id} style={styles.clientBlock}>
          <Text style={styles.clientName}>{c.name}</Text>
          <View style={styles.row}>
            {(['internal', 'sms', 'whatsapp'] as const).map((ch) => {
              const thread = threads.find((t) => t.clientId === c.id && t.channel === ch);
              const open = () => getOrCreateThread(c.id, ch);
              if (thread) {
                return (
                  <Link key={ch} href={`/chat/${thread.id}`} asChild>
                    <Pressable style={styles.channelBtn}>
                      <Text>{channelLabel[ch]}</Text>
                    </Pressable>
                  </Link>
                );
              }
              return (
                <Pressable
                  key={ch}
                  style={styles.channelBtn}
                  onPress={() => {
                    const t = open();
                    router.push(`/chat/${t.id}`);
                  }}>
                  <Text>{channelLabel[ch]}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Recent threads</Text>
      {threads.length === 0 ? (
        <Text style={styles.hint}>No messages yet.</Text>
      ) : (
        threads.map((t) => {
          const client = db.getClient(t.clientId);
          return (
            <Link key={t.id} href={`/chat/${t.id}`} asChild>
              <Pressable style={styles.threadRow}>
                <Text style={styles.threadTitle}>
                  {client?.name ?? 'Client'} · {channelLabel[t.channel]}
                </Text>
                <Text style={styles.meta}>{new Date(t.lastMessageAt).toLocaleString()}</Text>
              </Pressable>
            </Link>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700' },
  sub: { fontSize: 13, opacity: 0.65, marginBottom: 8 },
  sectionTitle: { fontWeight: '600', marginBottom: 8 },
  clientBlock: { marginBottom: 12 },
  clientName: { fontWeight: '600', marginBottom: 6 },
  row: { flexDirection: 'row', gap: 8 },
  channelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
  },
  threadRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  threadTitle: { fontWeight: '600' },
  meta: { fontSize: 12, opacity: 0.6 },
  hint: { opacity: 0.6 },
});

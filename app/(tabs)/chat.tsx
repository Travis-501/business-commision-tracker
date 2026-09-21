import { Link, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text, useThemeColor } from '@/components/Themed';
import { BusinessSwitcher } from '@/src/components/BusinessSwitcher';
import { useBusinessBooks } from '@/src/context/BusinessBooksContext';
import * as db from '@/src/db/database';

const channelLabel = { internal: 'In-app', sms: 'SMS', whatsapp: 'WhatsApp' };

export default function ChatScreen() {
  const { activeBusiness, clients, threads, getOrCreateThread } = useBusinessBooks();
  const panelBackground = useThemeColor({ light: '#ffffff', dark: '#111827' }, 'background');
  const panelBorder = useThemeColor({ light: '#e2e8f0', dark: '#334155' }, 'background');
  const buttonBackground = useThemeColor({ light: '#e2e8f0', dark: '#1f2937' }, 'background');
  const buttonText = useThemeColor({ light: '#0f172a', dark: '#f8fafc' }, 'text');
  const mutedText = useThemeColor({ light: '#475569', dark: '#cbd5e1' }, 'text');
  const sectionText = useThemeColor({ light: '#0f172a', dark: '#e2e8f0' }, 'text');

  if (!activeBusiness) {
    return (
      <View style={[styles.emptyState, { backgroundColor: useThemeColor({ light: '#f8fafc', dark: '#020817' }, 'background') }]}> 
        <Text style={[styles.emptyText, { color: sectionText }]}>Select a business in Settings to start chat threads.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: useThemeColor({ light: '#f8fafc', dark: '#020817' }, 'background') }]}>
      <Text style={[styles.title, { color: sectionText }]}>Chat</Text>
      <Text style={[styles.sub, { color: mutedText }]}> 
        In-app threads work offline. Connect SMS/WhatsApp in Settings (Twilio or Meta).
      </Text>
      <BusinessSwitcher />

      <Text style={[styles.sectionTitle, { color: sectionText }]}>Start conversation</Text>
      {clients.length === 0 ? (
        <Text style={[styles.hint, { color: mutedText }]}>Add a client first to create chat threads.</Text>
      ) : (
        clients.map((c) => (
          <View key={c.id} style={[styles.clientBlock, { backgroundColor: panelBackground, borderColor: panelBorder }]}>
            <Text style={[styles.clientName, { color: sectionText }]}>{c.name}</Text>
            <View style={styles.row}>
              {(['internal', 'sms', 'whatsapp'] as const).map((ch) => {
                const thread = threads.find((t) => t.clientId === c.id && t.channel === ch);
                if (thread) {
                  return (
                    <Link key={ch} href={`/chat/${thread.id}`} asChild>
                      <Pressable style={StyleSheet.flatten([styles.channelBtn, { backgroundColor: buttonBackground }])}> 
                        <Text style={{ color: buttonText }}>{channelLabel[ch]}</Text>
                      </Pressable>
                    </Link>
                  );
                }
                return (
                  <Pressable
                    key={ch}
                    style={StyleSheet.flatten([styles.channelBtn, { backgroundColor: buttonBackground }])}
                    onPress={() => {
                      const t = getOrCreateThread(c.id, ch);
                      router.push(`/chat/${t.id}`);
                    }}>
                    <Text style={{ color: buttonText }}>{channelLabel[ch]}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))
      )}

      <Text style={[styles.sectionTitle, { marginTop: 16, color: sectionText }]}>Recent threads</Text>
      {threads.length === 0 ? (
        <Text style={[styles.hint, { color: mutedText }]}>No messages yet.</Text>
      ) : (
        threads.map((t) => {
          const client = db.getClient(t.clientId);
          return (
            <Link key={t.id} href={`/chat/${t.id}`} asChild>
              <Pressable style={StyleSheet.flatten([styles.threadRow, { borderBottomColor: panelBorder }])}> 
                <Text style={[styles.threadTitle, { color: sectionText }]}>
                  {client?.name ?? 'Client'} · {channelLabel[t.channel]}
                </Text>
                <Text style={[styles.meta, { color: mutedText }]}>{new Date(t.lastMessageAt).toLocaleString()}</Text>
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
  clientBlock: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  clientName: { fontWeight: '600', marginBottom: 6 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  channelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  threadRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  threadTitle: { fontWeight: '600' },
  meta: { fontSize: 12, opacity: 0.6 },
  hint: { opacity: 0.6 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
  },
});

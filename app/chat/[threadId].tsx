import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Text } from '@/components/Themed';
import { useBusinessBooks } from '@/src/context/BusinessBooksContext';

export default function ChatThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { getThreadMessages, sendChatMessage, refresh, threads } = useBusinessBooks();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const thread = threads.find((t) => t.id === threadId);
  const messages = threadId ? getThreadMessages(threadId) : [];

  const onSend = useCallback(async () => {
    if (!threadId) return;
    const result = await sendChatMessage(threadId, text);
    setText('');
    refresh();
    setError(result.error ?? null);
  }, [refresh, sendChatMessage, text, threadId]);

  return (
    <>
      <Stack.Screen options={{ title: thread ? `Chat (${thread.channel})` : 'Chat' }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}>
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.direction === 'out' ? styles.bubbleOut : styles.bubbleIn,
              ]}>
              <Text>{item.body}</Text>
              <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
            </View>
          )}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            multiline
          />
          <Pressable style={styles.send} onPress={onSend}>
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: 12, paddingBottom: 8 },
  bubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  bubbleOut: { alignSelf: 'flex-end', backgroundColor: '#dbeafe' },
  bubbleIn: { alignSelf: 'flex-start', backgroundColor: '#e2e8f0' },
  time: { fontSize: 10, opacity: 0.5, marginTop: 4 },
  composer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#cbd5e1',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
  },
  send: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  sendText: { color: '#fff', fontWeight: '600' },
  error: { color: '#dc2626', fontSize: 12, paddingHorizontal: 12, paddingBottom: 4 },
});

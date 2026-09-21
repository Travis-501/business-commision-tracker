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

import { Text, useThemeColor } from '@/components/Themed';
import { useBusinessBooks } from '@/src/context/BusinessBooksContext';

export default function ChatThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId?: string | string[] }>();
  const { getThreadMessages, sendChatMessage, refresh, threads } = useBusinessBooks();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const safeThreadId = Array.isArray(threadId) ? threadId[0] : threadId ?? null;

  const screenBackground = useThemeColor({ light: '#f8fafc', dark: '#020817' }, 'background');
  const bubbleOut = useThemeColor({ light: '#dbeafe', dark: '#1d4ed8' }, 'background');
  const bubbleIn = useThemeColor({ light: '#e2e8f0', dark: '#1f2937' }, 'background');
  const inputBackground = useThemeColor({ light: '#ffffff', dark: '#0f172a' }, 'background');
  const inputBorder = useThemeColor({ light: '#cbd5e1', dark: '#475569' }, 'background');
  const textColor = useThemeColor({ light: '#0f172a', dark: '#f8fafc' }, 'text');
  const mutedText = useThemeColor({ light: '#475569', dark: '#cbd5e1' }, 'text');
  const borderColor = useThemeColor({ light: '#cbd5e1', dark: '#334155' }, 'background');
  const sendBackground = useThemeColor({ light: '#2563eb', dark: '#60a5fa' }, 'background');

  const thread = safeThreadId ? threads.find((t) => t.id === safeThreadId) ?? null : null;
  const messages = safeThreadId ? getThreadMessages(safeThreadId) : [];

  const onSend = useCallback(async () => {
    if (!safeThreadId) {
      setError('This chat thread is unavailable.');
      return;
    }
    if (!text.trim()) return;
    const result = await sendChatMessage(safeThreadId, text);
    setText('');
    refresh();
    setError(result.error ?? null);
  }, [refresh, safeThreadId, sendChatMessage, text]);

  return (
    <>
      <Stack.Screen options={{ title: thread ? `Chat (${thread.channel})` : 'Chat' }} />
      {!safeThreadId || !thread ? (
        <View style={[styles.empty, { backgroundColor: screenBackground }]}>
          <Text style={{ color: textColor }}>This chat thread is unavailable.</Text>
        </View>
      ) : (
      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor: screenBackground }]}
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
                {
                  backgroundColor: item.direction === 'out' ? bubbleOut : bubbleIn,
                },
              ]}>
              <Text style={{ color: textColor }}>{item.body}</Text>
              <Text style={[styles.time, { color: mutedText }]}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
            </View>
          )}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={[styles.composer, { borderTopColor: borderColor }]}> 
          <TextInput
            style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: textColor }]}
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            placeholderTextColor={mutedText}
            multiline
          />
          <Pressable style={[styles.send, { backgroundColor: sendBackground }]} onPress={onSend}>
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      )}
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
  bubbleOut: { alignSelf: 'flex-end' },
  bubbleIn: { alignSelf: 'flex-start' },
  time: { fontSize: 10, marginTop: 4 },
  composer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
  },
  send: {
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  sendText: { color: '#fff', fontWeight: '600' },
  error: { color: '#dc2626', fontSize: 12, paddingHorizontal: 12, paddingBottom: 4 },
});

import { Pressable, StyleSheet, View } from 'react-native';

import { Text, useThemeColor } from '@/components/Themed';
import { useBusinessBooks } from '@/src/context/BusinessBooksContext';

export function BusinessSwitcher() {
  const { businesses, activeBusiness, setActiveBusiness } = useBusinessBooks();
  const chipBackground = useThemeColor({ light: '#e8ecf1', dark: '#1f2937' }, 'background');
  const chipActiveBackground = useThemeColor({ light: '#2563eb', dark: '#3b82f6' }, 'background');
  const chipText = useThemeColor({ light: '#334155', dark: '#e2e8f0' }, 'text');
  const chipTextActive = useThemeColor({ light: '#ffffff', dark: '#f8fafc' }, 'text');

  return (
    <View style={styles.row}>
      {businesses.map((b) => {
        const active = b.id === activeBusiness?.id;
        return (
          <Pressable
            key={b.id}
            onPress={() => setActiveBusiness(b.id)}
            style={[styles.chip, { backgroundColor: active ? chipActiveBackground : chipBackground }]}>
            <Text style={[styles.chipText, { color: active ? chipTextActive : chipText }]}>{b.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e8ecf1',
  },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 13, color: '#334155' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
});

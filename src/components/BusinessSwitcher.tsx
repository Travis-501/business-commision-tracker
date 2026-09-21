import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useBusinessBooks } from '@/src/context/BusinessBooksContext';

export function BusinessSwitcher() {
  const { businesses, activeBusiness, setActiveBusiness } = useBusinessBooks();

  return (
    <View style={styles.row}>
      {businesses.map((b) => {
        const active = b.id === activeBusiness?.id;
        return (
          <Pressable
            key={b.id}
            onPress={() => setActiveBusiness(b.id)}
            style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{b.name}</Text>
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

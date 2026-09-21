import { Link } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { BusinessSwitcher } from '@/src/components/BusinessSwitcher';
import { IncomeChart } from '@/src/components/IncomeChart';
import { useBusinessBooks } from '@/src/context/BusinessBooksContext';
import {
  frequentClients,
  growthRatePercent,
  incomeByMonth,
  retentionRatePercent,
} from '@/src/lib/analytics';
import { dailyIncome, netForDay, suggestedWorkerPay } from '@/src/lib/booksEngine';

export default function DashboardScreen() {
  const { activeBusiness, entries, clients } = useBusinessBooks();
  const today = new Date().toISOString().slice(0, 10);
  const monthPoints = incomeByMonth(entries);
  const growth = growthRatePercent(monthPoints);
  const retention = retentionRatePercent(clients, entries);
  const topClients = frequentClients(clients, entries, 3);

  const incomeToday = activeBusiness ? dailyIncome(entries, today) : 0;
  const netToday = activeBusiness ? netForDay(entries, today) : 0;
  const workerSuggestion = activeBusiness ? suggestedWorkerPay(activeBusiness, incomeToday) : 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Business Books</Text>
      <BusinessSwitcher />

      {activeBusiness ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Today ({activeBusiness.currency})</Text>
            <Text style={styles.big}>Income {incomeToday.toFixed(2)}</Text>
            <Text>Net {netToday.toFixed(2)}</Text>
            <Text style={styles.hint}>
              Worker pay ({activeBusiness.workerPayNumerator}:
              {activeBusiness.workerPayDenominator} of income):{' '}
              {workerSuggestion.toFixed(2)}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Performance</Text>
            <Text>
              MoM growth:{' '}
              {growth === null ? '—' : `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`}
            </Text>
            <Text>
              Client retention (90d):{' '}
              {retention === null ? '—' : `${retention.toFixed(0)}%`}
            </Text>
            <IncomeChart points={monthPoints} />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Frequent customers</Text>
            {topClients.length === 0 ? (
              <Text style={styles.hint}>Link clients to income entries to rank them.</Text>
            ) : (
              topClients.map((row) => (
                <Link key={row.client.id} href={`/client/${row.client.id}`} asChild>
                  <Text style={styles.link}>
                    {row.client.name} — {row.visitCount} visits, {row.totalSpent.toFixed(2)}{' '}
                    {activeBusiness.currency}
                  </Text>
                </Link>
              ))
            )}
          </View>
        </>
      ) : (
        <Text>Add a business in Settings.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e2e8f0',
  },
  cardLabel: { fontSize: 13, opacity: 0.7, marginBottom: 4 },
  big: { fontSize: 20, fontWeight: '600', marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  hint: { fontSize: 13, opacity: 0.65, marginTop: 4 },
  link: { color: '#2563eb', marginVertical: 4 },
});

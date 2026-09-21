import { Link } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text, useThemeColor } from '@/components/Themed';
import { BusinessSwitcher } from '@/src/components/BusinessSwitcher';
import { ExpenditureChart, IncomeChart } from '@/src/components/IncomeChart';
import { useBusinessBooks } from '@/src/context/BusinessBooksContext';
import {
    frequentClients,
    growthRatePercent,
    incomeByMonth,
    retentionRatePercent,
} from '@/src/lib/analytics';
import { dailyIncome, dailySpentMoney, netForDay, suggestedWorkerPay } from '@/src/lib/booksEngine';

export default function DashboardScreen() {
  const { activeBusiness, entries, clients } = useBusinessBooks();
  const today = new Date().toISOString().slice(0, 10);
  const screenBackground = useThemeColor({ light: '#f8fafc', dark: '#020817' }, 'background');
  const cardBackground = useThemeColor({ light: '#ffffff', dark: '#111827' }, 'background');
  const cardBorder = useThemeColor({ light: '#e2e8f0', dark: '#334155' }, 'background');
  const textColor = useThemeColor({ light: '#0f172a', dark: '#e2e8f0' }, 'text');
  const mutedText = useThemeColor({ light: '#475569', dark: '#cbd5e1' }, 'text');
  const monthPoints = incomeByMonth(entries);
  const growth = growthRatePercent(monthPoints);
  const retention = retentionRatePercent(clients, entries);
  const topClients = frequentClients(clients, entries, 3);

  const incomeToday = activeBusiness ? dailyIncome(entries, today) : 0;
  const spendToday = activeBusiness ? dailySpentMoney(entries, today) : 0;
  const netToday = activeBusiness ? netForDay(entries, today) : 0;
  const workerSuggestion = activeBusiness ? suggestedWorkerPay(activeBusiness, incomeToday, spendToday) : 0;

  if (!activeBusiness) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: screenBackground }]}> 
        <Text style={[styles.title, { color: textColor }]}>Business Books</Text>
        <BusinessSwitcher />
        <Text style={[styles.emptyText, { color: mutedText }]}>Add a business in Settings to start tracking chats and income.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: screenBackground }]}> 
      <Text style={[styles.title, { color: textColor }]}>Business Books</Text>
      <BusinessSwitcher />

      <View style={[styles.card, { backgroundColor: cardBackground, borderColor: cardBorder }]}> 
        <Text style={[styles.cardLabel, { color: mutedText }]}>Today ({activeBusiness.currency})</Text>
        <Text style={[styles.big, { color: textColor }]}>Income {incomeToday.toFixed(2)}</Text>
        <Text style={{ color: textColor }}>Net {netToday.toFixed(2)}</Text>
        <Text style={{ color: textColor }}>Spent {spendToday.toFixed(2)}</Text>
        <Text style={[styles.hint, { color: mutedText }]}> 
          Worker pay ({activeBusiness.workerPayNumerator}:{activeBusiness.workerPayDenominator} of income):{' '}
          {workerSuggestion.toFixed(2)}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: cardBackground, borderColor: cardBorder }]}> 
        <Text style={[styles.sectionTitle, { color: textColor }]}>Performance</Text>
        <Text style={{ color: textColor }}>
          MoM growth:{' '}
          {growth === null ? '—' : `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`}
        </Text>
        <Text style={{ color: textColor }}>
          Client retention (90d):{' '}
          {retention === null ? '—' : `${retention.toFixed(0)}%`}
        </Text>
        <IncomeChart points={monthPoints} />
      </View>

      <View style={[styles.card, { backgroundColor: cardBackground, borderColor: cardBorder }]}> 
        <Text style={[styles.sectionTitle, { color: textColor }]}>Expenditure</Text>
        <ExpenditureChart points={monthPoints} />
      </View>

      <View style={[styles.card, { backgroundColor: cardBackground, borderColor: cardBorder }]}> 
        <Text style={[styles.sectionTitle, { color: textColor }]}>Frequent customers</Text>
        {topClients.length === 0 ? (
          <Text style={[styles.hint, { color: mutedText }]}>Link clients to income entries to rank them.</Text>
        ) : (
          topClients.map((row) => (
            <Link key={row.client.id} href={`/client/${row.client.id}`} asChild>
              <Text style={[styles.link, { color: '#2563eb' }]}>
                {row.client.name} — {row.visitCount} visits, {row.totalSpent.toFixed(2)}{' '}
                {activeBusiness.currency}
              </Text>
            </Link>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardLabel: { fontSize: 13, opacity: 0.7, marginBottom: 4 },
  big: { fontSize: 20, fontWeight: '600', marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  hint: { fontSize: 13, opacity: 0.65, marginTop: 4 },
  link: { color: '#2563eb', marginVertical: 4 },
  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 12 },
});

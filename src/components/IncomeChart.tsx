import { Dimensions, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import type { PeriodPoint } from '@/src/lib/analytics';

const chartWidth = Dimensions.get('window').width - 48;

export function IncomeChart({ points }: { points: PeriodPoint[] }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const gridColor = isDark ? '#334155' : '#cbd5e1';
  const textColor = isDark ? '#e2e8f0' : '#475569';

  if (points.every((p) => p.income === 0 && p.net === 0)) {
    return <Text style={{ opacity: 0.6 }}>Add income entries to see trends.</Text>;
  }

  return (
    <View>
      <LineChart
        data={{
          labels: points.map((p) => p.label),
          datasets: [
            { data: points.map((p) => p.income), color: () => '#2563eb', strokeWidth: 2 },
            { data: points.map((p) => Math.max(p.net, 0)), color: () => '#16a34a', strokeWidth: 2 },
          ],
          legend: ['Income', 'Net'],
        }}
        width={chartWidth}
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          backgroundGradientFrom: isDark ? '#0f172a' : '#f8fafc',
          backgroundGradientTo: isDark ? '#111827' : '#f8fafc',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(96, 165, 250, ${opacity})`,
          labelColor: () => textColor,
          propsForDots: { r: '4' },
          strokeWidth: 2,
          fillShadowGradientFromOpacity: 0.4,
          fillShadowGradientToOpacity: 0,
          propsForBackgroundLines: {
            stroke: gridColor,
            strokeWidth: 1,
          },
        }}
        bezier
        style={{ borderRadius: 12 }}
      />
    </View>
  );
}

export function ExpenditureChart({ points }: { points: PeriodPoint[] }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const gridColor = isDark ? '#334155' : '#cbd5e1';
  const textColor = isDark ? '#e2e8f0' : '#475569';

  if (points.every((p) => p.spend === 0 && p.workerPay === 0)) {
    return <Text style={{ opacity: 0.6 }}>Add expenses or worker pay entries to see spending.</Text>;
  }

  return (
    <View>
      <LineChart
        data={{
          labels: points.map((p) => p.label),
          datasets: [
            { data: points.map((p) => p.spend), color: () => '#f59e0b', strokeWidth: 2 },
            { data: points.map((p) => p.workerPay), color: () => '#ef4444', strokeWidth: 2 },
          ],
          legend: ['Spending', 'Worker Pay'],
        }}
        width={chartWidth}
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          backgroundGradientFrom: isDark ? '#0f172a' : '#f8fafc',
          backgroundGradientTo: isDark ? '#111827' : '#f8fafc',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(251, 146, 60, ${opacity})`,
          labelColor: () => textColor,
          propsForDots: { r: '4' },
          strokeWidth: 2,
          fillShadowGradientFromOpacity: 0.3,
          fillShadowGradientToOpacity: 0,
          propsForBackgroundLines: {
            stroke: gridColor,
            strokeWidth: 1,
          },
        }}
        bezier
        style={{ borderRadius: 12 }}
      />
    </View>
  );
}

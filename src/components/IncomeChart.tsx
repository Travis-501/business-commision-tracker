import { Dimensions, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

import { Text } from '@/components/Themed';
import type { PeriodPoint } from '@/src/lib/analytics';

const chartWidth = Dimensions.get('window').width - 48;

export function IncomeChart({ points }: { points: PeriodPoint[] }) {
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
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#f8fafc',
          backgroundGradientTo: '#f8fafc',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
          labelColor: () => '#64748b',
          propsForDots: { r: '4' },
        }}
        bezier
        style={{ borderRadius: 12 }}
      />
    </View>
  );
}

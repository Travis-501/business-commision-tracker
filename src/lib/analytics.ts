import type { Client, LedgerEntry } from '@/src/types/models';

export interface PeriodPoint {
  label: string;
  income: number;
  net: number;
  spend: number;
  workerPay: number;
}

export function incomeByMonth(entries: LedgerEntry[], months = 6): PeriodPoint[] {
  const now = new Date();
  const points: PeriodPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthEntries = entries.filter(
      (e) => !e.isDraft && e.entryDate.startsWith(key)
    );
    const income = monthEntries
      .filter((e) => e.type === 'income')
      .reduce((s, e) => s + e.amount, 0);
    const spend = monthEntries.reduce((s, e) => s + (Number(e.spentMoney) || 0), 0);
    const workerPay = monthEntries
      .filter((e) => e.type === 'worker_pay')
      .reduce((s, e) => s + e.amount, 0);
    const expenses = monthEntries
      .filter((e) => e.type !== 'income')
      .reduce((s, e) => s + e.amount, 0);
    points.push({
      label: d.toLocaleDateString(undefined, { month: 'short' }),
      income,
      net: income - expenses,
      spend,
      workerPay,
    });
  }
  return points;
}

export function growthRatePercent(points: PeriodPoint[]): number | null {
  if (points.length < 2) return null;
  const prev = points[points.length - 2].income;
  const curr = points[points.length - 1].income;
  if (prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

/** Share of clients with more than one income entry in the last 90 days */
export function retentionRatePercent(
  clients: Client[],
  entries: LedgerEntry[]
): number | null {
  if (clients.length === 0) return null;
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  let retained = 0;
  for (const client of clients) {
    const visits = entries.filter(
      (e) =>
        !e.isDraft &&
        e.clientId === client.id &&
        e.type === 'income' &&
        new Date(e.entryDate).getTime() >= cutoff
    );
    if (visits.length >= 2) retained += 1;
  }
  return (retained / clients.length) * 100;
}

export function frequentClients(
  clients: Client[],
  entries: LedgerEntry[],
  limit = 5
): { client: Client; visitCount: number; totalSpent: number }[] {
  return clients
    .map((client) => {
      const related = entries.filter(
        (e) => !e.isDraft && e.clientId === client.id && e.type === 'income'
      );
      return {
        client,
        visitCount: related.length,
        totalSpent: related.reduce((s, e) => s + e.amount, 0),
      };
    })
    .filter((row) => row.visitCount > 0)
    .sort((a, b) => b.visitCount - a.visitCount || b.totalSpent - a.totalSpent)
    .slice(0, limit);
}

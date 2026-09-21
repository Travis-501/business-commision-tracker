import type { Business, CustomRatio, LedgerEntry } from '@/src/types/models';

export function dailyIncome(entries: LedgerEntry[], dayIso: string): number {
  return sumByType(entries, dayIso, ['income']);
}

export function dailyExpenses(entries: LedgerEntry[], dayIso: string): number {
  return sumByType(entries, dayIso, ['expense', 'worker_pay', 'payment']);
}

export function dailySpentMoney(entries: LedgerEntry[], dayIso: string): number {
  return entries
    .filter((e) => !e.isDraft && e.entryDate.startsWith(dayIso))
    .reduce((sum, e) => sum + (Number(e.spentMoney) || 0), 0);
}

export function netForDay(entries: LedgerEntry[], dayIso: string): number {
  return dailyIncome(entries, dayIso) - dailyExpenses(entries, dayIso);
}

export function suggestedWorkerPay(
  business: Business,
  dailyIncomeAmount: number,
  extraWorkerValue = 0
): number {
  if (business.workerPayDenominator <= 0) return 0;
  return ((dailyIncomeAmount + extraWorkerValue) * business.workerPayNumerator) / business.workerPayDenominator;
}

export function applyCustomRatio(amount: number, ratio: CustomRatio): number {
  if (ratio.denominator <= 0) return 0;
  return (amount * ratio.numerator) / ratio.denominator;
}

export function simulateEntryChange(
  entries: LedgerEntry[],
  business: Business,
  dayIso: string,
  patch: Partial<LedgerEntry> & { id?: string }
): {
  entries: LedgerEntry[];
  dailyIncome: number;
  dailySpentMoney: number;
  suggestedWorkerPay: number;
  net: number;
} {
  const next = [...entries];
  if (patch.id) {
    const idx = next.findIndex((e) => e.id === patch.id);
    if (idx >= 0) {
      next[idx] = { ...next[idx], ...patch };
    }
  }
  const income = dailyIncome(next, dayIso);
  const spent = dailySpentMoney(next, dayIso);
  return {
    entries: next,
    dailyIncome: income,
    dailySpentMoney: spent,
    suggestedWorkerPay: suggestedWorkerPay(business, income, spent),
    net: netForDay(next, dayIso),
  };
}

function sumByType(entries: LedgerEntry[], dayIso: string, types: LedgerEntry['type'][]): number {
  return entries
    .filter((e) => !e.isDraft && e.entryDate.startsWith(dayIso) && types.includes(e.type))
    .reduce((sum, e) => sum + e.amount, 0);
}

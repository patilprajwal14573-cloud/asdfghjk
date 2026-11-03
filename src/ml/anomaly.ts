// Anomaly detection for transactions.
//
// Two signals are used:
//  1. Per-category z-score: for each category we compute the mean and standard
//     deviation of expense amounts. Any expense whose amount is more than 2
//     standard deviations above the category mean is flagged as unusually high.
//  2. Duplicate-charge detection: two expenses with the same merchant keyword
//     and the same amount within a 2-day window are flagged as a possible
//     duplicate charge.
//
// Each flag carries a plain-language reason so the Insights page can explain
// *why* something was flagged without exposing the math.

import { Transaction } from '@/utils/types';

export interface AnomalyFlag {
  transaction: Transaction;
  type: 'unusual' | 'duplicate';
  reason: string;
  severity: 'warning' | 'info';
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function std(nums: number[]): number {
  if (nums.length < 2) return 0;
  const m = mean(nums);
  const variance = nums.reduce((acc, x) => acc + (x - m) ** 2, 0) / nums.length;
  return Math.sqrt(variance);
}

// Merchant keyword: first non-noise token of the description, used for
// duplicate grouping so "UPI SWIGGY BANGALORE" and "SWIGGY ORDER" match.
function merchantKey(description: string): string {
  const noise = ['upi', 'pos', 'txn', 'ref', 'to', 'via', 'at', 'in'];
  const tokens = description
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !noise.includes(t));
  return tokens[0] ?? description.toLowerCase().trim();
}

export function detectAnomalies(transactions: Transaction[]): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];

  const expenses = transactions.filter((t) => t.type === 'expense');
  if (expenses.length === 0) return flags;

  // 1. Per-category z-score
  const byCategory = new Map<string, number[]>();
  for (const t of expenses) {
    const arr = byCategory.get(t.category) ?? [];
    arr.push(t.amount);
    byCategory.set(t.category, arr);
  }

  const stats = new Map<string, { m: number; s: number }>();
  for (const [cat, amounts] of byCategory) {
    stats.set(cat, { m: mean(amounts), s: std(amounts) });
  }

  for (const t of expenses) {
    const { m, s } = stats.get(t.category) ?? { m: 0, s: 0 };
    if (s > 0) {
      const z = (t.amount - m) / s;
      if (z > 2) {
        const pctAbove = Math.round(((t.amount - m) / m) * 100);
        flags.push({
          transaction: t,
          type: 'unusual',
          severity: 'warning',
          reason: `This ${t.category.toLowerCase()} charge of ₹${t.amount.toFixed(
            0,
          )} is about ${pctAbove}% higher than your usual ${t.category.toLowerCase()} spending (around ₹${m.toFixed(
            0,
          )}).`,
        });
      }
    }
  }

  // 2. Duplicate-charge detection (same merchant + amount within 2 days)
  const sorted = [...expenses].sort(
    (a, b) => a.date.localeCompare(b.date),
  );
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];
      const daysDiff =
        (new Date(b.date).getTime() - new Date(a.date).getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysDiff > 2) break;
      if (
        daysDiff > 0 &&
        a.amount === b.amount &&
        merchantKey(a.description) === merchantKey(b.description)
      ) {
        flags.push({
          transaction: b,
          type: 'duplicate',
          severity: 'warning',
          reason: `Possible duplicate charge: ₹${a.amount.toFixed(
            0,
          )} was charged by the same merchant on ${a.date} and again on ${b.date}.`,
        });
      }
    }
  }

  return flags;
}

import { describe, it, expect } from 'vitest';
import { detectAnomalies } from '@/ml/anomaly';
import { Transaction, Category } from '@/utils/types';

function makeTxn(
  id: string,
  date: string,
  description: string,
  amount: number,
  category: Category = 'Food',
): Transaction {
  return {
    id,
    date,
    description,
    amount,
    type: 'expense',
    category,
    predictedCategory: category,
    confidence: 0.9,
    alternatives: [],
    corrected: false,
  };
}

describe('detectAnomalies', () => {
  it('flags a z-score outlier above 2 std', () => {
    const txns = [
      makeTxn('1', '2026-10-01', 'UPI SWIGGY', 100),
      makeTxn('2', '2026-10-02', 'UPI SWIGGY', 120),
      makeTxn('3', '2026-10-03', 'UPI SWIGGY', 90),
      makeTxn('4', '2026-10-04', 'UPI SWIGGY', 110),
      makeTxn('5', '2026-10-05', 'UPI SWIGGY', 100),
      makeTxn('6', '2026-10-06', 'UPI SWIGGY', 130),
      makeTxn('7', '2026-10-07', 'UPI SWIGGY', 95),
      makeTxn('8', '2026-10-08', 'UPI SWIGGY', 115),
      makeTxn('9', '2026-10-09', 'UPI SWIGGY', 105),
      makeTxn('10', '2026-10-10', 'UPI SWIGGY', 1000), // outlier
    ];
    const flags = detectAnomalies(txns);
    expect(flags.some((f) => f.type === 'unusual' && f.transaction.id === '10')).toBe(true);
  });

  it('flags a duplicate charge within 2 days', () => {
    const txns = [
      makeTxn('1', '2026-10-01', 'UPI NETFLIX', 499),
      makeTxn('2', '2026-10-02', 'UPI NETFLIX', 499),
    ];
    const flags = detectAnomalies(txns);
    expect(flags.some((f) => f.type === 'duplicate')).toBe(true);
  });

  it('does not flag duplicates more than 2 days apart', () => {
    const txns = [
      makeTxn('1', '2026-10-01', 'UPI NETFLIX', 499),
      makeTxn('2', '2026-10-05', 'UPI NETFLIX', 499),
    ];
    const flags = detectAnomalies(txns);
    expect(flags.some((f) => f.type === 'duplicate')).toBe(false);
  });

  it('provides a plain-language reason', () => {
    const txns = [
      makeTxn('1', '2026-10-01', 'UPI SWIGGY', 100),
      makeTxn('2', '2026-10-02', 'UPI SWIGGY', 120),
      makeTxn('3', '2026-10-03', 'UPI SWIGGY', 90),
      makeTxn('4', '2026-10-04', 'UPI SWIGGY', 110),
      makeTxn('5', '2026-10-05', 'UPI SWIGGY', 100),
      makeTxn('6', '2026-10-06', 'UPI SWIGGY', 130),
      makeTxn('7', '2026-10-07', 'UPI SWIGGY', 95),
      makeTxn('8', '2026-10-08', 'UPI SWIGGY', 115),
      makeTxn('9', '2026-10-09', 'UPI SWIGGY', 105),
      makeTxn('10', '2026-10-10', 'UPI SWIGGY', 900),
    ];
    const flags = detectAnomalies(txns);
    expect(flags.length).toBeGreaterThan(0);
    expect(flags[0].reason.length).toBeGreaterThan(10);
  });
});

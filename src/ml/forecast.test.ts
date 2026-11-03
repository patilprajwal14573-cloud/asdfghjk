import { describe, it, expect } from 'vitest';
import { forecastMonthly, fitLine } from '@/ml/forecast';
import { Transaction } from '@/utils/types';

function makeTxn(
  id: string,
  date: string,
  amount: number,
): Transaction {
  return {
    id,
    date,
    description: 'test',
    amount,
    type: 'expense',
    category: 'Food',
    predictedCategory: 'Food',
    confidence: 0.9,
    alternatives: [],
    corrected: false,
  };
}

describe('forecastMonthly', () => {
  it('returns null with insufficient data', () => {
    expect(forecastMonthly([makeTxn('1', '2026-10-01', 100)])).toBeNull();
  });

  it('fits a line to monthly totals', () => {
    const txns = [
      makeTxn('1', '2026-05-01', 1000),
      makeTxn('2', '2026-06-01', 2000),
      makeTxn('3', '2026-07-01', 3000),
      makeTxn('4', '2026-08-01', 4000),
    ];
    const fc = forecastMonthly(txns);
    expect(fc).not.toBeNull();
    // Perfect linear trend: forecast should be 5000 next month.
    expect(Math.round(fc!.nextMonth.forecast)).toBe(5000);
    expect(fc!.points.length).toBe(4);
  });

  it('never returns a negative forecast', () => {
    const txns = [
      makeTxn('1', '2026-05-01', 5000),
      makeTxn('2', '2026-06-01', 1000),
      makeTxn('3', '2026-07-01', 200),
    ];
    const fc = forecastMonthly(txns);
    expect(fc!.nextMonth.forecast).toBeGreaterThanOrEqual(0);
    expect(fc!.nextMonth.rangeLow).toBeGreaterThanOrEqual(0);
  });
});

describe('fitLine', () => {
  it('returns slope and intercept for a perfect line', () => {
    const { slope, intercept } = fitLine([
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
    ]);
    expect(slope).toBe(2);
    expect(intercept).toBe(1);
  });

  it('handles a single point', () => {
    const { slope, intercept } = fitLine([{ x: 0, y: 7 }]);
    expect(slope).toBe(0);
    expect(intercept).toBe(7);
  });
});

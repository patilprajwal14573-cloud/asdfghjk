// Spending forecast using ordinary least-squares linear regression.
//
// We fit a line y = a + b*x to monthly totals (or per-category monthly totals),
// where x is the month index (0, 1, 2, ...) and y is the spend amount. The
// next month's forecast is y at x = n. To give a range we use the standard
// error of the residuals: forecast ± 1.96 * SE for an approximate 95%
// interval. A month with zero spend is treated as 0 so short histories still
// produce a sensible line.

import { Category, Transaction } from '@/utils/types';

export interface ForecastPoint {
  label: string; // e.g. "May" or "May (actual)"
  monthIndex: number;
  actual: number | null;
  forecast: number | null;
  rangeLow: number | null;
  rangeHigh: number | null;
}

export interface ForecastResult {
  points: ForecastPoint[];
  nextMonth: {
    label: string;
    forecast: number;
    rangeLow: number;
    rangeHigh: number;
  };
  slope: number;
  intercept: number;
}

export interface MonthlyTotal {
  label: string;
  monthIndex: number;
  total: number;
}

// Compute ordered monthly totals for a set of expense transactions.
export function monthlyTotals(
  transactions: Transaction[],
  category?: Category,
): MonthlyTotal[] {
  const txns = transactions.filter(
    (t) => t.type === 'expense' && (!category || t.category === category),
  );
  if (txns.length === 0) return [];

  const map = new Map<string, { label: string; total: number; monthIndex: number }>();
  for (const t of txns) {
    const ym = t.date.slice(0, 7); // yyyy-mm
    const label = monthLabel(t.date);
    const entry = map.get(ym) ?? { label, total: 0, monthIndex: 0 };
    entry.total += t.amount;
    map.set(ym, entry);
  }

  const sorted = [...map.keys()].sort();
  sorted.forEach((ym, i) => {
    map.get(ym)!.monthIndex = i;
  });

  return sorted.map((ym) => ({
    label: map.get(ym)!.label,
    monthIndex: map.get(ym)!.monthIndex,
    total: map.get(ym)!.total,
  }));
}

function monthLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleString('en-IN', { month: 'short' });
}

// Fit y = a + b*x via least squares.
export function fitLine(
  points: { x: number; y: number }[],
): { slope: number; intercept: number } {
  const n = points.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  if (n === 1) return { slope: 0, intercept: points[0].y };

  const sumX = points.reduce((a, p) => a + p.x, 0);
  const sumY = points.reduce((a, p) => a + p.y, 0);
  const sumXY = points.reduce((a, p) => a + p.x * p.y, 0);
  const sumXX = points.reduce((a, p) => a + p.x * p.x, 0);
  const denom = n * sumXX - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

// Standard error of the regression residuals.
function residualStdError(
  points: { x: number; y: number }[],
  slope: number,
  intercept: number,
): number {
  if (points.length <= 2) return 0;
  const residuals = points.map((p) => p.y - (intercept + slope * p.x));
  const se = Math.sqrt(
    residuals.reduce((a, r) => a + r * r, 0) / (points.length - 2),
  );
  return se;
}

export function forecastMonthly(
  transactions: Transaction[],
  category?: Category,
): ForecastResult | null {
  const months = monthlyTotals(transactions, category);
  if (months.length < 2) return null;

  const pts = months.map((m) => ({ x: m.monthIndex, y: m.total }));
  const { slope, intercept } = fitLine(pts);
  const se = residualStdError(pts, slope, intercept);

  const points: ForecastPoint[] = months.map((m) => {
    const fit = intercept + slope * m.monthIndex;
    return {
      label: m.label,
      monthIndex: m.monthIndex,
      actual: m.total,
      forecast: fit,
      rangeLow: Math.max(0, fit - 1.96 * se),
      rangeHigh: fit + 1.96 * se,
    };
  });

  const nextIndex = months.length;
  const forecast = Math.max(0, intercept + slope * nextIndex);
  const rangeLow = Math.max(0, forecast - 1.96 * se);
  const rangeHigh = forecast + 1.96 * se;

  const nextLabel = nextMonthLabel(months[months.length - 1].label);

  return {
    points,
    nextMonth: {
      label: nextLabel,
      forecast,
      rangeLow,
      rangeHigh,
    },
    slope,
    intercept,
  };
}

function nextMonthLabel(lastLabel: string): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const i = months.indexOf(lastLabel);
  return months[(i + 1) % 12];
}

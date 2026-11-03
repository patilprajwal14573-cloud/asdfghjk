// Recommendation engine: turns the user's own numbers into plain-language
// advice. Every recommendation is derived from the actual transaction data so
// the advice is personalised, not hard-coded tips.
//
// Recommendations produced:
//  - Savings rate vs. user-set target (default 20%)
//  - 50/30/20 rule check (needs / wants / savings split)
//  - Categories that rose versus the previous month
//  - Recurring subscription detection with yearly cost
//  - "If you cut X by 15% you save ₹Y a year" suggestions

import { Category, Transaction } from '@/utils/types';

export type RecKind =
  | 'savings-rate'
  | 'rule'
  | 'category-rise'
  | 'subscription'
  | 'cut-suggestion';

export interface Recommendation {
  id: string;
  kind: RecKind;
  title: string;
  detail: string;
  tone: 'good' | 'warning' | 'info';
  icon: string; // lucide icon name
}

// Categories considered "needs" vs "wants" for the 50/30/20 rule.
const NEEDS: Category[] = ['Rent', 'Utilities', 'Health', 'Education'];
const WANTS: Category[] = ['Food', 'Transport', 'Shopping', 'Entertainment'];

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function currentMonth(transactions: Transaction[]): string | null {
  if (transactions.length === 0) return null;
  return monthKey(
    [...transactions].sort((a, b) => b.date.localeCompare(a.date))[0].date,
  );
}

function monthTotals(transactions: Transaction[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    const k = monthKey(t.date);
    map.set(k, (map.get(k) ?? 0) + t.amount);
  }
  return map;
}

function monthIncome(transactions: Transaction[], ym: string): number {
  return transactions
    .filter((t) => t.type === 'income' && monthKey(t.date) === ym)
    .reduce((a, t) => a + t.amount, 0);
}

function monthExpenses(transactions: Transaction[], ym: string): number {
  return transactions
    .filter((t) => t.type === 'expense' && monthKey(t.date) === ym)
    .reduce((a, t) => a + t.amount, 0);
}

function categoryMonthSpend(
  transactions: Transaction[],
  ym: string,
): Map<Category, number> {
  const map = new Map<Category, number>();
  for (const t of transactions) {
    if (t.type !== 'expense' || monthKey(t.date) !== ym) continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  return map;
}

function previousMonthKey(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatINR(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function generateRecommendations(
  transactions: Transaction[],
  savingsTarget: number, // percent, e.g. 20
): Recommendation[] {
  const recs: Recommendation[] = [];
  const cur = currentMonth(transactions);
  if (!cur) return recs;

  const income = monthIncome(transactions, cur);
  const spent = monthExpenses(transactions, cur);
  const saved = income - spent;
  const savingsRate = income > 0 ? (saved / income) * 100 : 0;

  // 1. Savings rate vs target
  if (income > 0) {
    if (savingsRate >= savingsTarget) {
      recs.push({
        id: 'savings-rate',
        kind: 'savings-rate',
        title: `You are hitting your savings target`,
        detail: `You saved ${savingsRate.toFixed(
          0,
        )}% of your income this month — above your ${savingsTarget}% goal. Keep it up.`,
        tone: 'good',
        icon: 'PiggyBank',
      });
    } else {
      const gap = savingsTarget - savingsRate;
      const extra = (income * gap) / 100;
      recs.push({
        id: 'savings-rate',
        kind: 'savings-rate',
        title: `Savings below your ${savingsTarget}% target`,
        detail: `You saved ${savingsRate.toFixed(
          0,
        )}% this month. Saving ${formatINR(extra)} more would put you at your target.`,
        tone: 'warning',
        icon: 'PiggyBank',
      });
    }
  }

  // 2. 50/30/20 rule
  if (income > 0) {
    const catSpend = categoryMonthSpend(transactions, cur);
    const needs = NEEDS.reduce((a, c) => a + (catSpend.get(c) ?? 0), 0);
    const wants = WANTS.reduce((a, c) => a + (catSpend.get(c) ?? 0), 0);
    const needsPct = (needs / income) * 100;
    const wantsPct = (wants / income) * 100;
    const savingsPct = Math.max(0, savingsRate);

    const issues: string[] = [];
    if (needsPct > 55) issues.push(`needs are ${needsPct.toFixed(0)}% (target 50%)`);
    if (wantsPct > 35) issues.push(`wants are ${wantsPct.toFixed(0)}% (target 30%)`);
    if (savingsPct < 15) issues.push(`savings are ${savingsPct.toFixed(0)}% (target 20%)`);

    if (issues.length === 0) {
      recs.push({
        id: 'rule',
        kind: 'rule',
        title: `Your spending fits the 50/30/20 rule`,
        detail: `Needs ${needsPct.toFixed(0)}%, wants ${wantsPct.toFixed(0)}%, savings ${savingsPct.toFixed(0)}% — a balanced month.`,
        tone: 'good',
        icon: 'Scale',
      });
    } else {
      recs.push({
        id: 'rule',
        kind: 'rule',
        title: `Spending is off the 50/30/20 balance`,
        detail: `This month ${issues.join(', ')}. A balanced budget spends ~50% on needs, 30% on wants, and 20% on savings.`,
        tone: 'warning',
        icon: 'Scale',
      });
    }
  }

  // 3. Categories that rose vs previous month
  const prev = previousMonthKey(cur);
  const curCat = categoryMonthSpend(transactions, cur);
  const prevCat = categoryMonthSpend(transactions, prev);
  const rises: { category: Category; cur: number; prev: number; pct: number }[] = [];
  for (const c of curCat.keys()) {
    const pv = prevCat.get(c) ?? 0;
    const cv = curCat.get(c) ?? 0;
    if (pv > 0 && cv > pv) {
      rises.push({ category: c, cur: cv, prev: pv, pct: ((cv - pv) / pv) * 100 });
    }
  }
  rises.sort((a, b) => b.pct - a.pct);
  if (rises.length > 0) {
    const top = rises.slice(0, 2);
    for (const r of top) {
      recs.push({
        id: `category-rise-${r.category}`,
        kind: 'category-rise',
        title: `${r.category} spend up ${r.pct.toFixed(0)}%`,
        detail: `You spent ${formatINR(r.cur)} on ${r.category.toLowerCase()} this month, up from ${formatINR(
          r.prev,
        )} last month.`,
        tone: 'info',
        icon: 'TrendingUp',
      });
    }
  }

  // 4. Recurring subscription detection
  const subs = detectSubscriptions(transactions);
  for (const s of subs) {
    recs.push({
      id: `subscription-${s.merchant}`,
      kind: 'subscription',
      title: `Recurring charge: ${s.merchant}`,
      detail: `Charged ${formatINR(s.amount)} every month. That is about ${formatINR(
        s.yearly,
      )} per year — review whether you still use it.`,
      tone: 'info',
      icon: 'Repeat',
    });
  }

  // 5. Cut suggestions (top 3 discretionary categories by spend)
  const discretionary = ['Food', 'Shopping', 'Entertainment', 'Transport'] as Category[];
  const cutCandidates = discretionary
    .map((c) => ({ category: c, amount: curCat.get(c) ?? 0 }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);
  for (const c of cutCandidates) {
    const yearlyCut = c.amount * 12 * 0.15;
    recs.push({
      id: `cut-${c.category}`,
      kind: 'cut-suggestion',
      title: `Cut ${c.category} by 15% to save ${formatINR(yearlyCut)} a year`,
      detail: `You spent ${formatINR(c.amount)} on ${c.category.toLowerCase()} this month. Trimming 15% saves ${formatINR(
        yearlyCut,
      )} over a year.`,
      tone: 'info',
      icon: 'Scissors',
    });
  }

  return recs;
}

interface Subscription {
  merchant: string;
  amount: number;
  yearly: number;
  occurrences: number;
}

// Detect recurring monthly charges: same merchant keyword, same amount,
// appearing in at least 3 distinct months.
function detectSubscriptions(transactions: Transaction[]): Subscription[] {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const groups = new Map<string, Map<number, Set<string>>>();

  for (const t of expenses) {
    const merchant = merchantKeyword(t.description);
    const byAmt = groups.get(merchant) ?? new Map<number, Set<string>>();
    const months = byAmt.get(t.amount) ?? new Set<string>();
    months.add(monthKey(t.date));
    byAmt.set(t.amount, months);
    groups.set(merchant, byAmt);
  }

  const subs: Subscription[] = [];
  for (const [merchant, byAmt] of groups) {
    for (const [amount, months] of byAmt) {
      if (months.size >= 3) {
        const displayMerchant = displayMerchantName(merchant);
        subs.push({
          merchant: displayMerchant,
          amount,
          yearly: amount * 12,
          occurrences: months.size,
        });
      }
    }
  }
  return subs;
}

function merchantKeyword(description: string): string {
  const noise = ['upi', 'pos', 'txn', 'ref', 'to', 'via', 'at', 'in'];
  const tokens = description
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !noise.includes(t));
  return tokens[0] ?? description.toLowerCase().trim();
}

function displayMerchantName(keyword: string): string {
  const known: Record<string, string> = {
    swiggy: 'Swiggy',
    zomato: 'Zomato',
    netflix: 'Netflix',
    spotify: 'Spotify',
    airtel: 'Airtel',
    bescom: 'BESCOM',
    amazon: 'Amazon Prime',
    bigbasket: 'BigBasket',
  };
  return known[keyword] ?? keyword.charAt(0).toUpperCase() + keyword.slice(1);
}

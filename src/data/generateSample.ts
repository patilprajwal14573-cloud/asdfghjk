// Deterministic sample-data generator using a seeded PRNG so the generated
// data is identical on every load. Produces 6 months of realistic INR
// transactions for each persona (~150 each), including deliberate anomalies:
// one very large purchase and one duplicate charge.

import { Category, Persona, Transaction } from '@/utils/types';
import { NaiveBayesClassifier } from '@/ml/naiveBayes';
import { TRAINING_DATA } from './trainingData';

// Mulberry32 — small, fast, deterministic PRNG.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

interface MerchantTemplate {
  category: Category;
  description: string;
  min: number;
  max: number;
  recurrenceDays?: number;
}

const STUDENT_MERCHANTS: MerchantTemplate[] = [
  { category: 'Food', description: 'UPI SWIGGY BANGALORE', min: 80, max: 450 },
  { category: 'Food', description: 'Zomato Order DEL', min: 90, max: 500 },
  { category: 'Food', description: 'UPI BIGBASKET GROCERY', min: 200, max: 900 },
  { category: 'Food', description: 'UPI DOMINOS PIZZA', min: 150, max: 600 },
  { category: 'Food', description: 'Cafe Coffee Day CCD', min: 60, max: 250 },
  { category: 'Transport', description: 'UPI RAPIDO BIKE', min: 20, max: 90 },
  { category: 'Transport', description: 'Ola Auto ride', min: 40, max: 150 },
  { category: 'Transport', description: 'Namma Metro recharge', min: 50, max: 300 },
  { category: 'Transport', description: 'UPI UBER RIDE', min: 60, max: 250 },
  { category: 'Shopping', description: 'UPI AMAZON IN', min: 200, max: 2500 },
  { category: 'Shopping', description: 'Flipkart shopping', min: 250, max: 2000 },
  { category: 'Shopping', description: 'UPI MEESHO', min: 100, max: 800 },
  { category: 'Entertainment', description: 'UPI NETFLIX SUBSCRIPTION', min: 199, max: 649, recurrenceDays: 30 },
  { category: 'Entertainment', description: 'UPI SPOTIFY', min: 79, max: 119, recurrenceDays: 30 },
  { category: 'Entertainment', description: 'UPI BOOKMYSHOW', min: 120, max: 600 },
  { category: 'Health', description: 'UPI APOLLO PHARMACY', min: 50, max: 400 },
  { category: 'Education', description: 'UPI UDEMY', min: 400, max: 3000 },
  { category: 'Education', description: 'Coursera subscription', min: 500, max: 1500 },
];

const SALARIED_MERCHANTS: MerchantTemplate[] = [
  { category: 'Food', description: 'UPI SWIGGY BANGALORE', min: 150, max: 700 },
  { category: 'Food', description: 'UPI ZOMATO RESTAURANT', min: 250, max: 1200 },
  { category: 'Food', description: 'BigBasket Order BLR', min: 500, max: 2500 },
  { category: 'Food', description: 'Starbucks coffee BLR', min: 200, max: 600 },
  { category: 'Transport', description: 'UPI UBER RIDE', min: 120, max: 500 },
  { category: 'Transport', description: 'Ola Micro BLR', min: 150, max: 600 },
  { category: 'Transport', description: 'UPI FASTAG RECHARGE', min: 200, max: 1000 },
  { category: 'Transport', description: 'UPI PETROL PUMP', min: 1000, max: 3000 },
  { category: 'Shopping', description: 'UPI MYNTRA', min: 800, max: 5000 },
  { category: 'Shopping', description: 'UPI AJIO ORDER', min: 700, max: 4500 },
  { category: 'Shopping', description: 'UPI CROMA RETAIL', min: 2000, max: 30000 },
  { category: 'Shopping', description: 'UPI NYKAA', min: 500, max: 3000 },
  { category: 'Entertainment', description: 'UPI NETFLIX SUBSCRIPTION', min: 649, max: 649, recurrenceDays: 30 },
  { category: 'Entertainment', description: 'UPI AMAZON PRIME', min: 1499, max: 1499, recurrenceDays: 365 },
  { category: 'Entertainment', description: 'UPI HOTSTAR', min: 299, max: 1499, recurrenceDays: 30 },
  { category: 'Health', description: 'UPI CULTFIT', min: 1000, max: 1500, recurrenceDays: 30 },
  { category: 'Health', description: 'UPI APOLLO PHARMACY', min: 100, max: 800 },
  { category: 'Education', description: 'UPI UPGRAD', min: 3000, max: 10000, recurrenceDays: 30 },
];

interface PersonaConfig {
  seed: number;
  salary: number;
  rent: number;
  rentDescription: string;
  bills: { description: string; min: number; max: number }[];
  merchants: MerchantTemplate[];
}

const PERSONAS: Record<Persona, PersonaConfig> = {
  student: {
    seed: 12345,
    salary: 15000,
    rent: 5000,
    rentDescription: 'UPI RENT TRANSFER',
    bills: [
      { description: 'UPI BESCOM BILL', min: 400, max: 900 },
      { description: 'Airtel broadband', min: 600, max: 900 },
      { description: 'UPI JIO FIBER', min: 399, max: 699 },
    ],
    merchants: STUDENT_MERCHANTS,
  },
  salaried: {
    seed: 98765,
    salary: 75000,
    rent: 18000,
    rentDescription: 'Monthly Rent BANGALORE',
    bills: [
      { description: 'UPI BESCOM BILL', min: 1200, max: 2500 },
      { description: 'Airtel broadband', min: 1200, max: 1800 },
      { description: 'UPI BWSSB WATER', min: 300, max: 800 },
      { description: 'UPI IGL GAS', min: 500, max: 900 },
    ],
    merchants: SALARIED_MERCHANTS,
  },
};

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function generateSampleData(persona: Persona): Transaction[] {
  const cfg = PERSONAS[persona];
  const rng = mulberry32(cfg.seed);

  // Train classifier for predictions
  const clf = new NaiveBayesClassifier();
  clf.train(TRAINING_DATA);

  const transactions: Transaction[] = [];
  const today = new Date('2026-11-03T00:00:00');

  function addTransaction(
    date: string,
    description: string,
    amount: number,
    type: 'income' | 'expense',
    category?: Category,
  ): void {
    const pred = clf.predict(description);
    transactions.push({
      id: uid(),
      date,
      description,
      amount: round2(amount),
      type,
      category: category ?? pred.category,
      predictedCategory: pred.category,
      confidence: pred.confidence,
      alternatives: pred.alternatives,
      corrected: false,
    });
  }

  // 6 months ending current month
  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - monthOffset);
    const year = d.getFullYear();
    const month = d.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Salary on 1st
    addTransaction(
      isoDate(year, month, 1),
      'UPI SALARY CREDIT',
      cfg.salary,
      'income',
    );

    // Rent on 2nd
    addTransaction(
      isoDate(year, month, 2),
      cfg.rentDescription,
      cfg.rent,
      'expense',
      'Rent',
    );

    // Bills scattered in first week
    cfg.bills.forEach((bill, i) => {
      const day = 3 + i;
      const amount = round2(bill.min + rng() * (bill.max - bill.min));
      addTransaction(
        isoDate(year, month, day),
        bill.description,
        amount,
        'expense',
        'Utilities',
      );
    });

    // Recurring subscriptions (mid month)
    cfg.merchants
      .filter((m) => m.recurrenceDays)
      .forEach((m, i) => {
        const day = 15 + i;
        if (day <= daysInMonth) {
          const amount = round2(m.min + rng() * (m.max - m.min));
          addTransaction(
            isoDate(year, month, day),
            m.description,
            amount,
            'expense',
            m.category,
          );
        }
      });

    // Everyday spending: ~18-22 transactions/month
    const spendMerchants = cfg.merchants.filter((m) => !m.recurrenceDays);
    const count = 18 + Math.floor(rng() * 5);
    for (let i = 0; i < count; i++) {
      const day = 1 + Math.floor(rng() * daysInMonth);
      const m = pick(rng, spendMerchants);
      const amount = round2(m.min + rng() * (m.max - m.min));
      addTransaction(
        isoDate(year, month, day),
        m.description,
        amount,
        'expense',
        m.category,
      );
    }
  }

  // Deliberate anomalies in the most recent month:
  const recentDate = transactions[transactions.length - 1].date;
  const recentYM = recentDate.slice(0, 7);
  const [ry, rm] = recentYM.split('-').map(Number);

  // 1. One very large purchase (Shopping anomaly)
  const largeAmount = persona === 'student' ? 12000 : 45000;
  addTransaction(
    isoDate(ry, rm, 20),
    'UPI CROMA RETAIL',
    largeAmount,
    'expense',
    'Shopping',
  );

  // 2. Duplicate charge: same merchant + amount on consecutive days
  const dupDescription = 'UPI SWIGGY BANGALORE';
  const dupAmount = 449;
  addTransaction(isoDate(ry, rm, 22), dupDescription, dupAmount, 'expense', 'Food');
  addTransaction(isoDate(ry, rm, 23), dupDescription, dupAmount, 'expense', 'Food');

  return transactions.sort((a, b) => b.date.localeCompare(a.date));
}

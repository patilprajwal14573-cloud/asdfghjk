// Shared domain types used across the app.

export type Category =
  | 'Food'
  | 'Transport'
  | 'Rent'
  | 'Utilities'
  | 'Shopping'
  | 'Entertainment'
  | 'Health'
  | 'Education';

export const CATEGORIES: Category[] = [
  'Food',
  'Transport',
  'Rent',
  'Utilities',
  'Shopping',
  'Entertainment',
  'Health',
  'Education',
];

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  amount: number; // positive INR
  type: TransactionType;
  category: Category; // assigned category (user-confirmed or predicted)
  predictedCategory: Category; // model prediction at insert time
  confidence: number; // 0..1
  alternatives: { category: Category; probability: number }[];
  corrected?: boolean; // user manually corrected the category
}

export type Persona = 'student' | 'salaried';

export interface SavingsGoal {
  name: string;
  target: number;
  saved: number;
}

export interface AppState {
  persona: Persona | null;
  transactions: Transaction[];
  savingsTarget: number; // percent, default 20
  savingsGoal: SavingsGoal;
  trainingExtra: { text: string; category: Category }[]; // user corrections
}

// localStorage-backed app state with a React context provider.
// Persists transactions, persona, savings target, goal and user corrections.

import { createContext, useContext, useEffect, useState } from 'react';
import { AppState, Category, Persona, Transaction } from './types';
import { generateSampleData } from '@/data/generateSample';
import { TRAINING_DATA } from '@/data/trainingData';
import { NaiveBayesClassifier } from '@/ml/naiveBayes';

const STORAGE_KEY = 'finwise-ai-state-v1';

const DEFAULT_STATE: AppState = {
  persona: null,
  transactions: [],
  savingsTarget: 20,
  savingsGoal: { name: 'Emergency fund', target: 50000, saved: 0 },
  trainingExtra: [],
};

interface StoreContextValue {
  state: AppState;
  classifier: NaiveBayesClassifier;
  loadPersona: (persona: Persona) => void;
  addTransaction: (input: {
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
  }) => Transaction;
  updateTransactionCategory: (id: string, category: Category) => void;
  deleteTransaction: (id: string) => void;
  importTransactions: (txns: Transaction[]) => void;
  setSavingsTarget: (pct: number) => void;
  setSavingsGoal: (goal: { name: string; target: number; saved: number }) => void;
  resetAll: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch {
    // ignore corrupt storage
  }
  return DEFAULT_STATE;
}

function save(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full or unavailable — ignore
  }
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => load());
  const [classifier] = useState(() => {
    const clf = new NaiveBayesClassifier();
    clf.train(TRAINING_DATA);
    return clf;
  });

  // Retrain whenever user corrections change.
  useEffect(() => {
    if (state.trainingExtra.length === 0) {
      classifier.train(TRAINING_DATA);
    } else {
      classifier.train([...TRAINING_DATA, ...state.trainingExtra]);
    }
  }, [state.trainingExtra, classifier]);

  // Persist on change.
  useEffect(() => {
    save(state);
  }, [state]);

  const value: StoreContextValue = {
    state,
    classifier,
    loadPersona: (persona) => {
      const txns = generateSampleData(persona);
      setState({ ...DEFAULT_STATE, persona, transactions: txns });
    },
    addTransaction: (input) => {
      const pred = classifier.predict(input.description);
      const txn: Transaction = {
        id: uid(),
        date: input.date,
        description: input.description,
        amount: input.amount,
        type: input.type,
        category: pred.category,
        predictedCategory: pred.category,
        confidence: pred.confidence,
        alternatives: pred.alternatives,
        corrected: false,
      };
      setState((s) => ({
        ...s,
        transactions: [txn, ...s.transactions].sort((a, b) =>
          b.date.localeCompare(a.date),
        ),
      }));
      return txn;
    },
    updateTransactionCategory: (id, category) => {
      setState((s) => {
        const txn = s.transactions.find((t) => t.id === id);
        if (!txn) return s;
        const txns = s.transactions.map((t) =>
          t.id === id ? { ...t, category, corrected: true } : t,
        );
        return {
          ...s,
          transactions: txns,
          trainingExtra: [
            ...s.trainingExtra,
            { text: txn.description, category },
          ],
        };
      });
    },
    deleteTransaction: (id) => {
      setState((s) => ({
        ...s,
        transactions: s.transactions.filter((t) => t.id !== id),
      }));
    },
    importTransactions: (imported) => {
      setState((s) => ({
        ...s,
        transactions: [...imported, ...s.transactions].sort((a, b) =>
          b.date.localeCompare(a.date),
        ),
      }));
    },
    setSavingsTarget: (pct) =>
      setState((s) => ({ ...s, savingsTarget: pct })),
    setSavingsGoal: (goal) => setState((s) => ({ ...s, savingsGoal: goal })),
    resetAll: () => setState(DEFAULT_STATE),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

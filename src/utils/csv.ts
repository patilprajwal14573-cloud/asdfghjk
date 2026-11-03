// CSV parsing + serialisation using PapaParse.

import Papa from 'papaparse';
import { Category, Transaction } from './types';
import { NaiveBayesClassifier } from '@/ml/naiveBayes';

export interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
}

export interface ParseResult {
  rows: ParsedRow[];
  errors: string[];
}

export function parseCSV(text: string): ParseResult {
  const errors: string[] = [];
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (parsed.errors.length > 0) {
    for (const e of parsed.errors.slice(0, 5)) {
      errors.push(`Row ${typeof e.row === 'number' ? e.row + 1 : '?'}: ${e.message}`);
    }
  }

  const rows: ParsedRow[] = [];
  for (const [i, r] of parsed.data.entries()) {
    const date = r.date?.trim();
    const description = r.description?.trim();
    const amountRaw = r.amount?.trim();
    const typeRaw = (r.type?.trim() || '').toLowerCase();

    if (!date || !description || !amountRaw) {
      errors.push(`Row ${i + 2}: missing date, description or amount.`);
      continue;
    }
    const amount = Number(amountRaw.replace(/[^0-9.]/g, ''));
    if (!isFinite(amount) || amount <= 0) {
      errors.push(`Row ${i + 2}: amount "${amountRaw}" is not a positive number.`);
      continue;
    }
    const type: 'income' | 'expense' =
      typeRaw === 'income' ? 'income' : 'expense';
    // Validate ISO-ish date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push(`Row ${i + 2}: date "${date}" must be YYYY-MM-DD.`);
      continue;
    }
    rows.push({ date, description, amount, type });
  }

  return { rows, errors };
}

export function transactionsToCSV(transactions: Transaction[]): string {
  const data = transactions.map((t) => ({
    date: t.date,
    description: t.description,
    amount: t.amount,
    type: t.type,
    category: t.category,
    confidence: `${(t.confidence * 100).toFixed(0)}%`,
  }));
  return Papa.unparse(data);
}

export function parsedRowsToTransactions(
  rows: ParsedRow[],
  clf: NaiveBayesClassifier,
): Transaction[] {
  return rows.map((r) => {
    const pred = clf.predict(r.description);
    return {
      id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
      date: r.date,
      description: r.description,
      amount: Math.round(r.amount * 100) / 100,
      type: r.type,
      category: pred.category,
      predictedCategory: pred.category,
      confidence: pred.confidence,
      alternatives: pred.alternatives,
      corrected: false,
    } satisfies Transaction;
  });
}

export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function validateFile(file: File): string | null {
  if (!file) return 'No file selected.';
  const isCsv =
    file.name.toLowerCase().endsWith('.csv') ||
    file.type === 'text/csv' ||
    file.type === 'application/vnd.ms-excel';
  if (!isCsv) return 'Please upload a .csv file.';
  if (file.size > 1024 * 1024) return 'File is too large (max 1 MB).';
  return null;
}

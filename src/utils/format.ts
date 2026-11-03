// Formatting helpers — money uses Indian number grouping (en-IN).

import { Category } from './types';

export function formatINR(amount: number, withDecimals = false): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('en-IN').format(amount);
}

export function formatPercent(p: number, digits = 0): string {
  return `${p.toFixed(digits)}%`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function monthLabelFromISO(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

export function ymKey(iso: string): string {
  return iso.slice(0, 7);
}

// Category → tailwind classes for badges/charts.
export const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#f97316',
  Transport: '#3b82f6',
  Rent: '#8b5cf6',
  Utilities: '#06b6d4',
  Shopping: '#ec4899',
  Entertainment: '#a855f7',
  Health: '#10b981',
  Education: '#eab308',
};

export function categoryBadgeClass(category: Category): string {
  const map: Record<Category, string> = {
    Food: 'bg-wants-100 text-wants-700 dark:bg-wants-900/40 dark:text-wants-300',
    Transport: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    Rent: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    Utilities: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    Shopping: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
    Entertainment: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    Health: 'bg-savings-100 text-savings-700 dark:bg-savings-900/40 dark:text-savings-300',
    Education: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  };
  return map[category];
}

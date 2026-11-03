// Model performance evaluation: deterministic 80/20 train/test split, overall
// accuracy, per-category precision/recall/F1, and a confusion matrix.

import { Category, CATEGORIES } from '@/utils/types';
import { NaiveBayesClassifier, Prediction, TrainingExample } from './naiveBayes';

export interface CategoryMetrics {
  category: Category;
  precision: number;
  recall: number;
  f1: number;
  support: number; // number of test examples in this category
}

export interface ConfusionCell {
  actual: Category;
  predicted: Category;
  count: number;
}

export interface ModelEvaluation {
  accuracy: number;
  metrics: CategoryMetrics[];
  confusion: ConfusionCell[];
  trainCount: number;
  testCount: number;
}

// Deterministic split: sort examples by a stable key, then take every 5th
// example as test data starting from index 0. This guarantees the same split
// on every run and balances categories reasonably for non-pathological data.
export function trainTestSplit(
  examples: TrainingExample[],
  ratio = 0.2,
): { train: TrainingExample[]; test: TrainingExample[] } {
  const sorted = [...examples].sort((a, b) =>
    a.text.localeCompare(b.text) || a.category.localeCompare(b.category),
  );
  const step = Math.round(1 / ratio);
  const train: TrainingExample[] = [];
  const test: TrainingExample[] = [];
  sorted.forEach((ex, i) => {
    if (i % step === 0) test.push(ex);
    else train.push(ex);
  });
  return { train, test };
}

export function evaluateModel(examples: TrainingExample[]): ModelEvaluation {
  const { train, test } = trainTestSplit(examples);
  const clf = new NaiveBayesClassifier();
  clf.train(train);

  let correct = 0;
  const perCategory = new Map<
    Category,
    { tp: number; fp: number; fn: number; support: number }
  >();
  for (const c of CATEGORIES) perCategory.set(c, { tp: 0, fp: 0, fn: 0, support: 0 });

  const confusion = new Map<string, number>();

  for (const ex of test) {
    const pred = clf.predict(ex.text);
    if (pred.category === ex.category) correct++;
    const cell = `${ex.category}|${pred.category}`;
    confusion.set(cell, (confusion.get(cell) ?? 0) + 1);

    const m = perCategory.get(ex.category)!;
    m.support++;
    if (pred.category === ex.category) m.tp++;
    else {
      // false negative for actual, false positive for predicted
      const pm = perCategory.get(pred.category)!;
      pm.fp++;
      m.fn++;
    }
  }

  const metrics: CategoryMetrics[] = CATEGORIES.map((c) => {
    const m = perCategory.get(c)!;
    const precision = m.tp + m.fp === 0 ? 0 : m.tp / (m.tp + m.fp);
    const recall = m.tp + m.fn === 0 ? 0 : m.tp / (m.tp + m.fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    return { category: c, precision, recall, f1, support: m.support };
  });

  const confusionCells: ConfusionCell[] = [];
  for (const [key, count] of confusion) {
    const [actual, predicted] = key.split('|') as [Category, Category];
    confusionCells.push({ actual, predicted, count });
  }

  return {
    accuracy: test.length === 0 ? 0 : correct / test.length,
    metrics,
    confusion: confusionCells,
    trainCount: train.length,
    testCount: test.length,
  };
}

export type { Prediction };

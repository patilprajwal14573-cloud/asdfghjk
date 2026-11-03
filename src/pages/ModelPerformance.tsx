import { useMemo } from 'react';
import { useStore } from '@/utils/store';
import { TRAINING_DATA } from '@/data/trainingData';
import { evaluateModel } from '@/ml/performance';
import { CATEGORIES, Category } from '@/utils/types';
import { formatPercent } from '@/utils/format';
import { BarChart3 } from 'lucide-react';
import EmptyState from '@/components/EmptyState';

export default function ModelPerformance() {
  const { state } = useStore();

  const evaluation = useMemo(() => {
    const examples = [...TRAINING_DATA, ...state.trainingExtra];
    return evaluateModel(examples);
  }, [state.trainingExtra]);

  // Build a full NxN confusion matrix for the heatmap.
  const matrix = useMemo(() => {
    const grid: Record<Category, Record<Category, number>> = {} as never;
    for (const a of CATEGORIES) {
      grid[a] = {} as never;
      for (const p of CATEGORIES) grid[a][p] = 0;
    }
    for (const cell of evaluation.confusion) {
      grid[cell.actual][cell.predicted] += cell.count;
    }
    return grid;
  }, [evaluation.confusion]);

  const maxCell = useMemo(() => {
    let m = 1;
    for (const a of CATEGORIES) for (const p of CATEGORIES) m = Math.max(m, matrix[a][p]);
    return m;
  }, [matrix]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-brand-800 dark:text-white">
          Model performance
        </h1>
        <p className="mt-1 text-sm text-brand-500">
          A deterministic 80/20 train/test split evaluates the Naive Bayes classifier. Retraining on your corrections updates these metrics instantly.
        </p>
      </div>

      {TRAINING_DATA.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="h-8 w-8" />}
          title="No training data"
          message="The training dataset could not be loaded."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Training examples" value={String(evaluation.trainCount)} />
            <Stat label="Test examples" value={String(evaluation.testCount)} />
            <Stat
              label="Overall accuracy"
              value={formatPercent(evaluation.accuracy * 100, 1)}
              tone={evaluation.accuracy >= 0.8 ? 'good' : 'warn'}
            />
            <Stat
              label="User corrections"
              value={String(state.trainingExtra.length)}
              tone="neutral"
            />
          </div>

          {/* Per-category metrics */}
          <div className="card overflow-hidden">
            <div className="border-b px-4 py-3 dark:border-brand-800">
              <h2 className="text-base font-semibold text-brand-800 dark:text-brand-100">
                Per-category metrics
              </h2>
              <p className="mt-0.5 text-xs text-brand-500">
                Precision = how often a category guess was right. Recall = how many of a category we found. F1 = their balance.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-brand-50 text-left text-xs uppercase tracking-wide text-brand-500 dark:bg-brand-800/50">
                  <tr>
                    <th className="px-4 py-2 font-medium">Category</th>
                    <th className="px-4 py-2 font-medium">Precision</th>
                    <th className="px-4 py-2 font-medium">Recall</th>
                    <th className="px-4 py-2 font-medium">F1 score</th>
                    <th className="px-4 py-2 font-medium">Test support</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluation.metrics.map((m) => (
                    <tr
                      key={m.category}
                      className="border-b dark:border-brand-800"
                    >
                      <td className="px-4 py-2 font-medium text-brand-800 dark:text-brand-100">
                        {m.category}
                      </td>
                      <td className="px-4 py-2 tabular-nums">{formatPercent(m.precision * 100, 1)}</td>
                      <td className="px-4 py-2 tabular-nums">{formatPercent(m.recall * 100, 1)}</td>
                      <td className="px-4 py-2 tabular-nums">
                        <span className={m.f1 >= 0.7 ? 'text-savings-600 dark:text-savings-400' : m.f1 >= 0.5 ? 'text-wants-600 dark:text-wants-400' : ''}>
                          {formatPercent(m.f1 * 100, 1)}
                        </span>
                      </td>
                      <td className="px-4 py-2 tabular-nums text-brand-400">{m.support}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confusion matrix */}
          <div className="card p-5">
            <h2 className="text-base font-semibold text-brand-800 dark:text-brand-100">
              Confusion matrix
            </h2>
            <p className="mt-0.5 text-xs text-brand-500">
              Rows are the true category, columns are what the model predicted. Darker green = more correct predictions on the diagonal; off-diagonal cells are misclassifications.
            </p>
            <div className="mt-5 overflow-x-auto">
              <table className="border-collapse text-center text-xs">
                <thead>
                  <tr>
                    <th className="p-1" />
                    {CATEGORIES.map((c) => (
                      <th key={c} className="p-1 font-medium text-brand-500">
                        <span className="block max-w-16 truncate" title={c}>
                          {c.slice(0, 6)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map((actual) => (
                    <tr key={actual}>
                      <td className="p-1 text-right font-medium text-brand-500">
                        <span className="block max-w-20 truncate" title={actual}>
                          {actual.slice(0, 7)}
                        </span>
                      </td>
                      {CATEGORIES.map((predicted) => {
                        const count = matrix[actual][predicted];
                        const isDiagonal = actual === predicted;
                        const intensity = count / maxCell;
                        return (
                          <td
                            key={predicted}
                            className="p-1"
                            title={`True ${actual}, predicted ${predicted}: ${count}`}
                          >
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded text-xs font-medium"
                              style={{
                                background: isDiagonal
                                  ? `rgba(16,185,129,${0.15 + intensity * 0.7})`
                                  : count === 0
                                    ? 'transparent'
                                    : `rgba(249,115,22,${0.1 + intensity * 0.6})`,
                                color:
                                  intensity > 0.5
                                    ? '#fff'
                                    : 'inherit',
                              }}
                            >
                              {count}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'good' | 'warn' | 'neutral';
}) {
  const color =
    tone === 'good'
      ? 'text-savings-600 dark:text-savings-400'
      : tone === 'warn'
        ? 'text-wants-600 dark:text-wants-400'
        : 'text-brand-800 dark:text-brand-100';
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-brand-500">
        {label}
      </p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

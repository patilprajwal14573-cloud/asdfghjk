import { useMemo, useState } from 'react';
import { useStore } from '@/utils/store';
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Target,
  PiggyBank,
} from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import InsightCard from '@/components/InsightCard';
import { getIcon } from '@/components/DynIcon';
import { formatINR } from '@/utils/format';
import { detectAnomalies, AnomalyFlag } from '@/ml/anomaly';
import { forecastMonthly } from '@/ml/forecast';
import { generateRecommendations } from '@/ml/recommendations';

export default function Insights() {
  const { state, setSavingsTarget, setSavingsGoal } = useStore();

  const anomalies = useMemo(
    () => detectAnomalies(state.transactions),
    [state.transactions],
  );
  const forecast = useMemo(
    () => forecastMonthly(state.transactions),
    [state.transactions],
  );
  const recs = useMemo(
    () => generateRecommendations(state.transactions, state.savingsTarget),
    [state.transactions, state.savingsTarget],
  );

  const [goalName, setGoalName] = useState(state.savingsGoal.name);
  const [goalTarget, setGoalTarget] = useState(String(state.savingsGoal.target));

  const totalSaved = Math.max(
    0,
    state.transactions
      .filter((t) => t.type === 'income')
      .reduce((a, t) => a + t.amount, 0) -
      state.transactions
        .filter((t) => t.type === 'expense')
        .reduce((a, t) => a + t.amount, 0),
  );

  if (state.transactions.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles className="h-8 w-8" />}
        title="No insights yet"
        message="Load a sample persona or add transactions to see anomalies, forecasts and personalised recommendations."
      />
    );
  }

  function saveGoal() {
    setSavingsGoal({
      name: goalName.trim() || 'Emergency fund',
      target: Math.max(0, Number(goalTarget) || 0),
      saved: totalSaved,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-brand-800 dark:text-white">
          Insights
        </h1>
        <p className="mt-1 text-sm text-brand-500">
          AI-detected anomalies, next-month forecast and personalised recommendations.
        </p>
      </div>

      {/* Anomalies */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-brand-800 dark:text-brand-100">
          <AlertTriangle className="h-4 w-4 text-wants-500" />
          Unusual transactions
        </h2>
        {anomalies.length === 0 ? (
          <p className="card p-4 text-sm text-brand-500">
            No unusual spending or duplicate charges detected. Everything looks normal.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {anomalies.map((flag: AnomalyFlag, i) => (
              <InsightCard
                key={flag.transaction.id + i}
                title={`${flag.type === 'unusual' ? 'Unusual charge' : 'Duplicate charge'} — ${flag.transaction.description}`}
                detail={flag.reason}
                icon={AlertTriangle}
                tone="warning"
              />
            ))}
          </div>
        )}
      </section>

      {/* Forecast */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-brand-800 dark:text-brand-100">
          <TrendingUp className="h-4 w-4 text-savings-500" />
          Spending forecast
        </h2>
        {!forecast ? (
          <p className="card p-4 text-sm text-brand-500">
            Not enough months of data yet. Add at least two months of transactions to see a forecast.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <ForecastStat
              label={`Next month (${forecast.nextMonth.label})`}
              value={formatINR(forecast.nextMonth.forecast)}
              tone="savings"
            />
            <ForecastStat
              label="Low end of range"
              value={formatINR(forecast.nextMonth.rangeLow)}
              tone="neutral"
            />
            <ForecastStat
              label="High end of range"
              value={formatINR(forecast.nextMonth.rangeHigh)}
              tone="wants"
            />
          </div>
        )}
        {forecast && (
          <p className="mt-2 text-xs text-brand-400">
            Based on a least-squares line fit to your monthly totals. The trend slope is{' '}
            {forecast.slope >= 0 ? 'up' : 'down'} by {formatINR(Math.abs(forecast.slope))}/month on average.
          </p>
        )}
      </section>

      {/* Recommendations */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-brand-800 dark:text-brand-100">
          <Sparkles className="h-4 w-4 text-savings-500" />
          Recommendations
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {recs.map((r) => {
            const Icon = getIcon(r.icon);
            return (
              <InsightCard
                key={r.id}
                title={r.title}
                detail={r.detail}
                icon={Icon}
                tone={r.tone}
              />
            );
          })}
        </div>
      </section>

      {/* Savings target + goal */}
      <section className="card p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-brand-800 dark:text-brand-100">
          <Target className="h-4 w-4 text-savings-500" />
          Savings target
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-40">
            <label className="mb-1 block text-xs font-medium text-brand-500">
              Target savings rate: {state.savingsTarget}%
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={state.savingsTarget}
              onChange={(e) => setSavingsTarget(Number(e.target.value))}
              className="w-full accent-savings-500"
            />
          </div>
        </div>

        <h3 className="mt-6 flex items-center gap-2 text-sm font-semibold text-brand-700 dark:text-brand-200">
          <PiggyBank className="h-4 w-4 text-savings-500" />
          Savings goal
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-brand-500">
              Goal name
            </label>
            <input
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-brand-500">
              Target amount (₹)
            </label>
            <input
              type="number"
              value={goalTarget}
              onChange={(e) => setGoalTarget(e.target.value)}
              className="input"
              min="0"
            />
          </div>
          <div className="flex items-end">
            <button onClick={saveGoal} className="btn-primary w-full">
              Update goal
            </button>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-brand-600 dark:text-brand-300">
              {formatINR(totalSaved)} saved
            </span>
            <span className="text-brand-500">
              target {formatINR(state.savingsGoal.target)}
            </span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-brand-200 dark:bg-brand-800">
            <div
              className="h-full rounded-full bg-savings-500 transition-all duration-500"
              style={{
                width: `${state.savingsGoal.target > 0 ? Math.min(100, (totalSaved / state.savingsGoal.target) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function ForecastStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'savings' | 'wants' | 'neutral';
}) {
  const color =
    tone === 'savings'
      ? 'text-savings-600 dark:text-savings-400'
      : tone === 'wants'
        ? 'text-wants-600 dark:text-wants-400'
        : 'text-brand-600 dark:text-brand-300';
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-brand-500">
        {label}
      </p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${color}`}>
        {value}
      </p>
    </div>
  );
}

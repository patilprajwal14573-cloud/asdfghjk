import { useMemo, useState } from 'react';
import { useStore } from '@/utils/store';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  Calendar,
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import {
  formatINR,
  formatPercent,
  monthLabelFromISO,
  ymKey,
  CATEGORY_COLORS,
} from '@/utils/format';
import { CATEGORIES, Category } from '@/utils/types';
import { forecastMonthly } from '@/ml/forecast';
import { generateRecommendations, currentMonth } from '@/ml/recommendations';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { state } = useStore();
  const navigate = useNavigate();

  const months = useMemo(() => {
    const set = new Set(state.transactions.map((t) => ymKey(t.date)));
    return [...set].sort().reverse();
  }, [state.transactions]);

  const [selectedYM, setSelectedYM] = useState<string>(
    months[0] ?? currentMonth(state.transactions) ?? '',
  );

  const monthTxns = useMemo(
    () => state.transactions.filter((t) => ymKey(t.date) === selectedYM),
    [state.transactions, selectedYM],
  );

  const income = monthTxns
    .filter((t) => t.type === 'income')
    .reduce((a, t) => a + t.amount, 0);
  const spent = monthTxns
    .filter((t) => t.type === 'expense')
    .reduce((a, t) => a + t.amount, 0);
  const saved = income - spent;
  const savingsRate = income > 0 ? (saved / income) * 100 : 0;

  const categoryData = useMemo(() => {
    const map = new Map<Category, number>();
    for (const t of monthTxns) {
      if (t.type !== 'expense') continue;
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    }
    return [...map.entries()]
      .map(([category, amount]) => ({ name: category, value: amount }))
      .sort((a, b) => b.value - a.value);
  }, [monthTxns]);

  const forecast = useMemo(
    () => forecastMonthly(state.transactions),
    [state.transactions],
  );

  const recs = useMemo(
    () => generateRecommendations(state.transactions, state.savingsTarget),
    [state.transactions, state.savingsTarget],
  );
  const summary =
    recs.find((r) => r.kind === 'savings-rate') ??
    recs[0] ??
    null;

  const monthlyChartData = useMemo(() => {
    if (!forecast) {
      // at least show actual months
      const totals = new Map<string, number>();
      for (const t of state.transactions) {
        if (t.type !== 'expense') continue;
        const k = ymKey(t.date);
        totals.set(k, (totals.get(k) ?? 0) + t.amount);
      }
      return [...totals.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => ({
          label: monthLabelFromISO(k + '-01'),
          actual: v,
          forecast: null as number | null,
          rangeLow: null as number | null,
          rangeHigh: null as number | null,
        }));
    }
    return forecast.points.map((p) => ({
      label: p.label,
      actual: p.actual,
      forecast: p.forecast,
      rangeLow: p.rangeLow,
      rangeHigh: p.rangeHigh,
    }));
  }, [forecast, state.transactions]);

  if (state.transactions.length === 0) {
    return (
      <EmptyState
        icon={<Wallet className="h-8 w-8" />}
        title="No data yet"
        message="Load a sample persona above to explore FinWise AI, or add transactions in the Transactions page."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-brand-800 dark:text-white">
            Dashboard
          </h1>
          {summary && (
            <p className="mt-1 max-w-xl text-sm text-brand-600 dark:text-brand-300">
              {summary.detail}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-brand-400" />
          <select
            value={selectedYM}
            onChange={(e) => setSelectedYM(e.target.value)}
            className="input w-auto"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabelFromISO(m + '-01')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Income"
          value={formatINR(income)}
          icon={TrendingUp}
          tone="savings"
        />
        <StatCard
          label="Spent"
          value={formatINR(spent)}
          icon={TrendingDown}
          tone="wants"
        />
        <StatCard
          label="Saved"
          value={formatINR(saved)}
          icon={PiggyBank}
          tone={saved >= 0 ? 'savings' : 'wants'}
        />
        <StatCard
          label="Savings rate"
          value={formatPercent(savingsRate)}
          icon={Wallet}
          tone={savingsRate >= state.savingsTarget ? 'savings' : 'wants'}
          hint={`target ${state.savingsTarget}%`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5 animate-fade-in">
          <h2 className="text-base font-semibold text-brand-800 dark:text-brand-100">
            Spending by category
          </h2>
          <p className="mt-0.5 text-sm text-brand-500">
            How your spending is split this month.
          </p>
          {categoryData.length === 0 ? (
            <p className="py-10 text-center text-sm text-brand-400">
              No expenses this month.
            </p>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
              <div className="h-48 w-full sm:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {categoryData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={CATEGORY_COLORS[entry.name as Category]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, n) => [formatINR(Number(v)), String(n)]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full space-y-1.5 sm:w-1/2">
                {categoryData.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          background: CATEGORY_COLORS[c.name as Category],
                        }}
                      />
                      <span className="text-brand-600 dark:text-brand-300">
                        {c.name}
                      </span>
                    </div>
                    <span className="font-medium tabular-nums">
                      {formatINR(c.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card p-5 animate-fade-in">
          <h2 className="text-base font-semibold text-brand-800 dark:text-brand-100">
            Monthly trend
          </h2>
          <p className="mt-0.5 text-sm text-brand-500">
            Actual monthly spend with a forecast bar.
          </p>
          <div className="mt-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                />
                <Tooltip formatter={(v) => formatINR(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="actual" name="Actual" fill="#10b981" radius={[4, 4, 0, 0]} />
                {forecast && (
                  <Bar
                    dataKey="forecast"
                    name="Forecast"
                    fill="#94a3b8"
                    radius={[4, 4, 0, 0]}
                    stroke="#94a3b8"
                    strokeDasharray="4 2"
                  />
                )}
                {forecast && (
                  <ReferenceLine
                    x={forecast.nextMonth.label}
                    stroke="#f97316"
                    strokeDasharray="6 3"
                    label={{
                      value: 'next month',
                      fontSize: 10,
                      fill: '#f97316',
                    }}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
          {forecast && (
            <p className="mt-2 text-xs text-brand-500">
              Next month ({forecast.nextMonth.label}): forecast{' '}
              <span className="font-medium">
                {formatINR(forecast.nextMonth.forecast)}
              </span>{' '}
              (range {formatINR(forecast.nextMonth.rangeLow)}–
              {formatINR(forecast.nextMonth.rangeHigh)}).
            </p>
          )}
        </div>
      </div>

      {/* Savings goal tracker */}
      <div className="card p-5 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-brand-800 dark:text-brand-100">
              Savings goal
            </h2>
            <p className="mt-0.5 text-sm text-brand-500">
              {state.savingsGoal.name}
            </p>
          </div>
          <button
            onClick={() => navigate('/insights')}
            className="btn-secondary text-xs"
          >
            Manage goal
          </button>
        </div>
        <SavingsGoalBar />
      </div>
    </div>
  );

  function SavingsGoalBar() {
    const goal = state.savingsGoal;
    // Use cumulative savings across all months as "saved"
    const totalSaved = Math.max(
      0,
      state.transactions
        .filter((t) => t.type === 'income')
        .reduce((a, t) => a + t.amount, 0) -
        state.transactions
          .filter((t) => t.type === 'expense')
          .reduce((a, t) => a + t.amount, 0),
    );
    const pct = goal.target > 0 ? Math.min(100, (totalSaved / goal.target) * 100) : 0;
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-brand-600 dark:text-brand-300">
            {formatINR(totalSaved)} saved
          </span>
          <span className="text-brand-500">target {formatINR(goal.target)}</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-brand-200 dark:bg-brand-800">
          <div
            className="h-full rounded-full bg-savings-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-brand-400">
          {pct.toFixed(0)}% of your goal reached.
        </p>
      </div>
    );
  }
}

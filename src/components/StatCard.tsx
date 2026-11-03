import { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: 'savings' | 'wants' | 'neutral';
  hint?: string;
}

export default function StatCard({ label, value, icon: Icon, tone = 'neutral', hint }: Props) {
  const iconBg =
    tone === 'savings'
      ? 'bg-savings-100 text-savings-600 dark:bg-savings-900/40 dark:text-savings-400'
      : tone === 'wants'
        ? 'bg-wants-100 text-wants-600 dark:bg-wants-900/40 dark:text-wants-400'
        : 'bg-brand-100 text-brand-600 dark:bg-brand-800 dark:text-brand-300';

  return (
    <div className="card p-4 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          {hint && <p className="mt-0.5 text-xs text-brand-400">{hint}</p>}
        </div>
        <div className={`rounded-lg p-2 ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

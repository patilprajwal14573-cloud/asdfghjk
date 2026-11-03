import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  detail: string;
  icon: LucideIcon;
  tone: 'good' | 'warning' | 'info';
}

const TONE_STYLES = {
  good: {
    border: 'border-savings-200 dark:border-savings-800',
    icon: 'bg-savings-100 text-savings-600 dark:bg-savings-900/40 dark:text-savings-400',
  },
  warning: {
    border: 'border-wants-200 dark:border-wants-800',
    icon: 'bg-wants-100 text-wants-600 dark:bg-wants-900/40 dark:text-wants-400',
  },
  info: {
    border: 'border-brand-200 dark:border-brand-800',
    icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  },
} as const;

export default function InsightCard({ title, detail, icon: Icon, tone }: Props) {
  const s = TONE_STYLES[tone];
  return (
    <div className={`card animate-fade-in border p-4 ${s.border}`}>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 rounded-lg p-2 ${s.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-brand-800 dark:text-brand-100">
            {title}
          </h3>
          <p className="mt-1 text-sm text-brand-600 dark:text-brand-300">{detail}</p>
        </div>
      </div>
    </div>
  );
}

export function CardWithChildren({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="card p-5 animate-fade-in">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-brand-800 dark:text-brand-100">
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-sm text-brand-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

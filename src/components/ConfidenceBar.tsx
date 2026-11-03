interface Props {
  confidence: number; // 0..1
}

export default function ConfidenceBar({ confidence }: Props) {
  const pct = Math.round(confidence * 100);
  const color =
    pct >= 80
      ? 'bg-savings-500'
      : pct >= 50
        ? 'bg-wants-400'
        : 'bg-brand-400';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-brand-200 dark:bg-brand-700">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-brand-500 tabular-nums">{pct}%</span>
    </div>
  );
}

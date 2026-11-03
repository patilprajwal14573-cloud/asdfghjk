interface Props {
  icon: React.ReactNode;
  title: string;
  message: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, message, action }: Props) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 p-10 text-center animate-fade-in">
      <div className="rounded-full bg-brand-100 p-4 text-brand-400 dark:bg-brand-800 dark:text-brand-500">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-brand-700 dark:text-brand-200">
        {title}
      </h3>
      <p className="max-w-sm text-sm text-brand-500">{message}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

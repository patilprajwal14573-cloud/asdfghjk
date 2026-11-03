import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Sparkles,
  BarChart3,
  Brain,
  Wallet,
  GraduationCap,
  Briefcase,
  Moon,
  Sun,
} from 'lucide-react';
import { useStore } from '@/utils/store';
import { useTheme } from '@/utils/theme';
import { Persona } from '@/utils/types';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/insights', label: 'Insights', icon: Sparkles },
  { to: '/model', label: 'Model performance', icon: BarChart3 },
  { to: '/how', label: 'How the AI works', icon: Brain },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { state, loadPersona, resetAll } = useStore();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  function handlePersona(p: Persona) {
    if (state.persona === p) return;
    if (
      state.transactions.length > 0 &&
      !confirm(
        'Loading a sample persona will replace your current data. Continue?',
      )
    ) {
      return;
    }
    loadPersona(p);
    navigate('/');
  }

  function handleReset() {
    if (
      state.transactions.length > 0 &&
      !confirm('This clears all transactions. Continue?')
    ) {
      return;
    }
    resetAll();
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 shrink-0 border-r border-brand-200 bg-white md:block dark:border-brand-800 dark:bg-brand-900">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="rounded-lg bg-savings-600 p-2">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-800 dark:text-white">
              FinWise AI
            </p>
            <p className="text-[11px] text-brand-400">AI personal finance</p>
          </div>
        </div>
        <nav className="mt-2 flex flex-col gap-1 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-savings-50 text-savings-700 dark:bg-savings-900/30 dark:text-savings-300'
                    : 'text-brand-600 hover:bg-brand-100 dark:text-brand-300 dark:hover:bg-brand-800'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-brand-200 bg-white/80 px-4 py-3 backdrop-blur md:px-6 dark:border-brand-800 dark:bg-brand-900/80">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:hidden">
              <div className="rounded-lg bg-savings-600 p-1.5">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold">FinWise AI</span>
            </div>

            <div className="flex flex-1 items-center justify-end gap-2">
              {/* Persona switcher */}
              <div className="flex items-center gap-1 rounded-lg border border-brand-200 p-0.5 dark:border-brand-700">
                <PersonaButton
                  active={state.persona === 'student'}
                  onClick={() => handlePersona('student')}
                  icon={<GraduationCap className="h-4 w-4" />}
                  label="Student"
                />
                <PersonaButton
                  active={state.persona === 'salaried'}
                  onClick={() => handlePersona('salaried')}
                  icon={<Briefcase className="h-4 w-4" />}
                  label="Salaried"
                />
              </div>

              <button
                onClick={toggle}
                className="btn-ghost p-2"
                title="Toggle theme"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>

              {state.transactions.length > 0 && (
                <button
                  onClick={handleReset}
                  className="btn-ghost hidden p-2 text-sm sm:inline-flex"
                  title="Clear all data"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-brand-200 bg-white px-3 py-2 md:hidden dark:border-brand-800 dark:bg-brand-900">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? 'bg-savings-50 text-savings-700 dark:bg-savings-900/30 dark:text-savings-300'
                    : 'text-brand-500 hover:bg-brand-100 dark:hover:bg-brand-800'
                }`
              }
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 overflow-y-auto bg-brand-50 px-4 py-6 md:px-8 dark:bg-brand-950">
          {children}
        </main>
      </div>
    </div>
  );
}

function PersonaButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
        active
          ? 'bg-savings-600 text-white'
          : 'text-brand-600 hover:bg-brand-100 dark:text-brand-300 dark:hover:bg-brand-800'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

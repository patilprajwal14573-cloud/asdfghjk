// Dark-mode context with localStorage persistence and a class on <html>.

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const KEY = 'finwise-ai-theme';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitial(): Theme {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // ignore
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitial);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const value: ThemeContextValue = {
    theme,
    toggle: () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
    setTheme: setThemeState,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

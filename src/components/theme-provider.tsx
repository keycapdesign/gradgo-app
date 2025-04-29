import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => null,
};

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

const getThemeFromStorage = (key: string, fallback: Theme): Theme => {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    return (stored as Theme) || fallback;
  } catch (e) {
    // Handle localStorage errors
    console.warn('Error reading theme from localStorage:', e);
    return fallback;
  }
};

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'gradgo-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = getThemeFromStorage(storageKey, defaultTheme);
    setTheme(savedTheme);
  }, [defaultTheme, storageKey]);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = getSystemTheme();
      root.classList.add(systemTheme);
      setResolvedTheme(systemTheme);

      // Watch for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const updateSystemTheme = (e: MediaQueryListEvent) => {
        root.classList.remove('light', 'dark');
        const newTheme = e.matches ? 'dark' : 'light';
        root.classList.add(newTheme);
        setResolvedTheme(newTheme);
      };

      mediaQuery.addEventListener('change', updateSystemTheme);
      return () => mediaQuery.removeEventListener('change', updateSystemTheme);
    } else {
      root.classList.add(theme);
      setResolvedTheme(theme);
    }
  }, [theme, mounted]);

  const value = {
    theme,
    resolvedTheme,
    setTheme: (theme: Theme) => {
      try {
        localStorage.setItem(storageKey, theme);
      } catch (e) {
        console.warn('Error saving theme to localStorage:', e);
      }
      setTheme(theme);
    },
  };

  // Prevent flash of incorrect theme
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};

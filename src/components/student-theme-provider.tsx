import { useEffect, useState } from 'react';

import { ThemeProviderContext } from './theme-provider';

type StudentThemeProviderProps = {
  children: React.ReactNode;
};

// Create a custom provider that always uses dark mode
export function StudentThemeProvider({ children }: StudentThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Force dark mode on the document
    const root = window.document.documentElement;

    // Remove any existing theme classes
    root.classList.remove('light', 'dark');

    // Add dark class
    root.classList.add('dark');

    // Force dark mode by setting a data attribute as well
    root.setAttribute('data-forced-theme', 'dark');

    // Ensure localStorage doesn't override our setting
    try {
      localStorage.setItem('gradgo-ui-theme', 'dark');
      localStorage.setItem('gradgo-student-theme', 'dark');
    } catch (e) {
      console.warn('Error saving theme to localStorage:', e);
    }

    // Set up a MutationObserver to ensure dark mode stays applied
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class' &&
          !root.classList.contains('dark')
        ) {
          // Re-add dark class if it was removed
          root.classList.add('dark');
        }
      });
    });

    // Start observing the document with the configured parameters
    observer.observe(root, { attributes: true });

    // Clean up when unmounted
    return () => {
      observer.disconnect();
      // We don't remove the dark class on unmount to avoid flashing
      // The parent ThemeProvider will handle this
    };
  }, []);

  // Provide a fixed theme context that always returns "dark"
  const value = {
    theme: 'dark' as const,
    resolvedTheme: 'dark' as const,
    setTheme: () => {
      // This is a no-op function since we don't allow changing the theme
      console.info('Theme switching is disabled in student mode');

      // Force dark mode again
      const root = window.document.documentElement;
      root.classList.remove('light');
      root.classList.add('dark');
    },
  };

  // Prevent flash of incorrect theme
  if (!mounted) {
    return <>{children}</>;
  }

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}

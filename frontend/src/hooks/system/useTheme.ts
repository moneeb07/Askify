// hooks/useTheme.ts
import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const DEFAULT_THEME: Theme = 'dark';
const THEME_STORAGE_KEY = 'app-theme';

const applyThemeToDOM = (theme: Theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
};

const getStoredTheme = (): Theme => {
  try {
    return (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};

const useTheme = (): [Theme, (theme: Theme) => void] => {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = getStoredTheme();
    setThemeState(stored);
    applyThemeToDOM(stored);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    applyThemeToDOM(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // noop
    }
  }, []);

  return [theme, setTheme];
};

export default useTheme;
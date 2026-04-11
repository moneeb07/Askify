// hooks/useColorScheme.ts
import { useCallback, useEffect, useState } from 'react';

export type ColorScheme = 'default';

const DEFAULT_COLOR_SCHEME: ColorScheme = 'default';
const COLOR_SCHEME_STORAGE_KEY = 'app-color-scheme';

const useColorScheme = (): [ColorScheme, (scheme: ColorScheme) => void] => {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(DEFAULT_COLOR_SCHEME);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY) as ColorScheme;
      const initial = stored || DEFAULT_COLOR_SCHEME;
      setColorSchemeState(initial);
      document.documentElement.setAttribute('data-color-scheme', initial);
    } catch {
      document.documentElement.setAttribute('data-color-scheme', DEFAULT_COLOR_SCHEME);
    }
  }, []);

  const setColorScheme = useCallback((newScheme: ColorScheme) => {
    setColorSchemeState(newScheme);
    document.documentElement.setAttribute('data-color-scheme', newScheme);
    try {
      localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, newScheme);
    } catch {
      // noop
    }
  }, []);

  return [colorScheme, setColorScheme];
};

export default useColorScheme;
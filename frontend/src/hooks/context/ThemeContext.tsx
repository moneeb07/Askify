"use client";

import type { PropsWithChildren } from 'react';
import React, { createContext, useContext } from 'react';
import type { Theme } from '@/hooks/system/useTheme';
import useTheme from '@/hooks/system/useTheme';
import type { ColorScheme } from '@/hooks/ui/useColorScheme';
import useColorScheme from '@/hooks/ui/useColorScheme';
import useFontScale from '@/hooks/ui/useFontScale';

/**
 * Theme context value interface
 * Separates light/dark mode from color schemes
 */
interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;        // ← remove Promise<void>

  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;  // ← remove Promise<void>

  fontScale: number;
  setFontScale: (scale: number) => void;   // ← remove Promise<void>
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Theme provider component
 * Manages both light/dark mode and color schemes
 */
export const ThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [theme, setTheme] = useTheme();
  const [colorScheme, setColorScheme] = useColorScheme();
  const [fontScale, setFontScale] = useFontScale();

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colorScheme, setColorScheme, fontScale, setFontScale }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access theme context
 * @throws {Error} If used outside of ThemeProvider
 */
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
};

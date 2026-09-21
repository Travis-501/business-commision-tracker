import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

export type AppThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  theme: AppThemeMode;
  setTheme: (nextTheme: AppThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = 'app-theme-mode';
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useSystemColorScheme();
  const [theme, setThemeState] = useState<AppThemeMode>(
    systemTheme === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    let isMounted = true;

    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (isMounted) {
          if (savedTheme === 'light' || savedTheme === 'dark') {
            setThemeState(savedTheme);
          } else {
            setThemeState(systemTheme === 'dark' ? 'dark' : 'light');
          }
        }
      } catch {
        if (isMounted) {
          setThemeState(systemTheme === 'dark' ? 'dark' : 'light');
        }
      }
    };

    loadTheme();

    return () => {
      isMounted = false;
    };
  }, [systemTheme]);

  const setTheme = useCallback(async (nextTheme: AppThemeMode) => {
    setThemeState(nextTheme);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  }, []);

  const toggleTheme = useCallback(async () => {
    await setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreference() {
  const context = useContext(ThemeContext);

  if (!context) {
    return {
      theme: 'light' as AppThemeMode,
      setTheme: async () => {},
      toggleTheme: async () => {},
    };
  }

  return context;
}

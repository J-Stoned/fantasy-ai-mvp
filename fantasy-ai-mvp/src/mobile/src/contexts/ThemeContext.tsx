import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useStore } from '../store';

interface Theme {
  dark: boolean;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    notification: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    // Gradients
    gradientStart: string;
    gradientEnd: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  typography: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
}

const lightTheme: Theme = {
  dark: false,
  colors: {
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryDark: '#2563EB',
    secondary: '#8B5CF6',
    background: '#FFFFFF',
    card: '#F3F4F6',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    notification: '#EF4444',
    error: '#DC2626',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    gradientStart: '#3B82F6',
    gradientEnd: '#8B5CF6',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
};

const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: '#60A5FA',
    primaryLight: '#93BBFC',
    primaryDark: '#3B82F6',
    secondary: '#A78BFA',
    background: '#0F172A',
    card: '#1E293B',
    text: '#F3F4F6',
    textSecondary: '#9CA3AF',
    border: '#334155',
    notification: '#EF4444',
    error: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
    info: '#60A5FA',
    gradientStart: '#60A5FA',
    gradientEnd: '#A78BFA',
  },
  spacing: lightTheme.spacing,
  typography: lightTheme.typography,
  borderRadius: lightTheme.borderRadius,
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const { theme: storedTheme, setTheme: setStoredTheme } = useStore();
  const [currentTheme, setCurrentTheme] = useState<Theme>(
    storedTheme === 'auto' 
      ? (systemColorScheme === 'dark' ? darkTheme : lightTheme)
      : (storedTheme === 'dark' ? darkTheme : lightTheme)
  );

  useEffect(() => {
    if (storedTheme === 'auto') {
      setCurrentTheme(systemColorScheme === 'dark' ? darkTheme : lightTheme);
    }
  }, [systemColorScheme, storedTheme]);

  const toggleTheme = () => {
    const newThemeType = currentTheme.dark ? 'light' : 'dark';
    setStoredTheme(newThemeType);
    setCurrentTheme(newThemeType === 'dark' ? darkTheme : lightTheme);
  };

  const setTheme = (theme: 'light' | 'dark' | 'auto') => {
    setStoredTheme(theme);
    if (theme === 'auto') {
      setCurrentTheme(systemColorScheme === 'dark' ? darkTheme : lightTheme);
    } else {
      setCurrentTheme(theme === 'dark' ? darkTheme : lightTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
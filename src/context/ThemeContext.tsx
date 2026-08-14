import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useAppData } from './AppDataContext';
import { THEME_PRESETS } from '../utils/themePresets';
import type { AccentColor } from '../types';

interface ThemeContextValue {
  dark: boolean;
  toggleDark: () => void;
  accent: AccentColor;
  setAccent: (accent: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const TOKEN_TO_VAR: Record<string, string> = {
  paper: '--paper',
  card: '--card',
  cardRaised: '--card-raised',
  ink: '--ink',
  inkSoft: '--ink-soft',
  inkFaint: '--ink-faint',
  border: '--border',
  borderStrong: '--border-strong',
  accent: '--gold',
  accentSoft: '--gold-soft',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { data, updateSettings } = useAppData();
  const dark = data.settings.temaOscuro;
  const accent = data.settings.colorAcento ?? 'dorado';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const preset = THEME_PRESETS[accent] ?? THEME_PRESETS.dorado;
    const tokens = dark ? preset.dark : preset.light;
    const root = document.documentElement.style;
    for (const [key, cssVar] of Object.entries(TOKEN_TO_VAR)) {
      root.setProperty(cssVar, tokens[key as keyof typeof tokens]);
    }
  }, [accent, dark]);

  const toggleDark = () => updateSettings({ temaOscuro: !dark });
  const setAccent = (next: AccentColor) => updateSettings({ colorAcento: next });

  return (
    <ThemeContext.Provider value={{ dark, toggleDark, accent, setAccent }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}

import type { AccentColor } from '../types';

interface ThemeTokens {
  paper: string;
  card: string;
  cardRaised: string;
  ink: string;
  inkSoft: string;
  inkFaint: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentSoft: string;
}

interface ThemePreset {
  label: string;
  swatch: string;
  light: ThemeTokens;
  dark: ThemeTokens;
}

export const THEME_PRESETS: Record<AccentColor, ThemePreset> = {
  dorado: {
    label: 'Dorado',
    swatch: '#B7791F',
    light: {
      paper: '#F6F4EF',
      card: '#FFFFFF',
      cardRaised: '#FFFFFF',
      ink: '#16171A',
      inkSoft: '#5B5F67',
      inkFaint: '#8C9098',
      border: 'rgba(22, 23, 26, 0.07)',
      borderStrong: 'rgba(22, 23, 26, 0.15)',
      accent: '#B7791F',
      accentSoft: 'rgba(183, 121, 31, 0.12)',
    },
    dark: {
      paper: '#0C0C0E',
      card: '#151518',
      cardRaised: '#1C1C21',
      ink: '#F3F3F1',
      inkSoft: '#A7A9AD',
      inkFaint: '#74777D',
      border: 'rgba(255, 255, 255, 0.07)',
      borderStrong: 'rgba(255, 255, 255, 0.14)',
      accent: '#E3A84A',
      accentSoft: 'rgba(227, 168, 74, 0.14)',
    },
  },
  verde: {
    label: 'Verde',
    swatch: '#16865A',
    light: {
      paper: '#F1F5F2',
      card: '#FFFFFF',
      cardRaised: '#FFFFFF',
      ink: '#16171A',
      inkSoft: '#5B5F67',
      inkFaint: '#8C9098',
      border: 'rgba(22, 23, 26, 0.07)',
      borderStrong: 'rgba(22, 23, 26, 0.15)',
      accent: '#16865A',
      accentSoft: 'rgba(22, 134, 90, 0.11)',
    },
    dark: {
      paper: '#090E0C',
      card: '#111814',
      cardRaised: '#17201B',
      ink: '#F3F3F1',
      inkSoft: '#A7A9AD',
      inkFaint: '#74777D',
      border: 'rgba(255, 255, 255, 0.07)',
      borderStrong: 'rgba(255, 255, 255, 0.14)',
      accent: '#4FD18F',
      accentSoft: 'rgba(79, 209, 143, 0.13)',
    },
  },
  morado: {
    label: 'Morado',
    swatch: '#6D4FD8',
    light: {
      paper: '#F4F2F9',
      card: '#FFFFFF',
      cardRaised: '#FFFFFF',
      ink: '#16171A',
      inkSoft: '#5B5F67',
      inkFaint: '#8C9098',
      border: 'rgba(22, 23, 26, 0.07)',
      borderStrong: 'rgba(22, 23, 26, 0.15)',
      accent: '#6D4FD8',
      accentSoft: 'rgba(109, 79, 216, 0.11)',
    },
    dark: {
      paper: '#0C0A12',
      card: '#15121D',
      cardRaised: '#1C1826',
      ink: '#F3F3F1',
      inkSoft: '#A7A9AD',
      inkFaint: '#74777D',
      border: 'rgba(255, 255, 255, 0.07)',
      borderStrong: 'rgba(255, 255, 255, 0.14)',
      accent: '#A78BFA',
      accentSoft: 'rgba(167, 139, 250, 0.14)',
    },
  },
  rosa: {
    label: 'Rosa',
    swatch: '#CC3F78',
    light: {
      paper: '#F9F2F5',
      card: '#FFFFFF',
      cardRaised: '#FFFFFF',
      ink: '#16171A',
      inkSoft: '#5B5F67',
      inkFaint: '#8C9098',
      border: 'rgba(22, 23, 26, 0.07)',
      borderStrong: 'rgba(22, 23, 26, 0.15)',
      accent: '#CC3F78',
      accentSoft: 'rgba(204, 63, 120, 0.1)',
    },
    dark: {
      paper: '#110A0E',
      card: '#1B1217',
      cardRaised: '#23181E',
      ink: '#F3F3F1',
      inkSoft: '#A7A9AD',
      inkFaint: '#74777D',
      border: 'rgba(255, 255, 255, 0.07)',
      borderStrong: 'rgba(255, 255, 255, 0.14)',
      accent: '#F472B6',
      accentSoft: 'rgba(244, 114, 182, 0.14)',
    },
  },
  azul: {
    label: 'Azul',
    swatch: '#2563EB',
    light: {
      paper: '#F1F4F9',
      card: '#FFFFFF',
      cardRaised: '#FFFFFF',
      ink: '#16171A',
      inkSoft: '#5B5F67',
      inkFaint: '#8C9098',
      border: 'rgba(22, 23, 26, 0.07)',
      borderStrong: 'rgba(22, 23, 26, 0.15)',
      accent: '#2563EB',
      accentSoft: 'rgba(37, 99, 235, 0.1)',
    },
    dark: {
      paper: '#090C12',
      card: '#11161F',
      cardRaised: '#171E2A',
      ink: '#F3F3F1',
      inkSoft: '#A7A9AD',
      inkFaint: '#74777D',
      border: 'rgba(255, 255, 255, 0.07)',
      borderStrong: 'rgba(255, 255, 255, 0.14)',
      accent: '#60A5FA',
      accentSoft: 'rgba(96, 165, 250, 0.14)',
    },
  },
};

export const ACCENT_OPTIONS: { value: AccentColor; label: string; swatch: string }[] = (
  Object.entries(THEME_PRESETS) as [AccentColor, ThemePreset][]
).map(([value, preset]) => ({ value, label: preset.label, swatch: preset.swatch }));

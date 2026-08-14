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
    swatch: '#A9782E',
    light: {
      paper: '#EAE6D6',
      card: '#F8F6EC',
      cardRaised: '#FFFDF5',
      ink: '#1F2E3D',
      inkSoft: '#51606D',
      inkFaint: '#7C8994',
      border: 'rgba(31, 46, 61, 0.14)',
      borderStrong: 'rgba(31, 46, 61, 0.26)',
      accent: '#A9782E',
      accentSoft: 'rgba(169, 120, 46, 0.14)',
    },
    dark: {
      paper: '#14181D',
      card: '#1C222A',
      cardRaised: '#222933',
      ink: '#E9E4D3',
      inkSoft: '#AAB0B8',
      inkFaint: '#7D8791',
      border: 'rgba(233, 228, 211, 0.12)',
      borderStrong: 'rgba(233, 228, 211, 0.24)',
      accent: '#D1A04F',
      accentSoft: 'rgba(209, 160, 79, 0.16)',
    },
  },
  verde: {
    label: 'Verde',
    swatch: '#2F8F5B',
    light: {
      paper: '#E4EFE6',
      card: '#F1F8F2',
      cardRaised: '#FAFDFA',
      ink: '#1E3626',
      inkSoft: '#4B6B57',
      inkFaint: '#7C9788',
      border: 'rgba(30, 54, 38, 0.14)',
      borderStrong: 'rgba(30, 54, 38, 0.26)',
      accent: '#2F8F5B',
      accentSoft: 'rgba(47, 143, 91, 0.14)',
    },
    dark: {
      paper: '#101915',
      card: '#182720',
      cardRaised: '#1F3128',
      ink: '#E1EDE4',
      inkSoft: '#A6BBAC',
      inkFaint: '#78907F',
      border: 'rgba(225, 237, 228, 0.12)',
      borderStrong: 'rgba(225, 237, 228, 0.24)',
      accent: '#4FD38A',
      accentSoft: 'rgba(79, 211, 138, 0.16)',
    },
  },
  morado: {
    label: 'Morado',
    swatch: '#6B4FA0',
    light: {
      paper: '#EBE5F2',
      card: '#F6F2FA',
      cardRaised: '#FDFBFE',
      ink: '#2C2140',
      inkSoft: '#5B4E75',
      inkFaint: '#8A7FA0',
      border: 'rgba(44, 33, 64, 0.14)',
      borderStrong: 'rgba(44, 33, 64, 0.26)',
      accent: '#6B4FA0',
      accentSoft: 'rgba(107, 79, 160, 0.14)',
    },
    dark: {
      paper: '#15111F',
      card: '#1E1830',
      cardRaised: '#261E3C',
      ink: '#EAE3F5',
      inkSoft: '#AFA2C7',
      inkFaint: '#837798',
      border: 'rgba(234, 227, 245, 0.12)',
      borderStrong: 'rgba(234, 227, 245, 0.24)',
      accent: '#A98BD9',
      accentSoft: 'rgba(169, 139, 217, 0.16)',
    },
  },
  rosa: {
    label: 'Rosa',
    swatch: '#B5507A',
    light: {
      paper: '#F4E6EC',
      card: '#FBF2F6',
      cardRaised: '#FEFAFC',
      ink: '#3B2030',
      inkSoft: '#714D62',
      inkFaint: '#A17E93',
      border: 'rgba(59, 32, 48, 0.14)',
      borderStrong: 'rgba(59, 32, 48, 0.26)',
      accent: '#B5507A',
      accentSoft: 'rgba(181, 80, 122, 0.14)',
    },
    dark: {
      paper: '#1C1116',
      card: '#291822',
      cardRaised: '#331E2A',
      ink: '#F5E5EC',
      inkSoft: '#C1A0B0',
      inkFaint: '#937582',
      border: 'rgba(245, 229, 236, 0.12)',
      borderStrong: 'rgba(245, 229, 236, 0.24)',
      accent: '#E08FB0',
      accentSoft: 'rgba(224, 143, 176, 0.16)',
    },
  },
  azul: {
    label: 'Azul',
    swatch: '#3B6088',
    light: {
      paper: '#E4E9F0',
      card: '#F2F5F9',
      cardRaised: '#FAFCFD',
      ink: '#1B2A3B',
      inkSoft: '#4E6178',
      inkFaint: '#8090A3',
      border: 'rgba(27, 42, 59, 0.14)',
      borderStrong: 'rgba(27, 42, 59, 0.26)',
      accent: '#3B6088',
      accentSoft: 'rgba(59, 96, 136, 0.14)',
    },
    dark: {
      paper: '#0F161E',
      card: '#172230',
      cardRaised: '#1D2B3B',
      ink: '#E4EBF2',
      inkSoft: '#A6B4C4',
      inkFaint: '#798A9E',
      border: 'rgba(228, 235, 242, 0.12)',
      borderStrong: 'rgba(228, 235, 242, 0.24)',
      accent: '#7FAEDD',
      accentSoft: 'rgba(127, 174, 221, 0.16)',
    },
  },
};

export const ACCENT_OPTIONS: { value: AccentColor; label: string; swatch: string }[] = (
  Object.entries(THEME_PRESETS) as [AccentColor, ThemePreset][]
).map(([value, preset]) => ({ value, label: preset.label, swatch: preset.swatch }));

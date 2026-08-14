import type { Currency } from '../types';

const LOCALES: Record<Currency, string> = {
  MXN: 'es-MX',
  USD: 'en-US',
  ARS: 'es-AR',
  COP: 'es-CO',
  PEN: 'es-PE',
  EUR: 'es-ES',
  HNL: 'es-HN',
};

export function formatMoney(amount: number, currency: Currency): string {
  const formatted = new Intl.NumberFormat(LOCALES[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  return amount < 0 ? `-${formatted}` : formatted;
}

export function formatCompactMoney(amount: number, currency: Currency): string {
  const formatted = new Intl.NumberFormat(LOCALES[currency], {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Math.abs(amount));
  return amount < 0 ? `-${formatted}` : formatted;
}

export const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: 'HNL', label: 'Lempira hondureño (HNL)' },
  { value: 'MXN', label: 'Peso mexicano (MXN)' },
  { value: 'USD', label: 'Dólar estadounidense (USD)' },
  { value: 'ARS', label: 'Peso argentino (ARS)' },
  { value: 'COP', label: 'Peso colombiano (COP)' },
  { value: 'PEN', label: 'Sol peruano (PEN)' },
  { value: 'EUR', label: 'Euro (EUR)' },
];

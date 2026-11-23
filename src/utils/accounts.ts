import type { AccountType, Bank } from '../types';

export interface AccountTypeInfo {
  value: AccountType;
  label: string;
  hint: string;
  icon: string;
  /** Pasivo: su saldo representa dinero que se debe (tarjetas, préstamos). */
  liability: boolean;
}

export const ACCOUNT_TYPES: AccountTypeInfo[] = [
  { value: 'corriente', label: 'Cuenta corriente / débito', hint: 'Nómina o cuenta del día a día', icon: 'landmark', liability: false },
  { value: 'ahorro', label: 'Cuenta de ahorro', hint: 'Dinero guardado en el banco', icon: 'piggy-bank', liability: false },
  { value: 'efectivo', label: 'Efectivo', hint: 'Billetes y monedas en mano', icon: 'wallet', liability: false },
  { value: 'digital', label: 'Billetera digital', hint: 'PayPal, Mercado Pago, Tigo Money…', icon: 'smartphone', liability: false },
  { value: 'aparte', label: 'Cuenta aparte / fondo', hint: 'Fondo de emergencia, sobre, caja fuerte', icon: 'vault', liability: false },
  { value: 'inversion', label: 'Inversión', hint: 'Plazo fijo, fondos, acciones', icon: 'chart-line', liability: false },
  { value: 'financiera', label: 'Financiera / cooperativa', hint: 'Cuenta en una financiera o cooperativa', icon: 'building-2', liability: false },
  { value: 'credito', label: 'Tarjeta de crédito', hint: 'Lo que gastás aumenta tu deuda', icon: 'credit-card', liability: true },
  { value: 'prestamo', label: 'Préstamo / crédito', hint: 'Deuda con un banco, financiera o persona', icon: 'handshake', liability: true },
];

export function accountTypeInfo(tipo: AccountType | string | undefined): AccountTypeInfo {
  return ACCOUNT_TYPES.find((t) => t.value === tipo) ?? ACCOUNT_TYPES[0];
}

export function isLiability(bank: Pick<Bank, 'tipo'>): boolean {
  return accountTypeInfo(bank.tipo).liability;
}

/** Redondea a centavos para evitar errores de coma flotante (0.1 + 0.2 = 0.30000000000000004). */
export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

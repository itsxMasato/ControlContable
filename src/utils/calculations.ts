import type { Allocation, Bank, Category, SavingsGoal, Transaction } from '../types';
import { isoWeekKey, lastNMonthKeys, monthKey, startOfWeek, todayISO } from './dates';
import { isLiability, roundMoney } from './accounts';

export function signedAmount(t: Transaction): number {
  return t.tipo === 'ingreso' ? t.monto : -t.monto;
}

export function bankBalance(bank: Bank, transactions: Transaction[]): number {
  const delta = transactions
    .filter((t) => t.bankId === bank.id)
    .reduce((sum, t) => sum + signedAmount(t), 0);
  return roundMoney(bank.saldoInicial + delta);
}

export function bankAllocatedTotal(bankId: string, allocations: Allocation[]): number {
  return allocations.filter((a) => a.bankId === bankId).reduce((sum, a) => sum + a.monto, 0);
}

/**
 * Dinero que realmente se puede usar: saldo − apartados. En una tarjeta de crédito con límite,
 * el saldo es negativo (deuda), así que el disponible es límite − deuda − apartados.
 */
export function bankAvailable(bank: Bank, transactions: Transaction[], allocations: Allocation[]): number {
  const balance = bankBalance(bank, transactions);
  const base = bank.tipo === 'credito' && bank.limiteCredito ? bank.limiteCredito + balance : balance;
  return roundMoney(base - bankAllocatedTotal(bank.id, allocations));
}

/** Activos (lo que tenés), deudas (lo que debés) y patrimonio neto = activos − deudas. */
export function netWorthBreakdown(banks: Bank[], transactions: Transaction[]) {
  let activos = 0;
  let deudas = 0;
  for (const b of banks) {
    const bal = bankBalance(b, transactions);
    if (isLiability(b)) {
      if (bal < 0) deudas += -bal;
      else activos += bal; // saldo a favor en la tarjeta
    } else if (bal >= 0) activos += bal;
    else deudas += -bal; // sobregiro
  }
  return { activos: roundMoney(activos), deudas: roundMoney(deudas), neto: roundMoney(activos - deudas) };
}

/**
 * Busca el apartado de la misma cuenta que corresponde al gasto:
 * 1) uno vinculado explícitamente a la categoría del gasto o a su categoría padre;
 * 2) si no hay, uno cuyo nombre coincida con esa categoría (compatibilidad con apartados viejos).
 * Los apartados automáticos de pagos recurrentes se gestionan aparte y no entran acá.
 */
export function findMatchingAllocationByCategory(
  t: Transaction,
  categories: Category[],
  allocations: Allocation[]
): Allocation | undefined {
  const category = categories.find((c) => c.id === t.categoryId);
  if (!category) return undefined;
  const parent = category.parentId ? categories.find((c) => c.id === category.parentId) : null;
  const sameBank = allocations.filter((a) => a.bankId === t.bankId && !a.recurringPaymentId && a.monto > 0);
  const byLink =
    sameBank.find((a) => a.categoryId === category.id) ?? (parent ? sameBank.find((a) => a.categoryId === parent.id) : undefined);
  if (byLink) return byLink;
  const candidateNames = [category.nombre, parent?.nombre]
    .filter((n): n is string => Boolean(n))
    .map((n) => n.trim().toLowerCase());
  return sameBank.find((a) => !a.categoryId && candidateNames.includes(a.nombre.trim().toLowerCase()));
}

export function totalConsolidatedBalance(banks: Bank[], transactions: Transaction[]): number {
  return banks.reduce((sum, b) => sum + bankBalance(b, transactions), 0);
}

export function monthExpenseTotal(transactions: Transaction[], mKey: string, bankId?: string | null): number {
  return transactions
    .filter((t) => t.tipo === 'gasto' && monthKey(t.fecha) === mKey && (!bankId || t.bankId === bankId))
    .reduce((sum, t) => sum + t.monto, 0);
}

export function monthIncomeTotal(transactions: Transaction[], mKey: string, bankId?: string | null): number {
  return transactions
    .filter((t) => t.tipo === 'ingreso' && monthKey(t.fecha) === mKey && (!bankId || t.bankId === bankId))
    .reduce((sum, t) => sum + t.monto, 0);
}

export function monthChangePct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function totalSaved(goals: SavingsGoal[]): number {
  return goals.reduce((sum, g) => sum + g.contributions.reduce((s, c) => s + c.monto, 0), 0);
}

export function goalCurrentAmount(goal: SavingsGoal): number {
  return goal.contributions.reduce((sum, c) => sum + c.monto, 0);
}

export function categorySpendByMonth(
  transactions: Transaction[],
  categoryId: string,
  mKey: string,
  includeSubcategories: string[] = []
): number {
  const ids = new Set([categoryId, ...includeSubcategories]);
  return transactions
    .filter((t) => t.tipo === 'gasto' && ids.has(t.categoryId) && monthKey(t.fecha) === mKey)
    .reduce((sum, t) => sum + t.monto, 0);
}

export function subcategoryIds(categories: Category[], parentId: string): string[] {
  return categories.filter((c) => c.parentId === parentId).map((c) => c.id);
}

export function categorySpendLastNMonths(
  transactions: Transaction[],
  categoryId: string,
  n: number
): { month: string; total: number }[] {
  return lastNMonthKeys(n).map((mKey) => ({
    month: mKey,
    total: categorySpendByMonth(transactions, categoryId, mKey),
  }));
}

export function monthlyTrend(transactions: Transaction[], n: number, bankId?: string | null) {
  return lastNMonthKeys(n).map((mKey) => ({
    month: mKey,
    gasto: monthExpenseTotal(transactions, mKey, bankId),
    ingreso: monthIncomeTotal(transactions, mKey, bankId),
  }));
}

export function spendByCategoryForMonth(
  transactions: Transaction[],
  categories: Category[],
  mKey: string
): { category: Category; total: number }[] {
  const topLevel = categories.filter((c) => c.parentId === null);
  return topLevel
    .map((cat) => {
      const subIds = subcategoryIds(categories, cat.id);
      const total = categorySpendByMonth(transactions, cat.id, mKey, subIds);
      return { category: cat, total };
    })
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);
}

export function spendByBankForMonth(
  banks: Bank[],
  transactions: Transaction[],
  mKey: string
): { bank: Bank; total: number }[] {
  return banks
    .map((bank) => ({ bank, total: monthExpenseTotal(transactions, mKey, bank.id) }))
    .sort((a, b) => b.total - a.total);
}

export function weeklySpendTotals(transactions: Transaction[], weeksBack: number): { week: string; total: number }[] {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.tipo !== 'gasto') continue;
    const wk = isoWeekKey(t.fecha);
    map.set(wk, (map.get(wk) ?? 0) + t.monto);
  }
  const out: { week: string; total: number }[] = [];
  const today = todayISO();
  let cursor = startOfWeek(today);
  for (let i = 0; i < weeksBack; i++) {
    const wk = isoWeekKey(cursor);
    out.unshift({ week: wk, total: map.get(wk) ?? 0 });
    const d = new Date(cursor + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    cursor = d.toISOString().slice(0, 10);
  }
  return out;
}

export function totalMonthlyBudget(categories: Category[]): number {
  return categories.reduce((sum, c) => sum + (c.presupuestoMensual ?? 0), 0);
}

export function projectedGoalDate(goal: SavingsGoal): string | null {
  if (goal.contributions.length < 2) return goal.fechaObjetivo;
  const sorted = [...goal.contributions].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const daysSpan = Math.max(
    1,
    (new Date(last.fecha).valueOf() - new Date(first.fecha).valueOf()) / (24 * 60 * 60 * 1000)
  );
  const current = goalCurrentAmount(goal);
  const remaining = goal.montoObjetivo - current;
  if (remaining <= 0) return todayISO();
  const ratePerDay = current / daysSpan;
  if (ratePerDay <= 0) return goal.fechaObjetivo;
  const daysNeeded = remaining / ratePerDay;
  const target = new Date();
  target.setDate(target.getDate() + Math.ceil(daysNeeded));
  return target.toISOString().slice(0, 10);
}

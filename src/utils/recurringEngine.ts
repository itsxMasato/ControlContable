import type { Allocation, Category, RecurringPayment, Transaction } from '../types';
import { addMonths, monthKey, todayISO } from './dates';

const AMOUNT_TOLERANCE = 0.05; // 5%
const MAX_DAY_SPREAD = 5; // días de diferencia permitidos respecto al promedio
const LOOKBACK_MONTHS = 4;

function categoryLabel(categoryId: string, categories: Category[]): string {
  const cat = categories.find((c) => c.id === categoryId);
  return cat?.nombre ?? 'Gasto';
}

/**
 * Agrupa gastos por (banco, categoría, monto redondeado) y detecta los que se repiten
 * en al menos 2 meses distintos con un día del mes consistente — el patrón típico de
 * una suscripción, renta o servicio fijo. Descarta lo que ya está cargado a mano.
 */
export function detectRecurringCandidates(
  transactions: Transaction[],
  existingRecurring: RecurringPayment[],
  categories: Category[]
): RecurringPayment[] {
  const cutoff = addMonths(monthKey(todayISO()), -LOOKBACK_MONTHS);
  const groups = new Map<string, Transaction[]>();

  for (const t of transactions) {
    if (t.tipo !== 'gasto') continue;
    if (monthKey(t.fecha) < cutoff) continue;
    const key = `${t.bankId}|${t.categoryId}|${Math.round(t.monto)}`;
    const group = groups.get(key);
    if (group) group.push(t);
    else groups.set(key, [t]);
  }

  const candidates: RecurringPayment[] = [];

  for (const group of groups.values()) {
    const distinctMonths = new Set(group.map((t) => monthKey(t.fecha)));
    if (distinctMonths.size < 2) continue;

    const days = group.map((t) => Number(t.fecha.slice(8, 10)));
    const avgDay = Math.round(days.reduce((a, b) => a + b, 0) / days.length);
    const withinSpread = days.every((d) => Math.abs(d - avgDay) <= MAX_DAY_SPREAD);
    if (!withinSpread) continue;

    const bankId = group[0].bankId;
    const categoryId = group[0].categoryId;
    const avgMonto = Math.round((group.reduce((a, t) => a + t.monto, 0) / group.length) * 100) / 100;

    const alreadyTracked = existingRecurring.some(
      (rp) =>
        rp.bankId === bankId &&
        rp.categoryId === categoryId &&
        Math.abs(rp.monto - avgMonto) / avgMonto <= AMOUNT_TOLERANCE
    );
    if (alreadyTracked) continue;

    candidates.push({
      id: crypto.randomUUID(),
      nombre: `${categoryLabel(categoryId, categories)} (detectado)`,
      monto: avgMonto,
      bankId,
      categoryId,
      diaDeVencimiento: Math.min(28, Math.max(1, avgDay)),
      autoDetectado: true,
    });
  }

  return candidates;
}

/** Pagos recurrentes de un banco que todavía no tienen apartado automático (o solo parcial) para ese ciclo. */
export function computePendingForCycle(
  bankId: string,
  cicloClave: string,
  recurringPayments: RecurringPayment[],
  allocations: Allocation[]
): { recurringPayment: RecurringPayment; pendiente: number }[] {
  return recurringPayments
    .filter((rp) => rp.bankId === bankId)
    .map((rp) => {
      const yaApartado = allocations
        .filter((a) => a.recurringPaymentId === rp.id && a.cicloClave === cicloClave)
        .reduce((sum, a) => sum + a.monto, 0);
      return { recurringPayment: rp, pendiente: Math.round((rp.monto - yaApartado) * 100) / 100 };
    })
    .filter((p) => p.pendiente > 0.01);
}

/** Reparte un ingreso entre los pagos recurrentes pendientes: completo si alcanza, proporcional si no. */
export function splitIncomeAcrossPending(
  incomeAmount: number,
  pending: { recurringPayment: RecurringPayment; pendiente: number }[]
): { recurringPaymentId: string; monto: number }[] {
  const total = pending.reduce((sum, p) => sum + p.pendiente, 0);
  if (total <= 0 || incomeAmount <= 0) return [];

  if (incomeAmount >= total) {
    return pending.map((p) => ({ recurringPaymentId: p.recurringPayment.id, monto: p.pendiente }));
  }

  return pending.map((p) => ({
    recurringPaymentId: p.recurringPayment.id,
    monto: Math.round(incomeAmount * (p.pendiente / total) * 100) / 100,
  }));
}

/** Encuentra el pago recurrente que coincide con un gasto real (mismo banco, categoría y monto ±5%). */
export function findMatchingRecurring(
  t: Transaction,
  recurringPayments: RecurringPayment[]
): RecurringPayment | undefined {
  return recurringPayments.find(
    (rp) =>
      rp.bankId === t.bankId &&
      rp.categoryId === t.categoryId &&
      Math.abs(rp.monto - t.monto) / rp.monto <= AMOUNT_TOLERANCE
  );
}

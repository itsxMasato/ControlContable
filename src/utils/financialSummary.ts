import type { AppData } from '../types';
import {
  bankAvailable,
  bankBalance,
  categorySpendByMonth,
  goalCurrentAmount,
  monthChangePct,
  monthExpenseTotal,
  spendByCategoryForMonth,
  subcategoryIds,
  totalConsolidatedBalance,
  totalSaved,
} from './calculations';
import { addMonths, monthKey, todayISO } from './dates';
import { formatMoney } from './currency';

/** Arma un resumen en texto plano de la situación financiera actual, para dárselo de contexto a la IA. */
export function buildFinancialSummary(data: AppData): string {
  const { banks, categories, transactions, savingsGoals, recurringPayments, allocations, settings } = data;
  const currency = settings.moneda;
  const currentMonth = monthKey(todayISO());
  const prevMonth = addMonths(currentMonth, -1);
  const money = (n: number) => formatMoney(n, currency);

  const lines: string[] = [];

  lines.push(`Saldo consolidado en todos los bancos: ${money(totalConsolidatedBalance(banks, transactions))}.`);
  lines.push(
    `Gasto de este mes: ${money(monthExpenseTotal(transactions, currentMonth))} (mes anterior: ${money(
      monthExpenseTotal(transactions, prevMonth)
    )}).`
  );

  if (banks.length > 0) {
    lines.push('\nBancos / cuentas:');
    for (const b of banks) {
      const saldo = bankBalance(b, transactions);
      const disponible = bankAvailable(b, transactions, allocations);
      lines.push(`- ${b.nombre} (${b.tipo}): saldo ${money(saldo)}, disponible tras apartados ${money(disponible)}.`);
    }
  }

  const gastosPorCategoria = spendByCategoryForMonth(transactions, categories, currentMonth);
  if (gastosPorCategoria.length > 0) {
    lines.push('\nGasto de este mes por categoría:');
    for (const { category, total } of gastosPorCategoria) {
      const budgetPart = category.presupuestoMensual ? ` (presupuesto ${money(category.presupuestoMensual)})` : '';
      lines.push(`- ${category.nombre}: ${money(total)}${budgetPart}.`);
    }
  }

  const topCategories = categories.filter((c) => c.parentId === null && c.presupuestoMensual);
  const excedidas = topCategories.filter((c) => {
    const subIds = subcategoryIds(categories, c.id);
    return categorySpendByMonth(transactions, c.id, currentMonth, subIds) > (c.presupuestoMensual ?? 0);
  });
  if (excedidas.length > 0) {
    lines.push('\nCategorías con presupuesto excedido este mes:');
    for (const c of excedidas) lines.push(`- ${c.nombre}`);
  }

  if (savingsGoals.length > 0) {
    lines.push('\nMetas de ahorro:');
    for (const g of savingsGoals) {
      const actual = goalCurrentAmount(g);
      const pct = Math.round((actual / g.montoObjetivo) * 100);
      lines.push(
        `- ${g.nombre}: ${money(actual)} de ${money(g.montoObjetivo)} (${pct}%)${g.fechaObjetivo ? `, fecha objetivo ${g.fechaObjetivo}` : ''}.`
      );
    }
    lines.push(`Total ahorrado en todas las metas: ${money(totalSaved(savingsGoals))}.`);
  }

  if (recurringPayments.length > 0) {
    lines.push('\nPagos recurrentes:');
    for (const r of recurringPayments) {
      lines.push(`- ${r.nombre}: ${money(r.monto)}, vence el día ${r.diaDeVencimiento} de cada mes.`);
    }
  }

  const changePct = monthChangePct(monthExpenseTotal(transactions, currentMonth), monthExpenseTotal(transactions, prevMonth));
  if (changePct !== null) {
    lines.push(`\nVariación de gasto vs. mes anterior: ${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%.`);
  }

  return lines.join('\n');
}

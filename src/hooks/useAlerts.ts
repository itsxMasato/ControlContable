import { useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';
import type { AppAlert } from '../types';
import {
  categorySpendByMonth,
  goalCurrentAmount,
  subcategoryIds,
} from '../utils/calculations';
import { addMonths, daysUntil, formatDateShort, monthKey, nextOccurrenceOfDay, todayISO } from '../utils/dates';

export function computeAlerts(data: ReturnType<typeof useAppData>['data']): AppAlert[] {
  const { categories, transactions, savingsGoals, recurringPayments } = data;
  const alerts: AppAlert[] = [];
  const currentMonth = monthKey(todayISO());

  // 1. Presupuesto excedido
  const topLevel = categories.filter((c) => c.parentId === null && c.presupuestoMensual);
  for (const cat of topLevel) {
    const subIds = subcategoryIds(categories, cat.id);
    const spent = categorySpendByMonth(transactions, cat.id, currentMonth, subIds);
    const budget = cat.presupuestoMensual!;
    if (spent > budget) {
      const pct = Math.round(((spent - budget) / budget) * 100);
      alerts.push({
        id: `presupuesto:${cat.id}:${currentMonth}`,
        tipo: 'presupuesto_excedido',
        severidad: 'advertencia',
        titulo: `Presupuesto de ${cat.nombre} excedido`,
        descripcion: `El gasto en ${cat.nombre} superó el presupuesto mensual en ${pct}%.`,
        fecha: todayISO(),
        entidadId: cat.id,
        accionLabel: 'Ver categoría',
        accionRuta: '/categorias',
      });
    }
  }

  // 2. Pagos recurrentes próximos
  for (const rp of recurringPayments) {
    const nextDate = nextOccurrenceOfDay(rp.diaDeVencimiento);
    const d = daysUntil(nextDate);
    if (d >= 0 && d <= 7) {
      alerts.push({
        id: `pago:${rp.id}:${nextDate}`,
        tipo: 'pago_proximo',
        severidad: 'info',
        titulo: `Pago próximo: ${rp.nombre}`,
        descripcion: `Vence el ${formatDateShort(nextDate)} — ${d === 0 ? 'hoy' : `en ${d} día${d === 1 ? '' : 's'}`}.`,
        fecha: todayISO(),
        entidadId: rp.id,
        accionLabel: 'Ver configuración',
        accionRuta: '/configuracion',
      });
    }
  }

  // 3. Metas de ahorro alcanzadas
  for (const goal of savingsGoals) {
    const current = goalCurrentAmount(goal);
    if (current >= goal.montoObjetivo) {
      alerts.push({
        id: `meta:${goal.id}`,
        tipo: 'meta_alcanzada',
        severidad: 'logro',
        titulo: `¡Meta alcanzada: ${goal.nombre}!`,
        descripcion: `Llegaste a tu objetivo de ${goal.montoObjetivo.toLocaleString()}.`,
        fecha: todayISO(),
        entidadId: goal.id,
        accionLabel: 'Ver meta',
        accionRuta: '/ahorros',
      });
    }
  }

  // 4. Gasto inusual por categoría (vs. promedio de 3 meses previos)
  const topAll = categories.filter((c) => c.parentId === null);
  for (const cat of topAll) {
    const subIds = subcategoryIds(categories, cat.id);
    const current = categorySpendByMonth(transactions, cat.id, currentMonth, subIds);
    const prevMonths = [1, 2, 3].map((n) => categorySpendByMonth(transactions, cat.id, addMonths(currentMonth, -n), subIds));
    const avg = prevMonths.reduce((a, b) => a + b, 0) / prevMonths.length;
    if (avg > 0 && current > avg * 1.5) {
      const pct = Math.round(((current - avg) / avg) * 100);
      alerts.push({
        id: `inusual:${cat.id}:${currentMonth}`,
        tipo: 'gasto_inusual',
        severidad: 'advertencia',
        titulo: `Gasto inusual en ${cat.nombre}`,
        descripcion: `Es ${pct}% más alto que tu promedio de los últimos 3 meses.`,
        fecha: todayISO(),
        entidadId: cat.id,
        accionLabel: 'Ver transacciones',
        accionRuta: '/transacciones',
      });
    }
  }

  return alerts.filter((a) => !data.dismissedAlertIds.includes(a.id));
}

export function useAlerts(): AppAlert[] {
  const { data } = useAppData();
  return useMemo(() => computeAlerts(data), [data]);
}

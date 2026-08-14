import type { AppData } from '../types';
import {
  bankAllocatedTotal,
  bankAvailable,
  bankBalance,
  categorySpendByMonth,
  goalCurrentAmount,
  subcategoryIds,
} from './calculations';
import { monthKey, todayISO } from './dates';

export async function exportToExcel(data: AppData): Promise<void> {
  const XLSX = await import('xlsx');
  const { banks, categories, transactions, savingsGoals, recurringPayments, allocations } = data;
  const currentMonth = monthKey(todayISO());
  const categoryLabel = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return '';
    const parent = cat.parentId ? categories.find((c) => c.id === cat.parentId) : null;
    return parent ? `${parent.nombre} › ${cat.nombre}` : cat.nombre;
  };
  const bankLabel = (bankId: string) => banks.find((b) => b.id === bankId)?.nombre ?? '';

  const transaccionesSheet = [...transactions]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((t) => ({
      Fecha: t.fecha,
      Tipo: t.tipo === 'gasto' ? 'Gasto' : 'Ingreso',
      Banco: bankLabel(t.bankId),
      Categoría: categoryLabel(t.categoryId),
      Nota: t.nota,
      Monto: t.monto,
    }));

  const bancosSheet = banks.map((b) => ({
    Nombre: b.nombre,
    Tipo: b.tipo,
    'Saldo inicial': b.saldoInicial,
    'Saldo actual': bankBalance(b, transactions),
    Apartado: bankAllocatedTotal(b.id, allocations),
    Disponible: bankAvailable(b, transactions, allocations),
  }));

  const categoriasSheet = categories.map((c) => {
    const parent = c.parentId ? categories.find((p) => p.id === c.parentId) : null;
    const subIds = c.parentId ? [] : subcategoryIds(categories, c.id);
    return {
      Nombre: c.nombre,
      'Categoría padre': parent?.nombre ?? '',
      'Presupuesto mensual': c.presupuestoMensual ?? '',
      'Gasto del mes actual': categorySpendByMonth(transactions, c.id, currentMonth, subIds),
    };
  });

  const metasSheet = savingsGoals.map((g) => {
    const actual = goalCurrentAmount(g);
    return {
      Nombre: g.nombre,
      'Monto objetivo': g.montoObjetivo,
      'Monto actual': actual,
      '% completado': Math.min(100, Math.round((actual / g.montoObjetivo) * 100)),
      'Fecha objetivo': g.fechaObjetivo ?? '',
    };
  });

  const aportesSheet = savingsGoals
    .flatMap((g) => g.contributions.map((c) => ({ goal: g.nombre, ...c })))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((c) => ({
      Meta: c.goal,
      Fecha: c.fecha,
      Monto: c.monto,
      Nota: c.nota,
    }));

  const apartadosSheet = allocations.map((a) => ({
    Banco: bankLabel(a.bankId),
    Nombre: a.nombre,
    Monto: a.monto,
    Nota: a.nota,
  }));

  const recurrentesSheet = recurringPayments.map((r) => ({
    Nombre: r.nombre,
    Monto: r.monto,
    Banco: bankLabel(r.bankId),
    Categoría: categoryLabel(r.categoryId),
    'Día de vencimiento': r.diaDeVencimiento,
  }));

  const wb = XLSX.utils.book_new();
  const addSheet = (name: string, rows: Record<string, unknown>[]) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name);
  };

  addSheet('Transacciones', transaccionesSheet);
  addSheet('Bancos', bancosSheet);
  addSheet('Categorías', categoriasSheet);
  addSheet('Metas de ahorro', metasSheet);
  addSheet('Aportes', aportesSheet);
  addSheet('Apartados', apartadosSheet);
  addSheet('Pagos recurrentes', recurrentesSheet);

  XLSX.writeFile(wb, `libro-de-gastos-${todayISO()}.xlsx`);
}

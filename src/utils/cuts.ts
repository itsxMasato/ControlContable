import type { Bank, Cut, CutAccount, Transaction } from '../types';
import { roundMoney } from './accounts';

/** Último corte (el de fecha más reciente), o null si nunca se hizo uno. */
export function lastCut(cuts: Cut[]): Cut | null {
  return [...cuts].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.creadoEn.localeCompare(a.creadoEn))[0] ?? null;
}

function balanceUpTo(bank: Bank, transactions: Transaction[], fecha: string | null): number {
  if (fecha === null) return bank.saldoInicial;
  const delta = transactions
    .filter((t) => t.bankId === bank.id && t.fecha <= fecha)
    .reduce((sum, t) => sum + (t.tipo === 'ingreso' ? t.monto : -t.monto), 0);
  return roundMoney(bank.saldoInicial + delta);
}

/**
 * Calcula el resumen de un período (desde, hasta] por cuenta.
 * Por cuenta, ingresos/gastos incluyen transferencias (entran o salen de esa cuenta), así
 * saldoInicio + ingresos − gastos = saldo final. En los totales generales las transferencias
 * entre cuentas propias se excluyen, porque no son ni ingreso ni gasto real.
 */
export function computeCutPreview(banks: Bank[], transactions: Transaction[], desde: string | null, hasta: string) {
  const inPeriod = (t: Transaction) => (desde === null || t.fecha > desde) && t.fecha <= hasta;
  const periodTx = transactions.filter(inPeriod);

  const cuentas: Omit<CutAccount, 'saldoReal' | 'ajuste'>[] = banks.map((bank) => {
    const own = periodTx.filter((t) => t.bankId === bank.id);
    return {
      bankId: bank.id,
      nombre: bank.nombre,
      saldoInicioPeriodo: balanceUpTo(bank, transactions, desde),
      ingresos: roundMoney(own.filter((t) => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0)),
      gastos: roundMoney(own.filter((t) => t.tipo === 'gasto').reduce((s, t) => s + t.monto, 0)),
      saldoSistema: balanceUpTo(bank, transactions, hasta),
    };
  });

  const real = periodTx.filter((t) => !t.transferId && !t.ajusteCorteId);
  const ingresos = roundMoney(real.filter((t) => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0));
  const gastos = roundMoney(real.filter((t) => t.tipo === 'gasto').reduce((s, t) => s + t.monto, 0));

  return {
    cuentas,
    totales: { ingresos, gastos, neto: roundMoney(ingresos - gastos) },
    movimientos: periodTx.length,
  };
}

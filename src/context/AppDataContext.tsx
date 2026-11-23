import { arrayUnion, deleteDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type {
  Allocation,
  AppData,
  AppSettings,
  Bank,
  Category,
  Contribution,
  Cut,
  RecurringPayment,
  SavingsGoal,
  Transaction,
} from '../types';
import { ensureMetaDoc, metaDoc, normalizeSettings, replaceAllData, userCollection, userDoc, deleteWhere } from '../firebase/firestoreData';
import { useAuth } from './AuthContext';
import { monthKey, todayISO } from '../utils/dates';
import {
  computePendingForCycle,
  detectRecurringCandidates,
  findMatchingRecurring,
  splitIncomeAcrossPending,
} from '../utils/recurringEngine';
import { findMatchingAllocationByCategory } from '../utils/calculations';
import Splash from '../components/ui/Splash';
import { toast } from '../utils/toast';
import { roundMoney } from '../utils/accounts';
import { computeCutPreview, lastCut } from '../utils/cuts';

const ACTION_MESSAGES: Partial<Record<keyof AppDataContextValue, string>> = {
  addTransaction: 'Movimiento registrado',
  updateTransaction: 'Movimiento actualizado',
  deleteTransaction: 'Movimiento eliminado',
  addBank: 'Cuenta creada',
  updateBank: 'Cuenta actualizada',
  deleteBank: 'Cuenta eliminada',
  addCategory: 'Categoría creada',
  updateCategory: 'Categoría actualizada',
  deleteCategory: 'Categoría eliminada',
  addGoal: 'Meta creada',
  updateGoal: 'Meta actualizada',
  deleteGoal: 'Meta eliminada',
  contributeToGoal: 'Aporte registrado',
  updateContribution: 'Aporte actualizado',
  deleteContribution: 'Aporte eliminado',
  addRecurring: 'Pago recurrente creado',
  updateRecurring: 'Pago recurrente actualizado',
  deleteRecurring: 'Pago recurrente eliminado',
  addAllocation: 'Apartado creado',
  updateAllocation: 'Apartado actualizado',
  deleteAllocation: 'Apartado eliminado',
  payAllocation: 'Apartado pagado',
  addTransfer: 'Transferencia registrada',
  updateTransfer: 'Transferencia actualizada',
  importData: 'Datos importados',
  addCut: 'Corte realizado',
  deleteCut: 'Corte eliminado',
  clearAll: 'Datos borrados',
};

function withToasts(v: AppDataContextValue): AppDataContextValue {
  const wrapped = { ...v } as Record<string, unknown>;
  for (const [key, message] of Object.entries(ACTION_MESSAGES)) {
    const fn = v[key as keyof AppDataContextValue] as unknown as (...args: unknown[]) => unknown;
    wrapped[key] = (...args: unknown[]) => {
      const result = fn(...args);
      toast(message!, 'success', navigator.onLine ? undefined : 'Guardado en el teléfono; se sube al volver la conexión');
      return result;
    };
  }
  return wrapped as unknown as AppDataContextValue;
}

interface AppDataContextValue {
  data: AppData;
  addTransaction: (t: Transaction) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addBank: (b: Bank) => void;
  updateBank: (b: Bank) => void;
  deleteBank: (id: string) => void;
  addCategory: (c: Category) => void;
  updateCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  addGoal: (g: SavingsGoal) => void;
  updateGoal: (g: SavingsGoal) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (goal: SavingsGoal, input: { monto: number; fecha: string; nota: string }) => void;
  updateContribution: (
    goal: SavingsGoal,
    contribution: Contribution,
    input: { monto: number; fecha: string; nota: string }
  ) => void;
  deleteContribution: (goal: SavingsGoal, contributionId: string) => void;
  addRecurring: (r: RecurringPayment) => void;
  updateRecurring: (r: RecurringPayment) => void;
  deleteRecurring: (id: string) => void;
  addAllocation: (a: Allocation) => void;
  updateAllocation: (a: Allocation) => void;
  deleteAllocation: (id: string) => void;
  payAllocation: (a: Allocation) => void;
  addTransfer: (input: { fecha: string; origenBankId: string; destinoBankId: string; monto: number; nota: string }) => void;
  updateTransfer: (
    transferId: string,
    input: { fecha: string; origenBankId: string; destinoBankId: string; monto: number; nota: string }
  ) => void;
  dismissAlert: (id: string) => void;
  dismissAllAlerts: (ids: string[]) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  clearAll: () => void;
  importData: (d: AppData) => void;
  /** Cierra el período hasta `fecha`. `saldosReales` (por cuenta) concilia con el banco creando ajustes. */
  addCut: (input: { fecha: string; nombre: string; nota: string; saldosReales: Record<string, number> }) => void;
  deleteCut: (id: string) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function LoadingScreen() {
  return <Splash message="Cargando tu libro de gastos…" />;
}

interface MetaDoc {
  settings: AppSettings;
  dismissedAlertIds: string[];
}

const SAVINGS_CATEGORY_NAME = 'Ahorro';
const TRANSFER_CATEGORY_NAME = 'Transferencia';
const ADJUSTMENT_CATEGORY_NAME = 'Ajuste de corte';

/** Categoría fija usada para los aportes a metas — el usuario nunca la elige, así el aporte
 * queda registrado como movimiento sin forzarlo a clasificarlo entre categorías de gasto. */
function resolveSavingsCategory(categories: Category[]): Category {
  const existing = categories.find(
    (c) => c.parentId === null && c.nombre.trim().toLowerCase() === SAVINGS_CATEGORY_NAME.toLowerCase()
  );
  if (existing) return existing;
  return {
    id: crypto.randomUUID(),
    nombre: SAVINGS_CATEGORY_NAME,
    icono: 'piggy-bank',
    colorIndex: 0,
    parentId: null,
    presupuestoMensual: null,
  };
}

/** Categoría fija usada en ambas patas de una transferencia entre cuentas propias. */
function resolveTransferCategory(categories: Category[]): Category {
  const existing = categories.find(
    (c) => c.parentId === null && c.nombre.trim().toLowerCase() === TRANSFER_CATEGORY_NAME.toLowerCase()
  );
  if (existing) return existing;
  return {
    id: crypto.randomUUID(),
    nombre: TRANSFER_CATEGORY_NAME,
    icono: 'arrow-left-right',
    colorIndex: 0,
    parentId: null,
    presupuestoMensual: null,
  };
}

/** Busca (o crea) una categoría principal con el nombre dado — usada al pagar un apartado, para que
 * quede registrado bajo una categoría con el mismo nombre y así calce con el apartado en el futuro. */
function resolveCategoryByName(categories: Category[], nombre: string): Category {
  const existing = categories.find(
    (c) => c.parentId === null && c.nombre.trim().toLowerCase() === nombre.trim().toLowerCase()
  );
  if (existing) return existing;
  return {
    id: crypto.randomUUID(),
    nombre: nombre.trim(),
    icono: 'ellipsis',
    colorIndex: 0,
    parentId: null,
    presupuestoMensual: null,
  };
}

function AppDataProviderInner({ uid, children }: { uid: string; children: ReactNode }) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [meta, setMeta] = useState<MetaDoc | null>(null);
  const initializedFor = useRef<string | null>(null);

  useEffect(() => {
    if (initializedFor.current !== uid) {
      initializedFor.current = uid;
      ensureMetaDoc(uid).catch((err) => console.error('Error inicializando la cuenta en Firestore:', err));
    }

    const unsubscribers = [
      onSnapshot(userCollection(uid, 'banks'), (snap) => setBanks(snap.docs.map((d) => d.data() as Bank))),
      onSnapshot(userCollection(uid, 'categories'), (snap) => setCategories(snap.docs.map((d) => d.data() as Category))),
      onSnapshot(userCollection(uid, 'transactions'), (snap) => setTransactions(snap.docs.map((d) => d.data() as Transaction))),
      onSnapshot(userCollection(uid, 'savingsGoals'), (snap) => setSavingsGoals(snap.docs.map((d) => d.data() as SavingsGoal))),
      onSnapshot(userCollection(uid, 'recurringPayments'), (snap) =>
        setRecurringPayments(snap.docs.map((d) => d.data() as RecurringPayment))
      ),
      onSnapshot(userCollection(uid, 'allocations'), (snap) => setAllocations(snap.docs.map((d) => d.data() as Allocation))),
      onSnapshot(userCollection(uid, 'cuts'), (snap) => setCuts(snap.docs.map((d) => d.data() as Cut))),
      onSnapshot(metaDoc(uid), (snap) => {
        if (snap.exists()) setMeta(snap.data() as MetaDoc);
      }),
    ];

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [uid]);

  const detectedSignatures = useRef<Set<string>>(new Set());

  useEffect(() => {
    const candidates = detectRecurringCandidates(transactions, recurringPayments, categories);
    const fresh = candidates.filter((c) => {
      const sig = `${c.bankId}|${c.categoryId}|${Math.round(c.monto)}`;
      if (detectedSignatures.current.has(sig)) return false;
      detectedSignatures.current.add(sig);
      return true;
    });
    for (const c of fresh) void setDoc(userDoc(uid, 'recurringPayments', c.id), c);
  }, [uid, transactions, recurringPayments, categories]);

  useEffect(() => {
    const cicloActual = monthKey(todayISO());
    for (const a of allocations) {
      if (a.recurrente && a.cicloClave !== cicloActual) {
        void updateDoc(userDoc(uid, 'allocations', a.id), {
          monto: a.montoObjetivo ?? a.monto,
          cicloClave: cicloActual,
        });
      }
    }
  }, [uid, allocations]);

  const data: AppData | null = useMemo(
    () =>
      meta
        ? {
            banks,
            categories,
            transactions,
            savingsGoals,
            recurringPayments,
            allocations,
            cuts,
            dismissedAlertIds: meta.dismissedAlertIds,
            settings: normalizeSettings(meta.settings),
          }
        : null,
    [banks, categories, transactions, savingsGoals, recurringPayments, allocations, cuts, meta]
  );

  const rawValue: AppDataContextValue | null = useMemo(() => {
    if (!data) return null;

    /**
     * Descuenta un gasto del apartado que le corresponde (por categoría vinculada o por nombre) y
     * devuelve el movimiento con el registro de cuánto consumió. Solo aplica a gastos ya ocurridos:
     * una cuota futura no toca el dinero apartado hoy.
     */
    const consumeAllocation = (t: Transaction, allocations: Allocation[]): Transaction => {
      if (t.tipo !== 'gasto' || t.fecha > todayISO()) return { ...t, apartado: null };
      const match = findMatchingAllocationByCategory(t, data.categories, allocations);
      if (!match) return { ...t, apartado: null };
      const usado = roundMoney(Math.min(match.monto, t.monto));
      const restante = roundMoney(match.monto - usado);
      if (restante <= 0.009 && !match.recurrente) {
        void deleteDoc(userDoc(uid, 'allocations', match.id));
      } else {
        void updateDoc(userDoc(uid, 'allocations', match.id), { monto: restante });
      }
      const excedente = roundMoney(t.monto - usado);
      if (excedente > 0) {
        toast(`El gasto superó el apartado "${match.nombre}"`, 'info', `${usado.toFixed(2)} salió del apartado y ${excedente.toFixed(2)} del disponible.`);
      } else {
        toast(`Descontado del apartado "${match.nombre}"`, 'info', `Quedan ${restante.toFixed(2)} apartados.`);
      }
      return {
        ...t,
        apartado: {
          allocationId: match.id,
          nombre: match.nombre,
          monto: usado,
          categoryId: match.categoryId ?? null,
          recurrente: match.recurrente ?? false,
          montoObjetivo: match.montoObjetivo ?? null,
        },
      };
    };

    /** Devuelve al apartado lo que un movimiento había consumido (lo recrea si ya no existe). */
    const restoreAllocation = (t: Transaction, allocations: Allocation[]): Allocation[] => {
      const c = t.apartado;
      if (!c || c.monto <= 0) return allocations;
      const existing = allocations.find((a) => a.id === c.allocationId);
      if (existing) {
        let monto = roundMoney(existing.monto + c.monto);
        if (existing.recurrente && existing.montoObjetivo) monto = Math.min(monto, existing.montoObjetivo);
        void updateDoc(userDoc(uid, 'allocations', existing.id), { monto });
        return allocations.map((a) => (a.id === existing.id ? { ...a, monto } : a));
      }
      const recreated: Allocation = {
        id: c.allocationId,
        bankId: t.bankId,
        nombre: c.nombre,
        monto: c.monto,
        nota: 'Restaurado al editar o eliminar un gasto',
        recurringPaymentId: null,
        cicloClave: monthKey(todayISO()),
        recurrente: c.recurrente ?? false,
        montoObjetivo: c.montoObjetivo ?? null,
        categoryId: c.categoryId ?? null,
      };
      void setDoc(userDoc(uid, 'allocations', recreated.id), recreated);
      return [...allocations, recreated];
    };

    return {
      data,
      addTransaction: (input) => {
        const t: Transaction = { ...input, monto: roundMoney(input.monto) };
        if (t.tipo === 'ingreso') {
          void setDoc(userDoc(uid, 'transactions', t.id), t);
          const cicloClave = monthKey(t.fecha);
          const pending = computePendingForCycle(t.bankId, cicloClave, data.recurringPayments, data.allocations);
          const splits = splitIncomeAcrossPending(t.monto, pending);
          for (const s of splits) {
            const rp = data.recurringPayments.find((r) => r.id === s.recurringPaymentId);
            if (!rp) continue;
            const allocation: Allocation = {
              id: crypto.randomUUID(),
              bankId: t.bankId,
              nombre: rp.nombre,
              monto: s.monto,
              nota: 'Apartado automático',
              recurringPaymentId: rp.id,
              cicloClave,
              categoryId: rp.categoryId ?? null,
            };
            void setDoc(userDoc(uid, 'allocations', allocation.id), allocation);
          }
          return;
        }
        const rp = !t.transferId ? findMatchingRecurring(t, data.recurringPayments) : undefined;
        if (rp) {
          void setDoc(userDoc(uid, 'transactions', t.id), t);
          const cicloClave = monthKey(t.fecha);
          const match = data.allocations.find((a) => a.recurringPaymentId === rp.id && a.cicloClave === cicloClave);
          if (match) void deleteDoc(userDoc(uid, 'allocations', match.id));
          return;
        }
        const withConsumption = consumeAllocation(t, data.allocations);
        void setDoc(userDoc(uid, 'transactions', t.id), withConsumption);
      },
      updateTransaction: (input) => {
        const t: Transaction = { ...input, monto: roundMoney(input.monto) };
        const previous = data.transactions.find((x) => x.id === t.id);
        // Se devuelve al apartado lo que el movimiento viejo había consumido y se vuelve a calcular
        // con los datos nuevos (monto, cuenta, categoría o fecha pueden haber cambiado).
        let allocations = data.allocations;
        if (previous?.apartado) allocations = restoreAllocation(previous, allocations);
        const next = t.tipo === 'gasto' && !t.transferId ? consumeAllocation({ ...t, apartado: null }, allocations) : { ...t, apartado: null };
        void setDoc(userDoc(uid, 'transactions', t.id), next);
      },
      deleteTransaction: (id) => {
        const target = data.transactions.find((t) => t.id === id);
        if (target?.transferId) {
          for (const leg of data.transactions.filter((t) => t.transferId === target.transferId)) {
            void deleteDoc(userDoc(uid, 'transactions', leg.id));
          }
        } else {
          if (target?.apartado) restoreAllocation(target, data.allocations);
          void deleteDoc(userDoc(uid, 'transactions', id));
        }
      },
      addBank: (b) => void setDoc(userDoc(uid, 'banks', b.id), b),
      updateBank: (b) => void setDoc(userDoc(uid, 'banks', b.id), b),
      deleteBank: (id) => {
        void deleteDoc(userDoc(uid, 'banks', id));
        void deleteWhere(uid, 'transactions', 'bankId', id);
        void deleteWhere(uid, 'allocations', 'bankId', id);
      },
      addCategory: (c) => void setDoc(userDoc(uid, 'categories', c.id), c),
      updateCategory: (c) => void setDoc(userDoc(uid, 'categories', c.id), c),
      deleteCategory: (id) => {
        void deleteDoc(userDoc(uid, 'categories', id));
        void deleteWhere(uid, 'categories', 'parentId', id);
      },
      addGoal: (g) => void setDoc(userDoc(uid, 'savingsGoals', g.id), g),
      updateGoal: (g) => void setDoc(userDoc(uid, 'savingsGoals', g.id), g),
      deleteGoal: (id) => void deleteDoc(userDoc(uid, 'savingsGoals', id)),
      contributeToGoal: (goal, input) => {
        const category = resolveSavingsCategory(data.categories);
        if (!data.categories.some((c) => c.id === category.id)) {
          void setDoc(userDoc(uid, 'categories', category.id), category);
        }
        const transaction: Transaction = {
          id: crypto.randomUUID(),
          fecha: input.fecha,
          bankId: goal.bankId,
          categoryId: category.id,
          monto: input.monto,
          tipo: 'gasto',
          nota: `Aporte a meta: ${goal.nombre}${input.nota ? ` — ${input.nota}` : ''}`,
        };
        void setDoc(userDoc(uid, 'transactions', transaction.id), transaction);
        const contribution = {
          id: crypto.randomUUID(),
          fecha: input.fecha,
          monto: input.monto,
          nota: input.nota,
          transactionId: transaction.id,
        };
        void updateDoc(userDoc(uid, 'savingsGoals', goal.id), { contributions: arrayUnion(contribution) });
      },
      updateContribution: (goal, contribution, input) => {
        if (contribution.transactionId) {
          const category = resolveSavingsCategory(data.categories);
          if (!data.categories.some((c) => c.id === category.id)) {
            void setDoc(userDoc(uid, 'categories', category.id), category);
          }
          const transaction: Transaction = {
            id: contribution.transactionId,
            fecha: input.fecha,
            bankId: goal.bankId,
            categoryId: category.id,
            monto: input.monto,
            tipo: 'gasto',
            nota: `Aporte a meta: ${goal.nombre}${input.nota ? ` — ${input.nota}` : ''}`,
          };
          void setDoc(userDoc(uid, 'transactions', transaction.id), transaction);
        }
        const updatedContributions = goal.contributions.map((c) =>
          c.id === contribution.id ? { ...c, monto: input.monto, fecha: input.fecha, nota: input.nota } : c
        );
        void updateDoc(userDoc(uid, 'savingsGoals', goal.id), { contributions: updatedContributions });
      },
      deleteContribution: (goal, contributionId) => {
        const target = goal.contributions.find((c) => c.id === contributionId);
        if (target?.transactionId) void deleteDoc(userDoc(uid, 'transactions', target.transactionId));
        const updatedContributions = goal.contributions.filter((c) => c.id !== contributionId);
        void updateDoc(userDoc(uid, 'savingsGoals', goal.id), { contributions: updatedContributions });
      },
      addRecurring: (r) => void setDoc(userDoc(uid, 'recurringPayments', r.id), r),
      updateRecurring: (r) => void setDoc(userDoc(uid, 'recurringPayments', r.id), r),
      deleteRecurring: (id) => void deleteDoc(userDoc(uid, 'recurringPayments', id)),
      addAllocation: (a) => void setDoc(userDoc(uid, 'allocations', a.id), { ...a, monto: roundMoney(a.monto) }),
      updateAllocation: (a) => void setDoc(userDoc(uid, 'allocations', a.id), { ...a, monto: roundMoney(a.monto) }),
      deleteAllocation: (id) => void deleteDoc(userDoc(uid, 'allocations', id)),
      payAllocation: (a) => {
        if (a.monto <= 0) return;
        const linked = a.categoryId ? data.categories.find((c) => c.id === a.categoryId) : undefined;
        const category = linked ?? resolveCategoryByName(data.categories, a.nombre);
        if (!data.categories.some((c) => c.id === category.id)) {
          void setDoc(userDoc(uid, 'categories', category.id), category);
        }
        const transaction: Transaction = {
          id: crypto.randomUUID(),
          fecha: todayISO(),
          bankId: a.bankId,
          categoryId: category.id,
          monto: a.monto,
          tipo: 'gasto',
          nota: `Pago de apartado: ${a.nombre}`,
        };
        void setDoc(userDoc(uid, 'transactions', transaction.id), transaction);
        if (a.recurrente) {
          void updateDoc(userDoc(uid, 'allocations', a.id), { monto: 0, cicloClave: monthKey(todayISO()) });
        } else {
          void deleteDoc(userDoc(uid, 'allocations', a.id));
        }
      },
      addTransfer: (input) => {
        const category = resolveTransferCategory(data.categories);
        if (!data.categories.some((c) => c.id === category.id)) {
          void setDoc(userDoc(uid, 'categories', category.id), category);
        }
        const transferId = crypto.randomUUID();
        const salida: Transaction = {
          id: crypto.randomUUID(),
          fecha: input.fecha,
          bankId: input.origenBankId,
          categoryId: category.id,
          monto: input.monto,
          tipo: 'gasto',
          nota: input.nota,
          transferId,
        };
        const entrada: Transaction = {
          id: crypto.randomUUID(),
          fecha: input.fecha,
          bankId: input.destinoBankId,
          categoryId: category.id,
          monto: input.monto,
          tipo: 'ingreso',
          nota: input.nota,
          transferId,
        };
        void setDoc(userDoc(uid, 'transactions', salida.id), salida);
        void setDoc(userDoc(uid, 'transactions', entrada.id), entrada);
      },
      updateTransfer: (transferId, input) => {
        const legs = data.transactions.filter((t) => t.transferId === transferId);
        const salida = legs.find((t) => t.tipo === 'gasto');
        const entrada = legs.find((t) => t.tipo === 'ingreso');
        const category = resolveTransferCategory(data.categories);
        if (!data.categories.some((c) => c.id === category.id)) {
          void setDoc(userDoc(uid, 'categories', category.id), category);
        }
        if (salida) {
          const updated: Transaction = {
            ...salida,
            fecha: input.fecha,
            bankId: input.origenBankId,
            categoryId: category.id,
            monto: input.monto,
            nota: input.nota,
          };
          void setDoc(userDoc(uid, 'transactions', updated.id), updated);
        }
        if (entrada) {
          const updated: Transaction = {
            ...entrada,
            fecha: input.fecha,
            bankId: input.destinoBankId,
            categoryId: category.id,
            monto: input.monto,
            nota: input.nota,
          };
          void setDoc(userDoc(uid, 'transactions', updated.id), updated);
        }
      },
      dismissAlert: (id) => void updateDoc(metaDoc(uid), { dismissedAlertIds: arrayUnion(id) }),
      dismissAllAlerts: (ids) => {
        if (ids.length === 0) return;
        void updateDoc(metaDoc(uid), { dismissedAlertIds: arrayUnion(...ids) });
      },
      updateSettings: (s) => void setDoc(metaDoc(uid), { settings: s }, { merge: true }),
      clearAll: () =>
        void replaceAllData(uid, {
          banks: [],
          categories: [],
          transactions: [],
          savingsGoals: [],
          recurringPayments: [],
          allocations: [],
          cuts: [],
          dismissedAlertIds: [],
          settings: data.settings,
        }).catch((err) => console.error(err)),
      importData: (d) => void replaceAllData(uid, d).catch((err) => console.error(err)),
      addCut: ({ fecha, nombre, nota, saldosReales }) => {
        const previous = lastCut(data.cuts ?? []);
        const desde = previous ? previous.fecha : null;
        const preview = computeCutPreview(data.banks, data.transactions, desde, fecha);
        const cutId = crypto.randomUUID();
        const ajusteTxIds: string[] = [];
        let ajustesTotal = 0;
        let ajusteCategory: Category | null = null;

        const cuentas = preview.cuentas.map((c) => {
          const saldoReal = roundMoney(saldosReales[c.bankId] ?? c.saldoSistema);
          const ajuste = roundMoney(saldoReal - c.saldoSistema);
          if (Math.abs(ajuste) >= 0.01) {
            if (!ajusteCategory) {
              ajusteCategory = resolveCategoryByName(data.categories, ADJUSTMENT_CATEGORY_NAME);
              if (!data.categories.some((x) => x.id === ajusteCategory!.id)) {
                ajusteCategory = { ...ajusteCategory, icono: 'scale' };
                void setDoc(userDoc(uid, 'categories', ajusteCategory.id), ajusteCategory);
              }
            }
            const tx: Transaction = {
              id: crypto.randomUUID(),
              fecha,
              bankId: c.bankId,
              categoryId: ajusteCategory.id,
              monto: Math.abs(ajuste),
              tipo: ajuste > 0 ? 'ingreso' : 'gasto',
              nota: `Ajuste de corte${nombre ? ` "${nombre}"` : ''}: diferencia con el saldo real`,
              ajusteCorteId: cutId,
              apartado: null,
            };
            void setDoc(userDoc(uid, 'transactions', tx.id), tx);
            ajusteTxIds.push(tx.id);
            ajustesTotal = roundMoney(ajustesTotal + ajuste);
          }
          return { ...c, saldoReal, ajuste };
        });

        const cut: Cut = {
          id: cutId,
          fecha,
          desde,
          creadoEn: new Date().toISOString(),
          nombre: nombre.trim(),
          nota: nota.trim(),
          cuentas,
          totales: { ...preview.totales, ajustes: ajustesTotal },
          ajusteTxIds,
        };
        void setDoc(userDoc(uid, 'cuts', cut.id), cut);
      },
      deleteCut: (id) => {
        const cut = (data.cuts ?? []).find((c) => c.id === id);
        if (!cut) return;
        for (const txId of cut.ajusteTxIds) void deleteDoc(userDoc(uid, 'transactions', txId));
        void deleteDoc(userDoc(uid, 'cuts', id));
      },
    };
  }, [uid, data]);

  // Cada acción del usuario muestra un aviso breve, para que quede claro que se guardó
  const value = useMemo(() => (rawValue ? withToasts(rawValue) : null), [rawValue]);

  if (!value) return <LoadingScreen />;

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { uid, authReady } = useAuth();
  if (!authReady || !uid) return <LoadingScreen />;
  return <AppDataProviderInner uid={uid}>{children}</AppDataProviderInner>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData debe usarse dentro de AppDataProvider');
  return ctx;
}

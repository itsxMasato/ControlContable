import { arrayUnion, deleteDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type {
  Allocation,
  AppData,
  AppSettings,
  Bank,
  Category,
  Contribution,
  RecurringPayment,
  SavingsGoal,
  Transaction,
} from '../types';
import { ensureMetaDoc, metaDoc, normalizeSettings, replaceAllData, userCollection, userDoc, deleteWhere } from '../firebase/firestoreData';
import { useAuth } from './AuthContext';
import { monthKey } from '../utils/dates';
import {
  computePendingForCycle,
  detectRecurringCandidates,
  findMatchingRecurring,
  splitIncomeAcrossPending,
} from '../utils/recurringEngine';

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
  dismissAlert: (id: string) => void;
  dismissAllAlerts: (ids: string[]) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  clearAll: () => void;
  importData: (d: AppData) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--paper)',
        color: 'var(--ink-soft)',
        fontFamily: 'var(--font-serif)',
        fontSize: 16,
      }}
    >
      Cargando tu libro de gastos…
    </div>
  );
}

interface MetaDoc {
  settings: AppSettings;
  dismissedAlertIds: string[];
}

const SAVINGS_CATEGORY_NAME = 'Ahorro';

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

function AppDataProviderInner({ uid, children }: { uid: string; children: ReactNode }) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
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
            dismissedAlertIds: meta.dismissedAlertIds,
            settings: normalizeSettings(meta.settings),
          }
        : null,
    [banks, categories, transactions, savingsGoals, recurringPayments, allocations, meta]
  );

  const value: AppDataContextValue | null = useMemo(() => {
    if (!data) return null;
    return {
      data,
      addTransaction: (t) => {
        void setDoc(userDoc(uid, 'transactions', t.id), t);
        if (t.tipo === 'ingreso') {
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
            };
            void setDoc(userDoc(uid, 'allocations', allocation.id), allocation);
          }
        } else {
          const rp = findMatchingRecurring(t, data.recurringPayments);
          if (rp) {
            const cicloClave = monthKey(t.fecha);
            const match = data.allocations.find((a) => a.recurringPaymentId === rp.id && a.cicloClave === cicloClave);
            if (match) void deleteDoc(userDoc(uid, 'allocations', match.id));
          }
        }
      },
      updateTransaction: (t) => void setDoc(userDoc(uid, 'transactions', t.id), t),
      deleteTransaction: (id) => void deleteDoc(userDoc(uid, 'transactions', id)),
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
      addAllocation: (a) => void setDoc(userDoc(uid, 'allocations', a.id), a),
      updateAllocation: (a) => void setDoc(userDoc(uid, 'allocations', a.id), a),
      deleteAllocation: (id) => void deleteDoc(userDoc(uid, 'allocations', id)),
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
          dismissedAlertIds: [],
          settings: data.settings,
        }).catch((err) => console.error(err)),
      importData: (d) => void replaceAllData(uid, d).catch((err) => console.error(err)),
    };
  }, [uid, data]);

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

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
  addContribution: (goalId: string, contribution: Contribution) => void;
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
      addTransaction: (t) => void setDoc(userDoc(uid, 'transactions', t.id), t),
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
      addContribution: (goalId, contribution) =>
        void updateDoc(userDoc(uid, 'savingsGoals', goalId), { contributions: arrayUnion(contribution) }),
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

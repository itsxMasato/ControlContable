import { createContext, useContext, useState, type ReactNode } from 'react';
import { loadActiveAccount, saveActiveAccount } from '../data/storage';

interface ActiveAccountContextValue {
  activeBankId: string | null;
  setActiveBankId: (id: string | null) => void;
}

const ActiveAccountContext = createContext<ActiveAccountContextValue | null>(null);

export function ActiveAccountProvider({ children }: { children: ReactNode }) {
  const [activeBankId, setActiveBankIdState] = useState<string | null>(() => loadActiveAccount());

  const setActiveBankId = (id: string | null) => {
    setActiveBankIdState(id);
    saveActiveAccount(id);
  };

  return (
    <ActiveAccountContext.Provider value={{ activeBankId, setActiveBankId }}>
      {children}
    </ActiveAccountContext.Provider>
  );
}

export function useActiveAccount(): ActiveAccountContextValue {
  const ctx = useContext(ActiveAccountContext);
  if (!ctx) throw new Error('useActiveAccount debe usarse dentro de ActiveAccountProvider');
  return ctx;
}

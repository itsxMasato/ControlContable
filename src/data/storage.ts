const ACTIVE_ACCOUNT_KEY = 'libro-de-gastos:active-account';

export function loadActiveAccount(): string | null {
  return localStorage.getItem(ACTIVE_ACCOUNT_KEY);
}

export function saveActiveAccount(bankId: string | null): void {
  if (bankId) localStorage.setItem(ACTIVE_ACCOUNT_KEY, bankId);
  else localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
}

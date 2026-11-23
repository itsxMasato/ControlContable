export type ToastTone = 'success' | 'info' | 'error';

export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  detail?: string;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();
const lastShown = new Map<string, number>();

function emit() {
  for (const l of listeners) l(toasts);
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

/** Muestra un aviso breve. Mensajes idénticos en menos de 1 s se agrupan (ej. varias cuotas). */
export function toast(message: string, tone: ToastTone = 'success', detail?: string) {
  const now = Date.now();
  if (now - (lastShown.get(message) ?? 0) < 1000) return;
  lastShown.set(message, now);
  const item: ToastItem = { id: nextId++, message, tone, detail };
  toasts = [...toasts.slice(-2), item];
  emit();
  window.setTimeout(() => dismissToast(item.id), tone === 'error' ? 6000 : 2800);
}

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
}

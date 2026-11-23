import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { dismissToast, subscribeToasts, toast, type ToastItem } from '../../utils/toast';
import styles from './Toaster.module.css';

const ICONS = { success: CircleCheck, info: Info, error: CircleAlert };

export default function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToasts(setItems), []);

  // Las escrituras a Firestore se hacen "en segundo plano"; si alguna falla (permisos, cuota),
  // se avisa en lugar de perder el cambio en silencio.
  useEffect(() => {
    const onRejection = (e: PromiseRejectionEvent) => {
      const err = e.reason as { name?: string; code?: string; message?: string } | undefined;
      if (err?.name === 'FirebaseError') {
        toast('No se pudo guardar un cambio', 'error', err.code ?? err.message);
      }
    };
    window.addEventListener('unhandledrejection', onRejection);
    return () => window.removeEventListener('unhandledrejection', onRejection);
  }, []);

  return createPortal(
    <div className={styles.stack} aria-live="polite">
      {items.map((t) => {
        const Icon = ICONS[t.tone];
        return (
          <div key={t.id} className={`${styles.toast} ${styles[t.tone]}`} role="status">
            <Icon size={18} strokeWidth={2.2} className={styles.icon} />
            <div className={styles.body}>
              <div className={styles.message}>{t.message}</div>
              {t.detail && <div className={styles.detail}>{t.detail}</div>}
            </div>
            <button className={styles.close} onClick={() => dismissToast(t.id)} aria-label="Cerrar aviso">
              <X size={14} />
            </button>
            <span className={styles.timer} data-tone={t.tone} />
          </div>
        );
      })}
    </div>,
    document.body
  );
}

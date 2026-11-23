import { CloudCheck, CloudOff, RefreshCw } from 'lucide-react';
import { useSyncStatus } from '../../hooks/useSyncStatus';
import styles from './SyncStatus.module.css';

const LABELS = {
  offline: { text: 'Sin conexión', hint: 'Tus cambios se guardan en este dispositivo y se suben solos al volver la conexión.' },
  pending: { text: 'Sincronizando', hint: 'Subiendo tus últimos cambios a la nube…' },
  synced: { text: 'Respaldado', hint: 'Todos tus datos están guardados en la nube.' },
} as const;

export default function SyncStatus({ compact = false }: { compact?: boolean }) {
  const state = useSyncStatus();
  const { text, hint } = LABELS[state];
  const Icon = state === 'offline' ? CloudOff : state === 'pending' ? RefreshCw : CloudCheck;

  return (
    <span
      className={`${styles.pill} ${styles[state]} ${compact ? styles.compact : ''}`}
      title={hint}
      role="status"
      aria-live="polite"
      aria-label={`${text}. ${hint}`}
    >
      <Icon size={15} strokeWidth={2.1} className={state === 'pending' ? styles.spin : undefined} />
      {!compact && <span className={styles.text}>{text}</span>}
    </span>
  );
}

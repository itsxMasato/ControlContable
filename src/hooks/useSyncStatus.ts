import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { metaDoc, userCollection } from '../firebase/firestoreData';

export type SyncState = 'offline' | 'pending' | 'synced';

const COLLECTIONS = ['banks', 'categories', 'transactions', 'savingsGoals', 'recurringPayments', 'allocations'] as const;

/**
 * Estado de sincronización con la nube:
 * - offline: sin conexión — los cambios quedan guardados en el dispositivo y se suben al volver la señal.
 * - pending: hay cambios locales que todavía no confirmó el servidor.
 * - synced: todo está respaldado en la nube.
 *
 * Firestore comparte el mismo listener interno para la misma consulta, así que estos oyentes
 * de solo-metadatos no duplican lecturas.
 */
export function useSyncStatus(): SyncState {
  const { uid } = useAuth();
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    if (!uid) return;
    const flags = new Map<string, boolean>();
    const update = (key: string, value: boolean) => {
      flags.set(key, value);
      setPending([...flags.values()].some(Boolean));
    };
    const unsubs = [
      ...COLLECTIONS.map((name) =>
        onSnapshot(userCollection(uid, name), { includeMetadataChanges: true }, (snap) =>
          update(name, snap.metadata.hasPendingWrites)
        )
      ),
      onSnapshot(metaDoc(uid), { includeMetadataChanges: true }, (snap) => update('meta', snap.metadata.hasPendingWrites)),
    ];
    return () => unsubs.forEach((u) => u());
  }, [uid]);

  if (!online) return 'offline';
  return pending ? 'pending' : 'synced';
}

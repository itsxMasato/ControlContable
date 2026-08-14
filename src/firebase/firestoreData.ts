import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  type DocumentReference,
} from 'firebase/firestore';
import type { AppData, AppSettings } from '../types';
import { db } from './config';

const COLLECTIONS = ['banks', 'categories', 'transactions', 'savingsGoals', 'recurringPayments', 'allocations'] as const;
type CollectionName = (typeof COLLECTIONS)[number];

const DEFAULT_SETTINGS: AppSettings = {
  moneda: 'MXN',
  temaOscuro: false,
  colorAcento: 'dorado',
  ia: { proveedor: null, apiKey: '' },
};

/**
 * Rellena con valores por defecto cualquier campo de configuración que falte —
 * necesario para cuentas creadas antes de agregar un nuevo campo a `AppSettings`
 * (ej. `ia`, `colorAcento`), cuyo documento en Firestore quedó con la forma vieja.
 */
export function normalizeSettings(raw: Partial<AppSettings> | undefined | null): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    ia: { ...DEFAULT_SETTINGS.ia, ...(raw?.ia ?? {}) },
  };
}

export function userCollection(uid: string, name: CollectionName) {
  return collection(db, 'users', uid, name);
}

export function userDoc(uid: string, name: CollectionName, id: string) {
  return doc(db, 'users', uid, name, id);
}

export function metaDoc(uid: string) {
  return doc(db, 'users', uid, 'meta', 'appMeta');
}

type WriteOp = { type: 'set'; ref: DocumentReference; data: Record<string, unknown> } | { type: 'delete'; ref: DocumentReference };

async function commitInChunks(ops: WriteOp[], chunkSize = 400) {
  for (let i = 0; i < ops.length; i += chunkSize) {
    const batch = writeBatch(db);
    for (const op of ops.slice(i, i + chunkSize)) {
      if (op.type === 'set') batch.set(op.ref, op.data);
      else batch.delete(op.ref);
    }
    await batch.commit();
  }
}

export async function deleteWhere(uid: string, name: CollectionName, field: string, value: string) {
  const snap = await getDocs(query(userCollection(uid, name), where(field, '==', value)));
  await commitInChunks(snap.docs.map((d) => ({ type: 'delete' as const, ref: d.ref })));
}

async function writeFullAppData(uid: string, data: AppData) {
  const ops: WriteOp[] = [
    ...data.banks.map((b) => ({ type: 'set' as const, ref: userDoc(uid, 'banks', b.id), data: b as unknown as Record<string, unknown> })),
    ...data.categories.map((c) => ({ type: 'set' as const, ref: userDoc(uid, 'categories', c.id), data: c as unknown as Record<string, unknown> })),
    ...data.transactions.map((t) => ({ type: 'set' as const, ref: userDoc(uid, 'transactions', t.id), data: t as unknown as Record<string, unknown> })),
    ...data.savingsGoals.map((g) => ({ type: 'set' as const, ref: userDoc(uid, 'savingsGoals', g.id), data: g as unknown as Record<string, unknown> })),
    ...data.recurringPayments.map((r) => ({
      type: 'set' as const,
      ref: userDoc(uid, 'recurringPayments', r.id),
      data: r as unknown as Record<string, unknown>,
    })),
    ...data.allocations.map((a) => ({ type: 'set' as const, ref: userDoc(uid, 'allocations', a.id), data: a as unknown as Record<string, unknown> })),
  ];
  await commitInChunks(ops);
  const batch = writeBatch(db);
  batch.set(metaDoc(uid), { settings: data.settings, dismissedAlertIds: data.dismissedAlertIds });
  await batch.commit();
}

export async function replaceAllData(uid: string, data: AppData) {
  const deleteOps: WriteOp[] = [];
  for (const name of COLLECTIONS) {
    const snap = await getDocs(userCollection(uid, name));
    for (const d of snap.docs) deleteOps.push({ type: 'delete', ref: d.ref });
  }
  await commitInChunks(deleteOps);
  await writeFullAppData(uid, data);
}

/** Crea el documento de configuración la primera vez que un usuario entra. No siembra ningún otro dato. */
export async function ensureMetaDoc(uid: string) {
  const metaSnap = await getDoc(metaDoc(uid));
  if (metaSnap.exists()) return;
  await setMetaDefaults(uid);
}

async function setMetaDefaults(uid: string) {
  const batch = writeBatch(db);
  batch.set(metaDoc(uid), { settings: DEFAULT_SETTINGS, dismissedAlertIds: [] });
  await batch.commit();
}

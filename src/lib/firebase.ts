import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  limit,
} from 'firebase/firestore';
import { Tender, AuditLog } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const TENDERS_COLLECTION = 'tenders';
const LOGS_COLLECTION = 'auditLogs';

// Real-time Tender listener
export function subscribeToTenders(
  onData: (tenders: Tender[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, TENDERS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const tenders: Tender[] = [];
      snapshot.forEach((docSnap) => {
        tenders.push({ id: docSnap.id, ...(docSnap.data() as Omit<Tender, 'id'>) } as Tender);
      });
      onData(tenders);
    },
    (err) => {
      console.warn('Firestore tenders onSnapshot error:', err);
      if (onError) onError(err);
    }
  );
}

// Real-time AuditLog listener
export function subscribeToLogs(
  onData: (logs: AuditLog[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, LOGS_COLLECTION);
  const q = query(colRef, limit(200));
  return onSnapshot(
    q,
    (snapshot) => {
      const logs: AuditLog[] = [];
      snapshot.forEach((docSnap) => {
        logs.push({ id: docSnap.id, ...(docSnap.data() as Omit<AuditLog, 'id'>) } as AuditLog);
      });
      // Sort newest first
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onData(logs);
    },
    (err) => {
      console.warn('Firestore logs onSnapshot error:', err);
      if (onError) onError(err);
    }
  );
}

// Fetch all tenders once from Firestore
export async function getFirestoreTenders(): Promise<Tender[]> {
  try {
    const snapshot = await getDocs(collection(db, TENDERS_COLLECTION));
    const list: Tender[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Tender, 'id'>) } as Tender);
    });
    return list;
  } catch (err) {
    console.error('Failed to get firestore tenders:', err);
    return [];
  }
}

// Add/Update single tender
export async function saveFirestoreTender(tender: Tender): Promise<boolean> {
  try {
    const docRef = doc(db, TENDERS_COLLECTION, tender.id);
    await setDoc(docRef, tender, { merge: true });
    return true;
  } catch (err) {
    console.error('Firestore save tender error:', err);
    return false;
  }
}

// Delete single tender
export async function deleteFirestoreTender(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, TENDERS_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Firestore delete tender error:', err);
    return false;
  }
}

// Batch upload / sync tenders
export async function batchSaveFirestoreTenders(
  tenders: Tender[],
  mode: 'merge' | 'replace' = 'merge'
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    if (mode === 'replace') {
      const snapshot = await getDocs(collection(db, TENDERS_COLLECTION));
      const deleteBatch = writeBatch(db);
      snapshot.forEach((d) => deleteBatch.delete(d.ref));
      await deleteBatch.commit();
    }

    const CHUNK_SIZE = 400;
    for (let i = 0; i < tenders.length; i += CHUNK_SIZE) {
      const chunk = tenders.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const item of chunk) {
        if (!item.id) continue;
        const docRef = doc(db, TENDERS_COLLECTION, item.id);
        batch.set(docRef, item, { merge: mode === 'merge' });
      }
      await batch.commit();
    }

    return { success: true, count: tenders.length };
  } catch (err: any) {
    console.error('Firestore batch save error:', err);
    return { success: false, count: 0, error: err?.message || 'Failed batch save' };
  }
}

// Add Audit Log
export async function saveFirestoreLog(log: AuditLog): Promise<void> {
  try {
    const docRef = doc(db, LOGS_COLLECTION, log.id);
    await setDoc(docRef, log);
  } catch (err) {
    console.error('Firestore save log error:', err);
  }
}

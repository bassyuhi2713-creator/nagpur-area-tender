import { Tender, AuditLog } from '../types';
import {
  saveFirestoreTender,
  deleteFirestoreTender,
  batchSaveFirestoreTenders,
  saveFirestoreLog,
  getFirestoreTenders,
} from '../lib/firebase';

export async function fetchServerTenders(): Promise<Tender[] | null> {
  // Try Firestore first
  try {
    const firestoreData = await getFirestoreTenders();
    if (firestoreData && firestoreData.length > 0) {
      return firestoreData;
    }
  } catch (err) {
    console.warn('Firestore fetch failed, falling back to server API:', err);
  }

  // Fallback to local server API
  try {
    const res = await fetch(`/api/tenders?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.warn('Could not fetch tenders from server:', err);
    return null;
  }
}

export async function saveServerTender(tender: Tender): Promise<boolean> {
  let success = false;
  // 1. Save to Cloud Firestore
  try {
    const firestoreOk = await saveFirestoreTender(tender);
    if (firestoreOk) success = true;
  } catch (err) {
    console.warn('Could not save to firestore:', err);
  }

  // 2. Save to Express server backup
  try {
    const res = await fetch('/api/tenders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tender),
    });
    if (res.ok) success = true;
  } catch (err) {
    console.error('Failed to save tender to server:', err);
  }

  return success;
}

export async function batchUploadServerTenders(
  tenders: Tender[],
  mode: 'merge' | 'replace',
  user?: string,
  role?: string
): Promise<{ success: boolean; data?: Tender[]; count?: number; addedCount?: number; updatedCount?: number; message?: string }> {
  // 1. Save to Cloud Firestore
  try {
    await batchSaveFirestoreTenders(tenders, mode);
  } catch (err) {
    console.warn('Firestore batch save error:', err);
  }

  // 2. Save to Express server
  try {
    const res = await fetch('/api/tenders/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenders, mode, user, role }),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    console.error('Failed to batch upload tenders:', err);
    return { success: true, count: tenders.length, data: tenders, message: 'Saved to cloud storage' };
  }
}

export async function deleteServerTender(id: string): Promise<boolean> {
  let success = false;
  // 1. Delete from Cloud Firestore
  try {
    const firestoreOk = await deleteFirestoreTender(id);
    if (firestoreOk) success = true;
  } catch (err) {
    console.warn('Could not delete from firestore:', err);
  }

  // 2. Delete from Express server
  try {
    const res = await fetch(`/api/tenders/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) success = true;
  } catch (err) {
    console.error('Failed to delete tender from server:', err);
  }

  return success;
}

export async function fetchServerLogs(): Promise<AuditLog[] | null> {
  try {
    const res = await fetch(`/api/logs?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.warn('Could not fetch logs from server:', err);
    return null;
  }
}

export async function saveServerLog(log: AuditLog): Promise<void> {
  // 1. Save to Cloud Firestore
  try {
    await saveFirestoreLog(log);
  } catch (err) {
    console.warn('Could not save log to firestore:', err);
  }

  // 2. Save to Express server
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
  } catch (err) {
    console.error('Failed to save log to server:', err);
  }
}

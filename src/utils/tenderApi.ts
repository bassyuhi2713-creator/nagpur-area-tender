import { Tender, AuditLog } from '../types';

export async function fetchServerTenders(): Promise<Tender[] | null> {
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
  try {
    const res = await fetch('/api/tenders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tender),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to save tender to server:', err);
    return false;
  }
}

export async function batchUploadServerTenders(
  tenders: Tender[],
  mode: 'merge' | 'replace',
  user?: string,
  role?: string
): Promise<{ success: boolean; data?: Tender[]; count?: number; addedCount?: number; updatedCount?: number; message?: string }> {
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
    return { success: false, message: err?.message || 'Server connection failed' };
  }
}

export async function deleteServerTender(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/tenders/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to delete tender from server:', err);
    return false;
  }
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

export async function saveServerLog(log: Omit<AuditLog, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): Promise<void> {
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

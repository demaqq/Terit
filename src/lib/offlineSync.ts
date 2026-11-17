import { db } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

const DB_NAME = 'TeritOfflineDB';
const DB_VERSION = 1;
const STORE_OUTBOX = 'outbox';

type DbOperation = {
  id: string;
  collection: string;
  operation: 'create' | 'update' | 'delete';
  payload: any;
  timestamp: string;
  retryCount: number;
  lastError?: string;
};

const txDone = (tx: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

class OfflineSync {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
          const store = db.createObjectStore(STORE_OUTBOX, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('collection', 'collection', { unique: false });
        }
      };
    });
    return this.dbPromise;
  }

  async queueOutbox(entry: {
    localId: string;
    operation: 'create' | 'update' | 'delete';
    collection: string;
    payload: any;
  }): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(STORE_OUTBOX, 'readwrite');
    const store = tx.objectStore(STORE_OUTBOX);
    const record: DbOperation = {
      id: entry.localId,
      collection: entry.collection,
      operation: entry.operation,
      payload: entry.payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };
    store.put(record);
    await txDone(tx);
  }

  async getOutbox(): Promise<DbOperation[]> {
    const db = await this.getDB();
    const tx = db.transaction(STORE_OUTBOX, 'readonly');
    const store = tx.objectStore(STORE_OUTBOX);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromOutbox(id: string): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(STORE_OUTBOX, 'readwrite');
    const store = tx.objectStore(STORE_OUTBOX);
    store.delete(id);
    await txDone(tx);
  }

  async updateOutboxError(id: string, error: string, retryCount: number): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(STORE_OUTBOX, 'readwrite');
    const store = tx.objectStore(STORE_OUTBOX);
    const record = await new Promise<DbOperation | undefined>((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result as DbOperation | undefined);
      req.onerror = () => reject(req.error);
    });
    if (record) {
      record.lastError = error;
      record.retryCount = retryCount;
      store.put(record);
    }
    await txDone(tx);
  }

  async clearOutbox(): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(STORE_OUTBOX, 'readwrite');
    const store = tx.objectStore(STORE_OUTBOX);
    store.clear();
    await txDone(tx);
  }

  private sanitizePayload(payload: any, userId: string): any {
    if (!payload || typeof payload !== 'object') return payload;
    const strip = (val: any): any => {
      if (Array.isArray(val)) return val.map(strip).filter((v) => v !== undefined);
      if (val && typeof val === 'object') {
        const clean: Record<string, any> = {};
        for (const [k, v] of Object.entries(val)) {
          if (v !== undefined) {
            clean[k] = strip(v);
          }
        }
        return clean;
      }
      return val;
    };
    const cleaned = strip(payload);
    if (!cleaned.userId) cleaned.userId = userId;
    return cleaned;
  }

  private normalizeCollection(col: string): string {
    if (col === 'ledger_entries') return 'stock_ledger';
    if (col === 'items') return 'inventory_items';
    return col;
  }

  async syncAll(user: any): Promise<void> {
    if (!user?.uid) return;
    const outbox = await this.getOutbox();
    if (outbox.length === 0) return;

    outbox.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    for (const entry of outbox) {
      if (entry.retryCount >= 5) continue;

      try {
        const targetCollection = this.normalizeCollection(entry.collection);
        const docRef = doc(db, targetCollection, entry.id);
        if (entry.operation === 'delete') {
          await deleteDoc(docRef);
        } else {
          await setDoc(docRef, this.sanitizePayload(entry.payload, user.uid));
        }
        await this.removeFromOutbox(entry.id);
      } catch (err: any) {
        await this.updateOutboxError(entry.id, err.message, entry.retryCount + 1);
      }
    }
  }
}

export const offlineSync = new OfflineSync();

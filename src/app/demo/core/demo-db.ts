export const DB_NAME = 'bladi-credit-demo';
export const DB_VERSION = 1;

export const STORES = [
  'meta',
  'users',
  'grades',
  'teams',
  'processes',
  'steps',
  'workflows',
  'workflowProcesses',
  'workflowProcessSteps',
  'enterprises',
  'enterpriseCreditParameters',
  'enterpriseUserLinks',
  'invitations',
  'mortgageBorrowers',
  'creditRates',
  'bamParameters',
  'mourabahaParameters',
  'investmentCreditParameters',
  'activitySectors',
  'documentSuggestions',
  'demands',
  'demandComments',
  'demandAssignments',
  'demandStepInstances',
  'demandAgreedPricing',
  'documents',
  'documentRequests',
  'creditFiles',
  'installments',
  'payments',
  'earlyRepayments',
  'notifications',
  'auditLog',
] as const;

export type StoreName = (typeof STORES)[number];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: store === 'meta' ? 'key' : 'id' });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(store: StoreName, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode);
        const request = run(transaction.objectStore(store));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export function getAll<T>(store: StoreName): Promise<T[]> {
  return tx<T[]>(store, 'readonly', (s) => s.getAll() as IDBRequest<T[]>);
}

export function get<T>(store: StoreName, id: number | string): Promise<T | undefined> {
  return tx<T | undefined>(store, 'readonly', (s) => s.get(id) as IDBRequest<T | undefined>);
}

export function put<T>(store: StoreName, value: T): Promise<T> {
  return tx(store, 'readwrite', (s) => s.put(value as unknown as Record<string, unknown>)).then(() => value);
}

export function bulkPut<T>(store: StoreName, values: T[]): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(store, 'readwrite');
        const objectStore = transaction.objectStore(store);
        for (const v of values) {
          objectStore.put(v as unknown as Record<string, unknown>);
        }
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      }),
  );
}

export function remove(store: StoreName, id: number | string): Promise<void> {
  return tx(store, 'readwrite', (s) => s.delete(id)).then(() => undefined);
}

export function clearAllStores(): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORES as unknown as string[], 'readwrite');
        for (const store of STORES) {
          transaction.objectStore(store).clear();
        }
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      }),
  );
}

interface MetaEntry {
  key: string;
  value: unknown;
}

export function getMeta<T>(key: string): Promise<T | undefined> {
  return get<MetaEntry>('meta', key).then((e) => e?.value as T | undefined);
}

export function setMeta(key: string, value: unknown): Promise<void> {
  return put<MetaEntry>('meta', { key, value }).then(() => undefined);
}

export async function nextId(sequence: StoreName | string, startAfter = 0): Promise<number> {
  const seqKey = `seq:${sequence}`;
  const current = (await getMeta<number>(seqKey)) ?? startAfter;
  const next = current + 1;
  await setMeta(seqKey, next);
  return next;
}

export async function ensureSequenceAtLeast(sequence: string, value: number): Promise<void> {
  const seqKey = `seq:${sequence}`;
  const current = (await getMeta<number>(seqKey)) ?? 0;
  if (value > current) {
    await setMeta(seqKey, value);
  }
}

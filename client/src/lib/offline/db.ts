const DB_NAME = "jioplix-offline";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("outbox")) {
        const os = db.createObjectStore("outbox", { keyPath: "id" });
        os.createIndex("createdAt", "createdAt");
      }
      if (!db.objectStoreNames.contains("cache")) {
        db.createObjectStore("cache", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("kv")) {
        db.createObjectStore("kv", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function withStore<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<any>
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const req = fn(tx.objectStore(store));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
      })
  );
}

export const idb = {
  put<T>(store: string, value: T): Promise<IDBValidKey> {
    return withStore(store, "readwrite", (s) => s.put(value as any));
  },
  get<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
    return withStore<T | undefined>(store, "readonly", (s) => s.get(key));
  },
  getAll<T>(store: string): Promise<T[]> {
    return withStore<T[]>(store, "readonly", (s) => s.getAll());
  },
  count(store: string): Promise<number> {
    return withStore<number>(store, "readonly", (s) => s.count());
  },
  del(store: string, key: IDBValidKey): Promise<void> {
    return withStore<void>(store, "readwrite", (s) => s.delete(key));
  },
  clear(store: string): Promise<void> {
    return withStore<void>(store, "readwrite", (s) => s.clear());
  },
};

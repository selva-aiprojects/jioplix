import axios from "axios";
import { idb } from "./db";

export type HttpMethod = "POST" | "PUT" | "PATCH" | "DELETE";

export interface QueuedWrite {
  id: string;
  method: HttpMethod;
  url: string;
  body: any;
  headers: Record<string, string>;
  createdAt: number;
  attempts: number;
}

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function onOfflineChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `off-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function isNetworkError(err: any): boolean {
  if (!err) return false;
  return (
    !err.response ||
    err.code === "ECONNABORTED" ||
    err.code === "ERR_NETWORK" ||
    err.message === "Network Error" ||
    (typeof navigator !== "undefined" && navigator.onLine === false)
  );
}

export function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

// ─── Outbox ───────────────────────────────────────────────────────────────────
export async function enqueueWrite(write: Omit<QueuedWrite, "id" | "createdAt" | "attempts">): Promise<void> {
  const item: QueuedWrite = {
    ...write,
    id: genId(),
    createdAt: Date.now(),
    attempts: 0,
  };
  await idb.put("outbox", item);
  notify();
}

export async function getPendingCount(): Promise<number> {
  try {
    return await idb.count("outbox");
  } catch {
    return 0;
  }
}

export async function clearOutbox(): Promise<void> {
  await idb.clear("outbox");
  notify();
}

/**
 * Replays queued writes in FIFO order. Stops on the first item that still
 * fails (network / 5xx) so an earlier batch can retry cleanly later. Items
 * that fail with 4xx are dropped (permanent client errors).
 */
export async function flushOutbox(): Promise<number> {
  let items: QueuedWrite[] = [];
  try {
    items = await idb.getAll<QueuedWrite>("outbox");
  } catch {
    return 0;
  }
  items.sort((a, b) => a.createdAt - b.createdAt);

  let synced = 0;
  for (const item of items) {
    try {
      const res = await axios({
        method: item.method,
        url: item.url,
        data: item.body ?? null,
        headers: item.headers,
        timeout: 25000,
      });
      if (res.status >= 200 && res.status < 300) {
        await idb.del("outbox", item.id);
        synced++;
        continue;
      }
      if (res.status >= 400 && res.status < 500) {
        await idb.del("outbox", item.id);
        synced++;
        continue;
      }
      await idb.put("outbox", { ...item, attempts: item.attempts + 1 });
      break;
    } catch (err) {
      if (isOffline()) break;
      await idb.put("outbox", { ...item, attempts: item.attempts + 1 });
      break;
    }
  }
  notify();
  return synced;
}

// ─── GET response cache ───────────────────────────────────────────────────────
export async function cachePut(url: string, data: any): Promise<void> {
  try {
    await idb.put("cache", { key: url, data, savedAt: Date.now() });
  } catch {
    /* best-effort cache */
  }
}

export async function cacheGet<T>(url: string): Promise<T | null> {
  try {
    const hit = await idb.get<{ data: T }>("cache", url);
    return hit ? hit.data : null;
  } catch {
    return null;
  }
}

// Default cache keys are tenant-scoped so offline data from one tenant can
// never be served to another tenant sharing the same API origin.
function tenantScope(key: string): string {
  const tenant = typeof localStorage !== "undefined" ? (localStorage.getItem("activeSubdomain") || "demo") : "demo";
  return `${tenant}|${key}`;
}

// ─── Unified offline-aware request ────────────────────────────────────────────
export interface OfflineRequestCfg {
  method: HttpMethod | "GET";
  url: string;
  data?: any;
  headers?: Record<string, string>;
  cacheKey?: string;
}

export interface OfflineResult<T = any> {
  data: T;
  queued?: boolean;
  cached?: boolean;
}

/**
 * GET: tries network (caching success), falls back to IndexedDB cache when
 * offline. Writes: tries network, queues to the outbox when offline so the
 * data is replayed once connectivity returns.
 */
export async function offlineRequest<T = any>(cfg: OfflineRequestCfg): Promise<OfflineResult<T>> {
  const { method, url, data, headers, cacheKey } = cfg;
  try {
    const res = await axios({
      method,
      url,
      data: method !== "GET" ? data ?? null : undefined,
      headers,
      timeout: 15000,
    });
    if (method === "GET") void cachePut(tenantScope(cacheKey || url), res.data);
    return { data: res.data as T };
  } catch (err) {
    if (isNetworkError(err)) {
      if (method === "GET") {
        const cached = await cacheGet<T>(tenantScope(cacheKey || url));
        if (cached !== null && cached !== undefined) return { data: cached, cached: true };
      } else {
        await enqueueWrite({ method: method as HttpMethod, url, body: data ?? null, headers: headers ?? {} });
        return { data: null as any, queued: true };
      }
    }
    throw err;
  }
}

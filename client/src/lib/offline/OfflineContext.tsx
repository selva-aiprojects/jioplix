import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { flushOutbox, getPendingCount, onOfflineChange } from "./offline";

interface OfflineState {
  isOnline: boolean;
  pendingCount: number;
  syncing: boolean;
  lastSyncedAt: number | null;
  syncNow: () => Promise<void>;
}

const OfflineContext = createContext<OfflineState>({
  isOnline: true,
  pendingCount: 0,
  syncing: false,
  lastSyncedAt: null,
  syncNow: async () => {},
});

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const syncingRef = useRef(false);

  const refreshCount = useCallback(async () => {
    setPendingCount(await getPendingCount());
  }, []);

  const syncNow = useCallback(async () => {
    if (syncingRef.current || (typeof navigator !== "undefined" && !navigator.onLine)) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      const synced = await flushOutbox();
      if (synced > 0) setLastSyncedAt(Date.now());
      await refreshCount();
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [refreshCount]);

  useEffect(() => {
    void refreshCount();

    const onOnline = () => {
      setIsOnline(true);
      void syncNow();
    };
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const unsub = onOfflineChange(() => void refreshCount());

    const timer = setInterval(() => {
      if (navigator.onLine && !syncingRef.current) void syncNow();
    }, 20000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      unsub();
      clearInterval(timer);
    };
  }, [refreshCount, syncNow]);

  return (
    <OfflineContext.Provider value={{ isOnline, pendingCount, syncing, lastSyncedAt, syncNow }}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  return useContext(OfflineContext);
}

import { useOffline } from "../lib/offline/OfflineContext";

export default function OfflineIndicator() {
  const { isOnline, pendingCount, syncing, lastSyncedAt, syncNow } = useOffline();

  if (isOnline && pendingCount === 0 && !syncing) return null;

  const offline = !isOnline;
  const label = offline
    ? `Offline — ${pendingCount > 0 ? `${pendingCount} change${pendingCount > 1 ? "s" : ""} queued, ` : ""}will sync automatically`
    : pendingCount > 0
      ? `${syncing ? "Syncing" : `${pendingCount} change${pendingCount > 1 ? "s" : ""} queued`} — ${syncing ? "…" : "will sync automatically"}`
      : syncing
        ? "Syncing offline changes…"
        : "";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 18,
        right: 18,
        zIndex: 3000,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 800,
        color: "#ffffff",
        background: offline
          ? "linear-gradient(135deg, #b91c1c, #7f1d1d)"
          : "linear-gradient(135deg, #b45309, #92400e)",
        boxShadow: "0 10px 30px -6px rgba(0,0,0,0.35)",
        border: offline ? "1px solid #f87171" : "1px solid #fbbf24",
        cursor: offline || pendingCount > 0 ? "pointer" : "default",
      }}
      onClick={() => {
        if (offline) return;
        void syncNow();
      }}
      title={
        offline
          ? "No internet connection. Your work is saved locally and will sync automatically."
          : lastSyncedAt
            ? `Last synced ${new Date(lastSyncedAt).toLocaleTimeString()}`
            : "Tap to sync now"
      }
    >
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: offline ? "#fca5a5" : syncing ? "#fde68a" : "#fbbf24",
          animation: offline ? "pulseGlow 1.5s infinite" : "none",
          flexShrink: 0,
        }}
      />
      <span>{label}</span>
      {!offline && pendingCount > 0 && !syncing && (
        <span
          style={{
            background: "rgba(255,255,255,0.2)",
            padding: "3px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 900,
          }}
        >
          SYNC NOW
        </span>
      )}
    </div>
  );
}

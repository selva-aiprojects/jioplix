import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL as API_BASE } from "../../../config/api";
import { hd, getHeaders } from "./api";

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "PENDING_CUSTOMER", "ESCALATED", "RESOLVED", "CLOSED"];
const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  OPEN: { bg: "#dbeafe", fg: "#1d4ed8" },
  IN_PROGRESS: { bg: "#fef3c7", fg: "#b45309" },
  PENDING_CUSTOMER: { bg: "#ede9fe", fg: "#6d28d9" },
  ESCALATED: { bg: "#fee2e2", fg: "#b91c1c" },
  RESOLVED: { bg: "#dcfce7", fg: "#15803d" },
  CLOSED: { bg: "#f1f5f9", fg: "#64748b" },
};

const SLA_STYLE: Record<string, { bg: string; fg: string }> = {
  ON_TRACK: { bg: "#dcfce7", fg: "#15803d" },
  AT_RISK: { bg: "#fef3c7", fg: "#b45309" },
  BREACHED: { bg: "#fee2e2", fg: "#b91c1c" },
  NO_SLA: { bg: "#f1f5f9", fg: "#64748b" },
  CLOSED: { bg: "#f1f5f9", fg: "#64748b" },
};

export default function TicketList({ onOpen }: { onOpen: (id: string) => void }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [staff, setStaff] = useState<any[]>([]);
  const [reassigning, setReassigning] = useState<string | null>(null);

  const setF = (k: string, v: string) => {
    const next = { ...filters };
    if (v) next[k] = v;
    else delete next[k];
    setFilters(next);
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const q: Record<string, any> = { ...filters };
      if (search.trim()) q.search = search.trim();
      setTickets(await hd.listTickets(q));
    } catch (err) {
      console.error("Ticket list failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(fetchTickets, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/hospital/staff?limit=100`, { headers: getHeaders() });
        setStaff(Array.isArray(data) ? data : []);
      } catch (e) { console.error("Staff fetch failed:", e); }
    })();
  }, []);

  const quickReassign = async (id: string, userId: string) => {
    if (!userId) return;
    setReassigning(id);
    try {
      await hd.updateTicket(id, { assignedToUserId: userId });
      await fetchTickets();
    } catch (e) {
      console.error("Reassign failed:", e);
      alert("Failed to reassign.");
    } finally {
      setReassigning(null);
    }
  };

  const filterBar: React.CSSProperties = { padding: "10px 14px", borderRadius: "12px", border: "1px solid #e2e8f0", fontWeight: 600, background: "#fff", fontSize: "13px" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <input style={{ ...filterBar, flex: 1, minWidth: 200 }} placeholder="Search subject, ticket no, patient, description..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select style={filterBar} value={filters.status || ""} onChange={(e) => setF("status", e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <select style={filterBar} value={filters.priority || ""} onChange={(e) => setF("priority", e.target.value)}>
          <option value="">All priorities</option>
          {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={fetchTickets} style={{ padding: "10px 18px", borderRadius: "12px", background: "#0f172a", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>Refresh</button>
      </div>

      {loading && tickets.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "#64748b", fontWeight: 600 }}>Loading tickets...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {tickets.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px", background: "white", borderRadius: "20px", border: "1px dashed #e2e8f0", color: "#94a3b8", fontWeight: 600 }}>
              No tickets match the current filters.
            </div>
          )}
          {tickets.map((t) => {
            const st = STATUS_STYLE[t.status] || STATUS_STYLE.OPEN;
            const sla = SLA_STYLE[t.sla_status] || SLA_STYLE.NO_SLA;
            return (
              <div key={t.id} style={{ background: "white", borderRadius: "18px", border: "1px solid #e2e8f0", padding: "18px 20px", cursor: "pointer" }} onClick={() => onOpen(t.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "11px", fontWeight: 900, color: "#94a3b8" }}>#{t.ticket_no}</span>
                      <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "6px", fontWeight: 900, background: st.bg, color: st.fg }}>{t.status.replace(/_/g, " ")}</span>
                      <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "6px", fontWeight: 900, background: t.priority === "CRITICAL" ? "#fee2e2" : t.priority === "HIGH" ? "#ffedd5" : t.priority === "MEDIUM" ? "#fef9c3" : "#dcfce7", color: t.priority === "CRITICAL" ? "#b91c1c" : t.priority === "HIGH" ? "#c2410c" : t.priority === "MEDIUM" ? "#a16207" : "#15803d" }}>{t.priority}</span>
                      <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "6px", fontWeight: 900, background: sla.bg, color: sla.fg }}>SLA {t.sla_status.replace(/_/g, " ")}</span>
                    </div>
                    <h4 style={{ margin: "8px 0 4px", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>{t.subject}</h4>
                    <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>{t.category_name || "Uncategorized"}{t.department_name ? ` · ${t.department_name}` : ""}{t.patient_name ? ` · ${t.patient_name}` : ""}</p>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>{new Date(t.created_at).toLocaleString()}</span>
                    <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <span style={{ fontSize: "10px", color: "#94a3b8", marginBottom: "4px" }}>Assigned: {t.assigned_name || "Unassigned"}</span>
                      <select
                        value={t.assigned_user_id || ""}
                        onChange={(e) => quickReassign(t.id, e.target.value)}
                        disabled={reassigning === t.id}
                        style={{ padding: "6px 10px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: 700, background: "#fff", maxWidth: 180 }}
                      >
                        <option value="">Reassign...</option>
                        {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

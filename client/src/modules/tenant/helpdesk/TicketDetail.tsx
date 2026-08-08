import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL as API_BASE } from "../../../config/api";
import { hd, getHeaders } from "./api";

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "PENDING_CUSTOMER", "ESCALATED", "RESOLVED", "CLOSED"];

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#22c55e", MEDIUM: "#eab308", HIGH: "#f97316", CRITICAL: "#ef4444",
};

function sLAState(t: any) {
  if (!t) return { label: "—", color: "#94a3b8", pct: 0 };
  if (["RESOLVED", "CLOSED"].includes(t.status)) return { label: "Closed", color: "#10b981", pct: 100 };
  if (!t.sla_due_at) return { label: "No SLA", color: "#94a3b8", pct: 0 };
  const total = new Date(t.sla_due_at).getTime() - new Date(t.created_at).getTime();
  const elapsed = Date.now() - new Date(t.created_at).getTime();
  const pct = Math.min(100, Math.max(0, Math.round((elapsed / Math.max(total, 1)) * 100)));
  const remaining = new Date(t.sla_due_at).getTime() - Date.now();
  if (remaining < 0) return { label: "SLA BREACHED", color: "#ef4444", pct: 100 };
  if (remaining < total * 0.25) return { label: "SLA AT RISK", color: "#f59e0b", pct };
  return { label: "SLA ON TRACK", color: "#10b981", pct };
}

export default function TicketDetail({ ticketId, onBack }: { ticketId: string; onBack: () => void }) {
  const [ticket, setTicket] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [escalations, setEscalations] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [note, setNote] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [escalateReason, setEscalateReason] = useState("");
  const [showEscalate, setShowEscalate] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const t = await hd.getTicket(ticketId);
      setTicket(t);
      setNotes(Array.isArray(t.notes) ? t.notes : []);
      setEscalations(Array.isArray(t.escalations) ? t.escalations : []);
    } catch (err) {
      console.error("Ticket detail failed:", err);
    }
  };

  useEffect(() => {
    load();
  }, [ticketId]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/hospital/staff?limit=100`, { headers: getHeaders() });
        setStaff(Array.isArray(data) ? data : []);
      } catch (e) { console.error("Staff fetch failed:", e); }
    })();
  }, []);

  if (!ticket) {
    return <div style={{ padding: "60px 0", textAlign: "center", color: "#64748b", fontWeight: 600 }}>Loading ticket...</div>;
  }

  const sla = sLAState(ticket);

  const updateStatus = async (status: string) => {
    setBusy(true);
    try {
      await hd.updateTicket(ticketId, { status });
      await load();
    } catch (e) {
      console.error("Status update failed:", e);
      alert("Failed to update status.");
    } finally {
      setBusy(false);
    }
  };

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    setBusy(true);
    try {
      await hd.addNote(ticketId, note, isInternal);
      setNote("");
      await load();
    } catch (err) {
      console.error("Add note failed:", err);
      alert("Failed to add note.");
    } finally {
      setBusy(false);
    }
  };

  const doEscalate = async () => {
    setBusy(true);
    try {
      await hd.escalate(ticketId, escalateReason || "Manual escalation requested");
      setShowEscalate(false);
      setEscalateReason("");
      await load();
    } catch (e) {
      console.error("Escalate failed:", e);
      alert("Failed to escalate.");
    } finally {
      setBusy(false);
    }
  };

  const reassign = async (userId: string) => {
    if (!userId) return;
    setBusy(true);
    try {
      await hd.updateTicket(ticketId, { assignedToUserId: userId });
      await load();
    } catch (e) {
      console.error("Reassign failed:", e);
      alert("Failed to reassign.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onBack} style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "8px 14px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", color: "#334155" }}>← Back to tickets</button>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => setShowEscalate(!showEscalate)} style={{ background: "#fee2e2", border: "none", padding: "8px 16px", borderRadius: "10px", fontWeight: 800, color: "#b91c1c", cursor: "pointer" }}>Escalate</button>
          <select value={ticket.status} onChange={(e) => updateStatus(e.target.value)} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #e2e8f0", fontWeight: 700, background: "#fff" }}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>
      </div>

      {showEscalate && (
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "16px", padding: "16px" }}>
          <label style={{ fontSize: "12px", fontWeight: 800, color: "#9a3412", display: "block", marginBottom: "8px" }}>Escalation reason</label>
          <textarea rows={2} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #fed7aa", fontWeight: 600, resize: "none" }} value={escalateReason} onChange={(e) => setEscalateReason(e.target.value)} placeholder="Why is this being escalated?" />
          <button onClick={doEscalate} disabled={busy} style={{ marginTop: "10px", background: "#ea580c", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Confirm Escalation (Lv {Math.min((ticket.escalation_level || 0) + 1, 3)})</button>
        </div>
      )}

      <div style={{ background: "white", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
          <div>
            <span style={{ fontSize: "12px", fontWeight: 900, color: "#94a3b8" }}>#{ticket.ticket_no}</span>
            <h2 style={{ margin: "4px 0 8px", fontSize: "24px", fontWeight: 900, color: "#0f172a" }}>{ticket.subject}</h2>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "10px", padding: "4px 10px", borderRadius: "8px", fontWeight: 900, background: "#dbeafe", color: "#1d4ed8" }}>{ticket.status.replace(/_/g, " ")}</span>
              <span style={{ fontSize: "10px", padding: "4px 10px", borderRadius: "8px", fontWeight: 900, background: `${PRIORITY_COLORS[ticket.priority] || "#94a3b8"}22`, color: PRIORITY_COLORS[ticket.priority] || "#64748b" }}>{ticket.priority}</span>
              <span style={{ fontSize: "10px", padding: "4px 10px", borderRadius: "8px", fontWeight: 900, background: "#f1f5f9", color: "#475569" }}>{ticket.category_name || "Uncategorized"}</span>
              {ticket.department_name && <span style={{ fontSize: "10px", padding: "4px 10px", borderRadius: "8px", fontWeight: 900, background: "#f1f5f9", color: "#475569" }}>Dept: {ticket.department_name}</span>}
              {ticket.patient_name && <span style={{ fontSize: "10px", padding: "4px 10px", borderRadius: "8px", fontWeight: 900, background: "#ecfdf5", color: "#047857" }}>Patient: {ticket.patient_name}</span>}
              {ticket.assigned_name && <span style={{ fontSize: "10px", padding: "4px 10px", borderRadius: "8px", fontWeight: 900, background: "#e0e7ff", color: "#4338ca" }}>→ {ticket.assigned_name}</span>}
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: "12px", color: "#94a3b8", whiteSpace: "nowrap" }}>
            <p style={{ margin: 0 }}>Created {new Date(ticket.created_at).toLocaleString()}</p>
            {ticket.resolved_at && <p style={{ margin: "4px 0 0" }}>Resolved {new Date(ticket.resolved_at).toLocaleString()}</p>}
            <p style={{ margin: "4px 0 0" }}>Reported by {ticket.reported_name || "—"}</p>
          </div>
        </div>

        <div style={{ marginTop: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
            <span style={{ color: sla.color }}>{sla.label}</span>
            <span style={{ color: "#94a3b8" }}>Due {ticket.sla_due_at ? new Date(ticket.sla_due_at).toLocaleString() : "—"}</span>
          </div>
          <div style={{ height: 10, background: "#f1f5f9", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${sla.pct}%`, background: sla.color, borderRadius: 8, transition: "width 0.4s" }} />
          </div>
        </div>

        {ticket.description && (
          <div style={{ marginTop: "20px", background: "var(--app-bg, #f8fafc)", padding: "16px", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
            <p style={{ margin: 0, fontSize: "14px", color: "#475569", whiteSpace: "pre-wrap" }}>{ticket.description}</p>
          </div>
        )}

        <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>Reassign:</span>
          <select value={ticket.assigned_user_id || ""} onChange={(e) => reassign(e.target.value)} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #e2e8f0", fontWeight: 700, background: "#fff" }}>
            <option value="">Unassigned</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "16px" }}>
        <div style={{ background: "white", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "20px" }}>
          <h4 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>Ticket Thread</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
            {notes.length === 0 && <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>No notes yet. Add a reply or internal note below.</p>}
            {notes.map((n) => (
              <div key={n.id} style={{ background: n.is_internal ? "#fffbeb" : "#eff6ff", border: `1px solid ${n.is_internal ? "#fde68a" : "#dbeafe"}`, borderRadius: "14px", padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 900, color: n.is_internal ? "#92400e" : "#1d4ed8" }}>{n.user_name || "User"} {n.is_internal ? "· INTERNAL" : "· REPLY"}</span>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>{new Date(n.created_at).toLocaleString()}</span>
                </div>
                <p style={{ margin: 0, fontSize: "14px", color: "#334155", whiteSpace: "pre-wrap" }}>{n.body}</p>
              </div>
            ))}
          </div>

          <form onSubmit={addNote} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <textarea rows={3} required style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0", resize: "none", fontWeight: 600 }} placeholder="Type a reply or internal note..." value={note} onChange={(e) => setNote(e.target.value)} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700, color: "#475569" }}>
                <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} /> Internal note (hidden from patient)
              </label>
              <button type="submit" disabled={busy} style={{ background: "#0f172a", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "12px", fontWeight: 800, cursor: "pointer" }}>Add Note</button>
            </div>
          </form>
        </div>

        <div style={{ background: "white", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "20px" }}>
          <h4 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>Escalation Timeline</h4>
          {escalations.length === 0 && <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>No escalations. Level {(ticket.escalation_level || 0)}/3.</p>}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {escalations.map((e, i) => (
              <div key={e.id} style={{ position: "relative", paddingLeft: "24px", paddingBottom: "18px" }}>
                {i < escalations.length - 1 && <div style={{ position: "absolute", left: "5px", top: "12px", bottom: 0, width: 2, background: "#e2e8f0" }} />}
                <div style={{ position: "absolute", left: 0, top: 4, width: 12, height: 12, borderRadius: "50%", background: i === escalations.length - 1 ? "#ef4444" : "#f59e0b" }} />
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#334155" }}>Escalated to Level {e.to_level}</p>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>{e.assigned_to_name || "Admin"}{e.reason ? ` — ${e.reason}` : ""}</p>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#94a3b8" }}>{new Date(e.triggered_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

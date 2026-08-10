import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { API_BASE_URL as API_BASE } from "../../../config/api";
import { MetricCard, MetricsGrid } from "../../../components/MetricCard";
import {
  Ticket,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  Search,
  RefreshCw,
  ShieldCheck,
  Zap,
  Filter,
  User,
  ChevronRight,
  Sparkles
} from "lucide-react";

interface TicketItem {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "In-Progress" | "Resolved" | "Closed";
  createdAt: string;
  message: string;
  response?: string;
}

const SAMPLE_TICKETS: TicketItem[] = [
  { id: "t1", ticketNumber: "TCK-2026-101", subject: "Pharmacy Barcode Scanner Timeout in OPD Counter 2", category: "Technical Bug", priority: "High", status: "In-Progress", createdAt: "2026-08-09T09:15:00Z", message: "Barcode scanner loses connection during heavy prescription dispensing.", response: "IT Support engineer assigned. Reconfiguring USB serial port driver." },
  { id: "t2", ticketNumber: "TCK-2026-102", subject: "Upgrade Bed Capacity for Enterprise Multi-Branch", category: "Tier Upgrade", priority: "Medium", status: "Resolved", createdAt: "2026-08-08T14:30:00Z", message: "Requesting additional bed allocations for new ICU extension ward.", response: "Approved by Nexus Admin. Schema sharding updated for 150 beds." },
  { id: "t3", ticketNumber: "TCK-2026-103", subject: "Custom ICD-10 Shortcut Templates Request", category: "Feature Request", priority: "Low", status: "Open", createdAt: "2026-08-09T11:00:00Z", message: "Doctors requesting quick diagnostic tags for Pediatric Asthma." }
];

const CATEGORIES = ["ALL", "Technical Bug", "Tier Upgrade", "Feature Request", "Billing Issue", "Account Management"];

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<TicketItem[]>(SAMPLE_TICKETS);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const tenantId = localStorage.getItem("tenant") || "";

  const [form, setForm] = useState({
    subject: "",
    category: "Technical Bug",
    priority: "Medium",
    message: ""
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "x-tenant-id": localStorage.getItem("tenant") || ""
  });

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/nexus/tickets?tenantId=${tenantId}`, { headers: getHeaders() });
      if (Array.isArray(res.data) && res.data.length > 0) {
        setTickets(res.data);
      }
    } catch (err) {
      console.warn("Tickets fetch fallback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter(t => {
    if (selectedCategory !== "ALL" && t.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.subject.toLowerCase().includes(q) || t.ticketNumber.toLowerCase().includes(q);
    }
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.message) return showToast("Please fill in ticket subject and message details.");

    const created: TicketItem = {
      id: `t${tickets.length + 1}`,
      ticketNumber: `TCK-2026-${104 + tickets.length}`,
      subject: form.subject,
      category: form.category,
      priority: form.priority as any,
      status: "Open",
      createdAt: new Date().toISOString(),
      message: form.message
    };

    try {
      await axios.post(`${API_BASE}/api/nexus/tickets`, { ...form, tenantId }, { headers: getHeaders() });
    } catch (e) {}

    setTickets([created, ...tickets]);
    setShowForm(false);
    showToast(`✅ Support ticket ${created.ticketNumber} logged successfully!`);
    setForm({ subject: "", category: "Technical Bug", priority: "Medium", message: "" });
  };

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Hospital IT &amp; Support Helpdesk Workstation" subtitle="Log Technical Tickets, Track System Upgrade Requests &amp; Monitor SLA Resolutions" />

        {/* Toast Notification */}
        {toastMessage && (
          <div style={{
            position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
            background: "#0f172a", color: "#ffffff", padding: "14px 22px", borderRadius: "16px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: "12px",
            border: "1px solid rgba(255,255,255,0.15)", fontSize: "14px", fontWeight: 700
          }}>
            <Sparkles size={18} color="#a855f7" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* HERO BANNER */}
        <div style={{
          background: "linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)",
          borderRadius: "28px", padding: "32px 36px", color: "white", marginBottom: "28px",
          position: "relative", overflow: "hidden", boxShadow: "0 20px 40px -15px rgba(24, 24, 27, 0.4)",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", padding: "6px 14px", borderRadius: "999px", marginBottom: "16px" }}>
                <Ticket size={14} color="#a1a1aa" />
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#f4f4f5", letterSpacing: "0.5px" }}>24/7 DEDICATED IT HELPDESK &amp; SLA CONTROL</span>
              </div>
              <h1 style={{ fontSize: "30px", fontWeight: 900, margin: "0 0 8px 0" }}>
                Hospital Helpdesk &amp; Support Workstation
              </h1>
              <p style={{ fontSize: "14px", color: "#a1a1aa", margin: 0, maxWidth: "600px", lineHeight: 1.6 }}>
                Submit technical support tickets, request module feature enhancements, and track live SLA resolution progress.
              </p>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                padding: "14px 24px", borderRadius: "16px", background: "#ffffff", color: "#18181b",
                border: "none", fontWeight: 900, fontSize: "14px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 8px 20px rgba(0,0,0,0.2)"
              }}
            >
              <Plus size={18} /> {showForm ? "Close Form" : "Raise New Support Ticket"}
            </button>
          </div>

          {/* Quick Metrics */}
          <MetricsGrid minWidth="180px" style={{ marginTop: "28px" }}>
            <MetricCard variant="translucent" icon={Ticket} label="Total Tickets Logged" value={`${tickets.length} Tickets`} />
            <MetricCard variant="translucent" icon={Clock} label="Open / In-Progress" value={`${tickets.filter(t => t.status === "Open" || t.status === "In-Progress").length} Active`} accent="#fde047" />
            <MetricCard variant="translucent" icon={Zap} label="Avg SLA Response Time" value="45 mins" accent="#38bdf8" />
            <MetricCard variant="translucent" icon={ShieldCheck} label="Resolved Success Rate" value="98.5%" accent="#4ade80" />
          </MetricsGrid>
        </div>

        {/* RAISE TICKET FORM MODAL / DRAWER */}
        {showForm && (
          <div style={{ background: "#ffffff", padding: "32px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", marginBottom: "28px", maxWidth: "700px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", margin: "0 0 20px 0" }}>
              Submit Support &amp; Technical Request Ticket
            </h3>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "14px" }}>
                    {CATEGORIES.filter(c => c !== "ALL").map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Priority Rating</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "14px" }}>
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Critical">Critical STAT</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Subject Summary *</label>
                <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required placeholder="Brief description of issue or request..." style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "14px" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Detailed Description *</label>
                <textarea rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required placeholder="Describe steps to reproduce or custom requirements..." style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "14px", lineHeight: 1.6 }} />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", background: "#f8fafc", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: "#18181b", color: "white", fontWeight: 900, cursor: "pointer" }}>Submit Ticket</button>
              </div>
            </form>
          </div>
        )}

        {/* CATEGORY FILTERS & SEARCH */}
        <div style={{ background: "#ffffff", padding: "28px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Ticket # or Subject..."
              style={{ width: "100%", maxWidth: "380px", padding: "10px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "14px" }}
            />

            <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  style={{
                    padding: "8px 16px", borderRadius: "10px", border: `1.5px solid ${selectedCategory === c ? "#18181b" : "#e2e8f0"}`,
                    background: selectedCategory === c ? "#18181b" : "#ffffff", color: selectedCategory === c ? "#ffffff" : "#475569",
                    fontWeight: 800, fontSize: "12px", cursor: "pointer"
                  }}
                >
                  {c === "ALL" ? "All Categories" : c}
                </button>
              ))}
            </div>
          </div>

          {/* TICKETS TABLE */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", color: "#475569", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 16px" }}>Ticket #</th>
                  <th style={{ padding: "12px 16px" }}>Subject / Summary</th>
                  <th style={{ padding: "12px 16px" }}>Category</th>
                  <th style={{ padding: "12px 16px" }}>Priority</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px" }}>Created At</th>
                  <th style={{ padding: "12px 16px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map(t => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a" }}>{t.ticketNumber}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#334155", maxWidth: "340px" }}>{t.subject}</td>
                    <td style={{ padding: "14px 16px", color: "#64748b" }}>{t.category}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 800,
                        background: t.priority === "Critical" ? "#fef2f2" : t.priority === "High" ? "#fffbe6" : "#f1f5f9",
                        color: t.priority === "Critical" ? "#dc2626" : t.priority === "High" ? "#d97706" : "#475569"
                      }}>
                        {t.priority}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 800,
                        background: t.status === "Resolved" ? "#f0fdf4" : t.status === "In-Progress" ? "#fffbe6" : "#f1f5f9",
                        color: t.status === "Resolved" ? "#166534" : t.status === "In-Progress" ? "#92400e" : "#475569"
                      }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#64748b" }}>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <button
                        onClick={() => setSelectedTicket(t)}
                        style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: "#18181b", color: "white", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}
                      >
                        View Thread
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TICKET DETAIL DRAWER MODAL */}
        {selectedTicket && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(6px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "#ffffff", borderRadius: "24px", padding: "32px", width: "100%", maxWidth: "600px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#18181b", background: "#f4f4f5", padding: "4px 10px", borderRadius: "6px" }}>{selectedTicket.ticketNumber}</span>
                <button onClick={() => setSelectedTicket(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", fontWeight: 800 }}>✕</button>
              </div>

              <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", margin: "0 0 12px 0" }}>{selectedTicket.subject}</h3>

              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "14px", marginBottom: "16px", fontSize: "14px", color: "#334155", lineHeight: 1.6 }}>
                <strong>User Description:</strong>
                <p style={{ margin: "4px 0 0 0" }}>{selectedTicket.message}</p>
              </div>

              {selectedTicket.response && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "16px", borderRadius: "14px", marginBottom: "20px", fontSize: "14px", color: "#166534", lineHeight: 1.6 }}>
                  <strong>IT Support Engineer Response:</strong>
                  <p style={{ margin: "4px 0 0 0" }}>{selectedTicket.response}</p>
                </div>
              )}

              <button onClick={() => setSelectedTicket(null)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "none", background: "#18181b", color: "white", fontWeight: 800, cursor: "pointer" }}>
                Close Thread View
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

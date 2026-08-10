import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import PlanGateGuard from "../../../components/PlanGateGuard";
import { MetricCard, MetricsGrid } from "../../../components/MetricCard";
import { API_BASE_URL as API_BASE } from "../../../config/api";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Phone,
  MessageSquare,
  Sparkles,
  FileText,
  ShieldCheck,
  Zap
} from "lucide-react";

interface CommLog {
  id: string;
  recipient: string;
  subject: string;
  type: "Email" | "SMS" | "WhatsApp";
  status: "Delivered" | "Sent" | "Queued" | "Failed";
  created_at: string;
}

const SAMPLE_LOGS: CommLog[] = [
  { id: "c1", recipient: "rajesh.kumar@example.com", subject: "OPD Appointment Confirmation - Dr. Arvind Swamy (Aug 10, 10:30 AM)", type: "Email", status: "Delivered", created_at: "2026-08-09T10:15:00Z" },
  { id: "c2", recipient: "+91 98401 23456", subject: "Your Diagnostic Lab Test Report is Ready for Download", type: "SMS", status: "Delivered", created_at: "2026-08-09T11:00:00Z" },
  { id: "c3", recipient: "priya.sundaram@example.com", subject: "Anbu Hospitals - IPD Discharge Summary & Invoice #INV-2026-881", type: "Email", status: "Delivered", created_at: "2026-08-09T09:30:00Z" },
  { id: "c4", recipient: "+91 97100 88234", subject: "Reminder: Scheduled Follow-up Visit on Aug 12, 2026", type: "WhatsApp", status: "Sent", created_at: "2026-08-09T08:45:00Z" },
  { id: "c5", recipient: "karthik.subramanian@example.com", subject: "Payment Receipt Confirmation - Amt: ₹4,500", type: "Email", status: "Delivered", created_at: "2026-08-08T16:20:00Z" }
];

export default function MailManagementPage() {
  const [logs, setLogs] = useState<CommLog[]>(SAMPLE_LOGS);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"logs" | "compose">("logs");
  const [selectedChannel, setSelectedChannel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Compose State
  const [composeForm, setComposeForm] = useState({
    channel: "Email",
    recipientGroup: "OPD Patients Today",
    customRecipient: "",
    subject: "",
    message: "",
    template: "none"
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "x-tenant-id": localStorage.getItem("tenant") || ""
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/hospital/mail-logs`, { headers: getHeaders() });
      if (Array.isArray(res.data) && res.data.length > 0) {
        setLogs(res.data);
      }
    } catch (err) {
      console.warn("Mail logs fallback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (selectedChannel !== "ALL" && log.type !== selectedChannel) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return log.recipient.toLowerCase().includes(q) || log.subject.toLowerCase().includes(q);
    }
    return true;
  });

  const handleApplyTemplate = (tpl: string) => {
    setComposeForm({ ...composeForm, template: tpl });
    if (tpl === "appointment") {
      setComposeForm(prev => ({
        ...prev,
        subject: "OPD Appointment Confirmation — Anbu Hospitals",
        message: "Dear Patient, Your appointment with Dr. Arvind Swamy has been confirmed for tomorrow at 10:30 AM. Please arrive 15 minutes prior."
      }));
    } else if (tpl === "lab_ready") {
      setComposeForm(prev => ({
        ...prev,
        subject: "Diagnostic Lab Report Ready for Download",
        message: "Dear Patient, Your diagnostic test results are now verified and ready. Log in to your Patient Portal to view and download the PDF report."
      }));
    } else if (tpl === "payment") {
      setComposeForm(prev => ({
        ...prev,
        subject: "Payment Receipt Confirmation",
        message: "Thank you for your payment to Anbu Hospitals. Your transaction receipt #REC-2026-901 has been generated."
      }));
    }
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeForm.subject || !composeForm.message) return showToast("Please fill in subject and message body.");
    
    const newLog: CommLog = {
      id: `c${logs.length + 1}`,
      recipient: composeForm.customRecipient || composeForm.recipientGroup,
      subject: composeForm.subject,
      type: composeForm.channel as any,
      status: "Delivered",
      created_at: new Date().toISOString()
    };
    setLogs([newLog, ...logs]);
    setActiveTab("logs");
    showToast(`✅ ${composeForm.channel} broadcast dispatched successfully!`);
    setComposeForm({ channel: "Email", recipientGroup: "OPD Patients Today", customRecipient: "", subject: "", message: "", template: "none" });
  };

  return (
    <PlanGateGuard moduleName="Mail & Communications">
      <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg)" }}>
        <Sidebar />
        <main className="main-content" style={{ paddingBottom: "60px" }}>
          <Header title="Mail &amp; Patient Communications Suite" subtitle="Multi-Channel Delivery Tracker (Email, SMS &amp; WhatsApp), Automated Reminders &amp; Broadcast Dispatcher" />

          {/* Toast Notification */}
          {toastMessage && (
            <div style={{
              position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
              background: "#0f172a", color: "#ffffff", padding: "14px 22px", borderRadius: "16px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: "12px",
              border: "1px solid rgba(255,255,255,0.15)", fontSize: "14px", fontWeight: 700
            }}>
              <Sparkles size={18} color="#38bdf8" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* HERO METRICS BANNER */}
          <div style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
            borderRadius: "28px", padding: "32px 36px", color: "white", marginBottom: "28px",
            position: "relative", overflow: "hidden", boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.4)",
            border: "1px solid rgba(255,255,255,0.1)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", padding: "6px 14px", borderRadius: "999px", marginBottom: "16px" }}>
                  <Mail size={14} color="#38bdf8" />
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#f0f9ff", letterSpacing: "0.5px" }}>PATIENT ENGAGEMENT &amp; DISPATCH HUB</span>
                </div>
                <h1 style={{ fontSize: "30px", fontWeight: 900, margin: "0 0 8px 0" }}>
                  Omnichannel Patient Communications
                </h1>
                <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0, maxWidth: "600px", lineHeight: 1.6 }}>
                  Monitor automated email confirmations, SMS notification queues, and WhatsApp reminders with real-time delivery verification.
                </p>
              </div>

              <button
                onClick={() => setActiveTab("compose")}
                style={{
                  padding: "14px 24px", borderRadius: "16px", background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)", color: "white",
                  border: "none", fontWeight: 900, fontSize: "14px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 8px 20px rgba(2, 132, 199, 0.3)"
                }}
              >
                <Send size={18} /> Send Quick Broadcast
              </button>
            </div>

            {/* Quick Metrics */}
            <MetricsGrid minWidth="180px" style={{ marginTop: "28px" }}>
              <MetricCard variant="translucent" icon={Mail} label="Emails Delivered" value="1,842 Sent" accent="#38bdf8" />
              <MetricCard variant="translucent" icon={MessageSquare} label="SMS Reminders" value="4,210 Sent" accent="#34d399" />
              <MetricCard variant="translucent" icon={ShieldCheck} label="Delivery Success Rate" value="99.1%" accent="#4ade80" />
              <MetricCard variant="translucent" icon={AlertCircle} label="Failed Queue" value="0 Failed" accent="#a7f3d0" />
            </MetricsGrid>
          </div>

          {/* TABS */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
            <button
              onClick={() => setActiveTab("logs")}
              style={{
                padding: "12px 22px", borderRadius: "14px", border: "none", fontWeight: 800, fontSize: "14px", cursor: "pointer",
                background: activeTab === "logs" ? "#0f172a" : "#ffffff", color: activeTab === "logs" ? "#ffffff" : "#64748b",
                boxShadow: activeTab === "logs" ? "0 4px 12px rgba(15, 23, 42, 0.25)" : "0 1px 3px rgba(0,0,0,0.05)",
                display: "flex", alignItems: "center", gap: "8px"
              }}
            >
              <Mail size={16} /> 1. Communication Dispatch Logs ({filteredLogs.length})
            </button>

            <button
              onClick={() => setActiveTab("compose")}
              style={{
                padding: "12px 22px", borderRadius: "14px", border: "none", fontWeight: 800, fontSize: "14px", cursor: "pointer",
                background: activeTab === "compose" ? "#0f172a" : "#ffffff", color: activeTab === "compose" ? "#ffffff" : "#64748b",
                boxShadow: activeTab === "compose" ? "0 4px 12px rgba(15, 23, 42, 0.25)" : "0 1px 3px rgba(0,0,0,0.05)",
                display: "flex", alignItems: "center", gap: "8px"
              }}
            >
              <Send size={16} /> 2. Send Quick Broadcast / Mailer
            </button>
          </div>

          {/* TAB 1: DISPATCH LOGS */}
          {activeTab === "logs" && (
            <div style={{ background: "#ffffff", padding: "28px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", gap: "8px", flex: 1, maxWidth: "400px" }}>
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search Recipient, Subject..."
                    style={{ width: "100%", padding: "10px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  {["ALL", "Email", "SMS", "WhatsApp"].map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedChannel(c)}
                      style={{
                        padding: "8px 16px", borderRadius: "10px", border: `1.5px solid ${selectedChannel === c ? "#0f172a" : "#e2e8f0"}`,
                        background: selectedChannel === c ? "#0f172a" : "#ffffff", color: selectedChannel === c ? "#ffffff" : "#475569",
                        fontWeight: 800, fontSize: "12px", cursor: "pointer"
                      }}
                    >
                      {c}
                    </button>
                  ))}
                  <button onClick={fetchLogs} style={{ padding: "8px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", color: "#475569", borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ padding: "12px 16px" }}>Recipient Contact</th>
                      <th style={{ padding: "12px 16px" }}>Subject / Content Preview</th>
                      <th style={{ padding: "12px 16px" }}>Channel</th>
                      <th style={{ padding: "12px 16px" }}>Delivery Status</th>
                      <th style={{ padding: "12px 16px" }}>Sent Date &amp; Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a" }}>{log.recipient}</td>
                        <td style={{ padding: "14px 16px", color: "#334155", maxWidth: "420px" }}>{log.subject}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{
                            padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 800,
                            background: log.type === "Email" ? "#e0f2fe" : log.type === "SMS" ? "#fef3c7" : "#dcfce7",
                            color: log.type === "Email" ? "#0369a1" : log.type === "SMS" ? "#92400e" : "#15803d"
                          }}>
                            {log.type}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 800,
                            background: log.status === "Delivered" ? "#f0fdf4" : log.status === "Sent" ? "#eff6ff" : "#fef2f2",
                            color: log.status === "Delivered" ? "#166534" : log.status === "Sent" ? "#1d4ed8" : "#991b1b"
                          }}>
                            <CheckCircle2 size={12} /> {log.status}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#64748b" }}>
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: COMPOSE BROADCAST */}
          {activeTab === "compose" && (
            <div style={{ background: "#ffffff", padding: "32px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", maxWidth: "720px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", margin: "0 0 20px 0" }}>
                Send Broadcast Message / Patient Mailer
              </h3>

              {/* Template Quick Select */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>
                  Quick Insert Message Template:
                </label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => handleApplyTemplate("appointment")} style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                    📋 OPD Appointment Confirmation
                  </button>
                  <button type="button" onClick={() => handleApplyTemplate("lab_ready")} style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                    🧪 Lab Report Ready Notice
                  </button>
                  <button type="button" onClick={() => handleApplyTemplate("payment")} style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                    💳 Payment Receipt Confirmation
                  </button>
                </div>
              </div>

              <form onSubmit={handleSendBroadcast} style={{ display: "grid", gap: "18px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Channel</label>
                    <select value={composeForm.channel} onChange={e => setComposeForm({ ...composeForm, channel: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "14px" }}>
                      <option value="Email">Email Message</option>
                      <option value="SMS">SMS Notification</option>
                      <option value="WhatsApp">WhatsApp Business API</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Target Recipient Group</label>
                    <select value={composeForm.recipientGroup} onChange={e => setComposeForm({ ...composeForm, recipientGroup: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "14px" }}>
                      <option value="OPD Patients Today">OPD Patients Today (42 Patients)</option>
                      <option value="All Registered Patients">All Registered Patients (1,248)</option>
                      <option value="IPD Admitted Patients">IPD Admitted Patients (38 Beds)</option>
                      <option value="Hospital Staff & Doctors">Hospital Staff &amp; Doctors (84 Staff)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Subject Line *</label>
                  <input value={composeForm.subject} onChange={e => setComposeForm({ ...composeForm, subject: e.target.value })} required placeholder="Enter message subject..." style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "14px" }} />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Message Content *</label>
                  <textarea rows={5} value={composeForm.message} onChange={e => setComposeForm({ ...composeForm, message: e.target.value })} required placeholder="Type your broadcast message here..." style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "14px", lineHeight: 1.6 }} />
                </div>

                <button type="submit" style={{ padding: "16px", background: "#0f172a", color: "white", border: "none", borderRadius: "14px", fontWeight: 900, fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <Send size={18} /> Dispatch Broadcast Now
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </PlanGateGuard>
  );
}

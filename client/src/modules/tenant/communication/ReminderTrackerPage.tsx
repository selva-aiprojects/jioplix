import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import PlanGateGuard from "../../../components/PlanGateGuard";
import { useToast } from "../../../components/ToastProvider";
import { API_BASE_URL as API_BASE } from "../../../config/api";
import { Bell, Send, CalendarClock, AlertTriangle } from "lucide-react";
import { MetricCard, MetricsGrid } from "../../../components/MetricCard";

interface ReminderLog {
  timestamp: string;
  status: string;
  note: string;
}

interface Reminder {
  id: string;
  patientId: string;
  patientName: string;
  phone: string;
  type: string;
  appointmentDate: string;
  scheduledTime: string;
  doctorName: string;
  department: string;
  status: "SCHEDULED" | "SENT" | "DELIVERED" | "FAILED";
  whatsappTemplate: string;
  lastSentAt: string | null;
  messageBody: string;
  logs: ReminderLog[];
}

const Icons = {
  WhatsApp: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Send: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Clock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
};

export default function ReminderTrackerPage() {
  const { showToast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  
  // Modal State for New Reminder
  const [showModal, setShowModal] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newType, setNewType] = useState("OPD_FOLLOWUP");
  const [newDate, setNewDate] = useState("");
  const [newDoctor, setNewDoctor] = useState("Dr. Sarah Jenkins");
  const [newMsg, setNewMsg] = useState("");

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/reminders`, {
        params: { status: statusFilter, type: typeFilter, search: searchQuery },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "x-tenant-id": localStorage.getItem("tenant") || ""
        }
      });
      if (res.data.success) {
        setReminders(res.data.reminders);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch WhatsApp reminders. Using cached view.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [statusFilter, typeFilter, searchQuery]);

  const handleSendInstant = async (id: string, name: string) => {
    setSendingId(id);
    try {
      const res = await axios.post(`${API_BASE}/api/reminders/send`, { reminderId: id }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "x-tenant-id": localStorage.getItem("tenant") || ""
        }
      });
      if (res.data.success) {
        showToast(`WhatsApp reminder dispatched to ${name}`, "success");
        fetchReminders();
      }
    } catch (err) {
      showToast("Failed to send WhatsApp message. Please check API gateway.", "error");
    } finally {
      setSendingId(null);
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim() || !newPhone.trim()) {
      showToast("Please enter patient name and phone number.", "error");
      return;
    }
    try {
      const res = await axios.post(`${API_BASE}/api/reminders`, {
        patientName: newPatientName,
        phone: newPhone,
        type: newType,
        appointmentDate: newDate || new Date().toISOString().split('T')[0],
        doctorName: newDoctor,
        messageBody: newMsg
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "x-tenant-id": localStorage.getItem("tenant") || ""
        }
      });
      if (res.data.success) {
        showToast("New WhatsApp follow-up reminder scheduled successfully!", "success");
        setShowModal(false);
        setNewPatientName("");
        setNewPhone("");
        setNewMsg("");
        fetchReminders();
      }
    } catch (err) {
      showToast("Error creating reminder", "error");
    }
  };

  // Metric aggregates
  const total = reminders.length;
  const sentCount = reminders.filter(r => r.status === "SENT" || r.status === "DELIVERED").length;
  const scheduledCount = reminders.filter(r => r.status === "SCHEDULED").length;
  const failedCount = reminders.filter(r => r.status === "FAILED").length;
  const deliveryRate = total > 0 ? Math.round((sentCount / total) * 100) : 100;

  return (
    <PlanGateGuard moduleName="Executive Follow-up & Reminders">
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
        <Header title="Executive Follow-up & WhatsApp Automation Center" />

        {/* Top Summary Metrics */}
        <MetricsGrid minWidth="220px">
          <MetricCard icon={Bell} label="Total Reminders" value={total} sub="All patient touchpoints" iconBg="#eff6ff" iconColor="#3b82f6" accent="#0f172a" />
          <MetricCard icon={Send} label="Delivery Rate" value={`${deliveryRate}%`} sub="WhatsApp Cloud API Active" iconBg="#f0fdf4" iconColor="#10b981" accent="#10b981" />
          <MetricCard icon={CalendarClock} label="Scheduled Auto-Sends" value={scheduledCount} sub="Queue processed hourly" iconBg="#fffbeb" iconColor="#f59e0b" accent="#f59e0b" />
          <MetricCard icon={AlertTriangle} label="Undelivered / Failed" value={failedCount} sub="Action required" iconBg="#fef2f2" iconColor="#ef4444" accent="#ef4444" />
        </MetricsGrid>

        {/* Filter & Action Header */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
            <input
              type="text"
              placeholder="Search by patient name, ID, phone, doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', width: '280px', fontSize: '14px' }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', background: 'white', fontSize: '14px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="SENT">Sent</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', background: 'white', fontSize: '14px' }}
            >
              <option value="ALL">All Types</option>
              <option value="OPD_FOLLOWUP">OPD Follow-up</option>
              <option value="LAB_RESULT_READY">Lab Result Ready</option>
              <option value="MEDICATION_REFILL">Medication Refill</option>
              <option value="IPD_DISCHARGE_CARE">IPD Discharge Care</option>
            </select>
          </div>

          <button
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: '#25D366', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 2px 6px rgba(37, 211, 102, 0.3)' }}
          >
            <Icons.Plus /> Schedule WhatsApp Follow-up
          </button>
        </div>

        {/* Reminders Table */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '16px' }}>Patient</th>
                <th style={{ padding: '16px' }}>Phone / Channel</th>
                <th style={{ padding: '16px' }}>Category</th>
                <th style={{ padding: '16px' }}>Scheduled Date</th>
                <th style={{ padding: '16px' }}>Status</th>
                <th style={{ padding: '16px' }}>WhatsApp Template</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading WhatsApp follow-up log...</td>
                </tr>
              ) : reminders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No reminders found matching criteria.</td>
                </tr>
              ) : (
                reminders.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => setSelectedReminder(r)}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.patientName}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>ID: {r.patientId}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: 600 }}>
                        <Icons.WhatsApp /> {r.phone}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#f1f5f9', color: '#475569' }}>
                        {r.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ color: '#0f172a', fontWeight: 500 }}>{r.appointmentDate}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{r.scheduledTime}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {r.status === "DELIVERED" && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, background: '#dcfce7', color: '#166534' }}>
                          <Icons.CheckCircle /> Delivered
                        </span>
                      )}
                      {r.status === "SENT" && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, background: '#e0f2fe', color: '#0369a1' }}>
                          <Icons.Send /> Sent
                        </span>
                      )}
                      {r.status === "SCHEDULED" && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, background: '#fef3c7', color: '#92400e' }}>
                          <Icons.Clock /> Scheduled
                        </span>
                      )}
                      {r.status === "FAILED" && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, background: '#fee2e2', color: '#991b1b' }}>
                          <Icons.AlertTriangle /> Failed
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#475569', fontFamily: 'monospace' }}>
                      {r.whatsappTemplate}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleSendInstant(r.id, r.patientName)}
                        disabled={sendingId === r.id}
                        style={{ padding: '8px 14px', borderRadius: '8px', background: '#25D366', color: 'white', border: 'none', fontWeight: 600, fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Icons.Send /> {sendingId === r.id ? "Dispatching..." : "Send Now"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Log Modal */}
        {selectedReminder && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: '20px', padding: '28px', maxWidth: '540px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Follow-up Activity Audit Log</h3>
                <button onClick={() => setSelectedReminder(null)} style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>{selectedReminder.patientName}</div>
                <div style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>Phone: {selectedReminder.phone} • Doctor: {selectedReminder.doctorName}</div>
                <div style={{ marginTop: '12px', padding: '12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', lineHeight: 1.5, color: '#334155' }}>
                  <strong>Message Payload:</strong><br />
                  "{selectedReminder.messageBody}"
                </div>
              </div>

              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: '#475569' }}>Delivery Webhook Timeline</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedReminder.logs.map((log, i) => (
                  <div key={i} style={{ padding: '12px', borderRadius: '10px', background: '#f1f5f9', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#0f172a' }}>
                      <span>Status: {log.status}</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div style={{ color: '#475569', marginTop: '4px' }}>{log.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: '20px', padding: '28px', maxWidth: '500px', width: '90%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>New WhatsApp Follow-up Reminder</h3>
                <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>

              <form onSubmit={handleCreateReminder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Patient Name *</label>
                  <input
                    type="text"
                    required
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>WhatsApp Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Follow-up Type</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                    >
                      <option value="OPD_FOLLOWUP">OPD Follow-up</option>
                      <option value="LAB_RESULT_READY">Lab Result Ready</option>
                      <option value="MEDICATION_REFILL">Medication Refill</option>
                      <option value="IPD_DISCHARGE_CARE">IPD Discharge Care</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Target Date</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Custom WhatsApp Message Note</label>
                  <textarea
                    rows={3}
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Enter custom reminder note for patient..."
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ padding: '10px 18px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '10px 20px', borderRadius: '8px', background: '#25D366', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Confirm & Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
    </PlanGateGuard>
  );
}

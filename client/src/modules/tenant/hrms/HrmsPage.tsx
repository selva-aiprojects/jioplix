import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { API_BASE_URL as API_BASE } from "../../../config/api";

function getHeaders() {
  const tenantId = localStorage.getItem("tenantId") || localStorage.getItem("facility") || localStorage.getItem("tenant") || "";
  return {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "x-tenant-id": tenantId
  };
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  fontSize: "13px",
  width: "100%",
  background: "white",
};

const pillStyle = (active: boolean, ok: boolean = true) => ({
  padding: "5px 12px",
  borderRadius: "20px",
  border: "none",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: 800,
  background: !ok ? "#fee2e2" : active ? "#dcfce7" : "#f1f5f9",
  color: !ok ? "#b91c1c" : active ? "#15803d" : "#64748b",
});

export default function HrmsPage() {
  const [tab, setTab] = useState<"dashboard" | "shifts" | "roster" | "swaps" | "attendance" | "oncall" | "credentials" | "privileges">("dashboard");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // data
  const [staff, setStaff] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [swaps, setSwaps] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [oncall, setOncall] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [privileges, setPrivileges] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // filters
  const [rosterDate, setRosterDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attDate, setAttDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [staffFilter, setStaffFilter] = useState("");

  // forms
  const [shiftForm, setShiftForm] = useState({ name: "", code: "", start_time: "08:00", end_time: "14:00", is_overnight: false, min_staff: 1 });
  const [rosterForm, setRosterForm] = useState({ staffUserId: "", shiftId: "", dutyDate: new Date().toISOString().slice(0, 10), note: "" });
  const [attForm, setAttForm] = useState({ staffUserId: "", workDate: new Date().toISOString().slice(0, 10), checkIn: "", checkOut: "", status: "PRESENT", remarks: "" });
  const [oncallForm, setOncallForm] = useState({ staffUserId: "", dutyDate: new Date().toISOString().slice(0, 10), startTime: "", endTime: "", type: "GENERAL", notes: "" });
  const [credForm, setCredForm] = useState({ userId: "", credentialType: "", credentialNo: "", issuedBy: "", issuedOn: "", expiresOn: "" });
  const [privForm, setPrivForm] = useState({ userId: "", privilege: "", notes: "" });
  const [swapForm, setSwapForm] = useState({ rosterEntryId: "", requestedToUserId: "", reason: "" });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [st, sh, sw, cr, pr, an] = await Promise.all([
        axios.get(`${API_BASE}/api/hrms/staff`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/hrms/shifts`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/hrms/swaps`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/hrms/credentials`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/hrms/privileges`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/hrms/analytics`, { headers: getHeaders() }),
      ]);
      setStaff(st.data || []);
      setShifts(sh.data || []);
      setSwaps(sw.data || []);
      setCredentials(cr.data || []);
      setPrivileges(pr.data || []);
      setAnalytics(an.data || null);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoster = async () => {
    try {
      const params: any = { date: rosterDate };
      if (staffFilter) params.staffId = staffFilter;
      const res = await axios.get(`${API_BASE}/api/hrms/roster`, { headers: getHeaders(), params });
      setRoster(res.data || []);
    } catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  const fetchAttendance = async () => {
    try {
      const params: any = { date: attDate };
      if (staffFilter) params.staffId = staffFilter;
      const res = await axios.get(`${API_BASE}/api/hrms/attendance`, { headers: getHeaders(), params });
      setAttendance(res.data || []);
    } catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  const fetchOncall = async () => {
    try {
      const params: any = { date: new Date().toISOString().slice(0, 10) };
      if (staffFilter) params.staffId = staffFilter;
      const res = await axios.get(`${API_BASE}/api/hrms/oncall`, { headers: getHeaders(), params });
      setOncall(res.data || []);
    } catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  useEffect(() => {
    fetchAll();
    fetchRoster();
    fetchAttendance();
    fetchOncall();
  }, []);

  useEffect(() => { if (tab === "roster") fetchRoster(); }, [rosterDate, staffFilter, tab]);
  useEffect(() => { if (tab === "attendance") fetchAttendance(); }, [attDate, staffFilter, tab]);
  useEffect(() => { if (tab === "oncall") fetchOncall(); }, [staffFilter, tab]);

  // ── Shifts ──
  const saveShift = async (e: any) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/hrms/shifts`, shiftForm, { headers: getHeaders() });
      setShiftForm({ name: "", code: "", start_time: "08:00", end_time: "14:00", is_overnight: false, min_staff: 1 });
      await fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); }
    finally { setBusy(false); }
  };

  const deleteShift = async (id: string) => {
    try { await axios.delete(`${API_BASE}/api/hrms/shifts/${id}`, { headers: getHeaders() }); await fetchAll(); }
    catch (err: any) { setError(err.response?.data?.error || err.message); }
  };

  // ── Roster ──
  const saveRoster = async (e: any) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/hrms/roster`, rosterForm, { headers: getHeaders() });
      setRosterForm({ ...rosterForm, note: "" });
      await fetchRoster();
    } catch (err: any) { setError(err.response?.data?.error || err.message); }
    finally { setBusy(false); }
  };

  const deleteRoster = async (id: string) => {
    try { await axios.delete(`${API_BASE}/api/hrms/roster/${id}`, { headers: getHeaders() }); await fetchRoster(); }
    catch (err: any) { setError(err.response?.data?.error || err.message); }
  };

  const patchRoster = async (id: string, status: string) => {
    try { await axios.patch(`${API_BASE}/api/hrms/roster/${id}`, { status }, { headers: getHeaders() }); await fetchRoster(); }
    catch (err: any) { setError(err.response?.data?.error || err.message); }
  };

  // ── Swaps ──
  const saveSwap = async (e: any) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/hrms/swaps`, swapForm, { headers: getHeaders() });
      setSwapForm({ rosterEntryId: "", requestedToUserId: "", reason: "" });
      await fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); }
    finally { setBusy(false); }
  };

  const decideSwap = async (id: string, approve: boolean) => {
    try { await axios.post(`${API_BASE}/api/hrms/swaps/${id}/decide`, { approve }, { headers: getHeaders() }); await fetchAll(); }
    catch (err: any) { setError(err.response?.data?.error || err.message); }
  };

  // ── Attendance ──
  const saveAttendance = async (e: any) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/hrms/attendance`, attForm, { headers: getHeaders() });
      setAttForm({ staffUserId: "", workDate: new Date().toISOString().slice(0, 10), checkIn: "", checkOut: "", status: "PRESENT", remarks: "" });
      await fetchAttendance();
    } catch (err: any) { setError(err.response?.data?.error || err.message); }
    finally { setBusy(false); }
  };

  const deleteAttendance = async (id: string) => {
    try { await axios.delete(`${API_BASE}/api/hrms/attendance/${id}`, { headers: getHeaders() }); await fetchAttendance(); }
    catch (err: any) { setError(err.response?.data?.error || err.message); }
  };

  // ── On-Call ──
  const saveOncall = async (e: any) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/hrms/oncall`, oncallForm, { headers: getHeaders() });
      setOncallForm({ staffUserId: "", dutyDate: new Date().toISOString().slice(0, 10), startTime: "", endTime: "", type: "GENERAL", notes: "" });
      await fetchOncall();
    } catch (err: any) { setError(err.response?.data?.error || err.message); }
    finally { setBusy(false); }
  };

  const deleteOncall = async (id: string) => {
    try { await axios.delete(`${API_BASE}/api/hrms/oncall/${id}`, { headers: getHeaders() }); await fetchOncall(); }
    catch (err: any) { setError(err.response?.data?.error || err.message); }
  };

  // ── Credentials ──
  const saveCred = async (e: any) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/hrms/credentials`, credForm, { headers: getHeaders() });
      setCredForm({ userId: "", credentialType: "", credentialNo: "", issuedBy: "", issuedOn: "", expiresOn: "" });
      await fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); }
    finally { setBusy(false); }
  };

  const toggleCredVerify = async (c: any) => {
    const next = c.verification_status === "VERIFIED" ? "UNVERIFIED" : "VERIFIED";
    try { await axios.patch(`${API_BASE}/api/hrms/credentials/${c.id}`, { verification_status: next }, { headers: getHeaders() }); await fetchAll(); }
    catch (err: any) { setError(err.response?.data?.error || err.message); }
  };

  // ── Privileges ──
  const savePriv = async (e: any) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/hrms/privileges`, privForm, { headers: getHeaders() });
      setPrivForm({ userId: "", privilege: "", notes: "" });
      await fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); }
    finally { setBusy(false); }
  };

  const revokePriv = async (id: string) => {
    try { await axios.post(`${API_BASE}/api/hrms/privileges/${id}/revoke`, {}, { headers: getHeaders() }); await fetchAll(); }
    catch (err: any) { setError(err.response?.data?.error || err.message); }
  };

  const tabs = [
    { id: "dashboard" as const, label: "Dashboard" },
    { id: "roster" as const, label: "Duty Roster" },
    { id: "shifts" as const, label: "Shifts" },
    { id: "swaps" as const, label: "Shift Swaps" },
    { id: "attendance" as const, label: "Attendance" },
    { id: "oncall" as const, label: "On-Call" },
    { id: "credentials" as const, label: "Credentials" },
    { id: "privileges" as const, label: "Privileges" },
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="Human Resource Management System" />
        <div style={{ padding: "20px 24px" }}>
          {error && (
            <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "12px 16px", borderRadius: "12px", marginBottom: "16px", fontSize: "13px", fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div className="flex-responsive" style={{ gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: "8px 16px", 
                  borderRadius: "12px", 
                  border: "none", 
                  cursor: "pointer", 
                  fontSize: "13px", 
                  fontWeight: 700,
                  transition: "all 0.2s ease",
                  background: tab === t.id ? "linear-gradient(135deg, #0056A8 0%, #003870 100%)" : "#f1f5f9", 
                  color: tab === t.id ? "white" : "#475569",
                  boxShadow: tab === t.id ? "0 4px 12px rgba(0, 86, 168, 0.2)" : "none"
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading && tab === "dashboard" ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>Loading HRMS data…</div>
          ) : (
            <>
              {/* ── DASHBOARD ── */}
              {tab === "dashboard" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                    {[
                      { label: "On Duty Today", value: analytics?.dutyToday ?? "-", color: "#0056A8", bg: "rgba(0, 86, 168, 0.08)", icon: "👨‍⚕️" },
                      { label: "On-Call Today", value: analytics?.onCallToday ?? "-", color: "#00C897", bg: "rgba(0, 200, 151, 0.08)", icon: "📞" },
                      { label: "Active Staff", value: staff.length, color: "#0078FF", bg: "rgba(0, 120, 255, 0.08)", icon: "👥" },
                      { label: "Active Shifts", value: shifts.filter((s) => s.is_active).length, color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.08)", icon: "⏰" }
                    ].map((s, i) => (
                      <div key={i} style={{
                        background: "white",
                        padding: "20px 24px",
                        borderRadius: "20px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 16px -4px rgba(0,0,0,0.04)",
                        position: "relative",
                        overflow: "hidden"
                      }}>
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: s.color }} />
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</span>
                          <span style={{ width: "36px", height: "36px", borderRadius: "10px", background: s.bg, display: "grid", placeItems: "center", fontSize: "18px" }}>{s.icon}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#0f172a" }}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid-responsive" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                      <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 900 }}>Roster — Next 7 Days</h3>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "8px" }}>Date</th><th style={{ textAlign: "right", padding: "8px" }}>Staff</th></tr></thead>
                        <tbody>
                          {(analytics?.rosterWeek || []).map((r: any, i: number) => (
                            <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "8px" }}>{String(r.duty_date).slice(0, 10)}</td>
                              <td style={{ padding: "8px", textAlign: "right", fontWeight: 700 }}>{r.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                      <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 900 }}>Today's Attendance</h3>
                      {(analytics?.attendanceSummary || []).map((a: any, i: number) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: "13px" }}>
                          <span>{a.status}</span><b>{a.count}</b>
                        </div>
                      ))}
                      {(!analytics?.attendanceSummary || analytics.attendanceSummary.length === 0) && (
                        <div style={{ color: "#64748b", fontSize: "13px" }}>No attendance marked today.</div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ── ROSTER ── */}
              {tab === "roster" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Assign Duty Shift</h3>
                    <form onSubmit={saveRoster} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
                      <select required value={rosterForm.staffUserId} onChange={(e) => setRosterForm({ ...rosterForm, staffUserId: e.target.value })} style={inputStyle}>
                        <option value="">Select Staff…</option>
                        {staff.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                      </select>
                      <select value={rosterForm.shiftId} onChange={(e) => setRosterForm({ ...rosterForm, shiftId: e.target.value })} style={inputStyle}>
                        <option value="">No Shift</option>
                        {shifts.filter((s) => s.is_active).map((s) => <option key={s.id} value={s.id}>{s.name} ({s.start_time?.slice(0,5)}–{s.end_time?.slice(0,5)})</option>)}
                      </select>
                      <input type="date" required value={rosterForm.dutyDate} onChange={(e) => setRosterForm({ ...rosterForm, dutyDate: e.target.value })} style={inputStyle} />
                      <input placeholder="Note (optional)" value={rosterForm.note} onChange={(e) => setRosterForm({ ...rosterForm, note: e.target.value })} style={inputStyle} />
                      <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Saving…" : "Assign Shift"}</button>
                    </form>
                  </div>

                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <div className="flex-responsive" style={{ gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                      <input type="date" value={rosterDate} onChange={(e) => setRosterDate(e.target.value)} style={{ ...inputStyle, width: 180 }} />
                      <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} style={{ ...inputStyle, width: 220 }}>
                        <option value="">All Staff</option>
                        {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 640 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}>
                        <th style={{ textAlign: "left", padding: "10px" }}>Staff</th>
                        <th style={{ textAlign: "left", padding: "10px" }}>Shift</th>
                        <th style={{ textAlign: "left", padding: "10px" }}>Time</th>
                        <th style={{ textAlign: "left", padding: "10px" }}>Date</th>
                        <th style={{ textAlign: "center", padding: "10px" }}>Status</th>
                        <th style={{ textAlign: "center", padding: "10px" }}>Actions</th>
                      </tr></thead>
                      <tbody>
                        {roster.length === 0 && <tr><td colSpan={6} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No roster entries for this date.</td></tr>}
                        {roster.map((r) => (
                          <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{r.staff_name || "—"}</td>
                            <td style={{ padding: "10px" }}>{r.shift_name || "—"}</td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{r.start_time?.slice(0,5)}–{r.end_time?.slice(0,5)}{r.is_overnight ? " ⏴" : ""}</td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{String(r.duty_date).slice(0, 10)}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              <select value={r.status} onChange={(e) => patchRoster(r.id, e.target.value)} style={{ padding: "6px 8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}>
                                {["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED"].map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              <button onClick={() => deleteRoster(r.id)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#fee2e2", color: "#b91c1c", cursor: "pointer" }}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ── SHIFTS ── */}
              {tab === "shifts" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Add Shift</h3>
                    <form onSubmit={saveShift} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
                      <input required placeholder="Name (e.g. Morning)" value={shiftForm.name} onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })} style={inputStyle} />
                      <input placeholder="Code (e.g. M)" value={shiftForm.code} onChange={(e) => setShiftForm({ ...shiftForm, code: e.target.value })} style={inputStyle} />
                      <input type="time" required value={shiftForm.start_time} onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })} style={inputStyle} />
                      <input type="time" required value={shiftForm.end_time} onChange={(e) => setShiftForm({ ...shiftForm, end_time: e.target.value })} style={inputStyle} />
                      <input type="number" placeholder="Min Staff" value={shiftForm.min_staff} onChange={(e) => setShiftForm({ ...shiftForm, min_staff: Number(e.target.value) })} style={inputStyle} />
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600 }}>
                        <input type="checkbox" checked={shiftForm.is_overnight} onChange={(e) => setShiftForm({ ...shiftForm, is_overnight: e.target.checked })} />
                        Overnight
                      </label>
                      <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Saving…" : "Save Shift"}</button>
                    </form>
                  </div>

                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 520 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}>
                        <th style={{ textAlign: "left", padding: "10px" }}>Name</th>
                        <th style={{ textAlign: "left", padding: "10px" }}>Code</th>
                        <th style={{ textAlign: "left", padding: "10px" }}>Time</th>
                        <th style={{ textAlign: "center", padding: "10px" }}>Overnight</th>
                        <th style={{ textAlign: "center", padding: "10px" }}>Min Staff</th>
                        <th style={{ textAlign: "center", padding: "10px" }}>Active</th>
                        <th style={{ textAlign: "center", padding: "10px" }}></th>
                      </tr></thead>
                      <tbody>
                        {shifts.map((s) => (
                          <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9", opacity: s.is_active ? 1 : 0.5 }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{s.name}</td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{s.code || "—"}</td>
                            <td style={{ padding: "10px" }}>{s.start_time?.slice(0,5)} – {s.end_time?.slice(0,5)}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}>{s.is_overnight ? "🌙" : "—"}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}>{s.min_staff}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}>{s.is_active ? "✅" : "—"}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              <button onClick={() => deleteShift(s.id)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#fee2e2", color: "#b91c1c", cursor: "pointer" }}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ── SWAPS ── */}
              {tab === "swaps" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Request Shift Swap</h3>
                    <form onSubmit={saveSwap} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                      <select required value={swapForm.rosterEntryId} onChange={(e) => setSwapForm({ ...swapForm, rosterEntryId: e.target.value })} style={inputStyle}>
                        <option value="">Roster Entry…</option>
                        {roster.filter((r) => r.status !== "CANCELLED").map((r) => <option key={r.id} value={r.id}>{r.staff_name} · {String(r.duty_date).slice(0,10)} · {r.shift_name}</option>)}
                      </select>
                      <select required value={swapForm.requestedToUserId} onChange={(e) => setSwapForm({ ...swapForm, requestedToUserId: e.target.value })} style={inputStyle}>
                        <option value="">Swap With…</option>
                        {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <input placeholder="Reason" value={swapForm.reason} onChange={(e) => setSwapForm({ ...swapForm, reason: e.target.value })} style={inputStyle} />
                      <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Saving…" : "Request Swap"}</button>
                    </form>
                  </div>

                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 640 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}>
                        <th style={{ textAlign: "left", padding: "10px" }}>Roster</th>
                        <th style={{ textAlign: "left", padding: "10px" }}>Requested By</th>
                        <th style={{ textAlign: "left", padding: "10px" }}>Swap With</th>
                        <th style={{ textAlign: "left", padding: "10px" }}>Reason</th>
                        <th style={{ textAlign: "center", padding: "10px" }}>Status</th>
                        <th style={{ textAlign: "center", padding: "10px" }}>Actions</th>
                      </tr></thead>
                      <tbody>
                        {swaps.length === 0 && <tr><td colSpan={6} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No swap requests.</td></tr>}
                        {swaps.map((sw) => (
                          <tr key={sw.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px" }}>{String(sw.duty_date || "").slice(0,10)} · {sw.shift_name || "—"}</td>
                            <td style={{ padding: "10px" }}>{sw.requested_by_name || "—"}</td>
                            <td style={{ padding: "10px" }}>{sw.requested_to_name || "—"}</td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{sw.reason || "—"}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              <span style={pillStyle(sw.status === "APPROVED", sw.status === "PENDING")}>{sw.status}</span>
                            </td>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              {sw.status === "PENDING" && (
                                <>
                                  <button onClick={() => decideSwap(sw.id, true)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#dcfce7", color: "#15803d", cursor: "pointer", marginRight: "6px" }}>Approve</button>
                                  <button onClick={() => decideSwap(sw.id, false)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#fee2e2", color: "#b91c1c", cursor: "pointer" }}>Reject</button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ── ATTENDANCE ── */}
              {tab === "attendance" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Mark Attendance</h3>
                    <form onSubmit={saveAttendance} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
                      <select required value={attForm.staffUserId} onChange={(e) => setAttForm({ ...attForm, staffUserId: e.target.value })} style={inputStyle}>
                        <option value="">Select Staff…</option>
                        {staff.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                      </select>
                      <input type="date" required value={attForm.workDate} onChange={(e) => setAttForm({ ...attForm, workDate: e.target.value })} style={inputStyle} />
                      <input type="time" value={attForm.checkIn} onChange={(e) => setAttForm({ ...attForm, checkIn: e.target.value })} style={inputStyle} />
                      <input type="time" value={attForm.checkOut} onChange={(e) => setAttForm({ ...attForm, checkOut: e.target.value })} style={inputStyle} />
                      <select value={attForm.status} onChange={(e) => setAttForm({ ...attForm, status: e.target.value })} style={inputStyle}>
                        {["PRESENT", "ABSENT", "LEAVE", "HALF_DAY", "HOLIDAY"].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input placeholder="Remarks" value={attForm.remarks} onChange={(e) => setAttForm({ ...attForm, remarks: e.target.value })} style={inputStyle} />
                      <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Saving…" : "Mark Attendance"}</button>
                    </form>
                  </div>

                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <div className="flex-responsive" style={{ gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                      <input type="date" value={attDate} onChange={(e) => setAttDate(e.target.value)} style={{ ...inputStyle, width: 180 }} />
                      <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} style={{ ...inputStyle, width: 220 }}>
                        <option value="">All Staff</option>
                        {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 640 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}>
                        <th style={{ textAlign: "left", padding: "10px" }}>Staff</th>
                        <th style={{ textAlign: "left", padding: "10px" }}>Date</th>
                        <th style={{ textAlign: "left", padding: "10px" }}>Check-In</th>
                        <th style={{ textAlign: "left", padding: "10px" }}>Check-Out</th>
                        <th style={{ textAlign: "center", padding: "10px" }}>Status</th>
                        <th style={{ textAlign: "center", padding: "10px" }}></th>
                      </tr></thead>
                      <tbody>
                        {attendance.length === 0 && <tr><td colSpan={6} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No attendance records for this date.</td></tr>}
                        {attendance.map((a) => (
                          <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{a.staff_name || "—"}</td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{String(a.work_date).slice(0, 10)}</td>
                            <td style={{ padding: "10px" }}>{a.check_in ? new Date(a.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                            <td style={{ padding: "10px" }}>{a.check_out ? new Date(a.check_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              <span style={pillStyle(a.status === "PRESENT", a.status !== "ABSENT")}>{a.status}</span>
                            </td>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              <button onClick={() => deleteAttendance(a.id)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#fee2e2", color: "#b91c1c", cursor: "pointer" }}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ── ON-CALL ── */}
              {tab === "oncall" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Schedule On-Call</h3>
                    <form onSubmit={saveOncall} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
                      <select required value={oncallForm.staffUserId} onChange={(e) => setOncallForm({ ...oncallForm, staffUserId: e.target.value })} style={inputStyle}>
                        <option value="">Select Staff…</option>
                        {staff.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                      </select>
                      <input type="date" required value={oncallForm.dutyDate} onChange={(e) => setOncallForm({ ...oncallForm, dutyDate: e.target.value })} style={inputStyle} />
                      <input type="time" value={oncallForm.startTime} onChange={(e) => setOncallForm({ ...oncallForm, startTime: e.target.value })} style={inputStyle} />
                      <input type="time" value={oncallForm.endTime} onChange={(e) => setOncallForm({ ...oncallForm, endTime: e.target.value })} style={inputStyle} />
                      <input placeholder="Type (e.g. EMERGENCY)" value={oncallForm.type} onChange={(e) => setOncallForm({ ...oncallForm, type: e.target.value })} style={inputStyle} />
                      <input placeholder="Notes" value={oncallForm.notes} onChange={(e) => setOncallForm({ ...oncallForm, notes: e.target.value })} style={inputStyle} />
                      <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Saving…" : "Schedule"}</button>
                    </form>
                  </div>

                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 640 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}>
                        <th style={{ textAlign: "left", padding: "10px" }}>Staff</th>
                        <th style={{ textAlign: "left", padding: "10px" }}>Date</th>
                        <th style={{ textAlign: "left", padding: "10px" }}>Time</th>
                        <th style={{ textAlign: "left", padding: "10px" }}>Type</th>
                        <th style={{ textAlign: "center", padding: "10px" }}>Status</th>
                        <th style={{ textAlign: "center", padding: "10px" }}></th>
                      </tr></thead>
                      <tbody>
                        {oncall.length === 0 && <tr><td colSpan={6} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No on-call duty scheduled.</td></tr>}
                        {oncall.map((o) => (
                          <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{o.staff_name || "—"}</td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{String(o.duty_date).slice(0, 10)}</td>
                            <td style={{ padding: "10px" }}>{o.start_time?.slice(0,5)}–{o.end_time?.slice(0,5)}</td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{o.type || "GENERAL"}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              <span style={pillStyle(o.status === "CONFIRMED", o.status !== "CANCELLED")}>{o.status}</span>
                            </td>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              <button onClick={() => deleteOncall(o.id)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#fee2e2", color: "#b91c1c", cursor: "pointer" }}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ── CREDENTIALS ── */}
              {tab === "credentials" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Add Credential</h3>
                    <form onSubmit={saveCred} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
                      <select required value={credForm.userId} onChange={(e) => setCredForm({ ...credForm, userId: e.target.value })} style={inputStyle}>
                        <option value="">Select Staff…</option>
                        {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <input required placeholder="Type (e.g. NMC Registration)" value={credForm.credentialType} onChange={(e) => setCredForm({ ...credForm, credentialType: e.target.value })} style={inputStyle} />
                      <input required placeholder="Credential No." value={credForm.credentialNo} onChange={(e) => setCredForm({ ...credForm, credentialNo: e.target.value })} style={inputStyle} />
                      <input placeholder="Issued By" value={credForm.issuedBy} onChange={(e) => setCredForm({ ...credForm, issuedBy: e.target.value })} style={inputStyle} />
                      <input type="date" value={credForm.issuedOn} onChange={(e) => setCredForm({ ...credForm, issuedOn: e.target.value })} style={inputStyle} />
                      <input type="date" value={credForm.expiresOn} onChange={(e) => setCredForm({ ...credForm, expiresOn: e.target.value })} style={inputStyle} />
                      <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Saving…" : "Save Credential"}</button>
                    </form>
                  </div>

                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 640 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}>
                        <th style={{ textAlign: "left", padding: "10px" }}>Staff</th>
                        <th style={{ textAlign: "left", padding: "10px" }}>Type</th>
                        <th style={{ textAlign: "left", padding: "10px" }}>Number</th>
                        <th style={{ textAlign: "left", padding: "10px" }}>Expires</th>
                        <th style={{ textAlign: "left", padding: "10px" }}>Expiry</th>
                        <th style={{ textAlign: "center", padding: "10px" }}>Verified</th>
                      </tr></thead>
                      <tbody>
                        {credentials.length === 0 && <tr><td colSpan={6} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No credentials recorded.</td></tr>}
                        {credentials.map((c) => (
                          <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{c.staff_name || "—"}</td>
                            <td style={{ padding: "10px" }}>{c.credential_type}</td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{c.credential_no || "—"}</td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{c.expires_on ? String(c.expires_on).slice(0, 10) : "—"}</td>
                            <td style={{ padding: "10px" }}>
                              <span style={pillStyle(c.expiry_status === "VALID", c.expiry_status === "VALID")}>{c.expiry_status || "—"}</span>
                            </td>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              <button onClick={() => toggleCredVerify(c)} style={pillStyle(c.verification_status === "VERIFIED", true)}>
                                {c.verification_status === "VERIFIED" ? "VERIFIED" : "UNVERIFIED"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ── PRIVILEGES ── */}
              {tab === "privileges" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Grant Privilege</h3>
                    <form onSubmit={savePriv} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                      <select required value={privForm.userId} onChange={(e) => setPrivForm({ ...privForm, userId: e.target.value })} style={inputStyle}>
                        <option value="">Select Staff…</option>
                        {staff.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                      </select>
                      <input required placeholder="Privilege (e.g. PHARMACY_OVERRIDE)" value={privForm.privilege} onChange={(e) => setPrivForm({ ...privForm, privilege: e.target.value })} style={inputStyle} />
                      <input placeholder="Notes" value={privForm.notes} onChange={(e) => setPrivForm({ ...privForm, notes: e.target.value })} style={inputStyle} />
                      <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Saving…" : "Grant Privilege"}</button>
                    </form>
                  </div>

                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 640 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}>
                        <th style={{ textAlign: "left", padding: "10px" }}>Staff</th>
                        <th style={{ textAlign: "left", padding: "10px" }}>Privilege</th>
                        <th style={{ textAlign: "left", padding: "10px" }}>Granted By</th>
                        <th style={{ textAlign: "left", padding: "10px" }}>Granted On</th>
                        <th style={{ textAlign: "center", padding: "10px" }}>Status</th>
                        <th style={{ textAlign: "center", padding: "10px" }}></th>
                      </tr></thead>
                      <tbody>
                        {privileges.length === 0 && <tr><td colSpan={6} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No privileges granted.</td></tr>}
                        {privileges.map((p) => (
                          <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9", opacity: p.is_active ? 1 : 0.5 }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{p.staff_name || "—"}</td>
                            <td style={{ padding: "10px" }}>{p.privilege}</td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{p.granted_by_name || "—"}</td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{p.granted_on ? new Date(p.granted_on).toLocaleDateString() : "—"}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              <span style={pillStyle(p.is_active, true)}>{p.is_active ? "ACTIVE" : "REVOKED"}</span>
                            </td>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              {p.is_active && (
                                <button onClick={() => revokePriv(p.id)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#fee2e2", color: "#b91c1c", cursor: "pointer" }}>Revoke</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

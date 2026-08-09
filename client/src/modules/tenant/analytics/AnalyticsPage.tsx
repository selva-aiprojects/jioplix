import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import PlanGateGuard from "../../../components/PlanGateGuard";
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

export default function AnalyticsPage() {
  const [tab, setTab] = useState<"ops" | "performance" | "alerts" | "targets">("ops");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [opd, setOpd] = useState<any>({});
  const [beds, setBeds] = useState<any[]>([]);
  const [pharmRisk, setPharmRisk] = useState<any>({});
  const [revenue, setRevenue] = useState<any>({});
  const [doctors, setDoctors] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const [targetForm, setTargetForm] = useState({ period: "MONTHLY", metric: "REVENUE", target_value: 0 });
  const [busy, setBusy] = useState(false);

  const fetchOps = async () => {
    try {
      const [o, b, p, r] = await Promise.all([
        axios.get(`${API_BASE}/api/analytics/opd-load`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/analytics/bed-occupancy`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/analytics/pharmacy-risk`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/analytics/revenue`, { headers: getHeaders() }),
      ]);
      setOpd(o.data || {});
      setBeds(b.data || []);
      setPharmRisk(p.data || {});
      setRevenue(r.data || {});
    } catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  const fetchPerformance = async () => {
    try {
      const [d, s] = await Promise.all([
        axios.get(`${API_BASE}/api/analytics/performance/doctors`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/analytics/performance/specialties`, { headers: getHeaders() }),
      ]);
      setDoctors(d.data || []);
      setSpecialties(s.data || []);
    } catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/analytics/alerts`, { headers: getHeaders() });
      setAlerts(res.data?.alerts || []);
    } catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  const fetchTargets = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/analytics/targets`, { headers: getHeaders() });
      setTargets(res.data || []);
    } catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchOps(), fetchPerformance(), fetchAlerts(), fetchTargets()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (tab === "ops") fetchOps(); }, [tab]);
  useEffect(() => { if (tab === "performance") fetchPerformance(); }, [tab]);
  useEffect(() => { if (tab === "alerts") fetchAlerts(); }, [tab]);
  useEffect(() => { if (tab === "targets") fetchTargets(); }, [tab]);

  const runAlerts = async () => {
    setBusy(true); setError("");
    try {
      const res = await axios.post(`${API_BASE}/api/analytics/alerts/run`, {}, { headers: getHeaders() });
      setError(`Alert sweep done: ${res.data?.created ?? 0} new alert(s), ${res.data?.total ?? 0} total.`);
      fetchAlerts();
    } catch (e: any) { setError(e.response?.data?.error || e.message); }
    finally { setBusy(false); }
  };

  const ackAlert = async (id: string) => {
    try { await axios.post(`${API_BASE}/api/analytics/alerts/${id}/ack`, {}, { headers: getHeaders() }); fetchAlerts(); }
    catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  const resolveAlert = async (id: string) => {
    try { await axios.post(`${API_BASE}/api/analytics/alerts/${id}/resolve`, {}, { headers: getHeaders() }); fetchAlerts(); }
    catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  const saveTarget = async (e: any) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/analytics/targets`, targetForm, { headers: getHeaders() });
      setTargetForm({ period: "MONTHLY", metric: "REVENUE", target_value: 0 });
      fetchTargets();
    } catch (err: any) { setError(err.response?.data?.error || err.message); }
    finally { setBusy(false); }
  };

  const deleteTarget = async (id: string) => {
    try { await axios.delete(`${API_BASE}/api/analytics/targets/${id}`, { headers: getHeaders() }); fetchTargets(); }
    catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  const tabs = [
    { id: "ops" as const, label: "Operations" },
    { id: "performance" as const, label: "Performance" },
    { id: "alerts" as const, label: "Alerts" },
    { id: "targets" as const, label: "Targets" },
  ];

  const stat = (label: string, value: any) => (
    <div className="stat-card">
      <div style={{ fontSize: "12px", color: "#64748b" }}>{label}</div>
      <div style={{ fontSize: "24px", fontWeight: 900 }}>{value ?? "-"}</div>
    </div>
  );

  return (
    <PlanGateGuard moduleName="Operations & Clinical Analytics">
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="Operations & Clinical Analytics" />
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
                  padding: "9px 14px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700,
                  background: tab === t.id ? "#1e3a8a" : "#e2e8f0", color: tab === t.id ? "white" : "#334155",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="stat-card" style={{ textAlign: "center", color: "#64748b" }}>Loading analytics…</div>
          ) : (
            <>
              {tab === "ops" && (
                <>
                  <div className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                    {stat("Active Encounters", opd.totalActive ?? 0)}
                    {stat("Occupancy %", beds.length ? Math.round(beds.reduce((s: number, b: any) => s + (b.occupancy_pct || 0), 0) / beds.length) + "%" : "-")}
                    {stat("Low Stock Items", pharmRisk.lowStock?.length ?? 0)}
                    {stat("Expiring Soon", pharmRisk.expiringSoon?.length ?? 0)}
                    {stat("Billed (MTD)", revenue.total_billed ?? 0)}
                  </div>

                  <div className="grid-responsive" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                      <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 900 }}>Bed Occupancy</h3>
                      {beds.length === 0 && <div style={{ color: "#64748b", fontSize: "13px" }}>No ward/bed data.</div>}
                      {beds.map((b: any, i: number) => (
                        <div key={i} style={{ marginBottom: "10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                            <b>{b.ward_name || b.ward_id}</b>
                            <span style={{ color: "#64748b" }}>{b.occupied}/{b.capacity} ({Math.round(b.occupancy_pct || 0)}%)</span>
                          </div>
                          <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(100, b.occupancy_pct || 0)}%`, height: "100%", background: (b.occupancy_pct || 0) >= 90 ? "#ef4444" : (b.occupancy_pct || 0) >= 70 ? "#f59e0b" : "#22c55e" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                      <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 900 }}>Revenue vs Collected</h3>
                      {(revenue.by_status || []).map((s: any, i: number) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: "13px" }}>
                          <span>{s.status}</span><b>₹{Number(s.total ?? 0).toLocaleString()}</b>
                        </div>
                      ))}
                      {(!revenue.by_status || revenue.by_status.length === 0) && (
                        <div style={{ color: "#64748b", fontSize: "13px" }}>No invoice data this month.</div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {tab === "performance" && (
                <div className="grid-responsive" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 900 }}>Doctors</h3>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 320 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "8px" }}>Doctor</th><th style={{ textAlign: "right", padding: "8px" }}>Consultations</th><th style={{ textAlign: "right", padding: "8px" }}>Revenue</th></tr></thead>
                      <tbody>
                        {doctors.map((d: any, i: number) => (
                          <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "8px", fontWeight: 700 }}>{d.doctor_name || "—"}</td>
                            <td style={{ padding: "8px", textAlign: "right" }}>{d.consultations ?? 0}</td>
                            <td style={{ padding: "8px", textAlign: "right" }}>₹{Number(d.revenue ?? 0).toLocaleString()}</td>
                          </tr>
                        ))}
                        {doctors.length === 0 && <tr><td colSpan={3} style={{ padding: "12px", color: "#64748b" }}>No encounter data.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 900 }}>Specialties</h3>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 320 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "8px" }}>Specialty</th><th style={{ textAlign: "right", padding: "8px" }}>Consultations</th><th style={{ textAlign: "right", padding: "8px" }}>Revenue</th></tr></thead>
                      <tbody>
                        {specialties.map((s: any, i: number) => (
                          <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "8px", fontWeight: 700 }}>{s.specialization || "—"}</td>
                            <td style={{ padding: "8px", textAlign: "right" }}>{s.consultations ?? 0}</td>
                            <td style={{ padding: "8px", textAlign: "right" }}>₹{Number(s.revenue ?? 0).toLocaleString()}</td>
                          </tr>
                        ))}
                        {specialties.length === 0 && <tr><td colSpan={3} style={{ padding: "12px", color: "#64748b" }}>No data.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === "alerts" && (
                <>
                  <div style={{ marginBottom: "16px" }}>
                    <button onClick={runAlerts} disabled={busy} className="button-primary">{busy ? "Running…" : "Run Alert Sweep"}</button>
                  </div>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    {alerts.length === 0 && <div style={{ color: "#64748b", fontSize: "13px" }}>No alerts. Click "Run Alert Sweep" to scan for risks.</div>}
                    {alerts.map((a: any) => (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid #f1f5f9", flexWrap: "wrap" }}>
                        <span style={pillStyle(a.status === "RESOLVED", a.status === "ACTIVE")}>{a.severity || "INFO"}</span>
                        <span style={pillStyle(a.status === "ACKNOWLEDGED", true)}>{a.status}</span>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <b style={{ fontSize: "13px" }}>{a.alert_type}</b>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>{a.message}</div>
                        </div>
                        {a.status === "ACTIVE" && (
                          <>
                            <button onClick={() => ackAlert(a.id)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#dbeafe", color: "#1d4ed8", cursor: "pointer" }}>Acknowledge</button>
                            <button onClick={() => resolveAlert(a.id)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#dcfce7", color: "#15803d", cursor: "pointer" }}>Resolve</button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {tab === "targets" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Add Target</h3>
                    <form onSubmit={saveTarget} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
                      <select value={targetForm.period} onChange={(e) => setTargetForm({ ...targetForm, period: e.target.value })} style={inputStyle}>
                        <option value="MONTHLY">Monthly</option>
                        <option value="QUARTERLY">Quarterly</option>
                      </select>
                      <select value={targetForm.metric} onChange={(e) => setTargetForm({ ...targetForm, metric: e.target.value })} style={inputStyle}>
                        <option value="REVENUE">Revenue</option>
                        <option value="OPD_COUNT">OPD Count</option>
                        <option value="IPD_COUNT">IPD Count</option>
                        <option value="PHARMACY_SALES">Pharmacy Sales</option>
                      </select>
                      <input type="number" required placeholder="Target Value" value={targetForm.target_value} onChange={(e) => setTargetForm({ ...targetForm, target_value: Number(e.target.value) })} style={inputStyle} />
                      <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Saving…" : "Save Target"}</button>
                    </form>
                  </div>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    {targets.length === 0 && <div style={{ color: "#64748b", fontSize: "13px" }}>No targets configured.</div>}
                    {targets.map((t: any) => (
                      <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9", fontSize: "13px" }}>
                        <span><b>{t.metric}</b> · {t.period} {t.is_active ? "" : "(inactive)"}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <b>₹{Number(t.target_value ?? 0).toLocaleString()}</b>
                          <button onClick={() => deleteTarget(t.id)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#fee2e2", color: "#b91c1c", cursor: "pointer" }}>Delete</button>
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
    </PlanGateGuard>
  );
}

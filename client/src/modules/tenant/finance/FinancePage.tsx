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

export default function FinancePage() {
  const [tab, setTab] = useState<"dashboard" | "packages" | "surgery" | "advances" | "refunds" | "writeoffs" | "einvoice" | "insurance">("dashboard");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [packages, setPackages] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [writeoffs, setWriteoffs] = useState<any[]>([]);
  const [doctorShare, setDoctorShare] = useState<any[]>([]);
  const [eligibility, setEligibility] = useState<any>(null);

  const [pkgForm, setPkgForm] = useState({ package_code: "", name: "", category: "HEALTH_CHECKUP", base_price: 0, discount_percent: 0 });
  const [pkgCompForm, setPkgCompForm] = useState({ package_id: "", item_name: "", item_type: "LAB", qty: 1, unit_price: 0 });
  const [caseForm, setCaseForm] = useState({ patient_name: "", procedure_name: "", surgeon_name: "", anesthetist_name: "", ot_start: "", ot_end: "", gross_charge: 0 });
  const [advForm, setAdvForm] = useState({ patient_name: "", amount: 0, payment_mode: "CASH" });
  const [refundForm, setRefundForm] = useState({ invoice_ref: "", amount: 0, reason: "", payment_mode: "CASH" });
  const [writeoffForm, setWriteoffForm] = useState({ invoice_ref: "", amount: 0, reason: "" });
  const [eligForm, setEligForm] = useState({ patientId: "", planId: "" });

  const fetchAll = async () => {
    try {
      const [p, c, a, r, w, ds] = await Promise.all([
        axios.get(`${API_BASE}/api/finance/packages`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/finance/surgery/cases`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/finance/advances`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/finance/refunds`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/finance/writeoffs`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/finance/doctor-share-report`, { headers: getHeaders() }),
      ]);
      setPackages(p.data || []);
      setCases(c.data || []);
      setAdvances(a.data || []);
      setRefunds(r.data || []);
      setWriteoffs(w.data || []);
      setDoctorShare(ds.data?.report || []);
    } catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (tab !== "dashboard") fetchAll(); }, [tab]);

  const savePackage = async (e: any) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const res = await axios.post(`${API_BASE}/api/finance/packages`, pkgForm, { headers: getHeaders() });
      setPkgCompForm({ ...pkgCompForm, package_id: res.data?.id || "" });
      setPkgForm({ package_code: "", name: "", category: "HEALTH_CHECKUP", base_price: 0, discount_percent: 0 });
      setError(`Package created: ${res.data?.package_code || ""}`);
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
  };

  const addComponent = async (e: any) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/finance/packages/${pkgCompForm.package_id}/components`, pkgCompForm, { headers: getHeaders() });
      setPkgCompForm({ package_id: pkgCompForm.package_id, item_name: "", item_type: "LAB", qty: 1, unit_price: 0 });
      setError("Component added.");
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
  };

  const billPackage = async (pkg: any) => {
    setBusy(true); setError("");
    try {
      const res = await axios.post(`${API_BASE}/api/finance/package-bill`, { package_id: pkg.id, patient_name: "Demo Patient" }, { headers: getHeaders() });
      setError(`Package quote ready: ₹${Number(res.data?.total ?? 0).toLocaleString()} (discount ₹${Number(res.data?.discount ?? 0).toLocaleString()}).`);
    } catch (e: any) { setError(e.response?.data?.error || e.message); } finally { setBusy(false); }
  };

  const saveCase = async (e: any) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const res = await axios.post(`${API_BASE}/api/finance/surgery/cases`, caseForm, { headers: getHeaders() });
      setError(`Surgery case created: ${res.data?.case_no || ""}`);
      setCaseForm({ patient_name: "", procedure_name: "", surgeon_name: "", anesthetist_name: "", ot_start: "", ot_end: "", gross_charge: 0 });
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
  };

  const billSurgery = async (id: string) => {
    setBusy(true); setError("");
    try {
      const res = await axios.post(`${API_BASE}/api/finance/surgery/${id}/bill`, {}, { headers: getHeaders() });
      setError(`Surgery bill ready: ₹${Number(res.data?.total ?? 0).toLocaleString()}.`);
    } catch (e: any) { setError(e.response?.data?.error || e.message); } finally { setBusy(false); }
  };

  const saveAdvance = async (e: any) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/finance/advances`, advForm, { headers: getHeaders() });
      setAdvForm({ patient_name: "", amount: 0, payment_mode: "CASH" });
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
  };

  const applyAdvance = async (id: string) => {
    const invoiceRef = prompt("Invoice ref to apply against:");
    if (!invoiceRef) return;
    const amount = Number(prompt("Amount:") || "0");
    setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/finance/advances/${id}/apply`, { invoice_ref: invoiceRef, amount }, { headers: getHeaders() });
      setError("Advance applied.");
      fetchAll();
    } catch (e: any) { setError(e.response?.data?.error || e.message); } finally { setBusy(false); }
  };

  const saveRefund = async (e: any) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/finance/refunds`, refundForm, { headers: getHeaders() });
      setRefundForm({ invoice_ref: "", amount: 0, reason: "", payment_mode: "CASH" });
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
  };

  const approveRefund = async (id: string) => {
    try { await axios.post(`${API_BASE}/api/finance/refunds/${id}/approve`, {}, { headers: getHeaders() }); fetchAll(); }
    catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  const saveWriteoff = async (e: any) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/finance/writeoffs`, writeoffForm, { headers: getHeaders() });
      setWriteoffForm({ invoice_ref: "", amount: 0, reason: "" });
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
  };

  const approveWriteoff = async (id: string) => {
    try { await axios.post(`${API_BASE}/api/finance/writeoffs/${id}/approve`, {}, { headers: getHeaders() }); fetchAll(); }
    catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  const checkEligibility = async (e: any) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const res = await axios.get(`${API_BASE}/api/finance/insurance/eligibility`, { headers: getHeaders(), params: eligForm });
      setEligibility(res.data);
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
  };

  const generateEinvoice = async (id: string) => {
    setBusy(true); setError("");
    try {
      const res = await axios.post(`${API_BASE}/api/finance/einvoice/${id}/generate`, { invoice_ref: `INV-DEMO-${id.slice(0, 6)}` }, { headers: getHeaders() });
      setError(`e-Invoice IRN generated (sandbox): ${res.data?.irn || ""}`);
    } catch (e: any) { setError(e.response?.data?.error || e.message); } finally { setBusy(false); }
  };

  const tabs = [
    { id: "dashboard" as const, label: "Dashboard" },
    { id: "packages" as const, label: "Packages" },
    { id: "surgery" as const, label: "Surgery Billing" },
    { id: "advances" as const, label: "Advances" },
    { id: "refunds" as const, label: "Refunds" },
    { id: "writeoffs" as const, label: "Write-offs" },
    { id: "einvoice" as const, label: "GST / e-Invoice" },
    { id: "insurance" as const, label: "Insurance" },
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="Finance & Compliance" />
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

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>Loading Finance metrics…</div>
          ) : (
            <>
              {tab === "dashboard" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                  {[
                    { label: "Packages", value: packages.length, color: "#0056A8", bg: "rgba(0, 86, 168, 0.08)", icon: "📦" },
                    { label: "Surgery Cases", value: cases.length, color: "#00C897", bg: "rgba(0, 200, 151, 0.08)", icon: "🩺" },
                    { label: "Patient Advances", value: advances.length, color: "#0078FF", bg: "rgba(0, 120, 255, 0.08)", icon: "💳" },
                    { label: "Pending Refunds", value: refunds.filter((r: any) => r.status === "PENDING").length, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)", icon: "↩️" },
                    { label: "Pending Write-offs", value: writeoffs.filter((w: any) => w.status === "PENDING").length, color: "#ef4444", bg: "rgba(239, 68, 68, 0.08)", icon: "✍️" }
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
              )}

              {tab === "packages" && (
                <>
                  <div className="grid-responsive" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                    <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                      <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Create Package</h3>
                      <form onSubmit={savePackage} className="grid-responsive" style={{ gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <input required placeholder="Package Code" value={pkgForm.package_code} onChange={(e) => setPkgForm({ ...pkgForm, package_code: e.target.value })} style={inputStyle} />
                        <input required placeholder="Name" value={pkgForm.name} onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })} style={inputStyle} />
                        <select value={pkgForm.category} onChange={(e) => setPkgForm({ ...pkgForm, category: e.target.value })} style={inputStyle}>
                          <option value="HEALTH_CHECKUP">Health Checkup</option>
                          <option value="DIAGNOSTIC">Diagnostic</option>
                          <option value="MATERNITY">Maternity</option>
                          <option value="SURGERY">Surgery</option>
                        </select>
                        <div className="flex-responsive" style={{ gap: "8px" }}>
                          <input type="number" required placeholder="Base Price" value={pkgForm.base_price} onChange={(e) => setPkgForm({ ...pkgForm, base_price: Number(e.target.value) })} style={inputStyle} />
                          <input type="number" placeholder="Disc %" value={pkgForm.discount_percent} onChange={(e) => setPkgForm({ ...pkgForm, discount_percent: Number(e.target.value) })} style={{ ...inputStyle, maxWidth: 90 }} />
                        </div>
                        <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Saving…" : "Create Package"}</button>
                      </form>
                    </div>
                    <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                      <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Add Component</h3>
                      <form onSubmit={addComponent} className="grid-responsive" style={{ gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <select required value={pkgCompForm.package_id} onChange={(e) => setPkgCompForm({ ...pkgCompForm, package_id: e.target.value })} style={inputStyle}>
                          <option value="">Select package…</option>
                          {packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input required placeholder="Item name" value={pkgCompForm.item_name} onChange={(e) => setPkgCompForm({ ...pkgCompForm, item_name: e.target.value })} style={inputStyle} />
                        <select value={pkgCompForm.item_type} onChange={(e) => setPkgCompForm({ ...pkgCompForm, item_type: e.target.value })} style={inputStyle}>
                          <option value="LAB">Lab</option>
                          <option value="RADIOLOGY">Radiology</option>
                          <option value="PHARMACY">Pharmacy</option>
                          <option value="DOCTOR">Doctor</option>
                        </select>
                        <div className="flex-responsive" style={{ gap: "8px" }}>
                          <input type="number" placeholder="Qty" value={pkgCompForm.qty} onChange={(e) => setPkgCompForm({ ...pkgCompForm, qty: Number(e.target.value) })} style={inputStyle} />
                          <input type="number" placeholder="Unit price" value={pkgCompForm.unit_price} onChange={(e) => setPkgCompForm({ ...pkgCompForm, unit_price: Number(e.target.value) })} style={inputStyle} />
                        </div>
                        <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Saving…" : "Add Component"}</button>
                      </form>
                    </div>
                  </div>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 640 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "10px" }}>Code</th><th style={{ textAlign: "left", padding: "10px" }}>Name</th><th style={{ textAlign: "left", padding: "10px" }}>Category</th><th style={{ textAlign: "right", padding: "10px" }}>Price</th><th style={{ textAlign: "center", padding: "10px" }}>Components</th><th style={{ textAlign: "center", padding: "10px" }}>Actions</th></tr></thead>
                      <tbody>
                        {packages.map((p) => (
                          <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{p.package_code}</td>
                            <td style={{ padding: "10px" }}>{p.name}</td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{p.category}</td>
                            <td style={{ padding: "10px", textAlign: "right" }}>₹{Number(p.base_price ?? 0).toLocaleString()}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}>{p.component_count ?? 0}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}><button onClick={() => billPackage(p)} disabled={busy} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#dbeafe", color: "#1d4ed8", cursor: "pointer" }}>Quote</button></td>
                          </tr>
                        ))}
                        {packages.length === 0 && <tr><td colSpan={6} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No packages.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {tab === "surgery" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>New Surgery Case</h3>
                    <form onSubmit={saveCase} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
                      <input required placeholder="Patient Name" value={caseForm.patient_name} onChange={(e) => setCaseForm({ ...caseForm, patient_name: e.target.value })} style={inputStyle} />
                      <input required placeholder="Procedure" value={caseForm.procedure_name} onChange={(e) => setCaseForm({ ...caseForm, procedure_name: e.target.value })} style={inputStyle} />
                      <input placeholder="Surgeon" value={caseForm.surgeon_name} onChange={(e) => setCaseForm({ ...caseForm, surgeon_name: e.target.value })} style={inputStyle} />
                      <input placeholder="Anesthetist" value={caseForm.anesthetist_name} onChange={(e) => setCaseForm({ ...caseForm, anesthetist_name: e.target.value })} style={inputStyle} />
                      <input type="datetime-local" value={caseForm.ot_start} onChange={(e) => setCaseForm({ ...caseForm, ot_start: e.target.value })} style={inputStyle} />
                      <input type="datetime-local" value={caseForm.ot_end} onChange={(e) => setCaseForm({ ...caseForm, ot_end: e.target.value })} style={inputStyle} />
                      <input type="number" placeholder="Gross Charge" value={caseForm.gross_charge} onChange={(e) => setCaseForm({ ...caseForm, gross_charge: Number(e.target.value) })} style={inputStyle} />
                      <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Saving…" : "Create Case"}</button>
                    </form>
                  </div>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 640 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "10px" }}>Case</th><th style={{ textAlign: "left", padding: "10px" }}>Patient</th><th style={{ textAlign: "left", padding: "10px" }}>Procedure</th><th style={{ textAlign: "left", padding: "10px" }}>Surgeon</th><th style={{ textAlign: "right", padding: "10px" }}>Charge</th><th style={{ textAlign: "center", padding: "10px" }}>Status</th><th style={{ textAlign: "center", padding: "10px" }}>Actions</th></tr></thead>
                      <tbody>
                        {cases.map((c) => (
                          <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{c.case_no}</td>
                            <td style={{ padding: "10px" }}>{c.patient_name}</td>
                            <td style={{ padding: "10px" }}>{c.procedure_name}</td>
                            <td style={{ padding: "10px" }}>{c.surgeon_name || "—"}</td>
                            <td style={{ padding: "10px", textAlign: "right" }}>₹{Number(c.gross_charge ?? 0).toLocaleString()}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}><span style={pillStyle(c.status === "BILLED", true)}>{c.status}</span></td>
                            <td style={{ padding: "10px", textAlign: "center" }}><button onClick={() => billSurgery(c.id)} disabled={busy} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#dbeafe", color: "#1d4ed8", cursor: "pointer" }}>Bill</button></td>
                          </tr>
                        ))}
                        {cases.length === 0 && <tr><td colSpan={7} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No surgery cases.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {tab === "advances" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Record Advance</h3>
                    <form onSubmit={saveAdvance} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                      <input required placeholder="Patient Name" value={advForm.patient_name} onChange={(e) => setAdvForm({ ...advForm, patient_name: e.target.value })} style={inputStyle} />
                      <input type="number" required placeholder="Amount" value={advForm.amount} onChange={(e) => setAdvForm({ ...advForm, amount: Number(e.target.value) })} style={inputStyle} />
                      <select value={advForm.payment_mode} onChange={(e) => setAdvForm({ ...advForm, payment_mode: e.target.value })} style={inputStyle}>
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                        <option value="UPI">UPI</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                      </select>
                      <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Saving…" : "Save Advance"}</button>
                    </form>
                  </div>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 560 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "10px" }}>Patient</th><th style={{ textAlign: "right", padding: "10px" }}>Amount</th><th style={{ textAlign: "right", padding: "10px" }}>Balance</th><th style={{ textAlign: "center", padding: "10px" }}>Status</th><th style={{ textAlign: "center", padding: "10px" }}>Actions</th></tr></thead>
                      <tbody>
                        {advances.map((a) => (
                          <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{a.patient_name}</td>
                            <td style={{ padding: "10px", textAlign: "right" }}>₹{Number(a.amount ?? 0).toLocaleString()}</td>
                            <td style={{ padding: "10px", textAlign: "right" }}>₹{Number(a.balance ?? 0).toLocaleString()}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}><span style={pillStyle(a.status === "CLOSED", a.status === "OPEN")}>{a.status}</span></td>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              {a.status === "OPEN" && <button onClick={() => applyAdvance(a.id)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#dbeafe", color: "#1d4ed8", cursor: "pointer" }}>Apply</button>}
                            </td>
                          </tr>
                        ))}
                        {advances.length === 0 && <tr><td colSpan={5} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No advances.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {tab === "refunds" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Request Refund</h3>
                    <form onSubmit={saveRefund} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                      <input required placeholder="Invoice Ref" value={refundForm.invoice_ref} onChange={(e) => setRefundForm({ ...refundForm, invoice_ref: e.target.value })} style={inputStyle} />
                      <input type="number" required placeholder="Amount" value={refundForm.amount} onChange={(e) => setRefundForm({ ...refundForm, amount: Number(e.target.value) })} style={inputStyle} />
                      <input required placeholder="Reason" value={refundForm.reason} onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })} style={inputStyle} />
                      <select value={refundForm.payment_mode} onChange={(e) => setRefundForm({ ...refundForm, payment_mode: e.target.value })} style={inputStyle}>
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                        <option value="UPI">UPI</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                      </select>
                      <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Saving…" : "Submit Refund"}</button>
                    </form>
                  </div>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 560 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "10px" }}>Invoice</th><th style={{ textAlign: "right", padding: "10px" }}>Amount</th><th style={{ textAlign: "left", padding: "10px" }}>Reason</th><th style={{ textAlign: "center", padding: "10px" }}>Status</th><th style={{ textAlign: "center", padding: "10px" }}>Actions</th></tr></thead>
                      <tbody>
                        {refunds.map((r) => (
                          <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{r.invoice_ref}</td>
                            <td style={{ padding: "10px", textAlign: "right" }}>₹{Number(r.amount ?? 0).toLocaleString()}</td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{r.reason}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}><span style={pillStyle(r.status === "APPROVED", r.status !== "REJECTED")}>{r.status}</span></td>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              {r.status === "PENDING" && <button onClick={() => approveRefund(r.id)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#dcfce7", color: "#15803d", cursor: "pointer" }}>Approve</button>}
                            </td>
                          </tr>
                        ))}
                        {refunds.length === 0 && <tr><td colSpan={5} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No refunds.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {tab === "writeoffs" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Request Write-off</h3>
                    <form onSubmit={saveWriteoff} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                      <input required placeholder="Invoice Ref" value={writeoffForm.invoice_ref} onChange={(e) => setWriteoffForm({ ...writeoffForm, invoice_ref: e.target.value })} style={inputStyle} />
                      <input type="number" required placeholder="Amount" value={writeoffForm.amount} onChange={(e) => setWriteoffForm({ ...writeoffForm, amount: Number(e.target.value) })} style={inputStyle} />
                      <input required placeholder="Reason" value={writeoffForm.reason} onChange={(e) => setWriteoffForm({ ...writeoffForm, reason: e.target.value })} style={inputStyle} />
                      <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Saving…" : "Submit Write-off"}</button>
                    </form>
                  </div>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 520 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "10px" }}>Invoice</th><th style={{ textAlign: "right", padding: "10px" }}>Amount</th><th style={{ textAlign: "left", padding: "10px" }}>Reason</th><th style={{ textAlign: "center", padding: "10px" }}>Status</th><th style={{ textAlign: "center", padding: "10px" }}>Actions</th></tr></thead>
                      <tbody>
                        {writeoffs.map((w) => (
                          <tr key={w.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{w.invoice_ref}</td>
                            <td style={{ padding: "10px", textAlign: "right" }}>₹{Number(w.amount ?? 0).toLocaleString()}</td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{w.reason}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}><span style={pillStyle(w.status === "APPROVED", w.status !== "REJECTED")}>{w.status}</span></td>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              {w.status === "PENDING" && <button onClick={() => approveWriteoff(w.id)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#dcfce7", color: "#15803d", cursor: "pointer" }}>Approve</button>}
                            </td>
                          </tr>
                        ))}
                        {writeoffs.length === 0 && <tr><td colSpan={5} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No write-offs.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {tab === "einvoice" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>GST / e-Invoice</h3>
                    <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px" }}>
                      Mode: <b style={{ color: "#b45309" }}>SANDBOX</b> — IRNs are simulated, no real GSTN connection.
                    </div>
                    {[1, 2].map((i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid #f1f5f9", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: "13px" }}>INV-2026-{i}</span>
                        <span style={pillStyle(false, true)}>PENDING</span>
                        <button onClick={() => generateEinvoice(String(i))} disabled={busy} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#dbeafe", color: "#1d4ed8", cursor: "pointer" }}>Generate IRN</button>
                      </div>
                    ))}
                  </div>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 900 }}>Doctor Share Report (from Payroll)</h3>
                    {doctorShare.length === 0 && <div style={{ color: "#64748b", fontSize: "13px" }}>No payroll incentive data yet.</div>}
                    {doctorShare.map((d: any, i: number) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: "13px" }}>
                        <span><b>{d.doctor_name || d.staff_user_id}</b></span>
                        <span>₹{Number(d.incentive_amount ?? d.net_amount ?? 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {tab === "insurance" && (
                <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                  <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Insurance Eligibility</h3>
                  <form onSubmit={checkEligibility} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                    <input required placeholder="Patient ID" value={eligForm.patientId} onChange={(e) => setEligForm({ ...eligForm, patientId: e.target.value })} style={inputStyle} />
                    <input placeholder="Plan ID (optional)" value={eligForm.planId} onChange={(e) => setEligForm({ ...eligForm, planId: e.target.value })} style={inputStyle} />
                    <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Checking…" : "Check Eligibility"}</button>
                  </form>
                  {eligibility && (
                    <div style={{ marginTop: "16px", padding: "16px", borderRadius: "12px", background: eligibility.eligible ? "#f0fdf4" : "#fef2f2", fontSize: "13px" }}>
                      <b style={{ fontSize: "15px" }}>{eligibility.eligible ? "✅ Eligible" : "❌ Not Eligible"}</b>
                      <div style={{ color: "#64748b", marginTop: "4px" }}>Plan: {eligibility.plan || "—"} · Remaining limit: ₹{Number(eligibility.remaining_limit ?? eligibility.limit ?? 0).toLocaleString()}</div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

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

export default function InventoryPage() {
  const [tab, setTab] = useState<"dashboard" | "indents" | "issues" | "narcotics" | "reorder" | "analytics">("dashboard");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [dash, setDash] = useState<any>({});
  const [indents, setIndents] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [narcotics, setNarcotics] = useState<any[]>([]);
  const [reorderConfig, setReorderConfig] = useState<any[]>([]);
  const [expiry, setExpiry] = useState<any>({});
  const [consumption, setConsumption] = useState<any[]>([]);

  const [indentForm, setIndentForm] = useState({ requesting_dept: "", requested_by: "", items: [{ medicine_name: "", requested_qty: 1 }] });
  const [narcForm, setNarcForm] = useState({ patient_name: "", medicine_name: "", batch_number: "", qty: 1, administering_user: "", witness_user: "", purpose: "" });
  const [selectedIndent, setSelectedIndent] = useState<any>(null);

  const fetchAll = async () => {
    try {
      const [d, i, iss, n, r] = await Promise.all([
        axios.get(`${API_BASE}/api/inventory/dashboard`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/inventory/indents`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/inventory/issues`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/inventory/narcotics`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/inventory/reorder/config`, { headers: getHeaders() }),
      ]);
      setDash(d.data || {});
      setIndents(i.data || []);
      setIssues(iss.data || []);
      setNarcotics(n.data || []);
      setReorderConfig(r.data || []);
    } catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  const fetchAnalytics = async () => {
    try {
      const [e, c] = await Promise.all([
        axios.get(`${API_BASE}/api/inventory/analytics/expiry`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/inventory/analytics/consumption`, { headers: getHeaders() }),
      ]);
      setExpiry(e.data || {});
      setConsumption(c.data || []);
    } catch (err: any) { setError(err.response?.data?.error || err.message); }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAll(), fetchAnalytics()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (tab !== "dashboard") fetchAll(); }, [tab]);
  useEffect(() => { if (tab === "analytics") fetchAnalytics(); }, [tab]);

  const saveIndent = async (e: any) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const res = await axios.post(`${API_BASE}/api/inventory/indents`, indentForm, { headers: getHeaders() });
      setError(`Indent created: ${res.data?.indent_no || ""}`);
      setIndentForm({ requesting_dept: "", requested_by: "", items: [{ medicine_name: "", requested_qty: 1 }] });
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
  };

  const approveIndent = async (id: string) => {
    try { await axios.post(`${API_BASE}/api/inventory/indents/${id}/approve`, {}, { headers: getHeaders() }); fetchAll(); }
    catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  const rejectIndent = async (id: string) => {
    try { await axios.post(`${API_BASE}/api/inventory/indents/${id}/reject`, {}, { headers: getHeaders() }); fetchAll(); }
    catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  const openIndent = async (id: string) => {
    try {
      const res = await axios.get(`${API_BASE}/api/inventory/indents/${id}`, { headers: getHeaders() });
      setSelectedIndent(res.data);
    } catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  const issueIndent = async () => {
    if (!selectedIndent) return;
    setBusy(true); setError("");
    try {
      const items = (selectedIndent.items || []).map((it: any) => ({
        indent_item_id: it.id, qty: it.requested_qty - (it.issued_qty || 0), batch_number: it.batch_number || "", cost_price: 0
      }));
      const res = await axios.post(`${API_BASE}/api/inventory/indents/${selectedIndent.id}/issue`, { issued_by: "Demo Pharma", items }, { headers: getHeaders() });
      setError(`Issued: ${res.data?.issue_no || ""}`);
      setSelectedIndent(null);
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
  };

  const saveNarc = async (e: any) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/inventory/narcotics`, narcForm, { headers: getHeaders() });
      setNarcForm({ patient_name: "", medicine_name: "", batch_number: "", qty: 1, administering_user: "", witness_user: "", purpose: "" });
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
  };

  const runReorder = async () => {
    setBusy(true); setError("");
    try {
      const res = await axios.post(`${API_BASE}/api/inventory/reorder/run`, {}, { headers: getHeaders() });
      setError(`Reorder sweep: ${res.data?.created ?? 0} item(s) flagged.`);
      fetchAll();
    } catch (e: any) { setError(e.response?.data?.error || e.message); } finally { setBusy(false); }
  };

  const saveReorderConfig = async (item: any) => {
    try {
      await axios.put(`${API_BASE}/api/inventory/reorder/config`, { medicine_id: item.id, reorder_level: Number(item.reorder_level || 0), reorder_qty: Number(item.reorder_qty || 0) }, { headers: getHeaders() });
      setError("Reorder config saved.");
      fetchAll();
    } catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  const tabs = [
    { id: "dashboard" as const, label: "Dashboard" },
    { id: "indents" as const, label: "Indents" },
    { id: "issues" as const, label: "Issues" },
    { id: "narcotics" as const, label: "Narcotics Register" },
    { id: "reorder" as const, label: "Reorder Levels" },
    { id: "analytics" as const, label: "Expiry & Consumption" },
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="Pharmacy Inventory & Stock Control" />
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
            <div className="stat-card" style={{ textAlign: "center", color: "#64748b" }}>Loading…</div>
          ) : (
            <>
              {tab === "dashboard" && (
                <div className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                  <div className="stat-card"><div style={{ fontSize: "12px", color: "#64748b" }}>Pending Indents</div><div style={{ fontSize: "24px", fontWeight: 900 }}>{dash.pendingIndents ?? 0}</div></div>
                  <div className="stat-card"><div style={{ fontSize: "12px", color: "#64748b" }}>Issues</div><div style={{ fontSize: "24px", fontWeight: 900 }}>{dash.issues ?? 0}</div></div>
                  <div className="stat-card"><div style={{ fontSize: "12px", color: "#64748b" }}>Narcotic Entries</div><div style={{ fontSize: "24px", fontWeight: 900 }}>{dash.narcotics ?? 0}</div></div>
                  <div className="stat-card"><div style={{ fontSize: "12px", color: "#64748b" }}>Low Stock Items</div><div style={{ fontSize: "24px", fontWeight: 900, color: (dash.lowStock ?? 0) > 0 ? "#b91c1c" : "inherit" }}>{dash.lowStock ?? 0}</div></div>
                  <div className="stat-card"><div style={{ fontSize: "12px", color: "#64748b" }}>Expiring Soon</div><div style={{ fontSize: "24px", fontWeight: 900, color: (dash.expiringSoon ?? 0) > 0 ? "#b45309" : "inherit" }}>{dash.expiringSoon ?? 0}</div></div>
                </div>
              )}

              {tab === "indents" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Create Indent</h3>
                    <form onSubmit={saveIndent} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                      <input required placeholder="Department" value={indentForm.requesting_dept} onChange={(e) => setIndentForm({ ...indentForm, requesting_dept: e.target.value })} style={inputStyle} />
                      <input required placeholder="Requested By" value={indentForm.requested_by} onChange={(e) => setIndentForm({ ...indentForm, requested_by: e.target.value })} style={inputStyle} />
                      {indentForm.items.map((it, idx) => (
                        <div key={idx} className="flex-responsive" style={{ gap: "8px", gridColumn: "1/-1" }}>
                          <input required placeholder="Medicine name" value={it.medicine_name} onChange={(e) => { const items = [...indentForm.items]; items[idx] = { ...it, medicine_name: e.target.value }; setIndentForm({ ...indentForm, items }); }} style={{ ...inputStyle, flex: 2 }} />
                          <input type="number" required placeholder="Qty" value={it.requested_qty} onChange={(e) => { const items = [...indentForm.items]; items[idx] = { ...it, requested_qty: Number(e.target.value) }; setIndentForm({ ...indentForm, items }); }} style={{ ...inputStyle, flex: 1 }} />
                          {indentForm.items.length > 1 && <button type="button" onClick={() => setIndentForm({ ...indentForm, items: indentForm.items.filter((_, i) => i !== idx) })} style={{ padding: "8px 12px", borderRadius: "8px", border: "none", background: "#fee2e2", color: "#b91c1c", cursor: "pointer" }}>✕</button>}
                        </div>
                      ))}
                      <div style={{ gridColumn: "1/-1", display: "flex", gap: "10px" }}>
                        <button type="button" onClick={() => setIndentForm({ ...indentForm, items: [...indentForm.items, { medicine_name: "", requested_qty: 1 }] })} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontSize: "12px" }}>+ Add Line</button>
                        <button type="submit" disabled={busy} className="button-primary">{busy ? "Saving…" : "Create Indent"}</button>
                      </div>
                    </form>
                  </div>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 680 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "10px" }}>Indent</th><th style={{ textAlign: "left", padding: "10px" }}>Dept</th><th style={{ textAlign: "left", padding: "10px" }}>By</th><th style={{ textAlign: "center", padding: "10px" }}>Lines</th><th style={{ textAlign: "center", padding: "10px" }}>Status</th><th style={{ textAlign: "center", padding: "10px" }}>Actions</th></tr></thead>
                      <tbody>
                        {indents.map((ind) => (
                          <tr key={ind.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{ind.indent_no}</td>
                            <td style={{ padding: "10px" }}>{ind.requesting_dept}</td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{ind.requested_by}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}>{ind.item_count ?? 0}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}><span style={pillStyle(ind.status === "APPROVED" || ind.status === "ISSUED", ind.status !== "REJECTED")}>{ind.status}</span></td>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              {ind.status === "PENDING" && <>
                                <button onClick={() => approveIndent(ind.id)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#dcfce7", color: "#15803d", cursor: "pointer", marginRight: "6px" }}>Approve</button>
                                <button onClick={() => rejectIndent(ind.id)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#fee2e2", color: "#b91c1c", cursor: "pointer" }}>Reject</button>
                              </>}
                              {ind.status === "APPROVED" && <button onClick={() => openIndent(ind.id)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#dbeafe", color: "#1d4ed8", cursor: "pointer" }}>Issue</button>}
                            </td>
                          </tr>
                        ))}
                        {indents.length === 0 && <tr><td colSpan={6} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No indents.</td></tr>}
                      </tbody>
                    </table>
                  </div>

                  {selectedIndent && (
                    <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginTop: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                      <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Issue {selectedIndent.indent_no}</h3>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "8px" }}>Medicine</th><th style={{ textAlign: "right", padding: "8px" }}>Requested</th><th style={{ textAlign: "right", padding: "8px" }}>To Issue</th></tr></thead>
                        <tbody>
                          {(selectedIndent.items || []).map((it: any) => (
                            <tr key={it.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "8px" }}>{it.medicine_name}</td>
                              <td style={{ padding: "8px", textAlign: "right" }}>{it.requested_qty}</td>
                              <td style={{ padding: "8px", textAlign: "right" }}>{it.requested_qty - (it.issued_qty || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                        <button onClick={issueIndent} disabled={busy} className="button-primary">{busy ? "Issuing…" : "Issue to Dept"}</button>
                        <button onClick={() => setSelectedIndent(null)} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer" }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {tab === "issues" && (
                <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 560 }}>
                    <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "10px" }}>Issue</th><th style={{ textAlign: "left", padding: "10px" }}>Indent</th><th style={{ textAlign: "left", padding: "10px" }}>Dept</th><th style={{ textAlign: "left", padding: "10px" }}>Issued By</th><th style={{ textAlign: "left", padding: "10px" }}>Time</th></tr></thead>
                    <tbody>
                      {issues.map((iss) => (
                        <tr key={iss.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px", fontWeight: 700 }}>{iss.issue_no}</td>
                          <td style={{ padding: "10px" }}>{iss.indent_id}</td>
                          <td style={{ padding: "10px" }}>{iss.dept}</td>
                          <td style={{ padding: "10px", color: "#64748b" }}>{iss.issued_by}</td>
                          <td style={{ padding: "10px", color: "#64748b" }}>{new Date(iss.issued_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {issues.length === 0 && <tr><td colSpan={5} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No issues yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === "narcotics" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Narcotic Administration (dual-witness)</h3>
                    <form onSubmit={saveNarc} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                      <input required placeholder="Patient Name" value={narcForm.patient_name} onChange={(e) => setNarcForm({ ...narcForm, patient_name: e.target.value })} style={inputStyle} />
                      <input required placeholder="Medicine" value={narcForm.medicine_name} onChange={(e) => setNarcForm({ ...narcForm, medicine_name: e.target.value })} style={inputStyle} />
                      <input placeholder="Batch" value={narcForm.batch_number} onChange={(e) => setNarcForm({ ...narcForm, batch_number: e.target.value })} style={inputStyle} />
                      <input type="number" required placeholder="Qty" value={narcForm.qty} onChange={(e) => setNarcForm({ ...narcForm, qty: Number(e.target.value) })} style={inputStyle} />
                      <input required placeholder="Administering User" value={narcForm.administering_user} onChange={(e) => setNarcForm({ ...narcForm, administering_user: e.target.value })} style={inputStyle} />
                      <input required placeholder="Witness User" value={narcForm.witness_user} onChange={(e) => setNarcForm({ ...narcForm, witness_user: e.target.value })} style={inputStyle} />
                      <input placeholder="Purpose" value={narcForm.purpose} onChange={(e) => setNarcForm({ ...narcForm, purpose: e.target.value })} style={inputStyle} />
                      <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Saving…" : "Record Entry"}</button>
                    </form>
                  </div>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 720 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "10px" }}>Patient</th><th style={{ textAlign: "left", padding: "10px" }}>Medicine</th><th style={{ textAlign: "right", padding: "10px" }}>Qty</th><th style={{ textAlign: "left", padding: "10px" }}>Administered By</th><th style={{ textAlign: "left", padding: "10px" }}>Witness</th><th style={{ textAlign: "left", padding: "10px" }}>Purpose</th><th style={{ textAlign: "left", padding: "10px" }}>Time</th></tr></thead>
                      <tbody>
                        {narcotics.map((n: any) => (
                          <tr key={n.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{n.patient_name}</td>
                            <td style={{ padding: "10px" }}>{n.medicine_name}</td>
                            <td style={{ padding: "10px", textAlign: "right" }}>{n.qty}</td>
                            <td style={{ padding: "10px" }}>{n.administering_user}</td>
                            <td style={{ padding: "10px" }}>{n.witness_user}</td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{n.purpose}</td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{new Date(n.created_at).toLocaleString()}</td>
                          </tr>
                        ))}
                        {narcotics.length === 0 && <tr><td colSpan={7} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No narcotic entries. Entries are append-only and cannot be edited or deleted.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {tab === "reorder" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Reorder Config</h3>
                    <button onClick={runReorder} disabled={busy} className="button-primary" style={{ marginBottom: "12px" }}>{busy ? "Running…" : "⚡ Run Reorder Sweep"}</button>
                  </div>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 640 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "10px" }}>Medicine</th><th style={{ textAlign: "right", padding: "10px" }}>Stock</th><th style={{ textAlign: "right", padding: "10px" }}>Reorder Level</th><th style={{ textAlign: "right", padding: "10px" }}>Reorder Qty</th><th style={{ textAlign: "center", padding: "10px" }}>Status</th><th style={{ textAlign: "center", padding: "10px" }}>Save</th></tr></thead>
                      <tbody>
                        {reorderConfig.map((m: any) => (
                          <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{m.name || m.medicine_name}</td>
                            <td style={{ padding: "10px", textAlign: "right" }}>{m.stock_quantity ?? 0}</td>
                            <td style={{ padding: "10px", textAlign: "right" }}>
                              <input type="number" value={m.reorder_level ?? 0} onChange={(e) => { m.reorder_level = Number(e.target.value); setReorderConfig([...reorderConfig]); }} style={{ ...inputStyle, width: 90, textAlign: "right" }} />
                            </td>
                            <td style={{ padding: "10px", textAlign: "right" }}>
                              <input type="number" value={m.reorder_qty ?? 0} onChange={(e) => { m.reorder_qty = Number(e.target.value); setReorderConfig([...reorderConfig]); }} style={{ ...inputStyle, width: 90, textAlign: "right" }} />
                            </td>
                            <td style={{ padding: "10px", textAlign: "center" }}><span style={pillStyle(Number(m.stock_quantity ?? 0) > Number(m.reorder_level ?? 0), Number(m.stock_quantity ?? 0) <= Number(m.reorder_level ?? 0))}>{Number(m.stock_quantity ?? 0) <= Number(m.reorder_level ?? 0) ? "LOW" : "OK"}</span></td>
                            <td style={{ padding: "10px", textAlign: "center" }}><button onClick={() => saveReorderConfig(m)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#dbeafe", color: "#1d4ed8", cursor: "pointer" }}>Save</button></td>
                          </tr>
                        ))}
                        {reorderConfig.length === 0 && <tr><td colSpan={6} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No medicines configured.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {tab === "analytics" && (
                <div className="grid-responsive" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 900 }}>Expiry Risk</h3>
                    {["expiring30", "expiring60", "expiring90"].map((bucket) => (
                      <div key={bucket} style={{ marginBottom: "10px" }}>
                        <b style={{ fontSize: "13px" }}>{bucket.replace("expiring", "Next ") + " days"}</b>
                        {(expiry[bucket] || []).map((b: any, i: number) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "4px 0", color: "#475569" }}>
                            <span>{b.medicine_name || b.medicine_id}</span>
                            <span>{b.expiry_date ? String(b.expiry_date).slice(0, 10) : "—"} · {b.qty}</span>
                          </div>
                        ))}
                        {(expiry[bucket] || []).length === 0 && <div style={{ fontSize: "12px", color: "#94a3b8" }}>No batches.</div>}
                      </div>
                    ))}
                  </div>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 900 }}>Consumption (30 days)</h3>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "8px" }}>Medicine</th><th style={{ textAlign: "right", padding: "8px" }}>Qty</th></tr></thead>
                      <tbody>
                        {consumption.map((c: any, i: number) => (
                          <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "8px" }}>{c.medicine_name}</td>
                            <td style={{ padding: "8px", textAlign: "right" }}>{c.total_qty}</td>
                          </tr>
                        ))}
                        {consumption.length === 0 && <tr><td colSpan={2} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No dispense data.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

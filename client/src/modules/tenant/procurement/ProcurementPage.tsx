import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { API_BASE_URL as API_BASE } from "../../../config/api";

function getHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "x-tenant-id": localStorage.getItem("tenant") || ""
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

export default function ProcurementPage() {
  const [tab, setTab] = useState<"dashboard" | "contracts" | "requisitions" | "orders" | "grn" | "matches">("dashboard");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [contracts, setContracts] = useState<any[]>([]);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [grns, setGrns] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);

  const [contractForm, setContractForm] = useState({ supplier_name: "", item_name: "", rate: 0, effective_from: "", effective_to: "" });
  const [reqForm, setReqForm] = useState({ source_module: "PHARMACY", priority: "NORMAL", requested_by: "", items: [{ item_name: "", required_qty: 1 }] });
  const [poForm, setPoForm] = useState({ supplier_name: "", expected_delivery: "", items: [{ item_name: "", qty_ordered: 1, unit_rate: 0 }] });
  const [selectedPo, setSelectedPo] = useState<any>(null);
  const [selectedGrn, setSelectedGrn] = useState<any>(null);
  const [recvForm, setRecvForm] = useState({ invoice_ref: "" });

  const fetchAll = async () => {
    try {
      const [c, r, o, g, m] = await Promise.all([
        axios.get(`${API_BASE}/api/procurement/rate-contracts`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/procurement/requisitions`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/procurement/purchase-orders`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/procurement/grn`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/procurement/matches`, { headers: getHeaders() }),
      ]);
      setContracts(c.data || []);
      setRequisitions(r.data || []);
      setOrders(o.data || []);
      setGrns(g.data || []);
      setMatches(m.data || []);
    } catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (tab !== "dashboard") fetchAll(); }, [tab]);

  // contracts
  const saveContract = async (e: any) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/procurement/rate-contracts`, contractForm, { headers: getHeaders() });
      setContractForm({ supplier_name: "", item_name: "", rate: 0, effective_from: "", effective_to: "" });
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
  };

  // requisitions
  const generatePR = async () => {
    setBusy(true); setError("");
    try {
      const res = await axios.post(`${API_BASE}/api/procurement/requisitions/generate`, {}, { headers: getHeaders() });
      setError(`Auto-PR done: ${res.data?.created ?? 0} created.`);
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
  };

  const saveRequisition = async (e: any) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/procurement/requisitions`, reqForm, { headers: getHeaders() });
      setReqForm({ source_module: "PHARMACY", priority: "NORMAL", requested_by: "", items: [{ item_name: "", required_qty: 1 }] });
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
  };

  const approveReq = async (id: string) => {
    try { await axios.post(`${API_BASE}/api/procurement/requisitions/${id}/approve`, {}, { headers: getHeaders() }); fetchAll(); }
    catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  const convertReq = async (id: string) => {
    setBusy(true); setError("");
    try {
      const res = await axios.post(`${API_BASE}/api/procurement/requisitions/${id}/convert`, {}, { headers: getHeaders() });
      setError(`Converted to ${res.data?.po_no || "PO"}.`);
      fetchAll();
    } catch (e: any) { setError(e.response?.data?.error || e.message); } finally { setBusy(false); }
  };

  // purchase orders
  const savePO = async (e: any) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const res = await axios.post(`${API_BASE}/api/procurement/purchase-orders`, poForm, { headers: getHeaders() });
      setError(`PO created: ${res.data?.po_no || ""}`);
      setPoForm({ supplier_name: "", expected_delivery: "", items: [{ item_name: "", qty_ordered: 1, unit_rate: 0 }] });
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
  };

  const openPO = async (id: string) => {
    try {
      const res = await axios.get(`${API_BASE}/api/procurement/purchase-orders/${id}`, { headers: getHeaders() });
      setSelectedPo(res.data);
      setRecvForm({ invoice_ref: "" });
    } catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  const receivePO = async (e: any) => {
    e.preventDefault(); if (!selectedPo) return;
    setBusy(true); setError("");
    try {
      const items = (selectedPo.items || []).map((it: any) => ({
        po_item_id: it.id, item_name: it.item_name, qty_received: it.qty_ordered - (it.received_qty || 0),
        qty_accepted: it.qty_ordered - (it.received_qty || 0), qty_rejected: 0, batch_number: "", expiry_date: "", qc_result: "PASS", qc_notes: ""
      }));
      const res = await axios.post(`${API_BASE}/api/procurement/purchase-orders/${selectedPo.id}/receive`, { ...recvForm, items }, { headers: getHeaders() });
      setError(`GRN created: ${res.data?.grn_no || ""}`);
      setSelectedPo(null);
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
  };

  const openGRN = async (id: string) => {
    try {
      const res = await axios.get(`${API_BASE}/api/procurement/grn/${id}`, { headers: getHeaders() });
      setSelectedGrn(res.data);
    } catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  const runQc = async (pass: boolean) => {
    if (!selectedGrn) return;
    setBusy(true); setError("");
    try {
      const items = (selectedGrn.items || []).map((it: any) => ({
        grn_item_id: it.id, qc_result: pass ? "PASS" : "FAIL", qc_notes: pass ? "QC approved" : "QC rejected",
        qty_accepted: pass ? it.qty_received : 0, qty_rejected: pass ? 0 : it.qty_received
      }));
      await axios.post(`${API_BASE}/api/procurement/grn/${selectedGrn.id}/qc`, { items }, { headers: getHeaders() });
      const matchRes = await axios.post(`${API_BASE}/api/procurement/grn/${selectedGrn.id}/match`, {}, { headers: getHeaders() });
      setError(matchRes.data?.match_status ? `QC ${pass ? "passed" : "quarantined"} · Match: ${matchRes.data.match_status}` : "QC saved.");
      setSelectedGrn(null);
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
  };

  const tabs = [
    { id: "dashboard" as const, label: "Dashboard" },
    { id: "contracts" as const, label: "Rate Contracts" },
    { id: "requisitions" as const, label: "Requisitions" },
    { id: "orders" as const, label: "Purchase Orders" },
    { id: "grn" as const, label: "GRN / QC" },
    { id: "matches" as const, label: "3-Way Match" },
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="Procurement & Supply Chain" />
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
                  <div className="stat-card"><div style={{ fontSize: "12px", color: "#64748b" }}>Rate Contracts</div><div style={{ fontSize: "24px", fontWeight: 900 }}>{contracts.length}</div></div>
                  <div className="stat-card"><div style={{ fontSize: "12px", color: "#64748b" }}>Requisitions</div><div style={{ fontSize: "24px", fontWeight: 900 }}>{requisitions.length}</div></div>
                  <div className="stat-card"><div style={{ fontSize: "12px", color: "#64748b" }}>Purchase Orders</div><div style={{ fontSize: "24px", fontWeight: 900 }}>{orders.length}</div></div>
                  <div className="stat-card"><div style={{ fontSize: "12px", color: "#64748b" }}>GRN Receipts</div><div style={{ fontSize: "24px", fontWeight: 900 }}>{grns.length}</div></div>
                  <div className="stat-card"><div style={{ fontSize: "12px", color: "#64748b" }}>Match Exceptions</div><div style={{ fontSize: "24px", fontWeight: 900 }}>{matches.filter((m: any) => m.match_status !== "MATCHED").length}</div></div>
                </div>
              )}

              {tab === "contracts" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Add Rate Contract</h3>
                    <form onSubmit={saveContract} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
                      <input required placeholder="Supplier" value={contractForm.supplier_name} onChange={(e) => setContractForm({ ...contractForm, supplier_name: e.target.value })} style={inputStyle} />
                      <input required placeholder="Item Name" value={contractForm.item_name} onChange={(e) => setContractForm({ ...contractForm, item_name: e.target.value })} style={inputStyle} />
                      <input type="number" required placeholder="Rate" value={contractForm.rate} onChange={(e) => setContractForm({ ...contractForm, rate: Number(e.target.value) })} style={inputStyle} />
                      <input type="date" value={contractForm.effective_from} onChange={(e) => setContractForm({ ...contractForm, effective_from: e.target.value })} style={inputStyle} />
                      <input type="date" value={contractForm.effective_to} onChange={(e) => setContractForm({ ...contractForm, effective_to: e.target.value })} style={inputStyle} />
                      <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Saving…" : "Save Contract"}</button>
                    </form>
                  </div>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 640 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "10px" }}>Supplier</th><th style={{ textAlign: "left", padding: "10px" }}>Item</th><th style={{ textAlign: "right", padding: "10px" }}>Rate</th><th style={{ textAlign: "left", padding: "10px" }}>Valid</th><th style={{ textAlign: "center", padding: "10px" }}>Current</th></tr></thead>
                      <tbody>
                        {contracts.map((c) => (
                          <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{c.supplier_name}</td>
                            <td style={{ padding: "10px" }}>{c.item_name}</td>
                            <td style={{ padding: "10px", textAlign: "right" }}>₹{Number(c.rate ?? 0).toLocaleString()}</td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{String(c.effective_from || "").slice(0, 10)} → {String(c.effective_to || "").slice(0, 10)}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}>{c.is_current ? "✅" : "—"}</td>
                          </tr>
                        ))}
                        {contracts.length === 0 && <tr><td colSpan={5} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No rate contracts.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {tab === "requisitions" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Create Requisition</h3>
                    <form onSubmit={saveRequisition} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
                      <input required placeholder="Requested By" value={reqForm.requested_by} onChange={(e) => setReqForm({ ...reqForm, requested_by: e.target.value })} style={inputStyle} />
                      <select value={reqForm.source_module} onChange={(e) => setReqForm({ ...reqForm, source_module: e.target.value })} style={inputStyle}>
                        <option value="PHARMACY">Pharmacy</option>
                        <option value="STORES">Stores</option>
                      </select>
                      <select value={reqForm.priority} onChange={(e) => setReqForm({ ...reqForm, priority: e.target.value })} style={inputStyle}>
                        <option value="NORMAL">Normal</option>
                        <option value="URGENT">Urgent</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                      {reqForm.items.map((it, idx) => (
                        <div key={idx} className="flex-responsive" style={{ gap: "8px", gridColumn: "1/-1" }}>
                          <input required placeholder="Item name" value={it.item_name} onChange={(e) => { const items = [...reqForm.items]; items[idx] = { ...it, item_name: e.target.value }; setReqForm({ ...reqForm, items }); }} style={{ ...inputStyle, flex: 2 }} />
                          <input type="number" required placeholder="Qty" value={it.required_qty} onChange={(e) => { const items = [...reqForm.items]; items[idx] = { ...it, required_qty: Number(e.target.value) }; setReqForm({ ...reqForm, items }); }} style={{ ...inputStyle, flex: 1 }} />
                          {reqForm.items.length > 1 && <button type="button" onClick={() => setReqForm({ ...reqForm, items: reqForm.items.filter((_, i) => i !== idx) })} style={{ padding: "8px 12px", borderRadius: "8px", border: "none", background: "#fee2e2", color: "#b91c1c", cursor: "pointer" }}>✕</button>}
                        </div>
                      ))}
                      <div style={{ gridColumn: "1/-1", display: "flex", gap: "10px" }}>
                        <button type="button" onClick={() => setReqForm({ ...reqForm, items: [...reqForm.items, { item_name: "", required_qty: 1 }] })} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontSize: "12px" }}>+ Add Line</button>
                        <button type="submit" disabled={busy} className="button-primary">{busy ? "Saving…" : "Create Requisition"}</button>
                        <button type="button" onClick={generatePR} disabled={busy} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f1f5f9", cursor: "pointer", fontSize: "12px" }}>⚡ Auto-PR from Reorder Levels</button>
                      </div>
                    </form>
                  </div>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 720 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "10px" }}>PR No</th><th style={{ textAlign: "left", padding: "10px" }}>Source</th><th style={{ textAlign: "left", padding: "10px" }}>Requested By</th><th style={{ textAlign: "center", padding: "10px" }}>Lines</th><th style={{ textAlign: "center", padding: "10px" }}>Status</th><th style={{ textAlign: "center", padding: "10px" }}>Actions</th></tr></thead>
                      <tbody>
                        {requisitions.map((r) => (
                          <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{r.pr_no}</td>
                            <td style={{ padding: "10px" }}>{r.source_module}</td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{r.requested_by || "—"}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}>{r.item_count ?? 0}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}><span style={pillStyle(r.status === "APPROVED" || r.status === "CONVERTED", r.status !== "REJECTED")}>{r.status}</span></td>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              {r.status === "DRAFT" && <button onClick={() => approveReq(r.id)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#dcfce7", color: "#15803d", cursor: "pointer", marginRight: "6px" }}>Approve</button>}
                              {r.status === "APPROVED" && <button onClick={() => convertReq(r.id)} disabled={busy} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#dbeafe", color: "#1d4ed8", cursor: "pointer" }}>Convert to PO</button>}
                            </td>
                          </tr>
                        ))}
                        {requisitions.length === 0 && <tr><td colSpan={6} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No requisitions.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {tab === "orders" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Create Purchase Order</h3>
                    <form onSubmit={savePO} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                      <input required placeholder="Supplier" value={poForm.supplier_name} onChange={(e) => setPoForm({ ...poForm, supplier_name: e.target.value })} style={inputStyle} />
                      <input type="date" value={poForm.expected_delivery} onChange={(e) => setPoForm({ ...poForm, expected_delivery: e.target.value })} style={inputStyle} />
                      {poForm.items.map((it, idx) => (
                        <div key={idx} className="flex-responsive" style={{ gap: "8px", gridColumn: "1/-1" }}>
                          <input required placeholder="Item name" value={it.item_name} onChange={(e) => { const items = [...poForm.items]; items[idx] = { ...it, item_name: e.target.value }; setPoForm({ ...poForm, items }); }} style={{ ...inputStyle, flex: 2 }} />
                          <input type="number" required placeholder="Qty" value={it.qty_ordered} onChange={(e) => { const items = [...poForm.items]; items[idx] = { ...it, qty_ordered: Number(e.target.value) }; setPoForm({ ...poForm, items }); }} style={{ ...inputStyle, flex: 1 }} />
                          <input type="number" required placeholder="Rate" value={it.unit_rate} onChange={(e) => { const items = [...poForm.items]; items[idx] = { ...it, unit_rate: Number(e.target.value) }; setPoForm({ ...poForm, items }); }} style={{ ...inputStyle, flex: 1 }} />
                          {poForm.items.length > 1 && <button type="button" onClick={() => setPoForm({ ...poForm, items: poForm.items.filter((_, i) => i !== idx) })} style={{ padding: "8px 12px", borderRadius: "8px", border: "none", background: "#fee2e2", color: "#b91c1c", cursor: "pointer" }}>✕</button>}
                        </div>
                      ))}
                      <div style={{ gridColumn: "1/-1", display: "flex", gap: "10px" }}>
                        <button type="button" onClick={() => setPoForm({ ...poForm, items: [...poForm.items, { item_name: "", qty_ordered: 1, unit_rate: 0 }] })} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontSize: "12px" }}>+ Add Line</button>
                        <button type="submit" disabled={busy} className="button-primary">{busy ? "Saving…" : "Create PO"}</button>
                      </div>
                    </form>
                  </div>

                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 720 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "10px" }}>PO No</th><th style={{ textAlign: "left", padding: "10px" }}>Supplier</th><th style={{ textAlign: "right", padding: "10px" }}>Total</th><th style={{ textAlign: "center", padding: "10px" }}>Status</th><th style={{ textAlign: "center", padding: "10px" }}>Actions</th></tr></thead>
                      <tbody>
                        {orders.map((o) => (
                          <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{o.po_no}</td>
                            <td style={{ padding: "10px" }}>{o.supplier_name}</td>
                            <td style={{ padding: "10px", textAlign: "right" }}>₹{Number(o.total_amount ?? 0).toLocaleString()}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}><span style={pillStyle(o.status === "RECEIVED", o.status !== "CANCELLED")}>{o.status}</span></td>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              {o.status === "DRAFT" || o.status === "SENT" ? <button onClick={() => openPO(o.id)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#dbeafe", color: "#1d4ed8", cursor: "pointer" }}>Receive (GRN)</button> : "—"}
                            </td>
                          </tr>
                        ))}
                        {orders.length === 0 && <tr><td colSpan={5} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No purchase orders.</td></tr>}
                      </tbody>
                    </table>
                  </div>

                  {selectedPo && (
                    <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginTop: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                      <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Receive {selectedPo.po_no}</h3>
                      <form onSubmit={receivePO} className="grid-responsive" style={{ gap: "12px" }}>
                        <input required placeholder="Invoice Ref (e.g. INV-2026-101)" value={recvForm.invoice_ref} onChange={(e) => setRecvForm({ ...recvForm, invoice_ref: e.target.value })} style={{ ...inputStyle, maxWidth: 300 }} />
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                          <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "8px" }}>Item</th><th style={{ textAlign: "right", padding: "8px" }}>Ordered</th><th style={{ textAlign: "right", padding: "8px" }}>Received</th></tr></thead>
                          <tbody>
                            {(selectedPo.items || []).map((it: any) => (
                              <tr key={it.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "8px" }}>{it.item_name}</td>
                                <td style={{ padding: "8px", textAlign: "right" }}>{it.qty_ordered}</td>
                                <td style={{ padding: "8px", textAlign: "right" }}>{it.qty_ordered - (it.received_qty || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button type="submit" disabled={busy} className="button-primary">{busy ? "Receiving…" : "Create GRN"}</button>
                          <button type="button" onClick={() => setSelectedPo(null)} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer" }}>Cancel</button>
                        </div>
                      </form>
                    </div>
                  )}
                </>
              )}

              {tab === "grn" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 720 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "10px" }}>GRN No</th><th style={{ textAlign: "left", padding: "10px" }}>PO</th><th style={{ textAlign: "left", padding: "10px" }}>Invoice</th><th style={{ textAlign: "left", padding: "10px" }}>Received</th><th style={{ textAlign: "center", padding: "10px" }}>Status</th><th style={{ textAlign: "center", padding: "10px" }}>Actions</th></tr></thead>
                      <tbody>
                        {grns.map((g) => (
                          <tr key={g.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{g.grn_no}</td>
                            <td style={{ padding: "10px" }}>{g.po_no || g.po_id}</td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{g.invoice_ref || "—"}</td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{new Date(g.received_at).toLocaleString()}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}><span style={pillStyle(g.status === "APPROVED", g.status !== "REJECTED")}>{g.status}</span></td>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              {g.status === "UNDER_QC" || g.status === "DRAFT" ? (
                                <>
                                  <button onClick={() => openGRN(g.id)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#dbeafe", color: "#1d4ed8", cursor: "pointer" }}>QC</button>
                                </>
                              ) : "—"}
                            </td>
                          </tr>
                        ))}
                        {grns.length === 0 && <tr><td colSpan={6} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No GRNs. Receive a PO to create one.</td></tr>}
                      </tbody>
                    </table>
                  </div>

                  {selectedGrn && (
                    <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginTop: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                      <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Quality Check — {selectedGrn.grn_no}</h3>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "8px" }}>Item</th><th style={{ textAlign: "right", padding: "8px" }}>Qty</th><th style={{ textAlign: "left", padding: "8px" }}>Batch</th><th style={{ textAlign: "left", padding: "8px" }}>Expiry</th></tr></thead>
                        <tbody>
                          {(selectedGrn.items || []).map((it: any) => (
                            <tr key={it.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "8px" }}>{it.item_name}</td>
                              <td style={{ padding: "8px", textAlign: "right" }}>{it.qty_received}</td>
                              <td style={{ padding: "8px" }}>{it.batch_number || "—"}</td>
                              <td style={{ padding: "8px" }}>{it.expiry_date ? String(it.expiry_date).slice(0, 10) : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                        <button onClick={() => runQc(true)} disabled={busy} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#dcfce7", color: "#15803d", cursor: "pointer", fontWeight: 700 }}>Approve (PASS → stock)</button>
                        <button onClick={() => runQc(false)} disabled={busy} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#fee2e2", color: "#b91c1c", cursor: "pointer", fontWeight: 700 }}>Reject (FAIL → quarantine)</button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {tab === "matches" && (
                <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 720 }}>
                    <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "10px" }}>PO</th><th style={{ textAlign: "left", padding: "10px" }}>GRN</th><th style={{ textAlign: "left", padding: "10px" }}>Invoice</th><th style={{ textAlign: "right", padding: "10px" }}>PO Amt</th><th style={{ textAlign: "right", padding: "10px" }}>GRN Amt</th><th style={{ textAlign: "center", padding: "10px" }}>Status</th></tr></thead>
                    <tbody>
                      {matches.map((m) => (
                        <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px", fontWeight: 700 }}>{m.po_no}</td>
                          <td style={{ padding: "10px" }}>{m.grn_no}</td>
                          <td style={{ padding: "10px", color: "#64748b" }}>{m.invoice_ref || "—"}</td>
                          <td style={{ padding: "10px", textAlign: "right" }}>₹{Number(m.po_amount ?? 0).toLocaleString()}</td>
                          <td style={{ padding: "10px", textAlign: "right" }}>₹{Number(m.grn_amount ?? 0).toLocaleString()}</td>
                          <td style={{ padding: "10px", textAlign: "center" }}><span style={pillStyle(m.match_status === "MATCHED", m.match_status !== "NO_INVOICE")}>{m.match_status}</span></td>
                        </tr>
                      ))}
                      {matches.length === 0 && <tr><td colSpan={6} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No matching records yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

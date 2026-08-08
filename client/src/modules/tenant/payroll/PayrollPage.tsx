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

const fmt = (n: any) => "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PayrollPage() {
  const [tab, setTab] = useState<"runs" | "rules" | "statutory">("runs");
  const [runs, setRuns] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [statutory, setStatutory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [payslip, setPayslip] = useState<any>(null);
  const [error, setError] = useState("");

  const [ruleForm, setRuleForm] = useState({
    name: "", staffRole: "", baseSalary: "", dearnessAllowance: "", houseRentAllowance: "",
    otherAllowance: "", incentivePct: "", deductionPct: ""
  });
  const [statForm, setStatForm] = useState({ state: "", pfPct: "", esiPct: "", professionalTaxYearly: "" });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r, ru, st] = await Promise.all([
        axios.get(`${API_BASE}/api/payroll/runs`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/payroll/rules`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/payroll/statutory`, { headers: getHeaders() }),
      ]);
      setRuns(r.data || []);
      setRules(ru.data || []);
      setStatutory(st.data || []);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openRun = async (runMonth: string) => {
    try {
      const res = await axios.get(`${API_BASE}/api/payroll/runs/${runMonth}`, { headers: getHeaders() });
      setSelectedRun(res.data);
      setPayslip(null);
      setError("");
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    }
  };

  const generateRun = async () => {
    setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/payroll/runs/${month}/generate`, {}, { headers: getHeaders() });
      await fetchAll();
      await openRun(month);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally { setBusy(false); }
  };

  const finalizeRun = async (runMonth: string) => {
    setBusy(true); setError("");
    try {
      const res = await axios.post(`${API_BASE}/api/payroll/runs/${runMonth}/finalize`, {}, { headers: getHeaders() });
      if (res.data) await openRun(runMonth);
      await fetchAll();
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally { setBusy(false); }
  };

  const viewPayslip = async (staffId: string) => {
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/api/payroll/runs/${selectedRun?.run_month}/slips/${staffId}`, { headers: getHeaders() });
      setPayslip(res.data);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    }
  };

  const downloadPayslip = (staffId: string) => {
    const url = `${API_BASE}/api/payroll/runs/${selectedRun?.run_month}/slips/${staffId}/pdf`;
    const w = window.open(url, "_blank");
    if (w) w.focus();
  };

  // ── Rules CRUD ─────────────────────────────────────────────
  const saveRule = async (e: any) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/payroll/rules`, {
        ...ruleForm,
        baseSalary: ruleForm.baseSalary, dearnessAllowance: ruleForm.dearnessAllowance,
        houseRentAllowance: ruleForm.houseRentAllowance, otherAllowance: ruleForm.otherAllowance,
        incentivePct: ruleForm.incentivePct, deductionPct: ruleForm.deductionPct
      }, { headers: getHeaders() });
      setRuleForm({ name: "", staffRole: "", baseSalary: "", dearnessAllowance: "", houseRentAllowance: "", otherAllowance: "", incentivePct: "", deductionPct: "" });
      await fetchAll();
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally { setBusy(false); }
  };

  const toggleRule = async (r: any) => {
    try {
      await axios.put(`${API_BASE}/api/payroll/rules/${r.id}`, { isActive: !r.is_active }, { headers: getHeaders() });
      await fetchAll();
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    }
  };

  const saveStatutory = async (e: any) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/payroll/statutory`, {
        state: statForm.state || "All India",
        pfPct: statForm.pfPct, esiPct: statForm.esiPct, professionalTaxYearly: statForm.professionalTaxYearly
      }, { headers: getHeaders() });
      setStatForm({ state: "", pfPct: "", esiPct: "", professionalTaxYearly: "" });
      await fetchAll();
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="Payroll & Compensation Processing" />
        <div style={{ padding: "20px 24px" }}>

          {error && (
            <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "12px 16px", borderRadius: "12px", marginBottom: "16px", fontSize: "13px", fontWeight: 600 }}>
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex-responsive" style={{ gap: "10px", marginBottom: "20px" }}>
            {(["runs", "rules", "statutory"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="button-primary"
                style={{ background: tab === t ? "#1e3a8a" : "#e2e8f0", color: tab === t ? "white" : "#334155", border: "none" }}
              >
                {t === "runs" ? "Payroll Runs" : t === "rules" ? "Salary Rules" : "Statutory Config"}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="stat-card" style={{ textAlign: "center", color: "#64748b" }}>Loading payroll data…</div>
          ) : tab === "runs" ? (
            <>
              {/* Generate run */}
              <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                <div className="flex-responsive" style={{ alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 800, marginBottom: "4px" }}>Generate Monthly Payroll</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>Computes salary, PF/ESI/PT and doctor incentives from billing for a month.</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <input
                      type="month"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "10px", fontSize: "14px" }}
                    />
                  </div>
                  <button onClick={generateRun} disabled={busy} className="button-primary" style={{ whiteSpace: "nowrap" }}>
                    {busy ? "Generating…" : "Generate Run"}
                  </button>
                </div>
              </div>

              {/* Runs list */}
              <div className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                {runs.length === 0 && (
                  <div className="stat-card" style={{ color: "#64748b", textAlign: "center", gridColumn: "1/-1" }}>No payroll runs yet. Generate one above.</div>
                )}
                {runs.map((r) => (
                  <div key={r.id} className="stat-card" style={{ background: "white", borderRadius: "16px", padding: "18px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{ fontSize: "16px", fontWeight: 900, color: "#1e3a8a" }}>{r.run_month}</span>
                      <span style={{ fontSize: "11px", fontWeight: 800, padding: "3px 10px", borderRadius: "20px", background: r.status === "FINALIZED" ? "#dcfce7" : "#fef3c7", color: r.status === "FINALIZED" ? "#15803d" : "#b45309" }}>
                        {r.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "14px" }}>
                      {r.employee_count || 0} employees · Generated by {r.generated_by_name || "-"}
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button onClick={() => openRun(r.run_month)} className="button-primary" style={{ flex: 1, padding: "8px 12px", fontSize: "12px" }}>View</button>
                      {r.status !== "FINALIZED" && (
                        <button onClick={() => finalizeRun(r.run_month)} disabled={busy} style={{ flex: 1, padding: "8px 12px", fontSize: "12px", borderRadius: "10px", border: "none", background: "#059669", color: "white", cursor: "pointer" }}>Finalize</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Run detail */}
              {selectedRun && (
                <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginTop: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 900 }}>
                      Run {selectedRun.run_month} · <span style={{ color: "#64748b", fontSize: "13px" }}>{selectedRun.items?.length || 0} employees</span>
                    </h3>
                    <button onClick={() => { setSelectedRun(null); setPayslip(null); }} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "13px" }}>Close ✕</button>
                  </div>
                  <div className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                    <div className="stat-card"><div style={{ fontSize: "11px", color: "#64748b" }}>Gross Total</div><div style={{ fontSize: "16px", fontWeight: 900 }}>{fmt(selectedRun.gross_total)}</div></div>
                    <div className="stat-card"><div style={{ fontSize: "11px", color: "#64748b" }}>Deductions</div><div style={{ fontSize: "16px", fontWeight: 900 }}>{fmt(selectedRun.deduction_total)}</div></div>
                    <div className="stat-card"><div style={{ fontSize: "11px", color: "#64748b" }}>Net Payable</div><div style={{ fontSize: "16px", fontWeight: 900, color: "#059669" }}>{fmt(selectedRun.net_total)}</div></div>
                  </div>

                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#f1f5f9" }}>
                        <th style={{ textAlign: "left", padding: "10px" }}>Employee</th>
                        <th style={{ textAlign: "left", padding: "10px" }}>Role</th>
                        <th style={{ textAlign: "right", padding: "10px" }}>Gross</th>
                        <th style={{ textAlign: "right", padding: "10px" }}>Deductions</th>
                        <th style={{ textAlign: "right", padding: "10px" }}>Net</th>
                        <th style={{ textAlign: "center", padding: "10px" }}>Payslip</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedRun.items || []).map((it: any) => (
                        <tr key={it.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px", fontWeight: 700 }}>{it.staff_name || "-"}</td>
                          <td style={{ padding: "10px", color: "#64748b" }}>{it.staff_role || "-"}</td>
                          <td style={{ padding: "10px", textAlign: "right" }}>{fmt(it.gross_amount)}</td>
                          <td style={{ padding: "10px", textAlign: "right" }}>{fmt(it.deduction_amount)}</td>
                          <td style={{ padding: "10px", textAlign: "right", fontWeight: 800, color: "#059669" }}>{fmt(it.net_amount)}</td>
                          <td style={{ padding: "10px", textAlign: "center" }}>
                            <button onClick={() => viewPayslip(it.staff_user_id)} style={{ marginRight: "6px", padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#1e3a8a", color: "white", cursor: "pointer" }}>View</button>
                            <button onClick={() => downloadPayslip(it.staff_user_id)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", color: "#334155", cursor: "pointer" }}>PDF</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Payslip modal */}
              {payslip && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "20px" }}>
                  <div style={{ background: "white", borderRadius: "16px", maxWidth: 640, width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "24px", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 900 }}>Payslip · {payslip.run?.run_month}</h3>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => downloadPayslip(payslip.staff_user_id)} className="button-primary" style={{ fontSize: "12px" }}>Print / PDF</button>
                        <button onClick={() => setPayslip(null)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "14px" }}>✕</button>
                      </div>
                    </div>
                    <div className="grid-responsive" style={{ gridTemplateColumns: "1fr 1fr", gap: "8px 20px", fontSize: "13px", marginBottom: "16px" }}>
                      <div><b style={{ color: "#64748b", fontSize: "11px" }}>EMPLOYEE</b><br />{payslip.staff_name || "-"}</div>
                      <div><b style={{ color: "#64748b", fontSize: "11px" }}>ROLE</b><br />{payslip.staff_role || "-"}</div>
                      <div><b style={{ color: "#64748b", fontSize: "11px" }}>DEPARTMENT</b><br />{payslip.department || "-"}</div>
                      <div><b style={{ color: "#64748b", fontSize: "11px" }}>EMAIL</b><br />{payslip.email || "-"}</div>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "#f1f5f9" }}>
                          <th style={{ textAlign: "left", padding: "8px" }}>Component</th>
                          <th style={{ textAlign: "right", padding: "8px" }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(payslip.slipItems || []).map((s: any) => (
                          <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "8px" }}>{s.label} <span style={{ fontSize: "10px", color: s.type === "EARNING" ? "#15803d" : "#b91c1c", fontWeight: 800 }}>{s.type === "EARNING" ? "+" : "−"}</span></td>
                            <td style={{ padding: "8px", textAlign: "right" }}>{fmt(s.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "20px", marginTop: "16px", fontSize: "13px" }}>
                      <div>Gross <b>{fmt(payslip.gross_amount)}</b></div>
                      <div>Deductions <b>{fmt(payslip.deduction_amount)}</b></div>
                      <div style={{ background: "#dcfce7", padding: "6px 14px", borderRadius: "8px", fontWeight: 900 }}>Net {fmt(payslip.net_amount)}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : tab === "rules" ? (
            <>
              {/* Add rule */}
              <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Add Salary Rule</h3>
                <form onSubmit={saveRule} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
                  <input required placeholder="Name" value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} style={inputStyle} />
                  <input required placeholder="staffRole (e.g. doctor)" value={ruleForm.staffRole} onChange={(e) => setRuleForm({ ...ruleForm, staffRole: e.target.value })} style={inputStyle} />
                  <input type="number" placeholder="Base Salary" value={ruleForm.baseSalary} onChange={(e) => setRuleForm({ ...ruleForm, baseSalary: e.target.value })} style={inputStyle} />
                  <input type="number" placeholder="DA %/₹" value={ruleForm.dearnessAllowance} onChange={(e) => setRuleForm({ ...ruleForm, dearnessAllowance: e.target.value })} style={inputStyle} />
                  <input type="number" placeholder="HRA" value={ruleForm.houseRentAllowance} onChange={(e) => setRuleForm({ ...ruleForm, houseRentAllowance: e.target.value })} style={inputStyle} />
                  <input type="number" placeholder="Other Allowance" value={ruleForm.otherAllowance} onChange={(e) => setRuleForm({ ...ruleForm, otherAllowance: e.target.value })} style={inputStyle} />
                  <input type="number" placeholder="Incentive %" value={ruleForm.incentivePct} onChange={(e) => setRuleForm({ ...ruleForm, incentivePct: e.target.value })} style={inputStyle} />
                  <input type="number" placeholder="Deduction %" value={ruleForm.deductionPct} onChange={(e) => setRuleForm({ ...ruleForm, deductionPct: e.target.value })} style={inputStyle} />
                  <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Saving…" : "Save Rule"}</button>
                </form>
              </div>

              <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 720 }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9" }}>
                      <th style={{ textAlign: "left", padding: "10px" }}>Name</th>
                      <th style={{ textAlign: "left", padding: "10px" }}>Role</th>
                      <th style={{ textAlign: "right", padding: "10px" }}>Base</th>
                      <th style={{ textAlign: "right", padding: "10px" }}>DA</th>
                      <th style={{ textAlign: "right", padding: "10px" }}>HRA</th>
                      <th style={{ textAlign: "right", padding: "10px" }}>Other</th>
                      <th style={{ textAlign: "right", padding: "10px" }}>Incentive %</th>
                      <th style={{ textAlign: "right", padding: "10px" }}>Deduction %</th>
                      <th style={{ textAlign: "center", padding: "10px" }}>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((r) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9", opacity: r.is_active ? 1 : 0.5 }}>
                        <td style={{ padding: "10px", fontWeight: 700 }}>{r.name}</td>
                        <td style={{ padding: "10px", color: "#64748b" }}>{r.staff_role}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{fmt(r.base_salary)}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{fmt(r.dearness_allowance)}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{fmt(r.house_rent_allowance)}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{fmt(r.other_allowance)}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{Number(r.incentive_pct || 0)}%</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{Number(r.deduction_pct || 0)}%</td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <button onClick={() => toggleRule(r)} style={{ padding: "5px 12px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: 800, background: r.is_active ? "#dcfce7" : "#fee2e2", color: r.is_active ? "#15803d" : "#b91c1c" }}>
                            {r.is_active ? "ACTIVE" : "OFF"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Add Statutory Config</h3>
                <form onSubmit={saveStatutory} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
                  <input placeholder="State" value={statForm.state} onChange={(e) => setStatForm({ ...statForm, state: e.target.value })} style={inputStyle} />
                  <input type="number" placeholder="PF %" value={statForm.pfPct} onChange={(e) => setStatForm({ ...statForm, pfPct: e.target.value })} style={inputStyle} />
                  <input type="number" placeholder="ESI %" value={statForm.esiPct} onChange={(e) => setStatForm({ ...statForm, esiPct: e.target.value })} style={inputStyle} />
                  <input type="number" placeholder="Prof Tax / Year" value={statForm.professionalTaxYearly} onChange={(e) => setStatForm({ ...statForm, professionalTaxYearly: e.target.value })} style={inputStyle} />
                  <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Saving…" : "Save Config"}</button>
                </form>
              </div>

              <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 520 }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9" }}>
                      <th style={{ textAlign: "left", padding: "10px" }}>State</th>
                      <th style={{ textAlign: "right", padding: "10px" }}>PF %</th>
                      <th style={{ textAlign: "right", padding: "10px" }}>ESI %</th>
                      <th style={{ textAlign: "right", padding: "10px" }}>Prof Tax (yr)</th>
                      <th style={{ textAlign: "center", padding: "10px" }}>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statutory.map((s) => (
                      <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px", fontWeight: 700 }}>{s.state}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{Number(s.pf_pct || 0)}%</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{Number(s.esi_pct || 0)}%</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{fmt(s.professional_tax_yearly)}</td>
                        <td style={{ padding: "10px", textAlign: "center" }}>{s.is_active ? "✅" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  fontSize: "13px",
  width: "100%",
  background: "white",
};

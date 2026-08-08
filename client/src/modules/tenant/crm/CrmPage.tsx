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

export default function CrmPage() {
  const [tab, setTab] = useState<"dedup" | "identifiers" | "groups" | "consents" | "referrals" | "corporate" | "slots">("dedup");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [identifiers, setIdentifiers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [consents, setConsents] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [corporate, setCorporate] = useState<any[]>([]);

  const [dedupForm, setDedupForm] = useState({ name: "", phone: "", email: "", dob: "" });
  const [idForm, setIdForm] = useState({ patient_id: "", id_type: "MOBILE", id_value: "" });
  const [groupForm, setGroupForm] = useState({ group_name: "", primary_patient_id: "" });
  const [consentForm, setConsentForm] = useState({ patient_id: "", consent_type: "MARKETING", status: "GRANTED" });
  const [referralForm, setReferralForm] = useState({ patient_id: "", referring_doctor_id: "", referred_to_doctor_id: "", reason: "" });
  const [corpForm, setCorpForm] = useState({ name: "", type: "CORPORATE", credit_limit: 0 });
  const [slotForm, setSlotForm] = useState({ date: new Date().toISOString().slice(0, 10), doctor_id: "", patient_id: "", time: "10:00" });
  const [slots, setSlots] = useState<any[]>([]);

  const fetchAll = async () => {
    try {
      const [d, i, g, c, r, co] = await Promise.all([
        axios.get(`${API_BASE}/api/crm/patients/duplicates`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/crm/identifiers`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/crm/groups`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/crm/consents`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/crm/referrals`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/crm/corporate`, { headers: getHeaders() }),
      ]);
      setDuplicates(d.data || []);
      setIdentifiers(i.data || []);
      setGroups(g.data || []);
      setConsents(c.data || []);
      setReferrals(r.data || []);
      setCorporate(co.data || []);
    } catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (tab !== "dedup") fetchAll(); }, [tab]);

  const runDedup = async (e: any) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const res = await axios.post(`${API_BASE}/api/crm/patients/deduplicate`, dedupForm, { headers: getHeaders() });
      setError(`Dedup scan done: ${res.data?.matches?.length ?? 0} potential duplicate(s).`);
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
  };

  const mergeDup = async (id: string, keepId: string) => {
    try { await axios.post(`${API_BASE}/api/crm/patients/merge`, { duplicate_id: id, keep_patient_id: keepId }, { headers: getHeaders() }); fetchAll(); }
    catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  const dismissDup = async (id: string) => {
    try { await axios.post(`${API_BASE}/api/crm/patients/dismiss`, { duplicate_id: id }, { headers: getHeaders() }); fetchAll(); }
    catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  const saveIdentifier = async (e: any) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/crm/identifiers`, idForm, { headers: getHeaders() });
      setIdForm({ patient_id: "", id_type: "MOBILE", id_value: "" });
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
  };

  const saveGroup = async (e: any) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/crm/groups`, groupForm, { headers: getHeaders() });
      setGroupForm({ group_name: "", primary_patient_id: "" });
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
  };

  const saveConsent = async (e: any) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/crm/consents`, consentForm, { headers: getHeaders() });
      setConsentForm({ patient_id: "", consent_type: "MARKETING", status: "GRANTED" });
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
  };

  const revokeConsent = async (id: string) => {
    try { await axios.post(`${API_BASE}/api/crm/consents/${id}/revoke`, {}, { headers: getHeaders() }); fetchAll(); }
    catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  const saveReferral = async (e: any) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/crm/referrals`, referralForm, { headers: getHeaders() });
      setReferralForm({ patient_id: "", referring_doctor_id: "", referred_to_doctor_id: "", reason: "" });
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
  };

  const saveCorporate = async (e: any) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      await axios.post(`${API_BASE}/api/crm/corporate`, corpForm, { headers: getHeaders() });
      setCorpForm({ name: "", type: "CORPORATE", credit_limit: 0 });
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
  };

  const loadSlots = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/crm/slots/availability`, { headers: getHeaders(), params: { date: slotForm.date, doctor_id: slotForm.doctor_id || undefined } });
      setSlots(res.data?.slots || []);
    } catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  const bookSlot = async (time: string) => {
    setBusy(true); setError("");
    try {
      const res = await axios.post(`${API_BASE}/api/crm/slots/book`, { ...slotForm, time }, { headers: getHeaders() });
      setError(res.data?.ok ? `Booked successfully.` : res.data?.error || "Could not book slot.");
      loadSlots();
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
  };

  const tabs = [
    { id: "dedup" as const, label: "Dedup" },
    { id: "identifiers" as const, label: "Identifiers" },
    { id: "groups" as const, label: "Family" },
    { id: "consents" as const, label: "Consents" },
    { id: "referrals" as const, label: "Referrals" },
    { id: "corporate" as const, label: "Corporate" },
    { id: "slots" as const, label: "Slots" },
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="Patient Relationship Management (CRM)" />
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
              {tab === "dedup" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Scan for Duplicate Patients</h3>
                    <form onSubmit={runDedup} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                      <input required placeholder="Name" value={dedupForm.name} onChange={(e) => setDedupForm({ ...dedupForm, name: e.target.value })} style={inputStyle} />
                      <input placeholder="Phone" value={dedupForm.phone} onChange={(e) => setDedupForm({ ...dedupForm, phone: e.target.value })} style={inputStyle} />
                      <input placeholder="Email" value={dedupForm.email} onChange={(e) => setDedupForm({ ...dedupForm, email: e.target.value })} style={inputStyle} />
                      <input type="date" value={dedupForm.dob} onChange={(e) => setDedupForm({ ...dedupForm, dob: e.target.value })} style={inputStyle} />
                      <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Scanning…" : "Scan"}</button>
                    </form>
                  </div>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 640 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "10px" }}>Patient</th><th style={{ textAlign: "left", padding: "10px" }}>Duplicate Of</th><th style={{ textAlign: "center", padding: "10px" }}>Score</th><th style={{ textAlign: "center", padding: "10px" }}>Status</th><th style={{ textAlign: "center", padding: "10px" }}>Actions</th></tr></thead>
                      <tbody>
                        {duplicates.map((d) => (
                          <tr key={d.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{d.patient_name || d.patient_id}</td>
                            <td style={{ padding: "10px" }}>{d.duplicate_of_name || d.duplicate_of_id}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}>{Math.round((d.match_score || 0) * 100)}%</td>
                            <td style={{ padding: "10px", textAlign: "center" }}><span style={pillStyle(d.status === "MERGED", d.status === "PENDING")}>{d.status}</span></td>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              {d.status === "PENDING" && (
                                <>
                                  <button onClick={() => mergeDup(d.id, d.duplicate_of_id)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#dcfce7", color: "#15803d", cursor: "pointer", marginRight: "6px" }}>Merge</button>
                                  <button onClick={() => dismissDup(d.id)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#f1f5f9", color: "#475569", cursor: "pointer" }}>Dismiss</button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                        {duplicates.length === 0 && <tr><td colSpan={5} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No duplicate candidates.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {tab === "identifiers" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Add Identifier</h3>
                    <form onSubmit={saveIdentifier} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                      <input required placeholder="Patient ID" value={idForm.patient_id} onChange={(e) => setIdForm({ ...idForm, patient_id: e.target.value })} style={inputStyle} />
                      <select value={idForm.id_type} onChange={(e) => setIdForm({ ...idForm, id_type: e.target.value })} style={inputStyle}>
                        <option value="MOBILE">Mobile</option>
                        <option value="AADHAAR">Aadhaar</option>
                        <option value="UHID">UHID</option>
                        <option value="ABHA">ABHA</option>
                        <option value="PAN">PAN</option>
                      </select>
                      <input required placeholder="Value" value={idForm.id_value} onChange={(e) => setIdForm({ ...idForm, id_value: e.target.value })} style={inputStyle} />
                      <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Saving…" : "Save Identifier"}</button>
                    </form>
                  </div>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 560 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "10px" }}>Patient</th><th style={{ textAlign: "left", padding: "10px" }}>Type</th><th style={{ textAlign: "left", padding: "10px" }}>Value</th><th style={{ textAlign: "center", padding: "10px" }}>Primary</th><th style={{ textAlign: "center", padding: "10px" }}>Verified</th></tr></thead>
                      <tbody>
                        {identifiers.map((i) => (
                          <tr key={i.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{i.patient_id}</td>
                            <td style={{ padding: "10px" }}>{i.id_type}</td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{i.id_value}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}>{i.is_primary ? "✅" : "—"}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}>{i.verified ? "✅" : "—"}</td>
                          </tr>
                        ))}
                        {identifiers.length === 0 && <tr><td colSpan={5} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No identifiers.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {tab === "groups" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Create Family Group</h3>
                    <form onSubmit={saveGroup} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                      <input required placeholder="Group Name" value={groupForm.group_name} onChange={(e) => setGroupForm({ ...groupForm, group_name: e.target.value })} style={inputStyle} />
                      <input required placeholder="Primary Patient ID" value={groupForm.primary_patient_id} onChange={(e) => setGroupForm({ ...groupForm, primary_patient_id: e.target.value })} style={inputStyle} />
                      <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Saving…" : "Create Group"}</button>
                    </form>
                  </div>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 480 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "10px" }}>Group</th><th style={{ textAlign: "left", padding: "10px" }}>Primary</th><th style={{ textAlign: "center", padding: "10px" }}>Members</th></tr></thead>
                      <tbody>
                        {groups.map((g) => (
                          <tr key={g.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{g.group_name}</td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{g.primary_patient_id}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}>{g.member_count ?? 0}</td>
                          </tr>
                        ))}
                        {groups.length === 0 && <tr><td colSpan={3} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No family groups.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {tab === "consents" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Record Consent</h3>
                    <form onSubmit={saveConsent} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                      <input required placeholder="Patient ID" value={consentForm.patient_id} onChange={(e) => setConsentForm({ ...consentForm, patient_id: e.target.value })} style={inputStyle} />
                      <select value={consentForm.consent_type} onChange={(e) => setConsentForm({ ...consentForm, consent_type: e.target.value })} style={inputStyle}>
                        <option value="MARKETING">Marketing</option>
                        <option value="HEALTH_DATA_SHARING">Health Data Sharing</option>
                        <option value="RESEARCH">Research</option>
                        <option value="ABDM">ABDM</option>
                      </select>
                      <select value={consentForm.status} onChange={(e) => setConsentForm({ ...consentForm, status: e.target.value })} style={inputStyle}>
                        <option value="GRANTED">Granted</option>
                        <option value="REVOKED">Revoked</option>
                      </select>
                      <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Saving…" : "Save Consent"}</button>
                    </form>
                  </div>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 560 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "10px" }}>Patient</th><th style={{ textAlign: "left", padding: "10px" }}>Type</th><th style={{ textAlign: "center", padding: "10px" }}>Status</th><th style={{ textAlign: "left", padding: "10px" }}>Granted</th><th style={{ textAlign: "center", padding: "10px" }}>Actions</th></tr></thead>
                      <tbody>
                        {consents.map((c) => (
                          <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{c.patient_id}</td>
                            <td style={{ padding: "10px" }}>{c.consent_type}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}><span style={pillStyle(c.status === "GRANTED", c.status !== "REVOKED")}>{c.status}</span></td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{c.granted_at ? new Date(c.granted_at).toLocaleDateString() : "—"}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              {c.status === "GRANTED" && <button onClick={() => revokeConsent(c.id)} style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#fee2e2", color: "#b91c1c", cursor: "pointer" }}>Revoke</button>}
                            </td>
                          </tr>
                        ))}
                        {consents.length === 0 && <tr><td colSpan={5} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No consents recorded.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {tab === "referrals" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Log Referral</h3>
                    <form onSubmit={saveReferral} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                      <input required placeholder="Patient ID" value={referralForm.patient_id} onChange={(e) => setReferralForm({ ...referralForm, patient_id: e.target.value })} style={inputStyle} />
                      <input placeholder="Referring Doctor" value={referralForm.referring_doctor_id} onChange={(e) => setReferralForm({ ...referralForm, referring_doctor_id: e.target.value })} style={inputStyle} />
                      <input placeholder="Referred To Doctor" value={referralForm.referred_to_doctor_id} onChange={(e) => setReferralForm({ ...referralForm, referred_to_doctor_id: e.target.value })} style={inputStyle} />
                      <input placeholder="Reason" value={referralForm.reason} onChange={(e) => setReferralForm({ ...referralForm, reason: e.target.value })} style={inputStyle} />
                      <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Saving…" : "Save Referral"}</button>
                    </form>
                  </div>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 560 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "10px" }}>Patient</th><th style={{ textAlign: "left", padding: "10px" }}>From</th><th style={{ textAlign: "left", padding: "10px" }}>To</th><th style={{ textAlign: "center", padding: "10px" }}>Status</th><th style={{ textAlign: "left", padding: "10px" }}>Date</th></tr></thead>
                      <tbody>
                        {referrals.map((r) => (
                          <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{r.patient_id}</td>
                            <td style={{ padding: "10px" }}>{r.referring_doctor_id || "—"}</td>
                            <td style={{ padding: "10px" }}>{r.referred_to_doctor_id || "—"}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}><span style={pillStyle(r.status === "ACCEPTED", r.status !== "REJECTED")}>{r.status}</span></td>
                            <td style={{ padding: "10px", color: "#64748b" }}>{String(r.referred_on || "").slice(0, 10)}</td>
                          </tr>
                        ))}
                        {referrals.length === 0 && <tr><td colSpan={5} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No referrals.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {tab === "corporate" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Add Corporate / TPA Account</h3>
                    <form onSubmit={saveCorporate} className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                      <input required placeholder="Account Name" value={corpForm.name} onChange={(e) => setCorpForm({ ...corpForm, name: e.target.value })} style={inputStyle} />
                      <select value={corpForm.type} onChange={(e) => setCorpForm({ ...corpForm, type: e.target.value })} style={inputStyle}>
                        <option value="CORPORATE">Corporate</option>
                        <option value="TPA">TPA</option>
                        <option value="EMPLOYER">Employer</option>
                        <option value="GOVT">Government</option>
                      </select>
                      <input type="number" placeholder="Credit Limit" value={corpForm.credit_limit} onChange={(e) => setCorpForm({ ...corpForm, credit_limit: Number(e.target.value) })} style={inputStyle} />
                      <button type="submit" disabled={busy} className="button-primary" style={{ gridColumn: "1/-1", justifySelf: "start" }}>{busy ? "Saving…" : "Save Account"}</button>
                    </form>
                  </div>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 480 }}>
                      <thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: "10px" }}>Name</th><th style={{ textAlign: "left", padding: "10px" }}>Type</th><th style={{ textAlign: "right", padding: "10px" }}>Credit Limit</th><th style={{ textAlign: "center", padding: "10px" }}>Active</th></tr></thead>
                      <tbody>
                        {corporate.map((c) => (
                          <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{c.name}</td>
                            <td style={{ padding: "10px" }}>{c.type}</td>
                            <td style={{ padding: "10px", textAlign: "right" }}>₹{Number(c.credit_limit ?? 0).toLocaleString()}</td>
                            <td style={{ padding: "10px", textAlign: "center" }}>{c.is_active ? "✅" : "—"}</td>
                          </tr>
                        ))}
                        {corporate.length === 0 && <tr><td colSpan={4} style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>No corporate accounts.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {tab === "slots" && (
                <>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 900 }}>Appointment Slots</h3>
                    <div className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
                      <input type="date" value={slotForm.date} onChange={(e) => setSlotForm({ ...slotForm, date: e.target.value })} style={inputStyle} />
                      <input placeholder="Doctor ID" value={slotForm.doctor_id} onChange={(e) => setSlotForm({ ...slotForm, doctor_id: e.target.value })} style={inputStyle} />
                      <input required placeholder="Patient ID" value={slotForm.patient_id} onChange={(e) => setSlotForm({ ...slotForm, patient_id: e.target.value })} style={inputStyle} />
                      <button onClick={loadSlots} className="button-primary" style={{ justifySelf: "start" }}>Load Slots</button>
                    </div>
                  </div>
                  <div className="manage-card" style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    {slots.length === 0 && <div style={{ color: "#64748b", fontSize: "13px" }}>No slots loaded. Click "Load Slots" to see availability.</div>}
                    <div className="grid-responsive" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "8px" }}>
                      {slots.map((s: any, i: number) => (
                        <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
                          <div style={{ fontWeight: 800, fontSize: "13px" }}>{s.time}</div>
                          <div style={{ fontSize: "11px", color: "#64748b", margin: "4px 0 8px" }}>{s.status || "FREE"}</div>
                          <button onClick={() => bookSlot(s.time)} disabled={busy} style={{ padding: "5px 10px", fontSize: "11px", borderRadius: "8px", border: "none", background: "#dbeafe", color: "#1d4ed8", cursor: "pointer" }}>Book</button>
                        </div>
                      ))}
                    </div>
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

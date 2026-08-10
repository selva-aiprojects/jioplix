import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Archive, Plus, Search, Filter, FileText, CheckCircle2, ShieldAlert, Folder } from "lucide-react";
import { MetricCard, MetricsGrid } from "../../../components/MetricCard";

export default function MRDPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [mrn, setMrn] = useState("");
  const [patientName, setPatientName] = useState("");
  const [rackNo, setRackNo] = useState("RACK-04");
  const [shelfNo, setShelfNo] = useState("SHELF-B");
  const [boxNo, setBoxNo] = useState("BOX-102");
  const [isMlc, setIsMlc] = useState(false);
  const [mlcNo, setMlcNo] = useState("");
  const [icd10Code, setIcd10Code] = useState("I10");

  const fetchMRD = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const sub = localStorage.getItem("tenant") || localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/mrd/records", {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub }
      });
      const data = await res.json();
      if (data.success) setRecords(data.records || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMRD();
  }, []);

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token") || "";
      const sub = localStorage.getItem("tenant") || localStorage.getItem("activeSubdomain") || "demo";
      await fetch("/api/mrd/records", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-tenant-id": sub },
        body: JSON.stringify({
          mrn,
          patient_name: patientName,
          rack_no: rackNo,
          shelf_no: shelfNo,
          box_no: boxNo,
          is_mlc: isMlc,
          mlc_number: isMlc ? mlcNo : null,
          icd10_code: icd10Code,
          chart_status: "INDEXED"
        })
      });
      setShowModal(false);
      setPatientName(""); setMrn("");
      fetchMRD();
    } catch (e) {
      alert("Failed to submit MRD record");
    }
  };

  const filteredRecords = records.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.patient_name?.toLowerCase().includes(q) || r.mrn?.toLowerCase().includes(q) || r.rack_no?.toLowerCase().includes(q) || r.icd10_code?.toLowerCase().includes(q);
  });

  const mlcCount = records.filter(r => r.is_mlc).length;

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Medical Records Department (MRD / HIM)" subtitle="Physical File Storage Coordinates, Medico-Legal Case (MLC) Registry & ICD-10 Coding Console" />

        <div style={{ padding: "24px" }}>
          {/* Top KPI Metrics Bar */}
          <MetricsGrid minWidth="220px">
            <MetricCard
              icon={Archive}
              label="Indexed Physical Files"
              value={`${records.length} Archived`}
              iconBg="#f0f9ff"
              iconColor="#0284c7"
              accent="#0284c7"
            />
            <MetricCard
              icon={ShieldAlert}
              label="Medico-Legal (MLC) Files"
              value={`${mlcCount} Flagged`}
              iconBg="#fff7ed"
              iconColor="#c2410c"
              accent="#c2410c"
            />
            <MetricCard
              icon={FileText}
              label="ICD-10 Coded"
              value="100% Coded"
              iconBg="#faf5ff"
              iconColor="#9333ea"
              accent="#9333ea"
            />
            <MetricCard
              icon={CheckCircle2}
              label="Audit Compliance"
              value="NABH Ready"
              iconBg="#f0fdf4"
              iconColor="#16a34a"
              accent="#16a34a"
            />
          </MetricsGrid>

          {/* Search & Action Bar */}
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "20px", marginBottom: "24px", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
              <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input 
                type="text" 
                placeholder="Search patient, MRN, rack, ICD-10..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "10px 14px 10px 42px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", color: "#0f172a", fontSize: "14px" }}
              />
            </div>
            <button 
              onClick={() => setShowModal(true)}
              style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)", color: "#ffffff", padding: "12px 20px", borderRadius: "12px", border: "none", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 14px rgba(14, 165, 233, 0.35)", fontSize: "14px" }}
            >
              <Plus size={18} /> Index Physical Medical File
            </button>
          </div>

          {/* MRD Storage Table */}
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>Archived Medical Files Index</h3>
            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Loading MRD physical archive index...</div>
            ) : filteredRecords.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No physical medical records indexed yet. Click "Index Physical Medical File" to record.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>MRN / Patient</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Rack Location</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Shelf / Box</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>ICD-10 Code</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>MLC Status</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Chart Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map(r => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 900, color: "#0ea5e9" }}>
                          {r.mrn} <div style={{ fontSize: "13px", color: "#0f172a", fontWeight: 700, marginTop: "2px" }}>{r.patient_name}</div>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 800 }}>{r.rack_no}</td>
                        <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 600 }}>{r.shelf_no} / {r.box_no}</td>
                        <td style={{ padding: "14px 16px", color: "#9333ea", fontWeight: 800 }}>{r.icd10_code || 'Uncoded'}</td>
                        <td style={{ padding: "14px 16px" }}>
                          {r.is_mlc ? (
                            <span style={{ background: "#fee2e2", color: "#dc2626", padding: "4px 10px", borderRadius: "8px", fontWeight: 900, fontSize: "12px" }}>
                              MLC ({r.mlc_number || 'REG'})
                            </span>
                          ) : (
                            <span style={{ color: "#64748b", fontWeight: 600 }}>Standard</span>
                          )}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                            {r.chart_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: "#ffffff", padding: "32px", borderRadius: "24px", width: "100%", maxWidth: "520px", border: "1px solid #e2e8f0", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
              <h3 style={{ color: "#0f172a", marginTop: 0, fontWeight: 900, fontSize: "20px" }}>Index Physical Medical File</h3>
              <form onSubmit={handleCreateRecord} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Medical Record No (MRN)</label>
                    <input type="text" required value={mrn} onChange={e=>setMrn(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Patient Full Name</label>
                    <input type="text" required value={patientName} onChange={e=>setPatientName(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "12px", fontWeight: 700 }}>Rack No</label>
                    <input type="text" value={rackNo} onChange={e=>setRackNo(e.target.value)} style={{ width: "100%", padding: "8px 10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "12px", fontWeight: 700 }}>Shelf No</label>
                    <input type="text" value={shelfNo} onChange={e=>setShelfNo(e.target.value)} style={{ width: "100%", padding: "8px 10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "12px", fontWeight: 700 }}>Box No</label>
                    <input type="text" value={boxNo} onChange={e=>setBoxNo(e.target.value)} style={{ width: "100%", padding: "8px 10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", marginTop: "4px" }} />
                  </div>
                </div>
                <div>
                  <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>ICD-10 Primary Code</label>
                  <input type="text" value={icd10Code} onChange={e=>setIcd10Code(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                  <input type="checkbox" checked={isMlc} onChange={e=>setIsMlc(e.target.checked)} id="mlcCheck" />
                  <label htmlFor="mlcCheck" style={{ color: "#0f172a", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>Is Medico-Legal Case (MLC)?</label>
                </div>
                {isMlc && (
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>MLC Record Number</label>
                    <input type="text" value={mlcNo} onChange={e=>setMlcNo(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                )}
                <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: "12px", background: "#0ea5e9", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Index Record</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


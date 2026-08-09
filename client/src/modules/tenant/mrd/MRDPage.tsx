import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Plus } from "lucide-react";

export default function MRDPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [mrn, setMrn] = useState("");
  const [patientName, setPatientName] = useState("");
  const [rackNo, setRackNo] = useState("R-04");
  const [shelfNo, setShelfNo] = useState("S-02");
  const [boxNo, setBoxNo] = useState("B-12");
  const [isMlc, setIsMlc] = useState(false);
  const [mlcNumber, setMlcNumber] = useState("");
  const [chartStatus, setChartStatus] = useState("INCOMPLETE");

  const fetchMRD = async () => {
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
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
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
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
          mlc_number: mlcNumber,
          chart_status: chartStatus
        })
      });
      setShowModal(false);
      setMrn(""); setPatientName("");
      fetchMRD();
    } catch (e) {
      alert("Failed to index MRD record");
    }
  };

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Medical Records, MRD & HIM Command Center" subtitle="Physical File Location Tracking, ICD-10 Coding, Chart Audits & MLC Registers" />

        <div style={{ padding: "24px" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#0f172a", margin: 0, fontWeight: 800, fontSize: "18px" }}>Medical Records & Physical File Inventory</h3>
              <button 
                onClick={() => setShowModal(true)}
                style={{ background: "#0ea5e9", color: "#ffffff", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}
              >
                <Plus size={16} /> Index Physical Medical File
              </button>
            </div>

            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Loading records archive...</div>
            ) : records.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No MRD records found in active rack location index. Click "Index Physical Medical File" to add.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>MRN</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Patient Name</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Rack / Shelf / Box</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>MLC Status</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Coding Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map(r => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0284c7" }}>{r.mrn}</td>
                        <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a" }}>{r.patient_name}</td>
                        <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 600 }}>Rack: {r.rack_no || 'R-04'} | Shelf: {r.shelf_no || 'S-02'}</td>
                        <td style={{ padding: "14px 16px" }}>
                          {r.is_mlc ? (
                            <span style={{ background: "#fee2e2", color: "#dc2626", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                              MLC (#{r.mlc_number || 'REG-99'})
                            </span>
                          ) : (
                            <span style={{ color: "#64748b", fontSize: "12px", fontWeight: 600 }}>Non-MLC</span>
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

        {/* Index File Modal */}
        {showModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: "#ffffff", padding: "32px", borderRadius: "24px", width: "100%", maxWidth: "520px", border: "1px solid #e2e8f0", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
              <h3 style={{ color: "#0f172a", marginTop: 0, fontWeight: 900, fontSize: "20px" }}>Index Physical Medical Record File</h3>
              <form onSubmit={handleCreateRecord} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>MRN</label>
                    <input type="text" required value={mrn} onChange={e=>setMrn(e.target.value)} placeholder="MRN-10992" style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Patient Name</label>
                    <input type="text" required value={patientName} onChange={e=>setPatientName(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "12px", fontWeight: 700 }}>Rack No</label>
                    <input type="text" value={rackNo} onChange={e=>setRackNo(e.target.value)} style={{ width: "100%", padding: "10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "12px", fontWeight: 700 }}>Shelf No</label>
                    <input type="text" value={shelfNo} onChange={e=>setShelfNo(e.target.value)} style={{ width: "100%", padding: "10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "12px", fontWeight: 700 }}>Box No</label>
                    <input type="text" value={boxNo} onChange={e=>setBoxNo(e.target.value)} style={{ width: "100%", padding: "10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "4px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0f172a", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>
                    <input type="checkbox" checked={isMlc} onChange={e=>setIsMlc(e.target.checked)} /> Medico-Legal Case (MLC)
                  </label>
                  {isMlc && (
                    <input type="text" placeholder="MLC Registration No" value={mlcNumber} onChange={e=>setMlcNumber(e.target.value)} style={{ flex: 1, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "8px" }} />
                  )}
                </div>
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

import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Plus } from "lucide-react";

export default function QualityPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [incidentType, setIncidentType] = useState("MEDICATION_ERROR");
  const [department, setDepartment] = useState("ICU / Ward");
  const [severity, setSeverity] = useState("MODERATE");
  const [description, setDescription] = useState("");

  const fetchIncidents = async () => {
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/quality/incidents", {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub }
      });
      const data = await res.json();
      if (data.success) setIncidents(data.incidents || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      await fetch("/api/quality/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-tenant-id": sub },
        body: JSON.stringify({
          incident_type: incidentType,
          department,
          severity,
          description,
          status: "OPEN"
        })
      });
      setShowModal(false);
      setDescription("");
      fetchIncidents();
    } catch (e) {
      alert("Failed to report quality incident");
    }
  };

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Quality, Patient Safety & NABH Compliance" subtitle="Incident & Adverse Event Reporting, Root Cause Analysis (RCA) & Quality Indicators" />

        <div style={{ padding: "24px" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#0f172a", margin: 0, fontWeight: 800, fontSize: "18px" }}>Patient Safety & Sentinel Event Register</h3>
              <button 
                onClick={() => setShowModal(true)}
                style={{ background: "#0ea5e9", color: "#ffffff", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}
              >
                <Plus size={16} /> Report Safety Incident
              </button>
            </div>

            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Loading safety logs...</div>
            ) : incidents.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>Zero active critical safety incidents logged. NABH audit indicators green. Click "Report Safety Incident" to log event.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Incident Type</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Department</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Severity</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Description</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map(i => (
                      <tr key={i.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 800, color: "#d97706" }}>{i.incident_type}</td>
                        <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 700 }}>{i.department}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: "#fee2e2", color: "#dc2626", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                            {i.severity}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#334155" }}>{i.description}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                            {i.status}
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
              <h3 style={{ color: "#0f172a", marginTop: 0, fontWeight: 900, fontSize: "20px" }}>Report Safety / Sentinel Incident</h3>
              <form onSubmit={handleCreateIncident} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Incident Type</label>
                    <select value={incidentType} onChange={e=>setIncidentType(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }}>
                      <option value="MEDICATION_ERROR">Medication Error</option>
                      <option value="PATIENT_FALL">Patient Fall</option>
                      <option value="EQUIPMENT_FAILURE">Equipment Failure</option>
                      <option value="SENTINEL_EVENT">Sentinel Event</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Department</label>
                    <input type="text" value={department} onChange={e=>setDepartment(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                </div>
                <div>
                  <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Severity</label>
                  <select value={severity} onChange={e=>setSeverity(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }}>
                    <option value="MINOR">Minor / Near Miss</option>
                    <option value="MODERATE">Moderate Risk</option>
                    <option value="CRITICAL">Critical Sentinel Event</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Incident Description</label>
                  <textarea required value={description} onChange={e=>setDescription(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px", height: "70px" }} />
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: "12px", background: "#0ea5e9", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Submit Report</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { ShieldAlert, Plus, Search, Filter, AlertTriangle, CheckCircle2, FileText, Activity } from "lucide-react";
import { MetricCard, MetricsGrid } from "../../../components/MetricCard";

export default function QualityPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [incidentType, setIncidentType] = useState("MEDICATION_ERROR");
  const [department, setDepartment] = useState("IPD Ward 3");
  const [severity, setSeverity] = useState("MODERATE");
  const [description, setDescription] = useState("");

  const fetchIncidents = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const sub = localStorage.getItem("tenant") || localStorage.getItem("activeSubdomain") || "demo";
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
      const token = localStorage.getItem("token") || "";
      const sub = localStorage.getItem("tenant") || localStorage.getItem("activeSubdomain") || "demo";
      await fetch("/api/quality/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-tenant-id": sub },
        body: JSON.stringify({
          incident_type: incidentType,
          department,
          severity,
          description,
          action_status: "UNDER_RCA_REVIEW"
        })
      });
      setShowModal(false);
      setDescription("");
      fetchIncidents();
    } catch (e) {
      alert("Failed to submit safety incident");
    }
  };

  const filteredIncidents = incidents.filter(i => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return i.incident_type?.toLowerCase().includes(q) || i.department?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q);
  });

  const criticalCount = incidents.filter(i => i.severity === "SENTINEL" || i.severity === "HIGH").length;

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Quality & Patient Safety Desk (NABH / JCI)" subtitle="Sentinel Event Reporting, Root Cause Analysis (RCA) & Clinical Incident Audit Register" />

        <div style={{ padding: "24px" }}>
          {/* Top KPI Metrics Bar */}
          <MetricsGrid minWidth="220px">
            <MetricCard
              icon={ShieldAlert}
              label="Reported Incidents"
              value={`${incidents.length} Recorded`}
              iconBg="#f0f9ff"
              iconColor="#0284c7"
              accent="#0284c7"
            />
            <MetricCard
              icon={AlertTriangle}
              label="Sentinel / High Risks"
              value={`${criticalCount} Critical`}
              iconBg="#fff1f2"
              iconColor="#e11d48"
              accent="#e11d48"
            />
            <MetricCard
              icon={FileText}
              label="RCA Reviews Pending"
              value="2 Pending"
              iconBg="#faf5ff"
              iconColor="#9333ea"
              accent="#9333ea"
            />
            <MetricCard
              icon={CheckCircle2}
              label="NABH Quality Index"
              value="98.5% Score"
              iconBg="#f0fdf4"
              iconColor="#16a34a"
              accent="#16a34a"
            />
          </MetricsGrid>

          {/* Search & Actions Bar */}
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "20px", marginBottom: "24px", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
              <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input 
                type="text" 
                placeholder="Search incident type, department, RCA..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "10px 14px 10px 42px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", color: "#0f172a", fontSize: "14px" }}
              />
            </div>
            <button 
              onClick={() => setShowModal(true)}
              style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)", color: "#ffffff", padding: "12px 20px", borderRadius: "12px", border: "none", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 14px rgba(14, 165, 233, 0.35)", fontSize: "14px" }}
            >
              <Plus size={18} /> Report Safety Incident
            </button>
          </div>

          {/* Incidents Table */}
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>Patient Safety Incident Log</h3>
            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Loading quality incidents...</div>
            ) : filteredIncidents.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No safety incidents logged. Click "Report Safety Incident" to submit record.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Incident Category</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Department</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Severity Rating</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Description</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>RCA Action Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncidents.map(i => (
                      <tr key={i.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a" }}>{i.incident_type}</td>
                        <td style={{ padding: "14px 16px", color: "#0284c7", fontWeight: 700 }}>{i.department}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: i.severity === "SENTINEL" ? "#fee2e2" : "#fef3c7", color: i.severity === "SENTINEL" ? "#dc2626" : "#b45309", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                            {i.severity}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#334155", maxWidth: "300px" }}>{i.description}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                            {i.action_status}
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
              <h3 style={{ color: "#0f172a", marginTop: 0, fontWeight: 900, fontSize: "20px" }}>Report Patient Safety Incident</h3>
              <form onSubmit={handleCreateIncident} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Incident Category</label>
                    <select value={incidentType} onChange={e=>setIncidentType(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }}>
                      <option value="MEDICATION_ERROR">Medication Error</option>
                      <option value="PATIENT_FALL">Patient Fall</option>
                      <option value="EQUIPMENT_FAILURE">Equipment Failure</option>
                      <option value="SENTINEL_EVENT">Sentinel Event</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Severity Level</label>
                    <select value={severity} onChange={e=>setSeverity(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }}>
                      <option value="MINOR">Minor (Near Miss)</option>
                      <option value="MODERATE">Moderate</option>
                      <option value="HIGH">High Risk</option>
                      <option value="SENTINEL">Sentinel Critical</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Department Location</label>
                  <input type="text" required value={department} onChange={e=>setDepartment(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                </div>
                <div>
                  <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Incident Description & Context</label>
                  <textarea required value={description} onChange={e=>setDescription(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px", height: "80px" }} />
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


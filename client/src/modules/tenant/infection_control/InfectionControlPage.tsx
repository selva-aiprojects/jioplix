import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Plus } from "lucide-react";

export default function InfectionControlPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [patientName, setPatientName] = useState("");
  const [wardLocation, setWardLocation] = useState("ICU Bay 3");
  const [haiType, setHaiType] = useState("CLABSI");
  const [organism, setOrganism] = useState("MRSA");
  const [isolationType, setIsolationType] = useState("Contact Precautions");
  const [aspStatus, setAspStatus] = useState("APPROVED");

  const fetchInfections = async () => {
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/infection-control/surveillance", {
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
    fetchInfections();
  }, []);

  const handleCreateInfection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      await fetch("/api/infection-control/surveillance", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-tenant-id": sub },
        body: JSON.stringify({
          patient_name: patientName,
          ward_location: wardLocation,
          hai_type: haiType,
          organism_identified: organism,
          isolation_type: isolationType,
          asp_authorization_status: aspStatus
        })
      });
      setShowModal(false);
      setPatientName("");
      fetchInfections();
    } catch (e) {
      alert("Failed to log HAI surveillance case");
    }
  };

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Infection Control & Epidemiology Desk" subtitle="HAI Surveillance (CLABSI/CAUTI), Antimicrobial Stewardship & Isolation Precautions" />

        <div style={{ padding: "24px" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#0f172a", margin: 0, fontWeight: 800, fontSize: "18px" }}>Hospital-Acquired Infection (HAI) Surveillance Active Register</h3>
              <button 
                onClick={() => setShowModal(true)}
                style={{ background: "#0ea5e9", color: "#ffffff", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}
              >
                <Plus size={16} /> Log HAI Surveillance Case
              </button>
            </div>

            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Loading surveillance stream...</div>
            ) : records.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No active HAI outbreaks or restricted isolation flags reported. Click "Log HAI Surveillance Case" to add.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Patient Name</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Ward Location</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>HAI Type</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Organism</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Isolation Precaution</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>ASP Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map(r => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a" }}>{r.patient_name}</td>
                        <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 600 }}>{r.ward_location}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: "#fee2e2", color: "#dc2626", padding: "4px 10px", borderRadius: "8px", fontWeight: 900, fontSize: "12px" }}>
                            {r.hai_type}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#b45309", fontWeight: 800 }}>{r.organism_identified || 'MRSA'}</td>
                        <td style={{ padding: "14px 16px", color: "#334155" }}>{r.isolation_type}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                            {r.asp_authorization_status}
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
              <h3 style={{ color: "#0f172a", marginTop: 0, fontWeight: 900, fontSize: "20px" }}>Log HAI Infection Case</h3>
              <form onSubmit={handleCreateInfection} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
                <div>
                  <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Patient Full Name</label>
                  <input type="text" required value={patientName} onChange={e=>setPatientName(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Ward Location</label>
                    <input type="text" value={wardLocation} onChange={e=>setWardLocation(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>HAI Type</label>
                    <select value={haiType} onChange={e=>setHaiType(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }}>
                      <option>CLABSI</option><option>CAUTI</option><option>VAP</option><option>SSI</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Organism Identified</label>
                    <input type="text" value={organism} onChange={e=>setOrganism(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Isolation Type</label>
                    <select value={isolationType} onChange={e=>setIsolationType(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }}>
                      <option>Contact Precautions</option><option>Airborne Isolation</option><option>Droplet Isolation</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: "12px", background: "#0ea5e9", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Save Case</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { ShieldCheck, Plus, Search, Filter, AlertTriangle, Activity, CheckCircle2, ShieldAlert } from "lucide-react";
import { MetricCard, MetricsGrid } from "../../../components/MetricCard";

export default function InfectionControlPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [patientName, setPatientName] = useState("");
  const [wardLocation, setWardLocation] = useState("ICU Ward Bed 04");
  const [haiType, setHaiType] = useState("CLABSI");
  const [organism, setOrganism] = useState("MRSA (Staphylococcus aureus)");
  const [precaution, setPrecaution] = useState("CONTACT_ISOLATION");
  const [aspStatus, setAspStatus] = useState("APPROVED");

  const fetchInfections = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const sub = localStorage.getItem("tenant") || localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/infection-control/surveillance", {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub }
      });
      const data = await res.json();
      if (data.success) setCases(data.cases || []);
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
      const token = localStorage.getItem("token") || "";
      const sub = localStorage.getItem("tenant") || localStorage.getItem("activeSubdomain") || "demo";
      await fetch("/api/infection-control/surveillance", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-tenant-id": sub },
        body: JSON.stringify({
          patient_name: patientName,
          ward_location: wardLocation,
          hai_type: haiType,
          organism_isolated: organism,
          isolation_precaution: precaution,
          antimicrobial_stewardship_status: aspStatus
        })
      });
      setShowModal(false);
      setPatientName("");
      fetchInfections();
    } catch (e) {
      alert("Failed to submit HAI case");
    }
  };

  const filteredCases = cases.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.patient_name?.toLowerCase().includes(q) || c.hai_type?.toLowerCase().includes(q) || c.organism_isolated?.toLowerCase().includes(q);
  });

  const isolationCount = cases.filter(c => c.isolation_precaution && c.isolation_precaution !== "STANDARD").length;

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Infection Control & Antimicrobial Stewardship (ASP)" subtitle="Hospital-Acquired Infection (HAI) Surveillance, Outbreak Tracking & Isolation Protocols" />

        <div style={{ padding: "24px" }}>
          {/* Top KPI Metrics Bar */}
          <MetricsGrid minWidth="220px">
            <MetricCard
              icon={ShieldCheck}
              label="Active Surveillance Cases"
              value={`${cases.length} Tracked`}
              iconBg="#f0fdf4"
              iconColor="#16a34a"
              accent="#16a34a"
            />
            <MetricCard
              icon={ShieldAlert}
              label="Isolation Beds Active"
              value={`${isolationCount} Isolated`}
              iconBg="#fff1f2"
              iconColor="#e11d48"
              accent="#e11d48"
            />
            <MetricCard
              icon={Activity}
              label="ASP Reviews Approved"
              value="100% Compliant"
              iconBg="#f0f9ff"
              iconColor="#0284c7"
              accent="#0284c7"
            />
            <MetricCard
              icon={AlertTriangle}
              label="Hospital Infection Rate"
              value="0.4% Low"
              iconBg="#fff7ed"
              iconColor="#c2410c"
              accent="#c2410c"
            />
          </MetricsGrid>

          {/* Search & Actions Bar */}
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "20px", marginBottom: "24px", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
              <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input 
                type="text" 
                placeholder="Search patient, HAI type, organism..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "10px 14px 10px 42px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", color: "#0f172a", fontSize: "14px" }}
              />
            </div>
            <button 
              onClick={() => setShowModal(true)}
              style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)", color: "#ffffff", padding: "12px 20px", borderRadius: "12px", border: "none", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 14px rgba(14, 165, 233, 0.35)", fontSize: "14px" }}
            >
              <Plus size={18} /> Log HAI Surveillance Case
            </button>
          </div>

          {/* Cases Table */}
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>Active Infection Surveillance Cases</h3>
            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Loading surveillance data...</div>
            ) : filteredCases.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No active HAI cases reported. Click "Log HAI Surveillance Case" to log.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Patient / Location</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>HAI Type</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Organism Isolated</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Isolation Protocol</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>ASP Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map(c => (
                      <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a" }}>
                          {c.patient_name} <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, marginTop: "2px" }}>{c.ward_location}</div>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#e11d48", fontWeight: 800 }}>{c.hai_type}</td>
                        <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 700 }}>{c.organism_isolated}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: "#fee2e2", color: "#dc2626", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                            {c.isolation_precaution}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                            {c.antimicrobial_stewardship_status}
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
              <h3 style={{ color: "#0f172a", marginTop: 0, fontWeight: 900, fontSize: "20px" }}>Log HAI Surveillance Case</h3>
              <form onSubmit={handleCreateInfection} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Patient Name</label>
                    <input type="text" required value={patientName} onChange={e=>setPatientName(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Ward / Bed Location</label>
                    <input type="text" value={wardLocation} onChange={e=>setWardLocation(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>HAI Infection Category</label>
                    <select value={haiType} onChange={e=>setHaiType(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }}>
                      <option value="CLABSI">CLABSI (Central Line Associated)</option>
                      <option value="CAUTI">CAUTI (Catheter Urinary)</option>
                      <option value="VAP">VAP (Ventilator Pneumonia)</option>
                      <option value="SSI">SSI (Surgical Site)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Isolation Protocol</label>
                    <select value={precaution} onChange={e=>setPrecaution(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }}>
                      <option value="CONTACT_ISOLATION">Contact Isolation</option>
                      <option value="DROPLET_ISOLATION">Droplet Isolation</option>
                      <option value="AIRBORNE_ISOLATION">Airborne Isolation</option>
                      <option value="STANDARD">Standard Precautions</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Organism Isolated</label>
                  <input type="text" value={organism} onChange={e=>setOrganism(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: "12px", background: "#0ea5e9", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Log Surveillance Case</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


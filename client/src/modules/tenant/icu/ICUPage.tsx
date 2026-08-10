import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { HeartPulse, Plus, Activity, AlertTriangle, ShieldCheck, Zap, Search, Filter } from "lucide-react";
import { MetricCard, MetricsGrid } from "../../../components/MetricCard";

export default function ICUPage() {
  const [beds, setBeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Flowsheet Form state
  const [bedNo, setBedNo] = useState("ICU Bed 01");
  const [patientName, setPatientName] = useState("");
  const [ventMode, setVentMode] = useState("SIMV + PS");
  const [fio2, setFio2] = useState("45");
  const [peep, setPeep] = useState("8");
  const [abgPh, setAbgPh] = useState("7.38");
  const [gcsScore, setGcsScore] = useState("13");
  const [sofaScore, setSofaScore] = useState("4");
  const [apacheScore, setApacheScore] = useState("12");

  const fetchICUData = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const sub = localStorage.getItem("tenant") || localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/icu/dashboard", {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub }
      });
      const data = await res.json();
      if (data.success) setBeds(data.beds || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchICUData();
  }, []);

  const handleCreateFlowsheet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token") || "";
      const sub = localStorage.getItem("tenant") || localStorage.getItem("activeSubdomain") || "demo";
      await fetch("/api/icu/flowsheet", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-tenant-id": sub },
        body: JSON.stringify({
          bed_no: bedNo,
          patient_name: patientName,
          ventilator_mode: ventMode,
          fio2: parseInt(fio2) || 40,
          peep: parseInt(peep) || 5,
          abg_ph: parseFloat(abgPh) || 7.4,
          gcs_score: parseInt(gcsScore) || 15,
          sofa_score: parseInt(sofaScore) || 2,
          apache_ii_score: parseInt(apacheScore) || 10
        })
      });
      setShowModal(false);
      setPatientName("");
      fetchICUData();
    } catch (e) {
      alert("Failed to submit flowsheet record");
    }
  };

  const filteredBeds = beds.filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return b.patient_name?.toLowerCase().includes(q) || b.bed_no?.toLowerCase().includes(q) || b.ventilator_mode?.toLowerCase().includes(q);
  });

  const ventilatedCount = beds.filter(b => b.ventilator_mode && b.ventilator_mode !== "OFF").length;
  const criticalSOFACount = beds.filter(b => b.sofa_score >= 8).length;

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="ICU & Critical Care Workstation" subtitle="Intensive Care Bed Flowsheet, Ventilator Telemetry, SOFA/APACHE Risk Scores & Invasive Lines" />

        <div style={{ padding: "24px" }}>
          {/* Top KPI Metrics Bar */}
          <MetricsGrid minWidth="220px">
            <MetricCard
              icon={HeartPulse}
              label="ICU Beds Occupied"
              value={`${beds.length} Active`}
              iconBg="#f0f9ff"
              iconColor="#0284c7"
              accent="#0284c7"
            />
            <MetricCard
              icon={Activity}
              label="Mechanical Ventilation"
              value={`${ventilatedCount} Patients`}
              iconBg="#faf5ff"
              iconColor="#9333ea"
              accent="#9333ea"
            />
            <MetricCard
              icon={AlertTriangle}
              label="High SOFA Risk"
              value={`${criticalSOFACount} Critical`}
              iconBg="#fff1f2"
              iconColor="#e11d48"
              accent="#e11d48"
            />
            <MetricCard
              icon={ShieldCheck}
              label="Telemetry Monitors"
              value="100% Online"
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
                placeholder="Search patient, ICU bed, mode..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "10px 14px 10px 42px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", color: "#0f172a", fontSize: "14px" }}
              />
            </div>
            <button 
              onClick={() => setShowModal(true)}
              style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)", color: "#ffffff", padding: "12px 20px", borderRadius: "12px", border: "none", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 14px rgba(14, 165, 233, 0.35)", fontSize: "14px" }}
            >
              <Plus size={18} /> Log Bed Flowsheet Entry
            </button>
          </div>

          {/* ICU Bed Grid / Table */}
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>Active ICU Bed Worklist</h3>
            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Loading ICU telemetry data...</div>
            ) : filteredBeds.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No ICU bed flowsheets recorded. Click "Log Bed Flowsheet Entry" to create.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Bed / Patient</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Ventilator Settings</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>ABG pH</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>GCS Score</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>SOFA / APACHE II</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBeds.map(b => (
                      <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 900, color: "#0f172a" }}>
                          {b.bed_no} <div style={{ fontSize: "13px", color: "#0284c7", fontWeight: 700, marginTop: "2px" }}>{b.patient_name}</div>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 700 }}>
                          {b.ventilator_mode} <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>FiO2: {b.fio2}% | PEEP: {b.peep}</div>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 800 }}>{b.abg_ph}</td>
                        <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 700 }}>{b.gcs_score} / 15</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ color: b.sofa_score >= 8 ? "#dc2626" : "#0f172a", fontWeight: 900 }}>SOFA: {b.sofa_score}</span> • <span style={{ color: "#64748b", fontWeight: 700 }}>APACHE: {b.apache_ii_score}</span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                            CRITICAL MONITORED
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
            <div style={{ background: "#ffffff", padding: "32px", borderRadius: "24px", width: "100%", maxWidth: "540px", border: "1px solid #e2e8f0", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
              <h3 style={{ color: "#0f172a", marginTop: 0, fontWeight: 900, fontSize: "20px" }}>Log ICU Bed Flowsheet Entry</h3>
              <form onSubmit={handleCreateFlowsheet} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>ICU Bed Number</label>
                    <input type="text" required value={bedNo} onChange={e=>setBedNo(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Patient Full Name</label>
                    <input type="text" required value={patientName} onChange={e=>setPatientName(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Vent Mode</label>
                    <input type="text" value={ventMode} onChange={e=>setVentMode(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>FiO2 (%)</label>
                    <input type="number" value={fio2} onChange={e=>setFio2(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>PEEP</label>
                    <input type="number" value={peep} onChange={e=>setPeep(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "12px", fontWeight: 700 }}>ABG pH</label>
                    <input type="text" value={abgPh} onChange={e=>setAbgPh(e.target.value)} style={{ width: "100%", padding: "8px 10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "12px", fontWeight: 700 }}>GCS (3-15)</label>
                    <input type="number" value={gcsScore} onChange={e=>setGcsScore(e.target.value)} style={{ width: "100%", padding: "8px 10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "12px", fontWeight: 700 }}>SOFA</label>
                    <input type="number" value={sofaScore} onChange={e=>setSofaScore(e.target.value)} style={{ width: "100%", padding: "8px 10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "12px", fontWeight: 700 }}>APACHE II</label>
                    <input type="number" value={apacheScore} onChange={e=>setApacheScore(e.target.value)} style={{ width: "100%", padding: "8px 10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", marginTop: "4px" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: "12px", background: "#0ea5e9", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Save Flowsheet Entry</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


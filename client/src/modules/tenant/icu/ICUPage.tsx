import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Cpu, Plus, Activity, Bell } from "lucide-react";

export default function ICUPage() {
  const [beds, setBeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [bedNo, setBedNo] = useState("ICU-Bed 01");
  const [patientName, setPatientName] = useState("");
  const [ventMode, setVentMode] = useState("SIMV");
  const [fio2, setFio2] = useState("40");
  const [peep, setPeep] = useState("5");
  const [abgPh, setAbgPh] = useState("7.38");
  const [gcsScore, setGcsScore] = useState("14");
  const [sofaScore, setSofaScore] = useState("2");
  const [apacheScore, setApacheScore] = useState("12");
  const [criticalAlarm, setCriticalAlarm] = useState(false);
  const [alarmReason, setAlarmReason] = useState("");

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
          abg_ph: parseFloat(abgPh) || 7.38,
          gcs_score: parseInt(gcsScore) || 14,
          sofa_score: parseInt(sofaScore) || 2,
          apache_score: parseInt(apacheScore) || 12,
          critical_alarm: criticalAlarm,
          alarm_reason: alarmReason
        })
      });
      setShowModal(false);
      setPatientName("");
      fetchICUData();
    } catch (e) {
      alert("Failed to log ICU flowsheet");
    }
  };

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="ICU & Critical Care Unit Command Center" subtitle="Multi-Bed Telemetry, Ventilator Parameters, ABG & APACHE II / SOFA Risk Scoring" />

        <div style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ color: "#0f172a", margin: 0, fontWeight: 800, fontSize: "18px" }}>Active ICU Bed Telemetry Grid</h3>
            <button 
              onClick={() => setShowModal(true)}
              style={{ background: "#0ea5e9", color: "#ffffff", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}
            >
              <Plus size={16} /> Log Bed Flowsheet Entry
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {loading ? (
              <div style={{ color: "#64748b", padding: "30px", fontWeight: 600 }}>Loading ICU bed telemetry...</div>
            ) : beds.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", background: "#ffffff", padding: "40px", borderRadius: "20px", border: "1px solid #e2e8f0", textAlign: "center", color: "#475569", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
                <Cpu size={48} color="#0284c7" style={{ marginBottom: "12px" }} />
                <h3 style={{ color: "#0f172a", fontWeight: 800, margin: "0 0 8px 0" }}>ICU Telemetry Bed Grid Ready</h3>
                <p style={{ color: "#64748b", margin: 0 }}>Click "Log Bed Flowsheet Entry" to assign patient monitoring parameters.</p>
              </div>
            ) : (
              beds.map((b) => (
                <div key={b.id} style={{ background: b.critical_alarm ? "#fff1f2" : "#ffffff", border: `1px solid ${b.critical_alarm ? "#fda4af" : "#e2e8f0"}`, borderRadius: "20px", padding: "20px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontWeight: 900, color: "#0284c7", fontSize: "16px" }}>{b.bed_no}</span>
                    <span style={{ background: b.critical_alarm ? "#ef4444" : "#10b981", color: "#ffffff", fontSize: "11px", fontWeight: 900, padding: "4px 10px", borderRadius: "6px" }}>
                      {b.critical_alarm ? "CRITICAL ALARM" : "STABLE"}
                    </span>
                  </div>

                  <h4 style={{ color: "#0f172a", margin: "0 0 12px 0", fontSize: "16px", fontWeight: 800 }}>{b.patient_name}</h4>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", background: "#f8fafc", padding: "12px", borderRadius: "12px", marginBottom: "12px", border: "1px solid #f1f5f9" }}>
                    <div><span style={{ color: "#64748b", fontWeight: 600 }}>Vent Mode:</span> <strong style={{ color: "#0f172a" }}>{b.ventilator_mode || 'SIMV'}</strong></div>
                    <div><span style={{ color: "#64748b", fontWeight: 600 }}>FiO2 / PEEP:</span> <strong style={{ color: "#0f172a" }}>{b.fio2 || 40}% / {b.peep || 5}</strong></div>
                    <div><span style={{ color: "#64748b", fontWeight: 600 }}>ABG pH:</span> <strong style={{ color: "#0f172a" }}>{b.abg_ph || '7.38'}</strong></div>
                    <div><span style={{ color: "#64748b", fontWeight: 600 }}>GCS Score:</span> <strong style={{ color: "#0f172a" }}>{b.gcs_score || 14}/15</strong></div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#334155", fontWeight: 700 }}>
                    <span>SOFA Score: <strong style={{ color: "#d97706" }}>{b.sofa_score || 2}</strong></span>
                    <span>APACHE II: <strong style={{ color: "#d97706" }}>{b.apache_score || 12}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Flowsheet Modal */}
        {showModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: "#ffffff", padding: "32px", borderRadius: "24px", width: "100%", maxWidth: "520px", border: "1px solid #e2e8f0", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
              <h3 style={{ color: "#0f172a", marginTop: 0, fontWeight: 900, fontSize: "20px" }}>Log ICU Bed Flowsheet Entry</h3>
              <form onSubmit={handleCreateFlowsheet} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Bed Bay No</label>
                    <input type="text" required value={bedNo} onChange={e=>setBedNo(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Patient Name</label>
                    <input type="text" required value={patientName} onChange={e=>setPatientName(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "12px", fontWeight: 700 }}>Vent Mode</label>
                    <select value={ventMode} onChange={e=>setVentMode(e.target.value)} style={{ width: "100%", padding: "10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }}>
                      <option>SIMV</option><option>AC/VC</option><option>CPAP</option><option>BiPAP</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "12px", fontWeight: 700 }}>FiO2 (%)</label>
                    <input type="number" value={fio2} onChange={e=>setFio2(e.target.value)} style={{ width: "100%", padding: "10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "12px", fontWeight: 700 }}>PEEP</label>
                    <input type="number" value={peep} onChange={e=>setPeep(e.target.value)} style={{ width: "100%", padding: "10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "12px", fontWeight: 700 }}>GCS (3-15)</label>
                    <input type="number" value={gcsScore} onChange={e=>setGcsScore(e.target.value)} style={{ width: "100%", padding: "10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "12px", fontWeight: 700 }}>SOFA Score</label>
                    <input type="number" value={sofaScore} onChange={e=>setSofaScore(e.target.value)} style={{ width: "100%", padding: "10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "12px", fontWeight: 700 }}>APACHE II</label>
                    <input type="number" value={apacheScore} onChange={e=>setApacheScore(e.target.value)} style={{ width: "100%", padding: "10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: "12px", background: "#0ea5e9", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Save Telemetry</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Syringe, HeartPulse, ClipboardList } from "lucide-react";

export default function NursingPage() {
  const [emar, setEmar] = useState<any[]>([]);
  const [handovers, setHandovers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'emar' | 'vitals' | 'handover'>('emar');
  const [loading, setLoading] = useState(true);

  // Vitals form
  const [patientId, setPatientId] = useState("PT-1002");
  const [respRate, setRespRate] = useState(18);
  const [spo2, setSpo2] = useState(98);
  const [sysBp, setSysBp] = useState(120);
  const [diaBp, setDiaBp] = useState(80);
  const [pulse, setPulse] = useState(72);
  const [temp, setTemp] = useState(37.0);

  const fetchNursingData = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const sub = localStorage.getItem("tenant") || localStorage.getItem("activeSubdomain") || "demo";
      const [resEmar, resHandover] = await Promise.all([
        fetch("/api/nursing/emar", { headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub } }),
        fetch("/api/nursing/handovers", { headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub } })
      ]);
      const dEmar = await resEmar.json();
      const dHand = await resHandover.json();
      if (dEmar.success) setEmar(dEmar.emar || []);
      if (dHand.success) setHandovers(dHand.handovers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNursingData();
  }, []);

  const handleAdminister = async (id: string) => {
    try {
      const token = localStorage.getItem("token") || "";
      const sub = localStorage.getItem("tenant") || localStorage.getItem("activeSubdomain") || "demo";
      await fetch("/api/nursing/emar/administer", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-tenant-id": sub },
        body: JSON.stringify({ id, administered_by: "Nurse Supervisor", status: "GIVEN" })
      });
      fetchNursingData();
    } catch (e) {
      alert("Error logging medication administration");
    }
  };

  const handleVitalsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token") || "";
      const sub = localStorage.getItem("tenant") || localStorage.getItem("activeSubdomain") || "demo";
      await fetch("/api/nursing/vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-tenant-id": sub },
        body: JSON.stringify({
          patient_id: patientId,
          respiration_rate: respRate,
          spo2,
          sys_bp: sysBp,
          dia_bp: diaBp,
          pulse,
          temperature: temp,
          consciousness: "ALERT",
          recorded_by: "Floor Nurse"
        })
      });
      alert("Vitals & NEWS2 score logged successfully!");
    } catch (e) {
      alert("Error saving vitals");
    }
  };

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Nursing Desk & Ward Care Station" subtitle="eMAR 5-Rights Verification, NEWS2 Early Warning & Shift Handover" />

        <div style={{ padding: "24px" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
            <button 
              onClick={() => setActiveTab('emar')} 
              style={{ background: activeTab === 'emar' ? "#0ea5e9" : "#ffffff", color: activeTab === 'emar' ? "#ffffff" : "#475569", padding: "10px 20px", borderRadius: "12px", border: "1px solid #cbd5e1", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}
            >
              <Syringe size={18} /> eMAR Medication Schedule
            </button>
            <button 
              onClick={() => setActiveTab('vitals')} 
              style={{ background: activeTab === 'vitals' ? "#0ea5e9" : "#ffffff", color: activeTab === 'vitals' ? "#ffffff" : "#475569", padding: "10px 20px", borderRadius: "12px", border: "1px solid #cbd5e1", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}
            >
              <HeartPulse size={18} /> Vitals & NEWS2 Score
            </button>
            <button 
              onClick={() => setActiveTab('handover')} 
              style={{ background: activeTab === 'handover' ? "#0ea5e9" : "#ffffff", color: activeTab === 'handover' ? "#ffffff" : "#475569", padding: "10px 20px", borderRadius: "12px", border: "1px solid #cbd5e1", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}
            >
              <ClipboardList size={18} /> SBAR Shift Handover Log
            </button>
          </div>

          {activeTab === 'emar' && (
            <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
              <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>Electronic Medication Administration Record (eMAR)</h3>
              {loading ? (
                <div style={{ color: "#64748b", padding: "20px" }}>Loading schedule...</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Patient / Bed</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Medication</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Dosage / Route</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Scheduled Time</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Status</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emar.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: "30px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>No scheduled medications pending.</td></tr>
                    ) : (
                      emar.map(m => (
                        <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 800 }}>
                            {m.patient_name} <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, marginTop: "2px" }}>Bed: {m.bed_no || "Ward A"}</div>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#0284c7", fontWeight: 800 }}>{m.medication_name}</td>
                          <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 600 }}>{m.dosage} ({m.route})</td>
                          <td style={{ padding: "14px 16px", color: "#334155" }}>{new Date(m.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{ background: m.status === 'GIVEN' ? "#dcfce7" : "#fef3c7", color: m.status === 'GIVEN' ? "#15803d" : "#b45309", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 800 }}>
                              {m.status}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            {m.status !== 'GIVEN' && (
                              <button onClick={() => handleAdminister(m.id)} style={{ background: "#10b981", color: "#ffffff", border: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: 800, cursor: "pointer", fontSize: "12px" }}>
                                Administer Dose
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'vitals' && (
            <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)", maxWidth: "640px" }}>
              <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>Record Vitals & Calculate NEWS2 Risk Score</h3>
              <form onSubmit={handleVitalsSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Patient ID / MRN</label>
                  <input type="text" value={patientId} onChange={e=>setPatientId(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "6px", fontSize: "14px" }} />
                </div>
                <div>
                  <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Respiration Rate (/min)</label>
                  <input type="number" value={respRate} onChange={e=>setRespRate(parseInt(e.target.value))} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "6px", fontSize: "14px" }} />
                </div>
                <div>
                  <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>SpO2 (%)</label>
                  <input type="number" value={spo2} onChange={e=>setSpo2(parseInt(e.target.value))} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "6px", fontSize: "14px" }} />
                </div>
                <div>
                  <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Systolic BP (mmHg)</label>
                  <input type="number" value={sysBp} onChange={e=>setSysBp(parseInt(e.target.value))} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "6px", fontSize: "14px" }} />
                </div>
                <div>
                  <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Pulse Rate (bpm)</label>
                  <input type="number" value={pulse} onChange={e=>setPulse(parseInt(e.target.value))} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "6px", fontSize: "14px" }} />
                </div>
                <div>
                  <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Temperature (°C)</label>
                  <input type="number" step="0.1" value={temp} onChange={e=>setTemp(parseFloat(e.target.value))} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "6px", fontSize: "14px" }} />
                </div>
                <div style={{ gridColumn: "span 2", marginTop: "12px" }}>
                  <button type="submit" style={{ width: "100%", padding: "12px", background: "#0ea5e9", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer", fontSize: "15px" }}>Calculate & Save NEWS2 Vitals</button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'handover' && (
            <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
              <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>SBAR Shift Handover Ledger</h3>
              {handovers.length === 0 ? (
                <div style={{ color: "#64748b", padding: "20px" }}>No recent shift handovers logged.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {handovers.map(h => (
                    <div key={h.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#0284c7", fontWeight: 800, marginBottom: "8px" }}>
                        <span>Ward: {h.ward_name} ({h.shift_type} Shift)</span>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>{new Date(h.created_at).toLocaleString()}</span>
                      </div>
                      <div style={{ color: "#334155", fontSize: "14px" }}><strong>Outgoing:</strong> {h.outgoing_nurse} ➔ <strong>Incoming:</strong> {h.incoming_nurse}</div>
                      <div style={{ marginTop: "8px", fontSize: "14px", color: "#1e293b" }}><strong>Situation:</strong> {h.situation}</div>
                      <div style={{ marginTop: "4px", fontSize: "14px", color: "#1e293b" }}><strong>Assessment:</strong> {h.assessment}</div>
                      <div style={{ marginTop: "4px", fontSize: "14px", color: "#15803d", fontWeight: 700 }}><strong>Recommendation:</strong> {h.recommendation}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

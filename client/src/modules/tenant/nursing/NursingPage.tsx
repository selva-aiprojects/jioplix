import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Syringe, HeartPulse, ClipboardList, CheckCircle2, AlertCircle } from "lucide-react";

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
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
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
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
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
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
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
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="Nursing Desk & Ward Care Station" subtitle="eMAR 5-Rights Verification, NEWS2 Early Warning & Shift Handover" />

        <div style={{ padding: 24 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <button 
              onClick={() => setActiveTab('emar')} 
              style={{ background: activeTab === 'emar' ? '#0ea5e9' : 'rgba(255,255,255,0.05)', color: 'white', padding: '10px 20px', borderRadius: 10, border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Syringe size={18} /> eMAR Medication Schedule
            </button>
            <button 
              onClick={() => setActiveTab('vitals')} 
              style={{ background: activeTab === 'vitals' ? '#0ea5e9' : 'rgba(255,255,255,0.05)', color: 'white', padding: '10px 20px', borderRadius: 10, border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <HeartPulse size={18} /> Vitals & NEWS2 Score
            </button>
            <button 
              onClick={() => setActiveTab('handover')} 
              style={{ background: activeTab === 'handover' ? '#0ea5e9' : 'rgba(255,255,255,0.05)', color: 'white', padding: '10px 20px', borderRadius: 10, border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <ClipboardList size={18} /> SBAR Shift Handover Log
            </button>
          </div>

          {activeTab === 'emar' && (
            <div className="form-card" style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ color: 'white', margin: '0 0 16px 0', fontWeight: 800 }}>Electronic Medication Administration Record (eMAR)</h3>
              {loading ? (
                <div style={{ color: '#94a3b8' }}>Loading schedule...</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
                      <th style={{ padding: 12 }}>Patient / Bed</th>
                      <th style={{ padding: 12 }}>Medication</th>
                      <th style={{ padding: 12 }}>Dosage / Route</th>
                      <th style={{ padding: 12 }}>Scheduled Time</th>
                      <th style={{ padding: 12 }}>Status</th>
                      <th style={{ padding: 12 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emar.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No scheduled medications pending.</td></tr>
                    ) : (
                      emar.map(m => (
                        <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: 12, fontWeight: 700 }}>{m.patient_name} <div style={{ fontSize: 11, color: '#94a3b8' }}>Bed: {m.bed_no || 'Ward A'}</div></td>
                          <td style={{ padding: 12, color: '#38bdf8', fontWeight: 700 }}>{m.medication_name}</td>
                          <td style={{ padding: 12 }}>{m.dosage} ({m.route})</td>
                          <td style={{ padding: 12 }}>{new Date(m.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td style={{ padding: 12 }}>
                            <span style={{ background: m.status === 'GIVEN' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: m.status === 'GIVEN' ? '#10b981' : '#f59e0b', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 800 }}>
                              {m.status}
                            </span>
                          </td>
                          <td style={{ padding: 12 }}>
                            {m.status !== 'GIVEN' && (
                              <button onClick={() => handleAdminister(m.id)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>
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
            <div className="form-card" style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', maxWidth: 600 }}>
              <h3 style={{ color: 'white', margin: '0 0 16px 0', fontWeight: 800 }}>Record Vitals & Calculate NEWS2 Risk Score</h3>
              <form onSubmit={handleVitalsSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>Patient ID / MRN</label>
                  <input type="text" value={patientId} onChange={e=>setPatientId(e.target.value)} style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, marginTop: 4 }} />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>Respiration Rate (/min)</label>
                  <input type="number" value={respRate} onChange={e=>setRespRate(parseInt(e.target.value))} style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, marginTop: 4 }} />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>SpO2 (%)</label>
                  <input type="number" value={spo2} onChange={e=>setSpo2(parseInt(e.target.value))} style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, marginTop: 4 }} />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>Systolic BP (mmHg)</label>
                  <input type="number" value={sysBp} onChange={e=>setSysBp(parseInt(e.target.value))} style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, marginTop: 4 }} />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>Pulse Rate (bpm)</label>
                  <input type="number" value={pulse} onChange={e=>setPulse(parseInt(e.target.value))} style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, marginTop: 4 }} />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>Temperature (°C)</label>
                  <input type="number" step="0.1" value={temp} onChange={e=>setTemp(parseFloat(e.target.value))} style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, marginTop: 4 }} />
                </div>
                <div style={{ gridColumn: 'span 2', marginTop: 12 }}>
                  <button type="submit" style={{ width: '100%', padding: 12, background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>Calculate &amp; Save NEWS2 Vitals</button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'handover' && (
            <div className="form-card" style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ color: 'white', margin: '0 0 16px 0', fontWeight: 800 }}>SBAR Shift Handover Ledger</h3>
              {handovers.length === 0 ? (
                <div style={{ color: '#94a3b8' }}>No recent shift handovers logged.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {handovers.map(h => (
                    <div key={h.id} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38bdf8', fontWeight: 800, marginBottom: 8 }}>
                        <span>Ward: {h.ward_name} ({h.shift_type} Shift)</span>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(h.created_at).toLocaleString()}</span>
                      </div>
                      <div style={{ color: '#cbd5e1', fontSize: 13 }}><strong>Outgoing:</strong> {h.outgoing_nurse} ➔ <strong>Incoming:</strong> {h.incoming_nurse}</div>
                      <div style={{ marginTop: 8, fontSize: 13, color: '#e2e8f0' }}><strong>Situation:</strong> {h.situation}</div>
                      <div style={{ marginTop: 4, fontSize: 13, color: '#e2e8f0' }}><strong>Assessment:</strong> {h.assessment}</div>
                      <div style={{ marginTop: 4, fontSize: 13, color: '#10b981' }}><strong>Recommendation:</strong> {h.recommendation}</div>
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

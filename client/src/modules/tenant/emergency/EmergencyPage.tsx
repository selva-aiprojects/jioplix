import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Siren, AlertTriangle, UserPlus, Heart, Activity, CheckCircle2, ShieldAlert } from "lucide-react";

export default function EmergencyPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);

  // Form states
  const [patientName, setPatientName] = useState("");
  const [mrn, setMrn] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [esiLevel, setEsiLevel] = useState("1");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [bedBay, setBedBay] = useState("Bay 1 - Resus");

  const [codeType, setCodeType] = useState("CODE_BLUE");
  const [codeLocation, setCodeLocation] = useState("ER Bay 2");

  const fetchEmergencyData = async () => {
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/emergency/triage", {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub }
      });
      const data = await res.json();
      if (data.success) {
        setCases(data.cases || []);
        setAlerts(data.activeAlerts || []);
      }
    } catch (e) {
      console.error("Failed to fetch emergency data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencyData();
  }, []);

  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      await fetch("/api/emergency/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-tenant-id": sub },
        body: JSON.stringify({
          patient_name: patientName,
          mrn,
          age: parseInt(age) || 35,
          gender,
          esi_level: parseInt(esiLevel),
          chief_complaint: chiefComplaint,
          bed_bay: bedBay,
          triage_nurse: "Nurse Sarah"
        })
      });
      setShowTriageModal(false);
      fetchEmergencyData();
    } catch (err) {
      alert("Error logging triage case");
    }
  };

  const handleCodeTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      await fetch("/api/emergency/code-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-tenant-id": sub },
        body: JSON.stringify({
          code_type: codeType,
          location: codeLocation,
          activated_by: "ER Charge Nurse",
          notes: "STAT Emergency Response Dispatch"
        })
      });
      setShowCodeModal(false);
      fetchEmergencyData();
    } catch (err) {
      alert("Error triggering code alert");
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="Emergency & Casualty Management" subtitle="Rapid Triage, Code Activation & Trauma Bay Tracker" />

        <div style={{ padding: 24 }}>
          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Siren color="#ef4444" size={24} className="animate-pulse" />
                <div>
                  <div style={{ color: '#ef4444', fontWeight: 800, fontSize: 13, textTransform: 'uppercase' }}>Active Code Alerts</div>
                  <div style={{ color: 'white', fontWeight: 900, fontSize: 18 }}>{alerts.length} Active</div>
                </div>
              </div>
              <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '12px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Activity color="#38bdf8" size={24} />
                <div>
                  <div style={{ color: '#94a3b8', fontWeight: 700, fontSize: 13 }}>Triage Cases</div>
                  <div style={{ color: 'white', fontWeight: 900, fontSize: 18 }}>{cases.length} Recorded</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => setShowCodeModal(true)}
                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', color: 'white', padding: '12px 20px', borderRadius: 10, border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)' }}
              >
                <Siren size={18} /> Trigger Code Alert
              </button>
              <button 
                onClick={() => setShowTriageModal(true)}
                style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', color: 'white', padding: '12px 20px', borderRadius: 10, border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <UserPlus size={18} /> New Triage Intake
              </button>
            </div>
          </div>

          {/* Active Code Alerts Panel */}
          {alerts.length > 0 && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: 16, borderRadius: 16, marginBottom: 24 }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 900 }}>
                <ShieldAlert size={20} /> High Priority Code Notifications
              </h4>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {alerts.map((alt) => (
                  <div key={alt.id} style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '10px 16px', borderRadius: 10 }}>
                    <div style={{ color: '#f87171', fontWeight: 800 }}>{alt.code_type} - Location: {alt.location}</div>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>Activated by {alt.activated_by} • {new Date(alt.created_at).toLocaleTimeString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Triage Cases Table */}
          <div className="form-card" style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: 'white', margin: '0 0 16px 0', fontWeight: 800, fontSize: 18 }}>Triage & Emergency Patients</h3>
            
            {loading ? (
              <div style={{ color: '#94a3b8', padding: 20 }}>Loading triage queue...</div>
            ) : cases.length === 0 ? (
              <div style={{ color: '#94a3b8', padding: 20, textAlign: 'center' }}>No active emergency patients in triage. Click "New Triage Intake" to register.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
                      <th style={{ padding: 12 }}>ESI Level</th>
                      <th style={{ padding: 12 }}>Patient Name</th>
                      <th style={{ padding: 12 }}>Age/Gender</th>
                      <th style={{ padding: 12 }}>Chief Complaint</th>
                      <th style={{ padding: 12 }}>Bay/Bed</th>
                      <th style={{ padding: 12 }}>Triage Nurse</th>
                      <th style={{ padding: 12 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((c) => {
                      const esiColor = c.esi_level === 1 ? '#ef4444' : c.esi_level === 2 ? '#f97316' : c.esi_level === 3 ? '#eab308' : '#10b981';
                      return (
                        <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: 12 }}>
                            <span style={{ background: `${esiColor}22`, border: `1px solid ${esiColor}`, color: esiColor, padding: '4px 10px', borderRadius: 6, fontWeight: 900, fontSize: 12 }}>
                              ESI-{c.esi_level}
                            </span>
                          </td>
                          <td style={{ padding: 12, fontWeight: 700 }}>{c.patient_name} <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.mrn || 'No MRN'}</div></td>
                          <td style={{ padding: 12 }}>{c.age} yrs / {c.gender}</td>
                          <td style={{ padding: 12, color: '#cbd5e1' }}>{c.chief_complaint}</td>
                          <td style={{ padding: 12 }}>{c.bed_bay || 'Unassigned'}</td>
                          <td style={{ padding: 12 }}>{c.triage_nurse}</td>
                          <td style={{ padding: 12 }}>
                            <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Triage Modal */}
        {showTriageModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#0f172a', padding: 32, borderRadius: 16, width: '100%', maxWidth: 500, border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ color: 'white', marginTop: 0, fontWeight: 800 }}>New Emergency Triage Intake</h3>
              <form onSubmit={handleTriageSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>Patient Full Name</label>
                  <input type="text" required value={patientName} onChange={e=>setPatientName(e.target.value)} style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, marginTop: 4 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>Age</label>
                    <input type="number" value={age} onChange={e=>setAge(e.target.value)} style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, marginTop: 4 }} />
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>Gender</label>
                    <select value={gender} onChange={e=>setGender(e.target.value)} style={{ width: '100%', padding: 10, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, marginTop: 4 }}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>ESI Triage Level</label>
                    <select value={esiLevel} onChange={e=>setEsiLevel(e.target.value)} style={{ width: '100%', padding: 10, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, marginTop: 4 }}>
                      <option value="1">ESI 1 - Resuscitation (Immediate)</option>
                      <option value="2">ESI 2 - Emergent (High Risk)</option>
                      <option value="3">ESI 3 - Urgent (Multiple Resources)</option>
                      <option value="4">ESI 4 - Less Urgent</option>
                      <option value="5">ESI 5 - Non-Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>Bed / Bay</label>
                    <input type="text" value={bedBay} onChange={e=>setBedBay(e.target.value)} style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, marginTop: 4 }} />
                  </div>
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>Chief Complaint</label>
                  <textarea required value={chiefComplaint} onChange={e=>setChiefComplaint(e.target.value)} style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, marginTop: 4, height: 60 }} />
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button type="button" onClick={()=>setShowTriageModal(false)} style={{ padding: '10px 16px', background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '10px 20px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>Submit Triage Intake</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Code Trigger Modal */}
        {showCodeModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#0f172a', padding: 32, borderRadius: 16, width: '100%', maxWidth: 450, border: '1px solid rgba(239, 68, 68, 0.4)' }}>
              <h3 style={{ color: '#ef4444', marginTop: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Siren className="animate-pulse" /> Dispatch Emergency Code Alert
              </h3>
              <form onSubmit={handleCodeTrigger} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>Code Category</label>
                  <select value={codeType} onChange={e=>setCodeType(e.target.value)} style={{ width: '100%', padding: 10, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, marginTop: 4 }}>
                    <option value="CODE_BLUE">Code Blue (Cardiac Arrest)</option>
                    <option value="CODE_RED">Code Red (Fire / Hazard)</option>
                    <option value="TRAUMA_TEAM">Trauma Team Activation</option>
                    <option value="CODE_STROKE">Code Stroke Fast-Track</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>Location / Bay</label>
                  <input type="text" required value={codeLocation} onChange={e=>setCodeLocation(e.target.value)} style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, marginTop: 4 }} />
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button type="button" onClick={()=>setShowCodeModal(false)} style={{ padding: '10px 16px', background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 900, cursor: 'pointer' }}>Broadcast STAT Alert</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

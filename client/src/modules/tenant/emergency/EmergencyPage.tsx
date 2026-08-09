import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Siren, UserPlus, Activity, ShieldAlert, Search, Filter, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export default function EmergencyPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [esiFilter, setEsiFilter] = useState("ALL");

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
      const token = localStorage.getItem("token") || "";
      const sub = localStorage.getItem("tenant") || localStorage.getItem("activeSubdomain") || "demo";
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
      const token = localStorage.getItem("token") || "";
      const sub = localStorage.getItem("tenant") || localStorage.getItem("activeSubdomain") || "demo";
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
      setPatientName(""); setMrn(""); setChiefComplaint("");
      fetchEmergencyData();
    } catch (err) {
      alert("Error logging triage case");
    }
  };

  const handleCodeTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token") || "";
      const sub = localStorage.getItem("tenant") || localStorage.getItem("activeSubdomain") || "demo";
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

  const filteredCases = cases.filter(c => {
    if (esiFilter !== "ALL" && String(c.esi_level) !== esiFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.patient_name?.toLowerCase().includes(q) || c.mrn?.toLowerCase().includes(q) || c.chief_complaint?.toLowerCase().includes(q);
    }
    return true;
  });

  const esi1Count = cases.filter(c => c.esi_level === 1).length;
  const esi2Count = cases.filter(c => c.esi_level === 2).length;

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Emergency & Casualty Command Workstation" subtitle="ESI Triage Desk, Code Activation Console, Resuscitation Bay & Trauma Tracker" />

        <div style={{ padding: "24px" }}>
          {/* Top KPI Metrics Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#fef2f2", color: "#ef4444", display: "grid", placeItems: "center" }}>
                <Siren size={24} className="animate-pulse" />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Active Code Alerts</div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#be123c" }}>{alerts.length} Active</div>
              </div>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#fff1f2", color: "#e11d48", display: "grid", placeItems: "center" }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>ESI-1 Resus Cases</div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#e11d48" }}>{esi1Count} Critical</div>
              </div>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#fff7ed", color: "#c2410c", display: "grid", placeItems: "center" }}>
                <Clock size={24} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>ESI-2 Emergent</div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#c2410c" }}>{esi2Count} High Risk</div>
              </div>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#f0f9ff", color: "#0284c7", display: "grid", placeItems: "center" }}>
                <Activity size={24} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Total Triage Queue</div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#0284c7" }}>{cases.length} Registered</div>
              </div>
            </div>
          </div>

          {/* Active Code Notifications Banner */}
          {alerts.length > 0 && (
            <div style={{ background: "#fff1f2", border: "1px solid #fda4af", padding: "20px", borderRadius: "16px", marginBottom: "24px" }}>
              <h4 style={{ margin: "0 0 12px 0", color: "#be123c", display: "flex", alignItems: "center", gap: "8px", fontWeight: 900 }}>
                <ShieldAlert size={20} /> High Priority Code Notifications
              </h4>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {alerts.map((alt) => (
                  <div key={alt.id} style={{ background: "#ffffff", border: "1px solid #f43f5e", padding: "12px 18px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <div style={{ color: "#e11d48", fontWeight: 800, fontSize: "14px" }}>{alt.code_type} - Location: {alt.location}</div>
                    <div style={{ color: "#64748b", fontSize: "12px", marginTop: "4px" }}>Activated by {alt.activated_by} • {new Date(alt.created_at).toLocaleTimeString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search, Filter & Actions Bar */}
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "20px", marginBottom: "24px", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", gap: "12px", flex: 1, minWidth: "300px", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
                <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input 
                  type="text" 
                  placeholder="Search patient, MRN, complaint..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px 10px 42px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", color: "#0f172a", fontSize: "14px" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Filter size={16} color="#64748b" />
                <select 
                  value={esiFilter} 
                  onChange={e => setEsiFilter(e.target.value)}
                  style={{ padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", color: "#0f172a", fontSize: "14px", fontWeight: 700 }}
                >
                  <option value="ALL">All ESI Levels</option>
                  <option value="1">ESI 1 - Resuscitation</option>
                  <option value="2">ESI 2 - Emergent</option>
                  <option value="3">ESI 3 - Urgent</option>
                  <option value="4">ESI 4 - Less Urgent</option>
                  <option value="5">ESI 5 - Non-Urgent</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                onClick={() => setShowCodeModal(true)}
                style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "#ffffff", padding: "12px 20px", borderRadius: "12px", border: "none", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)", fontSize: "14px" }}
              >
                <Siren size={18} /> Trigger Code Alert
              </button>
              <button 
                onClick={() => setShowTriageModal(true)}
                style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)", color: "#ffffff", padding: "12px 20px", borderRadius: "12px", border: "none", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 14px rgba(14, 165, 233, 0.35)", fontSize: "14px" }}
              >
                <UserPlus size={18} /> New Triage Intake
              </button>
            </div>
          </div>

          {/* Triage Cases Table Card */}
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>Emergency Worklist & Patient Disposition</h3>
            
            {loading ? (
              <div style={{ color: "#64748b", padding: "30px", textAlign: "center", fontWeight: 600 }}>Loading triage queue...</div>
            ) : filteredCases.length === 0 ? (
              <div style={{ color: "#64748b", padding: "40px", textAlign: "center", fontWeight: 600 }}>No active emergency patients match your filter. Click "New Triage Intake" to register.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>ESI Level</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Patient Name</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Age/Gender</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Chief Complaint</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Bay/Bed</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Triage Nurse</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map((c) => {
                      const esiColor = c.esi_level === 1 ? "#ef4444" : c.esi_level === 2 ? "#f97316" : c.esi_level === 3 ? "#d97706" : "#10b981";
                      return (
                        <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{ background: `${esiColor}15`, border: `1px solid ${esiColor}`, color: esiColor, padding: "4px 10px", borderRadius: "8px", fontWeight: 900, fontSize: "12px" }}>
                              ESI-{c.esi_level}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 800 }}>
                            {c.patient_name} 
                            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, marginTop: "2px" }}>MRN: {c.mrn || "N/A"}</div>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 600 }}>{c.age} yrs / {c.gender}</td>
                          <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 500 }}>{c.chief_complaint}</td>
                          <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 700 }}>{c.bed_bay || "Unassigned"}</td>
                          <td style={{ padding: "14px 16px", color: "#334155" }}>{c.triage_nurse}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 800 }}>
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
          <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: "#ffffff", padding: "32px", borderRadius: "24px", width: "100%", maxWidth: "520px", border: "1px solid #e2e8f0", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
              <h3 style={{ color: "#0f172a", marginTop: 0, fontWeight: 900, fontSize: "20px" }}>New Emergency Triage Intake</h3>
              <form onSubmit={handleTriageSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
                <div>
                  <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Patient Full Name</label>
                  <input type="text" required value={patientName} onChange={e=>setPatientName(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "6px", fontSize: "14px" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Age</label>
                    <input type="number" value={age} onChange={e=>setAge(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "6px", fontSize: "14px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Gender</label>
                    <select value={gender} onChange={e=>setGender(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "6px", fontSize: "14px" }}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>ESI Triage Level</label>
                    <select value={esiLevel} onChange={e=>setEsiLevel(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "6px", fontSize: "14px" }}>
                      <option value="1">ESI 1 - Resuscitation (Immediate)</option>
                      <option value="2">ESI 2 - Emergent (High Risk)</option>
                      <option value="3">ESI 3 - Urgent (Multiple Resources)</option>
                      <option value="4">ESI 4 - Less Urgent</option>
                      <option value="5">ESI 5 - Non-Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Bed / Bay</label>
                    <input type="text" value={bedBay} onChange={e=>setBedBay(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "6px", fontSize: "14px" }} />
                  </div>
                </div>
                <div>
                  <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Chief Complaint</label>
                  <textarea required value={chiefComplaint} onChange={e=>setChiefComplaint(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "6px", fontSize: "14px", height: "70px" }} />
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setShowTriageModal(false)} style={{ flex: 1, padding: "12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: "12px", background: "#0ea5e9", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Save Triage Case</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Code Alert Modal */}
        {showCodeModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: "#ffffff", padding: "32px", borderRadius: "24px", width: "100%", maxWidth: "500px", border: "1px solid #e2e8f0", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
              <h3 style={{ color: "#be123c", marginTop: 0, fontWeight: 900, fontSize: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Siren size={24} /> Trigger Emergency Code Alert
              </h3>
              <form onSubmit={handleCodeTrigger} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
                <div>
                  <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Code Category</label>
                  <select value={codeType} onChange={e=>setCodeType(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "6px", fontSize: "14px", fontWeight: 700 }}>
                    <option value="CODE_BLUE">Code Blue (Cardiac Arrest)</option>
                    <option value="TRAUMA_TEAM">Trauma Team Dispatch</option>
                    <option value="CODE_STROKE">Code Stroke</option>
                    <option value="CODE_RED">Code Red (Fire Hazard)</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Location</label>
                  <input type="text" required value={codeLocation} onChange={e=>setCodeLocation(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "6px", fontSize: "14px" }} />
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setShowCodeModal(false)} style={{ flex: 1, padding: "12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: "12px", background: "#ef4444", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Dispatch Code Alert</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


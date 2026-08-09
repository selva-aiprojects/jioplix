import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { ClipboardList, Pill, HeartPulse, UserCheck, Plus, CheckCircle2, Clock, Search, Filter } from "lucide-react";

export default function NursingPage() {
  const [activeTab, setActiveTab] = useState<"emar" | "vitals" | "sbar">("emar");
  const [emar, setEmar] = useState<any[]>([]);
  const [handovers, setHandovers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Vitals form
  const [patientName, setPatientName] = useState("");
  const [bedNo, setBedNo] = useState("Ward A - Bed 02");
  const [systolic, setSystolic] = useState("120");
  const [diastolic, setDiastolic] = useState("80");
  const [hr, setHr] = useState("72");
  const [spo2, setSpo2] = useState("98");

  const fetchNursingData = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const sub = localStorage.getItem("tenant") || localStorage.getItem("activeSubdomain") || "demo";
      const [resEmar, resHandover] = await Promise.all([
        fetch("/api/nursing/emar", { headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub } }),
        fetch("/api/nursing/handovers", { headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub } })
      ]);
      const dataEmar = await resEmar.json();
      const dataHandover = await resHandover.json();
      if (dataEmar.success) setEmar(dataEmar.schedule || []);
      if (dataHandover.success) setHandovers(dataHandover.handovers || []);
    } catch (e) {
      console.error("Failed to fetch nursing data", e);
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
        body: JSON.stringify({ id, status: "GIVEN", nurse_name: "Floor Nurse Sarah" })
      });
      fetchNursingData();
    } catch (e) {
      alert("Error marking medication as administered");
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
          patient_name: patientName,
          bed_no: bedNo,
          bp: `${systolic}/${diastolic}`,
          heart_rate: parseInt(hr),
          spo2: parseInt(spo2),
          news2_score: parseInt(spo2) < 95 ? 4 : 0
        })
      });
      setPatientName("");
      alert("Vitals & NEWS2 score logged successfully!");
      fetchNursingData();
    } catch (e) {
      alert("Error logging vitals");
    }
  };

  const filteredEmar = emar.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.patient_name?.toLowerCase().includes(q) || item.drug_name?.toLowerCase().includes(q) || item.bed_no?.toLowerCase().includes(q);
  });

  const pendingCount = emar.filter(item => item.status === "PENDING").length;

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Nursing Command Station & eMAR Desk" subtitle="Electronic Medication Administration Record, NEWS2 Early Warning Vitals & SBAR Shift Handover" />

        <div style={{ padding: "24px" }}>
          {/* Top KPI Metrics Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#fff7ed", color: "#ea580c", display: "grid", placeItems: "center" }}>
                <Clock size={24} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Pending eMAR Doses</div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#ea580c" }}>{pendingCount} Due</div>
              </div>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#f0fdf4", color: "#16a34a", display: "grid", placeItems: "center" }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Given Doses Today</div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#16a34a" }}>{emar.length - pendingCount} Administered</div>
              </div>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#f0f9ff", color: "#0284c7", display: "grid", placeItems: "center" }}>
                <HeartPulse size={24} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>NEWS2 Vitals Logged</div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#0284c7" }}>24 Patients</div>
              </div>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#faf5ff", color: "#9333ea", display: "grid", placeItems: "center" }}>
                <UserCheck size={24} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Shift Handovers</div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#9333ea" }}>{handovers.length} SBAR Logs</div>
              </div>
            </div>
          </div>

          {/* Interactive Navigation Tabs & Action Bar */}
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "16px 24px", marginBottom: "24px", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                onClick={() => setActiveTab("emar")}
                style={{ padding: "10px 20px", borderRadius: "12px", border: "none", fontWeight: 800, cursor: "pointer", fontSize: "14px", background: activeTab === "emar" ? "#0ea5e9" : "#f1f5f9", color: activeTab === "emar" ? "#ffffff" : "#475569", display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Pill size={16} /> eMAR Medication Schedule
              </button>
              <button 
                onClick={() => setActiveTab("vitals")}
                style={{ padding: "10px 20px", borderRadius: "12px", border: "none", fontWeight: 800, cursor: "pointer", fontSize: "14px", background: activeTab === "vitals" ? "#0ea5e9" : "#f1f5f9", color: activeTab === "vitals" ? "#ffffff" : "#475569", display: "flex", alignItems: "center", gap: "8px" }}
              >
                <HeartPulse size={16} /> NEWS2 Vitals Logger
              </button>
              <button 
                onClick={() => setActiveTab("sbar")}
                style={{ padding: "10px 20px", borderRadius: "12px", border: "none", fontWeight: 800, cursor: "pointer", fontSize: "14px", background: activeTab === "sbar" ? "#0ea5e9" : "#f1f5f9", color: activeTab === "sbar" ? "#ffffff" : "#475569", display: "flex", alignItems: "center", gap: "8px" }}
              >
                <ClipboardList size={16} /> SBAR Shift Handover Logs
              </button>
            </div>

            {activeTab === "emar" && (
              <div style={{ position: "relative", minWidth: "260px" }}>
                <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input 
                  type="text" 
                  placeholder="Filter patient, drug, bed..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: "100%", padding: "9px 14px 9px 40px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", color: "#0f172a", fontSize: "14px" }}
                />
              </div>
            )}
          </div>

          {/* Tab Content */}
          {activeTab === "emar" && (
            <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
              <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>eMAR Medication Administration Schedule</h3>
              {loading ? (
                <div style={{ color: "#64748b", padding: "20px" }}>Loading eMAR schedule...</div>
              ) : filteredEmar.length === 0 ? (
                <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No active medication doses scheduled.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                        <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Patient / Bed</th>
                        <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Medication & Dosage</th>
                        <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Route & Freq</th>
                        <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Scheduled Time</th>
                        <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Status</th>
                        <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmar.map(m => (
                        <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a" }}>
                            {m.patient_name} <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, marginTop: "2px" }}>Bed: {m.bed_no}</div>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#0284c7", fontWeight: 800 }}>{m.drug_name} ({m.dosage})</td>
                          <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 600 }}>{m.route} - {m.frequency}</td>
                          <td style={{ padding: "14px 16px", color: "#d97706", fontWeight: 800 }}>{m.scheduled_time}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{ background: m.status === "GIVEN" ? "#dcfce7" : "#fef3c7", color: m.status === "GIVEN" ? "#15803d" : "#b45309", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                              {m.status}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            {m.status === "PENDING" ? (
                              <button 
                                onClick={() => handleAdminister(m.id)}
                                style={{ background: "#10b981", color: "#ffffff", border: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: 800, cursor: "pointer", fontSize: "12px" }}
                              >
                                Administer Dose
                              </button>
                            ) : (
                              <span style={{ color: "#64748b", fontSize: "12px", fontWeight: 700 }}>Given by {m.nurse_name}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "vitals" && (
            <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "28px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)", maxWidth: "600px" }}>
              <h3 style={{ color: "#0f172a", marginTop: 0, fontWeight: 900, fontSize: "20px" }}>Log Patient Vitals & NEWS2 Risk Score</h3>
              <form onSubmit={handleVitalsSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
                <div>
                  <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Patient Name</label>
                  <input type="text" required value={patientName} onChange={e=>setPatientName(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Bed / Ward</label>
                    <input type="text" value={bedNo} onChange={e=>setBedNo(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Heart Rate (bpm)</label>
                    <input type="number" value={hr} onChange={e=>setHr(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Systolic BP</label>
                    <input type="number" value={systolic} onChange={e=>setSystolic(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Diastolic BP</label>
                    <input type="number" value={diastolic} onChange={e=>setDiastolic(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>SpO2 (%)</label>
                    <input type="number" value={spo2} onChange={e=>setSpo2(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "4px" }} />
                  </div>
                </div>
                <button type="submit" style={{ padding: "12px", background: "#0ea5e9", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer", marginTop: "12px" }}>Submit NEWS2 Vitals</button>
              </form>
            </div>
          )}

          {activeTab === "sbar" && (
            <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
              <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>SBAR Shift Handover Records</h3>
              {handovers.length === 0 ? (
                <div style={{ color: "#64748b", padding: "20px" }}>No shift handover notes submitted for this ward today.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
                  {handovers.map(h => (
                    <div key={h.id} style={{ background: "#f8fafc", padding: "18px", borderRadius: "14px", border: "1px solid #cbd5e1" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "15px" }}>Ward: {h.ward_name}</div>
                      <div style={{ color: "#0284c7", fontWeight: 700, fontSize: "13px", marginTop: "4px" }}>Handover Nurse: {h.nurse_name}</div>
                      <div style={{ color: "#334155", fontSize: "13px", marginTop: "8px" }}>{h.notes}</div>
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


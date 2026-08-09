import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Lock } from "lucide-react";

export default function EMRPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [patientId, setPatientId] = useState("PT-5091");
  const [doctorName, setDoctorName] = useState("Dr. Alexander Wright");
  const [specialty, setSpecialty] = useState("Internal Medicine");
  const [subj, setSubj] = useState("");
  const [obj, setObj] = useState("");
  const [assess, setAssess] = useState("");
  const [plan, setPlan] = useState("");

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/emr/notes", {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub }
      });
      const data = await res.json();
      if (data.success) setNotes(data.notes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      await fetch("/api/emr/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-tenant-id": sub },
        body: JSON.stringify({
          encounter_id: "ENC-" + Math.floor(Math.random() * 90000 + 10000),
          patient_id: patientId,
          doctor_name: doctorName,
          specialty,
          subjective: subj,
          objective: obj,
          assessment: assess,
          plan,
          is_locked: true
        })
      });
      setSubj(""); setObj(""); setAssess(""); setPlan("");
      fetchNotes();
    } catch (e) {
      alert("Failed to save EMR note");
    }
  };

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="EMR & Clinical Documentation Studio" subtitle="SOAP Clinical Notes, CPOE Order Entry & Digital Signatures" />

        <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Note Editor */}
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>New SOAP Clinical Encounter Note</h3>
            <form onSubmit={handleSaveNote} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>Patient ID</label>
                <input type="text" value={patientId} onChange={e=>setPatientId(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "6px", fontSize: "14px" }} />
              </div>
              <div>
                <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>S - Subjective (Patient History / Symptoms)</label>
                <textarea required value={subj} onChange={e=>setSubj(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "6px", fontSize: "14px", height: "65px" }} />
              </div>
              <div>
                <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>O - Objective (Vitals & Physical Exam)</label>
                <textarea required value={obj} onChange={e=>setObj(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "6px", fontSize: "14px", height: "65px" }} />
              </div>
              <div>
                <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>A - Assessment (Diagnosis / Clinical Impression)</label>
                <textarea required value={assess} onChange={e=>setAssess(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "6px", fontSize: "14px", height: "65px" }} />
              </div>
              <div>
                <label style={{ color: "#334155", fontSize: "13px", fontWeight: 700 }}>P - Plan (Meds, Labs & Follow-up)</label>
                <textarea required value={plan} onChange={e=>setPlan(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", marginTop: "6px", fontSize: "14px", height: "65px" }} />
              </div>
              <button type="submit" style={{ padding: "12px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer", marginTop: "8px", fontSize: "15px" }}>
                Digitally Sign & Lock EMR Note
              </button>
            </form>
          </div>

          {/* Historical Locked Notes */}
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>Signed Encounter History</h3>
            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Loading notes...</div>
            ) : notes.length === 0 ? (
              <div style={{ color: "#64748b", padding: "20px" }}>No signed EMR notes for this patient encounter yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "640px", overflowY: "auto" }}>
                {notes.map(n => (
                  <div key={n.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "18px", borderRadius: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#0284c7", fontWeight: 800, marginBottom: "8px" }}>
                      <span>Encounter: {n.encounter_id}</span>
                      <span style={{ color: "#16a34a", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", fontWeight: 800 }}>
                        <Lock size={12} /> Locked & Signed
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: 600 }}>Doctor: {n.doctor_name} ({n.specialty})</div>
                    <div style={{ color: "#1e293b", fontSize: "14px", marginBottom: "4px" }}><strong>Assessment:</strong> {n.assessment}</div>
                    <div style={{ color: "#334155", fontSize: "14px" }}><strong>Plan:</strong> {n.plan}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

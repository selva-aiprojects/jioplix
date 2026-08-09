import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Stethoscope, FileText, Lock, ShieldCheck, Plus } from "lucide-react";

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
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="EMR & Clinical Documentation Studio" subtitle="SOAP Clinical Notes, CPOE Order Entry & Digital Signatures" />

        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Note Editor */}
          <div className="form-card" style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: 'white', margin: '0 0 16px 0', fontWeight: 800 }}>New SOAP Clinical Encounter Note</h3>
            <form onSubmit={handleSaveNote} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>Patient ID</label>
                <input type="text" value={patientId} onChange={e=>setPatientId(e.target.value)} style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, marginTop: 4 }} />
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>S - Subjective (Patient History / Symptoms)</label>
                <textarea required value={subj} onChange={e=>setSubj(e.target.value)} style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, marginTop: 4, height: 60 }} />
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>O - Objective (Vitals & Physical Exam)</label>
                <textarea required value={obj} onChange={e=>setObj(e.target.value)} style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, marginTop: 4, height: 60 }} />
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>A - Assessment (Diagnosis / Clinical Impression)</label>
                <textarea required value={assess} onChange={e=>setAssess(e.target.value)} style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, marginTop: 4, height: 60 }} />
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>P - Plan (Meds, Labs & Follow-up)</label>
                <textarea required value={plan} onChange={e=>setPlan(e.target.value)} style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, marginTop: 4, height: 60 }} />
              </div>
              <button type="submit" style={{ padding: 12, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', marginTop: 8 }}>
                Digitally Sign &amp; Lock EMR Note
              </button>
            </form>
          </div>

          {/* Historical Locked Notes */}
          <div className="form-card" style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: 'white', margin: '0 0 16px 0', fontWeight: 800 }}>Signed Encounter History</h3>
            {loading ? (
              <div style={{ color: '#94a3b8' }}>Loading notes...</div>
            ) : notes.length === 0 ? (
              <div style={{ color: '#94a3b8' }}>No signed EMR notes for this patient encounter yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 600, overflowY: 'auto' }}>
                {notes.map(n => (
                  <div key={n.id} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', padding: 16, borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38bdf8', fontWeight: 800, marginBottom: 6 }}>
                      <span>Encounter: {n.encounter_id}</span>
                      <span style={{ color: '#10b981', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Lock size={12} /> Locked &amp; Signed
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Doctor: {n.doctor_name} ({n.specialty})</div>
                    <div style={{ color: '#e2e8f0', fontSize: 13, marginBottom: 4 }}><strong>Assessment:</strong> {n.assessment}</div>
                    <div style={{ color: '#cbd5e1', fontSize: 13 }}><strong>Plan:</strong> {n.plan}</div>
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

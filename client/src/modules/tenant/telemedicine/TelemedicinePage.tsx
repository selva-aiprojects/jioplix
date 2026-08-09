import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Video, PhoneCall, Calendar, Link as LinkIcon } from "lucide-react";

export default function TelemedicinePage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTelemedicine = async () => {
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/telemedicine/sessions", {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub }
      });
      const data = await res.json();
      if (data.success) setSessions(data.sessions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemedicine();
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="Telemedicine & Virtual Consultation Studio" subtitle="WebRTC Video Rooms, Synchronized Digital Notes & Online Patient Bridge" />

        <div style={{ padding: 24 }}>
          <div className="form-card" style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: 'white', margin: '0 0 16px 0', fontWeight: 800 }}>Scheduled Virtual Consultation Rooms</h3>

            {loading ? (
              <div style={{ color: '#94a3b8' }}>Loading telemedicine schedule...</div>
            ) : sessions.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>No virtual video consultations scheduled today.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
                    <th style={{ padding: 12 }}>Patient Name</th>
                    <th style={{ padding: 12 }}>Attending Doctor</th>
                    <th style={{ padding: 12 }}>Specialty</th>
                    <th style={{ padding: 12 }}>Video Link</th>
                    <th style={{ padding: 12 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 12, fontWeight: 700 }}>{s.patient_name}</td>
                      <td style={{ padding: 12 }}>{s.doctor_name}</td>
                      <td style={{ padding: 12 }}>{s.specialty}</td>
                      <td style={{ padding: 12 }}>
                        <a href={s.meeting_link} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                          <LinkIcon size={14} /> Join Video Room
                        </a>
                      </td>
                      <td style={{ padding: 12 }}>
                        <button onClick={() => window.open(s.meeting_link, '_blank')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Video size={14} /> Start Call
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

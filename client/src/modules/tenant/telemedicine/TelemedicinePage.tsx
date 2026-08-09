import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Video, Link as LinkIcon } from "lucide-react";

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
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Telemedicine & Virtual Consultation Studio" subtitle="WebRTC Video Rooms, Synchronized Digital Notes & Online Patient Bridge" />

        <div style={{ padding: "24px" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>Scheduled Virtual Consultation Rooms</h3>

            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Loading telemedicine schedule...</div>
            ) : sessions.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No virtual video consultations scheduled today.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Patient Name</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Attending Doctor</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Specialty</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Video Link</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(s => (
                      <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a" }}>{s.patient_name}</td>
                        <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 700 }}>{s.doctor_name}</td>
                        <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 600 }}>{s.specialty}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <a href={s.meeting_link} target="_blank" rel="noreferrer" style={{ color: "#0284c7", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", fontWeight: 800 }}>
                            <LinkIcon size={14} /> Join Video Room
                          </a>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <button onClick={() => window.open(s.meeting_link, '_blank')} style={{ background: "#10b981", color: "#ffffff", border: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                            <Video size={14} /> Start Call
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

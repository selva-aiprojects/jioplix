import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { ShieldCheck, AlertTriangle, CheckCircle2, FileSearch } from "lucide-react";

export default function QualityPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/quality/incidents", {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub }
      });
      const data = await res.json();
      if (data.success) setIncidents(data.incidents || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="Quality, Patient Safety & NABH Compliance" subtitle="Incident & Adverse Event Reporting, Root Cause Analysis (RCA) & Quality Indicators" />

        <div style={{ padding: 24 }}>
          <div className="form-card" style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: 'white', margin: '0 0 16px 0', fontWeight: 800 }}>Patient Safety & Sentinel Event Register</h3>

            {loading ? (
              <div style={{ color: '#94a3b8' }}>Loading safety logs...</div>
            ) : incidents.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>Zero active critical safety incidents logged. NABH audit indicators green.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
                    <th style={{ padding: 12 }}>Incident Type</th>
                    <th style={{ padding: 12 }}>Department</th>
                    <th style={{ padding: 12 }}>Severity</th>
                    <th style={{ padding: 12 }}>Description</th>
                    <th style={{ padding: 12 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map(i => (
                    <tr key={i.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 12, fontWeight: 800, color: '#f59e0b' }}>{i.incident_type}</td>
                      <td style={{ padding: 12 }}>{i.department}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 12 }}>
                          {i.severity}
                        </span>
                      </td>
                      <td style={{ padding: 12, color: '#cbd5e1' }}>{i.description}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 12 }}>
                          {i.status}
                        </span>
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

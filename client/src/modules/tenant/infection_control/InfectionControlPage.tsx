import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { ShieldAlert, Bug, Pill, Activity } from "lucide-react";

export default function InfectionControlPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInfections = async () => {
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/infection-control/surveillance", {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub }
      });
      const data = await res.json();
      if (data.success) setRecords(data.records || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfections();
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="Infection Control & Epidemiology Desk" subtitle="HAI Surveillance (CLABSI/CAUTI), Antimicrobial Stewardship & Isolation Precautions" />

        <div style={{ padding: 24 }}>
          <div className="form-card" style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: 'white', margin: '0 0 16px 0', fontWeight: 800 }}>Hospital-Acquired Infection (HAI) Surveillance Active Register</h3>

            {loading ? (
              <div style={{ color: '#94a3b8' }}>Loading surveillance stream...</div>
            ) : records.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>No active HAI outbreaks or restricted isolation flags reported.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
                    <th style={{ padding: 12 }}>Patient Name</th>
                    <th style={{ padding: 12 }}>Ward Location</th>
                    <th style={{ padding: 12 }}>HAI Type</th>
                    <th style={{ padding: 12 }}>Organism</th>
                    <th style={{ padding: 12 }}>Isolation Precaution</th>
                    <th style={{ padding: 12 }}>ASP Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 12, fontWeight: 700 }}>{r.patient_name}</td>
                      <td style={{ padding: 12 }}>{r.ward_location}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '4px 8px', borderRadius: 6, fontWeight: 900, fontSize: 12 }}>
                          {r.hai_type}
                        </span>
                      </td>
                      <td style={{ padding: 12, color: '#f59e0b', fontWeight: 700 }}>{r.organism_identified || 'MRSA'}</td>
                      <td style={{ padding: 12 }}>{r.isolation_type}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 12 }}>
                          {r.asp_authorization_status}
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

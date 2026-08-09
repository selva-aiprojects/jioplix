import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Archive, Scale, CheckCircle2 } from "lucide-react";

export default function MortuaryPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMortuary = async () => {
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/mortuary/records", {
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
    fetchMortuary();
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="Mortuary & Deceased Management Desk" subtitle="Cold Chamber Bay Allocation, Autopsy Registers & Medico-Legal Handover" />

        <div style={{ padding: 24 }}>
          <div className="form-card" style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: 'white', margin: '0 0 16px 0', fontWeight: 800 }}>Deceased Body Intake Register</h3>

            {loading ? (
              <div style={{ color: '#94a3b8' }}>Loading mortuary records...</div>
            ) : records.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>No active deceased records in mortuary intake storage.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
                    <th style={{ padding: 12 }}>Deceased Name</th>
                    <th style={{ padding: 12 }}>MRN</th>
                    <th style={{ padding: 12 }}>Cold Chamber Bay</th>
                    <th style={{ padding: 12 }}>Autopsy / MLC</th>
                    <th style={{ padding: 12 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 12, fontWeight: 700 }}>{r.deceased_name}</td>
                      <td style={{ padding: 12, color: '#38bdf8' }}>{r.mrn || 'N/A'}</td>
                      <td style={{ padding: 12, fontWeight: 800 }}>Bay-{r.chamber_no}</td>
                      <td style={{ padding: 12 }}>
                        {r.autopsy_requested ? <span style={{ color: '#f59e0b', fontWeight: 800 }}>Autopsy Req</span> : 'Standard'}
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 12 }}>
                          {r.handover_status}
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

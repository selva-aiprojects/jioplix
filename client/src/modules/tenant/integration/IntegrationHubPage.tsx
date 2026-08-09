import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Cpu, Activity, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";

export default function IntegrationHubPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/integration/logs", {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub }
      });
      const data = await res.json();
      if (data.success) setLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="Integration & Interoperability Hub" subtitle="HL7 v2.x Interface Engine, FHIR R4 Gateways & LIS/RIS/PACS Connectors" />

        <div style={{ padding: 24 }}>
          <div className="form-card" style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ color: 'white', margin: 0, fontWeight: 800 }}>Integration Transaction Logs</h3>
              <button onClick={fetchLogs} style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '6px 14px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={14} /> Refresh Stream
              </button>
            </div>

            {loading ? (
              <div style={{ color: '#94a3b8' }}>Polling interface engine logs...</div>
            ) : logs.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>No messages in integration queue. HL7 and FHIR engine ready.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
                    <th style={{ padding: 12 }}>Protocol</th>
                    <th style={{ padding: 12 }}>Message Type</th>
                    <th style={{ padding: 12 }}>Direction</th>
                    <th style={{ padding: 12 }}>Status</th>
                    <th style={{ padding: 12 }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 12, fontWeight: 800, color: '#38bdf8' }}>{l.protocol}</td>
                      <td style={{ padding: 12, fontWeight: 700 }}>{l.message_type}</td>
                      <td style={{ padding: 12 }}>{l.direction}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{ background: l.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: l.status === 'SUCCESS' ? '#10b981' : '#ef4444', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 12 }}>
                          {l.status}
                        </span>
                      </td>
                      <td style={{ padding: 12, color: '#94a3b8', fontSize: 12 }}>{new Date(l.created_at).toLocaleString()}</td>
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

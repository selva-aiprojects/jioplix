import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { ShieldCheck, Lock, Eye, AlertTriangle } from "lucide-react";

export default function AuditGovernancePage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/audit-governance/logs", {
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
    fetchAuditLogs();
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="Audit & Clinical Governance Console" subtitle="System-Wide Immutable Access Audit Trail & Emergency Break-Glass Logs" />

        <div style={{ padding: 24 }}>
          <div className="form-card" style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: 'white', margin: '0 0 16px 0', fontWeight: 800 }}>PHI Data Access & Privilege Governance Audit Stream</h3>

            {loading ? (
              <div style={{ color: '#94a3b8' }}>Loading audit logs...</div>
            ) : logs.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>Audit trail active. All user operations signed &amp; timestamped.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
                    <th style={{ padding: 12 }}>User</th>
                    <th style={{ padding: 12 }}>Action Type</th>
                    <th style={{ padding: 12 }}>Resource Affected</th>
                    <th style={{ padding: 12 }}>IP Address</th>
                    <th style={{ padding: 12 }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 12, fontWeight: 700 }}>{l.actor_user}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{ background: l.action_type === 'BREAK_GLASS' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)', color: l.action_type === 'BREAK_GLASS' ? '#ef4444' : '#38bdf8', padding: '4px 8px', borderRadius: 6, fontWeight: 900, fontSize: 12 }}>
                          {l.action_type}
                        </span>
                      </td>
                      <td style={{ padding: 12, color: '#e2e8f0' }}>{l.resource_affected}</td>
                      <td style={{ padding: 12, color: '#94a3b8' }}>{l.ip_address || 'Internal'}</td>
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

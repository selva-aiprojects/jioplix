import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";

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
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Audit & Clinical Governance Console" subtitle="System-Wide Immutable Access Audit Trail & Emergency Break-Glass Logs" />

        <div style={{ padding: "24px" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>PHI Data Access & Privilege Governance Audit Stream</h3>

            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Loading audit logs...</div>
            ) : logs.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>Audit trail active. All user operations signed & timestamped.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>User</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Action Type</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Resource Affected</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>IP Address</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(l => (
                      <tr key={l.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a" }}>{l.actor_user}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: l.action_type === 'BREAK_GLASS' ? "#fee2e2" : "#e0f2fe", color: l.action_type === 'BREAK_GLASS' ? "#dc2626" : "#0369a1", padding: "4px 10px", borderRadius: "8px", fontWeight: 900, fontSize: "12px" }}>
                            {l.action_type}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 700 }}>{l.resource_affected}</td>
                        <td style={{ padding: "14px 16px", color: "#64748b" }}>{l.ip_address || 'Internal'}</td>
                        <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "12px" }}>{new Date(l.created_at).toLocaleString()}</td>
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

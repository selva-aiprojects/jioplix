import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { RefreshCw } from "lucide-react";

export default function IntegrationHubPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const sub = localStorage.getItem("tenant") || localStorage.getItem("activeSubdomain") || "demo";
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
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Integration & Interoperability Hub" subtitle="HL7 v2.x Interface Engine, FHIR R4 Gateways & LIS/RIS/PACS Connectors" />

        <div style={{ padding: "24px" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#0f172a", margin: 0, fontWeight: 800, fontSize: "18px" }}>Integration Transaction Logs</h3>
              <button onClick={fetchLogs} style={{ background: "#e0f2fe", color: "#0284c7", border: "1px solid #bae6fd", padding: "8px 16px", borderRadius: "10px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                <RefreshCw size={14} /> Refresh Stream
              </button>
            </div>

            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Polling interface engine logs...</div>
            ) : logs.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No messages in integration queue. HL7 and FHIR engine ready.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Protocol</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Message Type</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Direction</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Status</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(l => (
                      <tr key={l.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0284c7" }}>{l.protocol}</td>
                        <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a" }}>{l.message_type}</td>
                        <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 600 }}>{l.direction}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: l.status === 'SUCCESS' ? "#dcfce7" : "#fee2e2", color: l.status === 'SUCCESS' ? "#15803d" : "#dc2626", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                            {l.status}
                          </span>
                        </td>
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

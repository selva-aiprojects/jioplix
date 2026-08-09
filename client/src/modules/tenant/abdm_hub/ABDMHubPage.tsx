import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";

export default function ABDMHubPage() {
  const [contexts, setContexts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchABDM = async () => {
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/abdm-hub/contexts", {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub }
      });
      const data = await res.json();
      if (data.success) setContexts(data.contexts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchABDM();
  }, []);

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="ABDM / ABHA Phase 2 Gateway" subtitle="ABHA Address Linking, HIP Health Document Compiler & HIU Consent Fetcher" />

        <div style={{ padding: "24px" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>Linked Care Contexts (HIP Gateway)</h3>

            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Loading ABDM care contexts...</div>
            ) : contexts.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No linked ABDM care contexts active for this hospital shard.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>ABHA ID</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Care Context Ref</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Display Name</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>HIP Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contexts.map(c => (
                      <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0284c7" }}>{c.abha_id}</td>
                        <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 700 }}>{c.care_context_reference}</td>
                        <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 600 }}>{c.display_name}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                            {c.hip_status}
                          </span>
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

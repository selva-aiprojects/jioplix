import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";

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
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Mortuary & Deceased Management Desk" subtitle="Cold Chamber Bay Allocation, Autopsy Registers & Medico-Legal Handover" />

        <div style={{ padding: "24px" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>Deceased Body Intake Register</h3>

            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Loading mortuary records...</div>
            ) : records.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No active deceased records in mortuary intake storage.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Deceased Name</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>MRN</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Cold Chamber Bay</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Autopsy / MLC</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map(r => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a" }}>{r.deceased_name}</td>
                        <td style={{ padding: "14px 16px", color: "#0284c7", fontWeight: 700 }}>{r.mrn || 'N/A'}</td>
                        <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 800 }}>Bay-{r.chamber_no}</td>
                        <td style={{ padding: "14px 16px", color: "#d97706", fontWeight: 700 }}>
                          {r.autopsy_requested ? <span style={{ color: "#d97706", fontWeight: 800 }}>Autopsy Req</span> : 'Standard'}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                            {r.handover_status}
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

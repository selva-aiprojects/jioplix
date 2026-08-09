import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";

export default function CSSDPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCSSD = async () => {
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/cssd/batches", {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub }
      });
      const data = await res.json();
      if (data.success) setBatches(data.batches || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCSSD();
  }, []);

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="CSSD - Central Sterile Supply Department" subtitle="Surgical Kit Sterilization Cycles, Autoclave Logs & BI/CI Indicator Pass Records" />

        <div style={{ padding: "24px" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>Sterilization Batch Records</h3>

            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Loading autoclave batch records...</div>
            ) : batches.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No active sterilization batches logged today.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Batch No</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Sterilizer ID</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Method</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>BI Test</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>CI Test</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map(b => (
                      <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0284c7" }}>{b.batch_number}</td>
                        <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 700 }}>{b.sterilizer_id}</td>
                        <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 600 }}>{b.sterilization_method}</td>
                        <td style={{ padding: "14px 16px", color: "#16a34a", fontWeight: 800 }}>{b.biological_indicator}</td>
                        <td style={{ padding: "14px 16px", color: "#16a34a", fontWeight: 800 }}>{b.chemical_indicator}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                            {b.status}
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

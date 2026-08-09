import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";

export default function MRDPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMRD = async () => {
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/mrd/records", {
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
    fetchMRD();
  }, []);

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Medical Records, MRD & HIM Command Center" subtitle="Physical File Location Tracking, ICD-10 Coding, Chart Audits & MLC Registers" />

        <div style={{ padding: "24px" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>Medical Records & Physical File Inventory</h3>

            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Loading records archive...</div>
            ) : records.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No MRD records found in active rack location index.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>MRN</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Patient Name</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Rack / Shelf / Box</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>MLC Status</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Coding Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map(r => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0284c7" }}>{r.mrn}</td>
                        <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a" }}>{r.patient_name}</td>
                        <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 600 }}>Rack: {r.rack_no || 'R-04'} | Shelf: {r.shelf_no || 'S-02'}</td>
                        <td style={{ padding: "14px 16px" }}>
                          {r.is_mlc ? (
                            <span style={{ background: "#fee2e2", color: "#dc2626", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                              MLC (#{r.mlc_number || 'REG-99'})
                            </span>
                          ) : (
                            <span style={{ color: "#64748b", fontSize: "12px", fontWeight: 600 }}>Non-MLC</span>
                          )}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                            {r.chart_status}
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

import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";

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
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Infection Control & Epidemiology Desk" subtitle="HAI Surveillance (CLABSI/CAUTI), Antimicrobial Stewardship & Isolation Precautions" />

        <div style={{ padding: "24px" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>Hospital-Acquired Infection (HAI) Surveillance Active Register</h3>

            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Loading surveillance stream...</div>
            ) : records.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No active HAI outbreaks or restricted isolation flags reported.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Patient Name</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Ward Location</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>HAI Type</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Organism</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Isolation Precaution</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>ASP Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map(r => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a" }}>{r.patient_name}</td>
                        <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 600 }}>{r.ward_location}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: "#fee2e2", color: "#dc2626", padding: "4px 10px", borderRadius: "8px", fontWeight: 900, fontSize: "12px" }}>
                            {r.hai_type}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#b45309", fontWeight: 800 }}>{r.organism_identified || 'MRSA'}</td>
                        <td style={{ padding: "14px 16px", color: "#334155" }}>{r.isolation_type}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                            {r.asp_authorization_status}
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

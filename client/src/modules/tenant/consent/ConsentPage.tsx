import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { CheckCircle2 } from "lucide-react";

export default function ConsentPage() {
  const [consents, setConsents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConsents = async () => {
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/consent/records", {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub }
      });
      const data = await res.json();
      if (data.success) setConsents(data.consents || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, []);

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Consent Management & DPDP Compliance" subtitle="Digital Informed Consents, Touchscreen Signatures & DPDP Data Privacy Preferences" />

        <div style={{ padding: "24px" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>Captured Clinical Consents</h3>

            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Loading consent records...</div>
            ) : consents.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No digital clinical consents captured yet. Form templates loaded.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Patient Name</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Consent Type</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Procedure</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Witness</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Signature Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consents.map(c => (
                      <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a" }}>{c.patient_name}</td>
                        <td style={{ padding: "14px 16px", color: "#0284c7", fontWeight: 800 }}>{c.consent_type}</td>
                        <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 600 }}>{c.procedure_name || 'General Admission'}</td>
                        <td style={{ padding: "14px 16px", color: "#334155" }}>{c.witness_name || 'Staff Nurse'}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <CheckCircle2 size={12} /> Captured & Verified
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

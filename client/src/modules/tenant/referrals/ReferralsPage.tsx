import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReferrals = async () => {
    try {
      const token = localStorage.getItem("token");
      const sub = localStorage.getItem("activeSubdomain") || "demo";
      const res = await fetch("/api/referrals/ledger", {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": sub }
      });
      const data = await res.json();
      if (data.success) setReferrals(data.referrals || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  return (
    <div className="dashboard-layout" style={{ minHeight: "100vh", background: "var(--app-bg, #f8fafc)" }}>
      <Sidebar />
      <main className="main-content" style={{ paddingBottom: "60px" }}>
        <Header title="Referral Management & Partner Network" subtitle="Inbound & Outbound Doctor/Hospital Referral Tracking & Patient Feedback" />

        <div style={{ padding: "24px" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", fontWeight: 800, fontSize: "18px" }}>Partner Doctor Referral Ledger</h3>

            {loading ? (
              <div style={{ color: "#64748b", padding: "20px" }}>Loading referral network logs...</div>
            ) : referrals.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No active referrals logged in partner network registry.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Direction</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Referring Doctor</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Patient Name</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Specialty</th>
                      <th style={{ padding: "14px 16px", color: "#475569", fontWeight: 800, textTransform: "uppercase", fontSize: "12px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map(r => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                            {r.referral_type}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a" }}>
                          {r.referring_doctor} 
                          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, marginTop: "2px" }}>{r.referring_hospital || 'Clinic'}</div>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 700 }}>{r.patient_name}</td>
                        <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 600 }}>{r.specialty_required}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "8px", fontWeight: 800, fontSize: "12px" }}>
                            {r.referral_status}
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

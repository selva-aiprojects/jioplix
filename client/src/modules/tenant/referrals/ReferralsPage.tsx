import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { Users, ArrowRightLeft, Building2 } from "lucide-react";

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
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="Referral Management & Partner Network" subtitle="Inbound & Outbound Doctor/Hospital Referral Tracking & Patient Feedback" />

        <div style={{ padding: 24 }}>
          <div className="form-card" style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: 'white', margin: '0 0 16px 0', fontWeight: 800 }}>Partner Doctor Referral Ledger</h3>

            {loading ? (
              <div style={{ color: '#94a3b8' }}>Loading referral network logs...</div>
            ) : referrals.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>No active referrals logged in partner network registry.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
                    <th style={{ padding: 12 }}>Direction</th>
                    <th style={{ padding: 12 }}>Referring Doctor</th>
                    <th style={{ padding: 12 }}>Patient Name</th>
                    <th style={{ padding: 12 }}>Specialty</th>
                    <th style={{ padding: 12 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 12 }}>
                        <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 12 }}>
                          {r.referral_type}
                        </span>
                      </td>
                      <td style={{ padding: 12, fontWeight: 700 }}>{r.referring_doctor} <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.referring_hospital || 'Clinic'}</div></td>
                      <td style={{ padding: 12, color: '#e2e8f0' }}>{r.patient_name}</td>
                      <td style={{ padding: 12 }}>{r.specialty_required}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 12 }}>
                          {r.referral_status}
                        </span>
                      </td>
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

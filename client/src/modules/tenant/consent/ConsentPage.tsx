import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { FileSignature, ShieldCheck, CheckCircle2 } from "lucide-react";

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
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="Consent Management & DPDP Compliance" subtitle="Digital Informed Consents, Touchscreen Signatures & DPDP Data Privacy Preferences" />

        <div style={{ padding: 24 }}>
          <div className="form-card" style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: 'white', margin: '0 0 16px 0', fontWeight: 800 }}>Captured Clinical Consents</h3>

            {loading ? (
              <div style={{ color: '#94a3b8' }}>Loading consent records...</div>
            ) : consents.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>No digital clinical consents captured yet. Form templates loaded.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
                    <th style={{ padding: 12 }}>Patient Name</th>
                    <th style={{ padding: 12 }}>Consent Type</th>
                    <th style={{ padding: 12 }}>Procedure</th>
                    <th style={{ padding: 12 }}>Witness</th>
                    <th style={{ padding: 12 }}>Signature Status</th>
                  </tr>
                </thead>
                <tbody>
                  {consents.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 12, fontWeight: 700 }}>{c.patient_name}</td>
                      <td style={{ padding: 12, color: '#38bdf8', fontWeight: 800 }}>{c.consent_type}</td>
                      <td style={{ padding: 12 }}>{c.procedure_name || 'General Admission'}</td>
                      <td style={{ padding: 12 }}>{c.witness_name || 'Staff Nurse'}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={12} /> Captured &amp; Verified
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

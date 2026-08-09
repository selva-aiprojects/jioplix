import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { ShieldCheck, Share2, FileCode, CheckCircle2 } from "lucide-react";

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
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header title="ABDM / ABHA Phase 2 Gateway" subtitle="ABHA Address Linking, HIP Health Document Compiler & HIU Consent Fetcher" />

        <div style={{ padding: 24 }}>
          <div className="form-card" style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: 'white', margin: '0 0 16px 0', fontWeight: 800 }}>Linked Care Contexts (HIP Gateway)</h3>

            {loading ? (
              <div style={{ color: '#94a3b8' }}>Loading ABDM care contexts...</div>
            ) : contexts.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>No linked ABDM care contexts active for this hospital shard.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
                    <th style={{ padding: 12 }}>ABHA ID</th>
                    <th style={{ padding: 12 }}>Care Context Ref</th>
                    <th style={{ padding: 12 }}>Display Name</th>
                    <th style={{ padding: 12 }}>HIP Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contexts.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: 12, fontWeight: 800, color: '#38bdf8' }}>{c.abha_id}</td>
                      <td style={{ padding: 12 }}>{c.care_context_reference}</td>
                      <td style={{ padding: 12, color: '#e2e8f0' }}>{c.display_name}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 12 }}>
                          {c.hip_status}
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
